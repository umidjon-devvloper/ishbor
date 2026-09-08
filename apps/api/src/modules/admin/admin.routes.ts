import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../common/prisma.js";
import { Errors } from "../../common/errors.js";
import { requireAuth, requireRole } from "../../common/auth-guard.js";
import { boolish } from "../../common/validation.js";
import { notify } from "../notifications/notifications.service.js";
import { reindexAll, isSearchEngineEnabled } from "../search/search.service.js";
import { syncVacancyIndex } from "../vacancies/vacancies.service.js";
import { runAlertSweep } from "../alerts/alerts.service.js";
import { markPaymentPaid } from "../billing/billing.service.js";

/**
 * Admin paneli: moderatsiya, foydalanuvchi boshqaruvi, statistika, to'lovlar.
 * Barcha yo'llar `admin` roli bilan himoyalangan.
 */

const adminOnly = { preHandler: [requireAuth, requireRole("admin")] };

const pageSchema = z.object({
  text: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

function paging(query: z.infer<typeof pageSchema>) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 25;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

const like = (v: string) => ({ contains: v, mode: "insensitive" as const });

export async function adminRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------
  // Umumiy ko'rsatkichlar
  // ---------------------------------------------------------
  app.get("/api/admin/overview", adminOnly, async () => {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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
      prisma.application.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.companyReview.count({ where: { status: "pending" } }),
      prisma.payment.count({ where: { status: "paid" } }),
      prisma.payment.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
    ]);

    // Oxirgi 14 kunlik ro'yxatdan o'tish/ariza dinamikasi (grafik uchun)
    const since = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
    since.setHours(0, 0, 0, 0);
    const [recentUsers, recentApps] = await Promise.all([
      prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.application.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const days: { date: string; users: number; applications: number }[] = [];
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        users: recentUsers.filter((u: { createdAt: Date }) => u.createdAt.toISOString().slice(0, 10) === key).length,
        applications: recentApps.filter((a: { createdAt: Date }) => a.createdAt.toISOString().slice(0, 10) === key)
          .length,
      });
    }

    return {
      users: { total: users, seekers, employers, blocked, newThisWeek: newUsersWeek },
      companies: { total: companies, verified: verifiedCompanies },
      vacancies: { active: vacanciesActive, moderation: vacanciesModeration },
      applications: { total: applications, today: applicationsToday },
      reviews: { pending: reviewsPending },
      payments: { paid: paymentsPaid, revenue: revenueRows._sum.amount ?? 0 },
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

    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.text
        ? {
            OR: [
              { email: like(query.text) },
              { phone: like(query.text) },
              { jobSeekerProfile: { firstName: like(query.text) } },
              { jobSeekerProfile: { lastName: like(query.text) } },
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
          ownedCompanies: { select: { name: true, slug: true }, take: 1 },
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
    const { id } = req.params as { id: string };
    const { isBlocked } = z.object({ isBlocked: z.boolean() }).parse(req.body);
    if (id === req.user!.sub) throw Errors.badRequest("O'zingizni bloklay olmaysiz");

    const user = await prisma.user.update({ where: { id }, data: { isBlocked } });

    // Bloklanganda uning faol vakansiyalari ham saytdan olinadi
    if (isBlocked) {
      const vacancies = await prisma.vacancy.findMany({
        where: { company: { ownerUserId: id }, status: "active" },
        select: { id: true },
      });
      await prisma.vacancy.updateMany({
        where: { company: { ownerUserId: id }, status: "active" },
        data: { status: "archived" },
      });
      for (const v of vacancies) void syncVacancyIndex(v.id, "archived");
    }

    return { id: user.id, isBlocked: user.isBlocked };
  });

  app.patch("/api/admin/users/:id/role", adminOnly, async (req) => {
    const { id } = req.params as { id: string };
    const { role } = z.object({ role: z.enum(["job_seeker", "employer", "admin"]) }).parse(req.body);
    if (id === req.user!.sub) throw Errors.badRequest("O'z rolingizni o'zgartira olmaysiz");
    const user = await prisma.user.update({ where: { id }, data: { role } });
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

    const where: Prisma.VacancyWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.text
        ? { OR: [{ title: like(query.text) }, { company: { name: like(query.text) } }] }
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
          _count: { select: { applications: true } },
        },
      }),
      prisma.vacancy.count({ where }),
    ]);

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
        applicationCount: v._count.applications,
        rejectionReason: v.rejectionReason,
        createdAt: v.createdAt,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  });

  app.patch("/api/admin/vacancies/:id/moderate", adminOnly, async (req) => {
    const { id } = req.params as { id: string };
    const { status, reason, isPremium } = z
      .object({
        status: z.enum(["active", "rejected", "archived"]).optional(),
        reason: z.string().max(500).optional(),
        isPremium: z.boolean().optional(),
      })
      .parse(req.body);

    const vacancy = await prisma.vacancy.findUnique({
      where: { id },
      include: { company: { select: { ownerUserId: true } } },
    });
    if (!vacancy) throw Errors.notFound();

    const updated = await prisma.vacancy.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(status === "rejected" ? { rejectionReason: reason ?? null } : {}),
        ...(status === "active" ? { rejectionReason: null, publishedAt: vacancy.publishedAt ?? new Date() } : {}),
        ...(isPremium !== undefined ? { isPremium } : {}),
      },
    });

    void syncVacancyIndex(updated.id, updated.status);

    if (status === "rejected") {
      void notify({
        userId: vacancy.company.ownerUserId,
        type: "system",
        title: "Vakansiya rad etildi",
        body: `"${vacancy.title}" moderatsiyadan o'tmadi${reason ? `: ${reason}` : ""}`,
        url: "/employer/vacancies",
      });
    }

    return { id: updated.id, status: updated.status, isPremium: updated.isPremium };
  });

  // ---------------------------------------------------------
  // Kompaniyalar
  // ---------------------------------------------------------
  app.get("/api/admin/companies", adminOnly, async (req) => {
    const query = pageSchema.extend({ verified: boolish().optional() }).parse(req.query);
    const { page, pageSize, skip, take } = paging(query);

    const where: Prisma.CompanyWhereInput = {
      ...(query.verified !== undefined ? { isVerified: query.verified } : {}),
      ...(query.text ? { name: like(query.text) } : {}),
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
    const { id } = req.params as { id: string };
    const { isVerified } = z.object({ isVerified: z.boolean() }).parse(req.body);
    const company = await prisma.company.update({
      where: { id },
      data: { isVerified },
      select: { id: true, isVerified: true, ownerUserId: true, name: true },
    });

    if (isVerified) {
      void notify({
        userId: company.ownerUserId,
        type: "system",
        title: "Kompaniya tasdiqlandi",
        body: `"${company.name}" endi tasdiqlangan ish beruvchi belgisiga ega.`,
        url: "/profile",
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
    const { id } = req.params as { id: string };
    const { status } = z.object({ status: z.enum(["pending", "approved", "rejected"]) }).parse(req.body);
    const review = await prisma.companyReview.update({ where: { id }, data: { status } });
    return { id: review.id, status: review.status };
  });

  app.delete("/api/admin/reviews/:id", adminOnly, async (req) => {
    const { id } = req.params as { id: string };
    await prisma.companyReview.delete({ where: { id } });
    return { ok: true };
  });

  // ---------------------------------------------------------
  // To'lovlar
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

  // Provayder ulanmagan bo'lsa — to'lovni admin qo'lda tasdiqlaydi
  app.post("/api/admin/payments/:transactionId/confirm", adminOnly, async (req) => {
    const { transactionId } = req.params as { transactionId: string };
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
        url: "/pricing",
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
  app.post("/api/admin/broadcast", adminOnly, async (req) => {
    const { title, body, role, url } = z
      .object({
        title: z.string().trim().min(3).max(140),
        body: z.string().trim().min(3).max(1000),
        role: z.enum(["all", "job_seeker", "employer"]).default("all"),
        url: z.string().max(200).optional(),
      })
      .parse(req.body);

    const users = await prisma.user.findMany({
      where: { isBlocked: false, ...(role === "all" ? {} : { role }) },
      select: { id: true },
    });

    // Ketma-ket yuboramiz — minglab foydalanuvchida DB'ni bosmasligi uchun
    for (const u of users) {
      await notify({
        userId: u.id,
        type: "system",
        title,
        body,
        url: url && url.startsWith("/") ? url : "/",
      }).catch(() => undefined);
    }
    return { sent: users.length };
  });
}
