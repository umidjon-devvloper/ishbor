import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../common/prisma.js";
import { AppError, Errors } from "../../common/errors.js";
import { requireAuth, requireStaff } from "../../common/auth-guard.js";
import { boolish, idParams, safeInternalPath } from "../../common/validation.js";
import { bumpDataVersion } from "../../common/cache.js";
import { closeUserSockets } from "../../common/realtime.js";
import { ownedCompanyIds } from "../../common/ownership.js";
import { maskPhone } from "../../common/phone.js";
import { apostropheVariants } from "../../common/search-text.js";
import { recordSecurityEvent } from "../../common/security-events.js";
import { DAY_MS, startOfTashkentDay, tashkentDayKey } from "../../common/time.js";
import { features } from "../../common/env.js";
import { revokeUserSessions } from "../auth/auth.service.js";
import { assertNotLastActiveAdmin, revokePendingStaffInvites } from "../team/team.routes.js";
import { assertVacancyPlacement, effectiveWorkplaceType } from "../vacancies/vacancies.rules.js";
import { notify } from "../notifications/notifications.service.js";
import { reindexAll, isSearchEngineEnabled } from "../search/search.service.js";
import { syncVacancyIndex } from "../vacancies/vacancies.service.js";
import { runAlertSweep } from "../alerts/alerts.service.js";
import { markPaymentPaid } from "../billing/billing.service.js";

/**
 * Admin paneli: moderatsiya, foydalanuvchi boshqaruvi, statistika, to'lovlar.
 *
 * Rol va blok holati TOKENDAN emas, har so'rovda BAZADAN tekshiriladi (audit ISSUE-035):
 * roli olingan yoki bloklangan admin 15 daqiqalik access token tugashini kutmasdan kirolmaydi.
 */
const adminOnly = { preHandler: [requireAuth, requireStaff("admin")] };

const pageSchema = z.object({
  text: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).max(10_000).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

function paging(query: z.infer<typeof pageSchema>) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 25;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

const like = (v: string) => ({ contains: v, mode: "insensitive" as const });

/**
 * Prisma `contains` MongoDB'da regexga aylanadi — admin qidiruvidagi maxsus belgilar
 * (`.*`, `(`, `|`) zararsizlantiriladi va matn qisqartiriladi (audit R3, admin-staff-11).
 */
function searchText(value: string | undefined): string {
  return (value ?? "").replace(/[\\^$.*+?()[\]{}|]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * O'zbekcha tutuq belgisi variantlari (audit R3, D-080): `Qo'chqorov` va `Qo’chqorov`
 * bir xil topilsin. Prisma `contains` ga regex berib bo'lmaydi, shuning uchun har variant
 * alohida OR sharti bo'ladi (tutuq belgisi bo'lmasa — bitta shart).
 */
function textVariants(value: string): string[] {
  return value ? apostropheVariants(value) : [];
}

/**
 * Relation filter ($lookup) o'rniga oldindan yechilgan id ro'yxati (audit R3, admin-staff-11,
 * employer-flows-12, scale-10k-12). Ro'yxat chegaralangan: juda keng qidiruv butun
 * kolleksiyani `$in` ga solib qo'ymaydi.
 */
const RELATION_MATCH_LIMIT = 1000;

/** Ariza sonlari: har qator uchun `_count` ($lookup) emas, sahifa id'lari bo'yicha bitta guruhlash. */
async function applicationCounts(vacancyIds: string[]): Promise<Map<string, number>> {
  if (vacancyIds.length === 0) return new Map();
  const groups = await prisma.application.groupBy({
    by: ["vacancyId"],
    where: { vacancyId: { in: vacancyIds } },
    _count: { _all: true },
  });
  return new Map(groups.map((g) => [g.vacancyId, g._count._all]));
}

/**
 * Bloklash yoki rol o'zgarishi natijasida ish beruvchining faol e'lonlari yopiladi va
 * `adminArchivedAt` bilan QULFLANADI (audit R3, D-070/D-077): egasi ularni qayta ocholmaydi.
 */
async function archiveOwnerVacancies(userId: string, reason: string, log?: { warn: (o: unknown, m?: string) => void }): Promise<number> {
  const companyIds = await ownedCompanyIds(userId);
  if (companyIds.length === 0) return 0;
  const where: Prisma.VacancyWhereInput = { companyId: { in: companyIds }, status: "active" };
  const vacancies = await prisma.vacancy.findMany({ where, select: { id: true } });
  if (vacancies.length === 0) return 0;
  await prisma.vacancy.updateMany({ where, data: { status: "archived", adminArchivedAt: new Date() } });
  for (const v of vacancies) void syncVacancyIndex(v.id, "archived");
  bumpDataVersion();
  log?.warn({ userId, reason, count: vacancies.length }, "Ish beruvchining faol vakansiyalari arxivlandi");
  return vacancies.length;
}

/** Toshkent kalendar kunlari bo'yicha sanaydi. */
function countByDay(rows: { createdAt: Date }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = tashkentDayKey(row.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Ommaviy xabar bir vaqtda faqat bittadan yuboriladi (API bitta nusxada ishlaydi). */
let broadcastRunning = false;
const BROADCAST_BATCH = 500;
/**
 * Foydalanuvchilar orasidagi eng kam oraliq — soniyasiga ko'pi bilan ~25 ta (Telegram bot limiti ~30/s).
 * Ilgari tashqi kanallar kutilmay, minglab so'rov bir zumda ketardi va 429 javoblari yo'qolardi (audit PHASE 6, V9).
 */
const BROADCAST_MIN_GAP_MS = 40;
/** Tasdiqlangan tiklash so'rovi shuncha vaqt davomida davom ettiriladi (audit R3, D-049). */
const RECOVERY_CONTINUE_TTL_MS = 72 * 60 * 60 * 1000;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function adminRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------
  // Umumiy ko'rsatkichlar
  // ---------------------------------------------------------
  app.get("/api/admin/overview", adminOnly, async () => {
    const now = new Date();
    // "Bugun" — Toshkent kalendar kuni boshidan (grafik va bosh sahifa statistikasi bilan bir xil;
    // ilgari so'nggi 24 soat sanalardi — audit PHASE 6, U19)
    const todayStart = startOfTashkentDay(now.getTime());
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

    const [
      users,
      seekers,
      employers,
      blocked,
      companies,
      verifiedCompanies,
      vacanciesActive,
      vacanciesModeration,
      applications,
      applicationsToday,
      newUsersWeek,
      reviewsPending,
      paymentsPaid,
      revenueRows,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "job_seeker" } }),
      prisma.user.count({ where: { role: "employer" } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.company.count(),
      prisma.company.count({ where: { isVerified: true } }),
      prisma.vacancy.count({ where: { status: "active" } }),
      prisma.vacancy.count({ where: { status: "moderation" } }),
      prisma.application.count(),
      prisma.application.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.companyReview.count({ where: { status: "pending" } }),
      prisma.payment.count({ where: { status: "paid" } }),
      prisma.payment.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
    ]);

    // Oxirgi 14 kunlik ro'yxatdan o'tish/ariza dinamikasi — Toshkent kunlari bo'yicha
    // (ilgari server vaqti va UTC aralashib, kun chegarasi 5 soatga siljirdi; audit ISSUE-052)
    const since = new Date(todayStart.getTime() - 13 * DAY_MS);
    const [recentUsers, recentApps] = await Promise.all([
      prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.application.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);
    const usersByDay = countByDay(recentUsers);
    const appsByDay = countByDay(recentApps);
    const days = Array.from({ length: 14 }, (_, i) => {
      const date = tashkentDayKey(new Date(since.getTime() + i * DAY_MS));
      return { date, users: usersByDay.get(date) ?? 0, applications: appsByDay.get(date) ?? 0 };
    });

    return {
      users: { total: users, seekers, employers, blocked, newThisWeek: newUsersWeek },
      companies: { total: companies, verified: verifiedCompanies },
      vacancies: { active: vacanciesActive, moderation: vacanciesModeration },
      applications: { total: applications, today: applicationsToday },
      reviews: { pending: reviewsPending },
      payments: { paid: paymentsPaid, revenue: revenueRows._sum.amount ?? 0 },
      // Monetizatsiya o'chiq (audit R3, D-065): panel tushum/tarif ko'rinishlarini shu bayroq bo'yicha yashiradi
      billingEnabled: features.billing,
      search: { engine: isSearchEngineEnabled() ? "meilisearch" : "mongodb" },
      chart: days,
    };
  });

  // ---------------------------------------------------------
  // Foydalanuvchilar
  // ---------------------------------------------------------
  app.get("/api/admin/users", adminOnly, async (req) => {
    const query = pageSchema.extend({ role: z.enum(["job_seeker", "employer", "admin"]).optional() }).parse(req.query);
    const { page, pageSize, skip, take } = paging(query);

    // Ism bo'yicha qidiruv relation filter ($lookup) emas, oldindan yechilgan `userId` ro'yxati
    // orqali (audit R3, admin-staff-11): ilgari har hujjat uchun $lookup ikki marta (ro'yxat + count) ishlardi.
    const text = searchText(query.text);
    const variants = textVariants(text);
    let profileUserIds: string[] = [];
    if (variants.length) {
      const profiles = await prisma.jobSeekerProfile.findMany({
        where: { OR: variants.flatMap((v) => [{ firstName: like(v) }, { lastName: like(v) }]) },
        select: { userId: true },
        take: RELATION_MATCH_LIMIT,
      });
      profileUserIds = profiles.map((r) => r.userId);
    }
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(variants.length
        ? {
            OR: [
              ...variants.flatMap((v) => [{ email: like(v) }, { phone: like(v) }]),
              ...(profileUserIds.length ? [{ id: { in: profileUserIds } }] : []),
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          jobSeekerProfile: { select: { firstName: true, lastName: true } },
          ownedCompanies: { select: { name: true, slug: true }, orderBy: { createdAt: "asc" }, take: 1 },
          _count: { select: { applications: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: rows.map((u: (typeof rows)[number]) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isBlocked: u.isBlocked,
        isPhoneVerified: u.isPhoneVerified,
        telegramLinked: Boolean(u.telegramChatId),
        name: [u.jobSeekerProfile?.firstName, u.jobSeekerProfile?.lastName].filter(Boolean).join(" ") || null,
        companyName: u.ownedCompanies[0]?.name ?? null,
        applicationCount: u._count.applications,
        createdAt: u.createdAt,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  });

  app.patch("/api/admin/users/:id/block", adminOnly, async (req) => {
    const { id } = idParams.parse(req.params);
    const { isBlocked } = z.object({ isBlocked: z.boolean() }).parse(req.body);
    if (id === req.user!.sub) throw Errors.badRequest("O'zingizni bloklay olmaysiz");

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, isBlocked: true } });
    if (!target) throw Errors.notFound("Foydalanuvchi topilmadi");
    // Oxirgi faol adminni bloklab, panelni butunlay yopib bo'lmaydi (audit R3, D-077)
    if (isBlocked && target.role === "admin" && !target.isBlocked) await assertNotLastActiveAdmin(id);

    const user = await prisma.user.update({ where: { id }, data: { isBlocked } });
    // Xavfsizlik jurnali (audit R3, D-050): admin amallari iz qoldiradi
    recordSecurityEvent({ type: isBlocked ? "user_blocked" : "user_unblocked", userId: id, actorId: req.user!.sub });

    if (isBlocked) {
      // Blok darhol kuchga kiradi: refresh tokenlar bekor qilinadi va ochiq WebSocket ulanishlari
      // yopiladi (audit ISSUE-035). Access token har autentifikatsiyalangan so'rovda bazadan tekshiriladi (audit PHASE 6, V5).
      await revokeUserSessions(id);
      closeUserSockets(id);
      recordSecurityEvent({ type: "sessions_invalidated", userId: id, actorId: req.user!.sub, meta: { reason: "user_blocked" } });

      // Uning faol vakansiyalari ham saytdan olinadi va qulflanadi (audit R3, D-070)
      await archiveOwnerVacancies(id, "user_blocked", req.log);
      // Bloklangan adminning kutilayotgan staff takliflari bekor bo'ladi (audit R3, D-077, gap2-3)
      const revoked = await revokePendingStaffInvites(id);
      if (revoked > 0) {
        recordSecurityEvent({ type: "user_blocked", userId: id, actorId: req.user!.sub, meta: { invitesRevoked: revoked } });
      }
    }

    return { id: user.id, isBlocked: user.isBlocked };
  });

  app.patch("/api/admin/users/:id/role", adminOnly, async (req) => {
    const { id } = idParams.parse(req.params);
    const { role } = z.object({ role: z.enum(["job_seeker", "employer", "admin"]) }).parse(req.body);
    if (id === req.user!.sub) throw Errors.badRequest("O'z rolingizni o'zgartira olmaysiz");
    const previous = await prisma.user.findUnique({ where: { id }, select: { role: true, isBlocked: true } });
    if (!previous) throw Errors.notFound("Foydalanuvchi topilmadi");
    // Oxirgi faol adminning rolini tushirib bo'lmaydi (audit R3, D-077)
    if (previous.role === "admin" && role !== "admin" && !previous.isBlocked) await assertNotLastActiveAdmin(id);
    const user = await prisma.user.update({ where: { id }, data: { role } });
    // Ish beruvchi rolidan chiqqan hisobning faol e'lonlari yetim qolmaydi: bloklashdagi kabi
    // arxivlanadi va qulflanadi (audit R3, D-077; employer-flows-5, data-integrity-6, admin-staff-7)
    if (previous.role === "employer" && role !== "employer") {
      await archiveOwnerVacancies(id, "role_changed", req.log);
    }
    // Admin rolidan tushirilgan hisobning kutilayotgan staff takliflari bekor bo'ladi (D-077, gap2-3)
    if (previous.role === "admin" && role !== "admin") await revokePendingStaffInvites(id);
    // Eski rol yozilgan tokenlar bilan davom etib bo'lmasin: qayta kirishda yangi rol olinadi
    await revokeUserSessions(id);
    closeUserSockets(id);
    recordSecurityEvent({
      type: "role_changed",
      userId: id,
      actorId: req.user!.sub,
      meta: { from: previous?.role ?? "", to: role },
    });
    recordSecurityEvent({ type: "sessions_invalidated", userId: id, actorId: req.user!.sub, meta: { reason: "role_changed" } });
    return { id: user.id, role: user.role };
  });

  // ---------------------------------------------------------
  // Vakansiyalar moderatsiyasi
  // ---------------------------------------------------------
  app.get("/api/admin/vacancies", adminOnly, async (req) => {
    const query = pageSchema
      .extend({
        status: z.enum(["draft", "moderation", "active", "archived", "rejected"]).optional(),
      })
      .parse(req.query);
    const { page, pageSize, skip, take } = paging(query);

    // Kompaniya nomi bo'yicha qidiruv relation filter emas, oldindan yechilgan `companyId` ro'yxati
    // orqali (audit R3, employer-flows-12, scale-10k-12)
    const text = searchText(query.text);
    const variants = textVariants(text);
    let companyIds: string[] = [];
    if (variants.length) {
      const companies = await prisma.company.findMany({
        where: { OR: variants.map((v) => ({ name: like(v) })) },
        select: { id: true },
        take: RELATION_MATCH_LIMIT,
      });
      companyIds = companies.map((c) => c.id);
    }
    const where: Prisma.VacancyWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(variants.length
        ? {
            OR: [
              ...variants.map((v) => ({ title: like(v) })),
              ...(companyIds.length ? [{ companyId: { in: companyIds } }] : []),
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.vacancy.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          company: { select: { name: true, slug: true } },
          region: { select: { name: true } },
        },
      }),
      prisma.vacancy.count({ where }),
    ]);
    const counts = await applicationCounts(rows.map((v: (typeof rows)[number]) => v.id));

    return {
      items: rows.map((v: (typeof rows)[number]) => ({
        id: v.id,
        slug: v.slug,
        title: v.title,
        status: v.status,
        companyName: v.company.name,
        companySlug: v.company.slug,
        regionName: v.region?.name ?? null,
        salaryMin: v.salaryMin,
        salaryMax: v.salaryMax,
        isPremium: v.isPremium,
        viewsCount: v.viewsCount,
        applicationCount: counts.get(v.id) ?? 0,
        rejectionReason: v.rejectionReason,
        // Admin yopgan e'lon (audit R3, D-070): ish beruvchi uni qayta ocholmaydi
        adminArchivedAt: v.adminArchivedAt,
        createdAt: v.createdAt,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  });

  app.patch("/api/admin/vacancies/:id/moderate", adminOnly, async (req) => {
    const { id } = idParams.parse(req.params);
    const { status, reason, isPremium } = z
      .object({
        status: z.enum(["active", "rejected", "archived"]).optional(),
        reason: z.string().max(500).optional(),
        isPremium: z.boolean().optional(),
      })
      .parse(req.body);

    const vacancy = await prisma.vacancy.findUnique({
      where: { id },
      include: { company: { select: { ownerUserId: true, owner: { select: { isBlocked: true } } } } },
    });
    if (!vacancy) throw Errors.notFound();

    if (status === "active") {
      // Bloklangan hisobning e'loni saytga qaytmaydi (audit R3, data-integrity-3): avval blok olinadi
      if (vacancy.company.owner.isBlocked) {
        throw new AppError(409, "OWNER_BLOCKED", "E'lon egasi bloklangan — avval hisob blokini oching");
      }
      // Qoralama — ish beruvchining shaxsiy ishi: moderator uni chop eta olmaydi (audit R3, D-070, admin-staff-6)
      if (vacancy.status === "draft") {
        throw new AppError(
          409,
          "VACANCY_IS_DRAFT",
          "Qoralama e'lonni chop etib bo'lmaydi — uni faqat ish beruvchining o'zi joylashi mumkin"
        );
      }
      // Tasdiqlashda ham kategoriya / ish joylashuvi / hudud qoidalari tekshiriladi:
      // ilgari admin to'ldirilmagan e'lonni faollashtirib, ochiq ro'yxatga yaroqsiz yozuv tushardi
      await assertVacancyPlacement({
        categoryId: vacancy.categoryId,
        regionId: vacancy.regionId,
        workplaceType: effectiveWorkplaceType({}, vacancy),
      });
    }

    const now = new Date();
    const updated = await prisma.vacancy.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(status === "rejected" ? { rejectionReason: reason ?? null } : {}),
        ...(status === "active" ? { rejectionReason: null, publishedAt: vacancy.publishedAt ?? now } : {}),
        // Admin qulfi (audit R3, D-070): rad etilgan/arxivlangan e'lonni ish beruvchi qayta ocholmaydi,
        // admin faollashtirsa qulf ochiladi.
        ...(status === "rejected" || status === "archived" ? { adminArchivedAt: now } : {}),
        ...(status === "active" ? { adminArchivedAt: null } : {}),
        ...(isPremium !== undefined ? { isPremium } : {}),
      },
    });

    void syncVacancyIndex(updated.id, updated.status);
    bumpDataVersion();

    if (status === "rejected") {
      void notify({
        userId: vacancy.company.ownerUserId,
        type: "system",
        title: "Vakansiya rad etildi",
        body: `"${vacancy.title}" moderatsiyadan o'tmadi${reason ? `: ${reason}` : ""}`,
        url: "/employer/vacancies",
        // Web matnni o'z tilida chizadi (audit R3, D-059)
        i18n: { key: "vacancy.rejected", params: { vacancyTitle: vacancy.title, reason: reason ?? "" } },
      });
    }
    if (status === "archived") {
      // Ish beruvchi e'loni nega yo'qolganini bilsin (audit R3, employer-flows-14)
      void notify({
        userId: vacancy.company.ownerUserId,
        type: "system",
        title: "Vakansiya yopildi",
        body: `"${vacancy.title}" administrator tomonidan yopildi.`,
        url: "/employer/vacancies",
        i18n: { key: "vacancy.archivedByAdmin", params: { vacancyTitle: vacancy.title } },
      });
    }

    return { id: updated.id, status: updated.status, isPremium: updated.isPremium, adminArchivedAt: updated.adminArchivedAt };
  });

  // ---------------------------------------------------------
  // Kompaniyalar
  // ---------------------------------------------------------
  app.get("/api/admin/companies", adminOnly, async (req) => {
    const query = pageSchema.extend({ verified: boolish().optional() }).parse(req.query);
    const { page, pageSize, skip, take } = paging(query);

    // Maxsus regex belgilari zararsizlantiriladi (audit R3, admin-staff-11)
    const text = searchText(query.text);
    const variants = textVariants(text);
    const where: Prisma.CompanyWhereInput = {
      ...(query.verified !== undefined ? { isVerified: query.verified } : {}),
      ...(variants.length ? { OR: variants.map((v) => ({ name: like(v) })) } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          owner: { select: { email: true } },
          subscriptionPlan: { select: { name: true, slug: true } },
          _count: { select: { vacancies: true, reviews: true } },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      items: rows.map((c: (typeof rows)[number]) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        ownerEmail: c.owner.email,
        isVerified: c.isVerified,
        planName: c.subscriptionPlan?.name ?? null,
        subscriptionExpiresAt: c.subscriptionExpiresAt,
        vacancyCount: c._count.vacancies,
        reviewCount: c._count.reviews,
        createdAt: c.createdAt,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  });

  app.patch("/api/admin/companies/:id/verify", adminOnly, async (req) => {
    const { id } = idParams.parse(req.params);
    const { isVerified } = z.object({ isVerified: z.boolean() }).parse(req.body);
    const company = await prisma.company.update({
      where: { id },
      data: { isVerified },
      select: { id: true, isVerified: true, ownerUserId: true, name: true },
    });
    bumpDataVersion();

    if (isVerified) {
      void notify({
        userId: company.ownerUserId,
        type: "system",
        title: "Kompaniya tasdiqlandi",
        body: `"${company.name}" endi tasdiqlangan ish beruvchi belgisiga ega.`,
        url: "/profile",
        i18n: { key: "company.verified", params: { companyName: company.name } },
      });
    }
    return { id: company.id, isVerified: company.isVerified };
  });

  // ---------------------------------------------------------
  // Sharhlar moderatsiyasi
  // ---------------------------------------------------------
  app.get("/api/admin/reviews", adminOnly, async (req) => {
    const query = pageSchema
      .extend({ status: z.enum(["pending", "approved", "rejected"]).optional() })
      .parse(req.query);
    const { page, pageSize, skip, take } = paging(query);
    const where: Prisma.CompanyReviewWhereInput = query.status ? { status: query.status } : {};

    const [rows, total] = await Promise.all([
      prisma.companyReview.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          company: { select: { name: true, slug: true } },
          user: {
            select: { email: true, jobSeekerProfile: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      prisma.companyReview.count({ where }),
    ]);

    return {
      items: rows.map((r: (typeof rows)[number]) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        companyName: r.company.name,
        companySlug: r.company.slug,
        authorName:
          [r.user.jobSeekerProfile?.firstName, r.user.jobSeekerProfile?.lastName]
            .filter(Boolean)
            .join(" ") || r.user.email,
        createdAt: r.createdAt,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  });

  app.patch("/api/admin/reviews/:id", adminOnly, async (req) => {
    const { id } = idParams.parse(req.params);
    const { status } = z.object({ status: z.enum(["pending", "approved", "rejected"]) }).parse(req.body);
    const review = await prisma.companyReview.update({ where: { id }, data: { status } });
    bumpDataVersion();
    return { id: review.id, status: review.status };
  });

  app.delete("/api/admin/reviews/:id", adminOnly, async (req) => {
    const { id } = idParams.parse(req.params);
    await prisma.companyReview.delete({ where: { id } });
    bumpDataVersion();
    return { ok: true };
  });

  // ---------------------------------------------------------
  // To'lovlar (monetizatsiya o'chiq — faqat eski yozuvlarni ko'rish/tasdiqlash)
  // ---------------------------------------------------------
  app.get("/api/admin/payments", adminOnly, async (req) => {
    const query = pageSchema
      .extend({ status: z.enum(["pending", "paid", "failed", "refunded"]).optional() })
      .parse(req.query);
    const { page, pageSize, skip, take } = paging(query);
    const where: Prisma.PaymentWhereInput = query.status ? { status: query.status } : {};

    const [rows, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          company: { select: { name: true, slug: true } },
          plan: { select: { name: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      items: rows.map((p: (typeof rows)[number]) => ({
        id: p.id,
        transactionId: p.transactionId,
        companyName: p.company.name,
        planName: p.plan.name,
        amount: p.amount,
        status: p.status,
        provider: p.provider,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  });

  // Provayder ulanmagan bo'lsa — to'lovni admin qo'lda tasdiqlaydi.
  // Monetizatsiya o'chiq bo'lsa endpoint umuman yo'q (audit R3, D-065; monetization-3, admin-staff-14):
  // ilgari bepul platformada ham tarif "faollashtirildi" degan bildirishnoma yuborardi.
  app.post("/api/admin/payments/:transactionId/confirm", adminOnly, async (req) => {
    if (!features.billing) throw Errors.notFound("To'lovlar moduli o'chirilgan");
    const { transactionId } = z.object({ transactionId: z.string().min(1).max(64) }).parse(req.params);
    await markPaymentPaid(transactionId);

    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      include: { company: { select: { ownerUserId: true } }, plan: { select: { name: true } } },
    });
    if (payment) {
      void notify({
        userId: payment.company.ownerUserId,
        type: "system",
        title: "To'lov tasdiqlandi",
        body: `"${payment.plan.name}" tarifi faollashtirildi.`,
        // Tariflar sahifasi ko'rsatilmaydi (platforma bepul) — havola profilga
        url: "/profile",
        i18n: { key: "payment.confirmed", params: { planName: payment.plan.name } },
      });
    }
    return { ok: true };
  });

  // ---------------------------------------------------------
  // Xizmat amallari
  // ---------------------------------------------------------

  // Qidiruv indeksini qayta qurish
  app.post("/api/admin/search/reindex", adminOnly, async () => reindexAll());

  // Obuna xabarnomalarini hoziroq tekshirish
  app.post("/api/admin/alerts/run", adminOnly, async () => runAlertSweep());

  // Ommaviy xabar (tanlangan rolga)
  app.post("/api/admin/broadcast", adminOnly, async (req, reply) => {
    const { title, body, role, url } = z
      .object({
        title: z.string().trim().min(3).max(140),
        body: z.string().trim().min(3).max(1000),
        role: z.enum(["all", "job_seeker", "employer"]).default("all"),
        url: z.string().max(200).optional(),
      })
      .parse(req.body);

    if (broadcastRunning) {
      throw new AppError(409, "BROADCAST_RUNNING", "Oldingi ommaviy xabar hali yuborilmoqda — tugagach qayta urinib ko'ring");
    }

    const where: Prisma.UserWhereInput = { isBlocked: false, ...(role === "all" ? {} : { role }) };
    const total = await prisma.user.count({ where });
    // Faqat sayt ichidagi yo'l: "//host" va "/\host" tashqi saytga ochiladi (audit ISSUE-054)
    const target = safeInternalPath(url) ?? "/";
    const log = req.log;

    // Minglab foydalanuvchida HTTP so'rov kutib qolmasin (audit ISSUE-054): javob darhol (202),
    // yuborish fonda, foydalanuvchilar 500 talik bo'laklarda o'qiladi.
    broadcastRunning = true;
    void (async () => {
      let delivered = 0;
      try {
        // Keyset sahifalash (id > oxirgi): Prisma `cursor` hujjati (chegaradagi foydalanuvchi) skan paytida
        // o'chirilsa sikl erta tugab, qolganlarga xabar bormasdi (audit PHASE 6, U15)
        let lastId: string | undefined;
        for (;;) {
          const batch = await prisma.user.findMany({
            where: lastId ? { ...where, id: { gt: lastId } } : where,
            select: { id: true },
            orderBy: { id: "asc" },
            take: BROADCAST_BATCH,
          });
          if (batch.length === 0) break;
          for (const user of batch) {
            const startedAt = Date.now();
            // Tashqi kanallar kutiladi va foydalanuvchilar orasida kamida 40 ms (≈25/s) — audit PHASE 6, V9
            await notify({ userId: user.id, type: "system", title, body, url: target, awaitChannels: true });
            delivered += 1;
            const wait = BROADCAST_MIN_GAP_MS - (Date.now() - startedAt);
            if (wait > 0) await sleep(wait);
          }
          lastId = batch[batch.length - 1].id;
          if (batch.length < BROADCAST_BATCH) break;
        }
        log.info({ delivered }, "Ommaviy xabar yuborildi");
      } catch (err) {
        log.error({ err, delivered }, "Ommaviy xabar yuborish to'xtadi");
      } finally {
        broadcastRunning = false;
      }
    })();

    return reply.status(202).send({ sent: total });
  });
  // ---------------------------------------------------------
  // Qo'lda tiklash so'rovlari (audit R3, D-049; telegram-6, admin-staff-2)
  //
  // Admin FAQAT egalikni tasdiqlaydi: parol, reset havolasi yoki tokenni ko'rmaydi va
  // parol o'rnata olmaydi. Tasdiqlanganda hisobdagi telefon va Telegram bog'lanishlari
  // tozalanadi, barcha seanslar bekor bo'ladi va foydalanuvchi 72 soat ichida botda yangi
  // raqamini tasdiqlab, reset havolasini oladi.
  // ---------------------------------------------------------
  app.get("/api/admin/recovery-requests", adminOnly, async (req) => {
    const query = pageSchema
      .extend({ status: z.enum(["pending", "approved", "rejected", "completed", "expired"]).optional() })
      .parse(req.query);
    const { page, pageSize, skip, take } = paging(query);
    const where: Prisma.RecoveryRequestWhereInput = query.status ? { status: query.status } : {};

    const [rows, total] = await Promise.all([
      prisma.recoveryRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.recoveryRequest.count({ where }),
    ]);

    // Hisoblar bitta so'rovda (N+1 yo'q)
    const userIds = [...new Set(rows.map((r) => r.userId).filter((v): v is string => Boolean(v)))];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            role: true,
            createdAt: true,
            isBlocked: true,
            phone: true,
            isPhoneVerified: true,
            backupPhone: true,
            telegramChatId: true,
          },
        })
      : [];
    const byId = new Map(users.map((u) => [u.id, u]));

    return {
      items: rows.map((r) => {
        const account = r.userId ? byId.get(r.userId) : undefined;
        return {
          id: r.id,
          email: r.email,
          fullName: r.fullName,
          details: r.details,
          contact: r.contact,
          status: r.status,
          createdAt: r.createdAt,
          reviewedAt: r.reviewedAt,
          reviewNote: r.reviewNote,
          continueExpiresAt: r.continueExpiresAt,
          // Telefon raqamlari NIQOBLANGAN holda (D-050): admin panelida to'liq raqam ko'rinmaydi
          account: account
            ? {
                exists: true,
                id: account.id,
                role: account.role,
                createdAt: account.createdAt,
                isBlocked: account.isBlocked,
                phoneMasked: account.isPhoneVerified ? maskPhone(account.phone) : null,
                backupPhoneMasked: maskPhone(account.backupPhone),
                telegramLinked: Boolean(account.telegramChatId),
              }
            : { exists: false },
        };
      }),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  });

  /** Tasdiqlash: tiklash kanallari tozalanadi va so'rov 72 soat davomida davom ettiriladi. */
  app.post("/api/admin/recovery-requests/:id/approve", adminOnly, async (req) => {
    const { id } = idParams.parse(req.params);
    const { note } = z.object({ note: z.string().trim().max(500).optional() }).parse(req.body ?? {});

    const request = await prisma.recoveryRequest.findUnique({ where: { id } });
    if (!request) throw Errors.notFound();
    if (request.status !== "pending") {
      throw new AppError(409, "REQUEST_NOT_PENDING", "So'rov allaqachon ko'rib chiqilgan");
    }
    if (!request.userId) {
      throw new AppError(409, "ACCOUNT_NOT_FOUND", "Bu email bilan hisob yo'q — so'rovni rad eting");
    }
    const user = await prisma.user.findUnique({ where: { id: request.userId }, select: { id: true, telegramChatId: true } });
    if (!user) throw new AppError(409, "ACCOUNT_NOT_FOUND", "Hisob topilmadi — so'rovni rad eting");

    const continueExpiresAt = new Date(Date.now() + RECOVERY_CONTINUE_TTL_MS);
    const claimed = await prisma.recoveryRequest.updateMany({
      where: { id, status: "pending" },
      data: {
        status: "approved",
        reviewedById: req.user!.sub,
        reviewNote: note ?? null,
        reviewedAt: new Date(),
        continueExpiresAt,
      },
    });
    if (claimed.count !== 1) throw new AppError(409, "REQUEST_NOT_PENDING", "So'rov allaqachon ko'rib chiqilgan");

    // Tiklash kanallari tozalanadi: eski telefon va Telegram bog'lanishi bekor qilinadi
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: null,
        isPhoneVerified: false,
        phoneVerifiedAt: null,
        telegramChatId: null,
        backupPhone: null,
        backupPhoneVerifiedAt: null,
        backupTelegramId: null,
      },
    });
    await revokeUserSessions(user.id);
    closeUserSockets(user.id);

    recordSecurityEvent({ type: "manual_recovery_approved", userId: user.id, actorId: req.user!.sub, meta: { requestId: id } });
    recordSecurityEvent({ type: "sessions_invalidated", userId: user.id, actorId: req.user!.sub, meta: { reason: "manual_recovery" } });
    if (user.telegramChatId) {
      recordSecurityEvent({ type: "telegram_unlinked", userId: user.id, actorId: req.user!.sub, meta: { reason: "manual_recovery" } });
    }

    return { ok: true as const, id, status: "approved" as const, continueExpiresAt };
  });

  app.post("/api/admin/recovery-requests/:id/reject", adminOnly, async (req) => {
    const { id } = idParams.parse(req.params);
    const { note } = z.object({ note: z.string().trim().max(500).optional() }).parse(req.body ?? {});

    const request = await prisma.recoveryRequest.findUnique({ where: { id }, select: { userId: true, status: true } });
    if (!request) throw Errors.notFound();
    const rejected = await prisma.recoveryRequest.updateMany({
      where: { id, status: "pending" },
      data: { status: "rejected", reviewedById: req.user!.sub, reviewNote: note ?? null, reviewedAt: new Date() },
    });
    if (rejected.count !== 1) throw new AppError(409, "REQUEST_NOT_PENDING", "So'rov allaqachon ko'rib chiqilgan");
    // Hisobsiz (noma'lum email) so'rov ham jurnalga tushadi: admin qarori har doim iz qoldiradi
    recordSecurityEvent({
      type: "manual_recovery_rejected",
      userId: request.userId,
      actorId: req.user!.sub,
      meta: { requestId: id },
    });
    return { ok: true as const, id, status: "rejected" as const };
  });

  /** Bitta foydalanuvchining oxirgi xavfsizlik hodisalari (maxfiy qiymatlarsiz). */
  app.get("/api/admin/users/:id/security-events", adminOnly, async (req) => {
    const { id } = idParams.parse(req.params);
    const rows = await prisma.securityEvent.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return {
      items: rows.map((e) => ({
        id: e.id,
        type: e.type,
        meta: e.meta ?? null,
        actorId: e.actorId,
        createdAt: e.createdAt,
      })),
    };
  });
}
