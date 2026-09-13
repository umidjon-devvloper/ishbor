import type { FastifyInstance } from "fastify";
import type { ApplicationStatus } from "@prisma/client";
import type { SocketStream } from "@fastify/websocket";
import { z } from "zod";
import { objectId } from "../../common/validation.js";
import { prisma } from "../../common/prisma.js";
import { Errors, AppError } from "../../common/errors.js";
import { env } from "../../common/env.js";
import { requireAuth, requirePhoneVerified } from "../../common/auth-guard.js";
import { verifyAccessToken } from "../../common/jwt.js";
import { addSocket, removeSocket, sendToUser, isOnline } from "../../common/realtime.js";
import { notifyUserViaTelegram, tgEscape } from "../telegram/telegram.service.js";

async function participantsOf(conversationId: string) {
  const c = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { employerUserId: true, seekerUserId: true },
  });
  if (!c) return null;
  return { employerId: c.employerUserId, seekerId: c.seekerUserId };
}

/** Juftlik bo'yicha suhbatni topadi yoki yaratadi. */
export async function getOrCreateConversation(
  employerUserId: string,
  seekerUserId: string,
  companyId?: string | null
) {
  const existing = await prisma.conversation.findUnique({
    where: { employerUserId_seekerUserId: { employerUserId, seekerUserId } },
  });
  if (existing) {
    // Kompaniya konteksti keyinroq aniqlansa — yozib qo'yamiz
    if (!existing.companyId && companyId) {
      return prisma.conversation.update({ where: { id: existing.id }, data: { companyId } });
    }
    return existing;
  }
  return prisma.conversation.create({
    data: { employerUserId, seekerUserId, companyId: companyId ?? null },
  });
}

const startSchema = z.object({
  candidateUserId: objectId().optional(),
  companySlug: z.string().optional(),
});

/** Suhbat kontekstidagi arizani tanlash tartibi: taklif/qabul — faol muloqot, rad etilgan — oxirida. */
const CONTEXT_RANK: Record<ApplicationStatus, number> = { invited: 0, accepted: 1, viewed: 2, sent: 3, rejected: 4 };

const rateSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

/**
 * Baho berish sharti: suhbatda IKKALA tomon ham kamida bittadan xabar yozgan
 * bo'lishi kerak. Bir tomonlama yozib (javob olmasdan) baho qo'yib bo'lmaydi.
 */
async function isMutualConversation(conversationId: string, a: string, b: string) {
  const [fromA, fromB] = await Promise.all([
    prisma.message.count({ where: { conversationId, senderId: a }, take: 1 }),
    prisma.message.count({ where: { conversationId, senderId: b }, take: 1 }),
  ]);
  return fromA > 0 && fromB > 0;
}

export async function chatRoutes(app: FastifyInstance) {
  // Real-time chat — WebSocket. Brauzer header yubora olmagani uchun token query'da.
  app.get("/ws/chat", { websocket: true }, (connection: SocketStream, req) => {
    const ws = connection.socket;
    let userId: string;
    try {
      const url = new URL(req.url ?? "", "http://localhost");
      userId = verifyAccessToken(url.searchParams.get("token") ?? "").sub;
    } catch {
      ws.close();
      return;
    }
    addSocket(userId, ws);

    ws.on("message", async (raw) => {
      let data: { type?: string; conversationId?: string; body?: string; clientId?: unknown };
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return;
      }
      const conversationId = String(data.conversationId ?? "");
      if (!conversationId) return;
      const parts = await participantsOf(conversationId);
      if (!parts) return;
      if (userId !== parts.seekerId && userId !== parts.employerId) return;
      const otherId = userId === parts.seekerId ? parts.employerId : parts.seekerId;

      if (data.type === "read") {
        // Suhbatni o'qidim — yuboruvchini xabardor qilamiz (ikki belgi)
        await prisma.message.updateMany({
          where: { conversationId, senderId: { not: userId }, isRead: false },
          data: { isRead: true },
        });
        sendToUser(otherId, JSON.stringify({ type: "read", conversationId }));
        return;
      }

      if (data.type !== "message") return;
      const body = String(data.body ?? "").trim();
      if (!body) return;

      const saved = await prisma.message.create({
        data: { conversationId, senderId: userId, body: body.slice(0, 4000) },
      });
      const message = {
        id: saved.id,
        conversationId,
        senderId: userId,
        body: saved.body,
        isRead: false,
        createdAt: saved.createdAt,
      };
      // Yuboruvchi oynasi o'z `clientId`sini qaytarib oladi — "yuborilmoqda" pufagi shu bilan tasdiqlanadi
      const clientId = typeof data.clientId === "string" && data.clientId.length <= 64 ? data.clientId : undefined;
      sendToUser(userId, JSON.stringify({ type: "message", message, ...(clientId ? { clientId } : {}) }));
      sendToUser(otherId, JSON.stringify({ type: "message", message }));

      // Qabul qiluvchi saytda oflayn bo'lsa — Telegram orqali xabar beramiz
      if (!isOnline(otherId)) {
        void notifyUserViaTelegram(
          otherId,
          `💬 <b>Yangi xabar keldi</b>\n\n${tgEscape(saved.body.slice(0, 200))}\n\n👉 ${env.WEB_ORIGIN}/messages`
        );
      }
    });

    ws.on("close", () => removeSocket(userId, ws));
  });

  // Suhbat ochish/topish: ish beruvchi -> nomzod yoki nomzod -> kompaniya
  app.post("/api/conversations/start", { preHandler: [requireAuth, requirePhoneVerified] }, async (req) => {
    const me = req.user!.sub;
    const role = req.user!.role;
    const body = startSchema.parse(req.body);

    let conv;
    if (role === "employer" || role === "admin") {
      if (!body.candidateUserId) throw Errors.badRequest("candidateUserId kerak");
      const candidate = await prisma.user.findUnique({ where: { id: body.candidateUserId } });
      if (!candidate || candidate.role !== "job_seeker") throw Errors.notFound();
      const company = await prisma.company.findFirst({ where: { ownerUserId: me } });
      conv = await getOrCreateConversation(me, body.candidateUserId, company?.id ?? null);
    } else {
      // job_seeker -> kompaniyaga yozadi
      if (!body.companySlug) throw Errors.badRequest("companySlug kerak");
      const company = await prisma.company.findUnique({ where: { slug: body.companySlug } });
      if (!company) throw Errors.notFound();
      conv = await getOrCreateConversation(company.ownerUserId, me, company.id);
    }
    return { id: conv.id };
  });

  // Joriy foydalanuvchining suhbatlari
  app.get("/api/conversations", { preHandler: [requireAuth] }, async (req) => {
    const userId = req.user!.sub;
    const convs = await prisma.conversation.findMany({
      where: { OR: [{ employerUserId: userId }, { seekerUserId: userId }] },
      include: {
        company: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
            industry: true,
            description: true,
            region: { select: { name: true } },
          },
        },
        seeker: {
          select: {
            email: true,
            jobSeekerProfile: { select: { firstName: true, lastName: true, headline: true, avatarUrl: true } },
          },
        },
        employer: { select: { email: true, role: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const ids = convs.map((c) => c.id);
    const unreadRows = ids.length
      ? await prisma.message.groupBy({
          by: ["conversationId"],
          where: { conversationId: { in: ids }, senderId: { not: userId }, isRead: false },
          _count: { _all: true },
        })
      : [];
    const unreadMap = new Map(unreadRows.map((r) => [r.conversationId, r._count._all]));

    // Vakansiya konteksti: suhbatda vakansiya maydoni yo'q — nomzodning shu kompaniya
    // vakansiyalariga bergan arizasidan olinadi (bir nechta bo'lsa — faol bosqichdagisi).
    const withCompany = convs.filter((c) => c.companyId);
    const applications = withCompany.length
      ? await prisma.application.findMany({
          where: {
            jobSeekerId: { in: [...new Set(withCompany.map((c) => c.seekerUserId))] },
            vacancy: { is: { companyId: { in: [...new Set(withCompany.map((c) => c.companyId as string))] } } },
          },
          select: {
            jobSeekerId: true,
            status: true,
            createdAt: true,
            vacancy: {
              select: {
                companyId: true,
                title: true,
                slug: true,
                status: true,
                employmentType: true,
                experienceRequired: true,
                salaryMin: true,
                salaryMax: true,
                currency: true,
                isSalaryHidden: true,
                region: { select: { name: true } },
              },
            },
          },
        })
      : [];
    const contextOf = new Map<string, (typeof applications)[number]>();
    for (const application of applications) {
      const key = `${application.jobSeekerId}:${application.vacancy.companyId}`;
      const current = contextOf.get(key);
      const rank = CONTEXT_RANK[application.status];
      if (
        !current ||
        rank < CONTEXT_RANK[current.status] ||
        (rank === CONTEXT_RANK[current.status] && application.createdAt > current.createdAt)
      ) {
        contextOf.set(key, application);
      }
    }

    const items = convs.map((c) => {
      const iAmEmployer = c.employerUserId === userId;
      const sp = c.seeker.jobSeekerProfile;
      const seekerName = [sp?.firstName, sp?.lastName].filter(Boolean).join(" ") || c.seeker.email;
      const title = iAmEmployer ? seekerName : c.company?.name ?? c.employer.email;
      const subtitle = iAmEmployer ? sp?.headline ?? c.seeker.email : c.company?.name ? "Ish beruvchi" : c.employer.email;
      const last = c.messages[0];
      const vacancy = c.companyId ? contextOf.get(`${c.seekerUserId}:${c.companyId}`)?.vacancy : undefined;
      return {
        id: c.id,
        title,
        subtitle,
        companySlug: c.company?.slug ?? null,
        otherUserId: iAmEmployer ? c.seekerUserId : c.employerUserId,
        lastMessage: last?.body ?? null,
        lastMessageAt: last?.createdAt ?? c.createdAt,
        unread: unreadMap.get(c.id) ?? 0,
        // /messages sahifasi uchun qo'shimcha (ixtiyoriy) maydonlar
        otherRole: iAmEmployer ? "job_seeker" : c.employer.role,
        otherHeadline: iAmEmployer ? sp?.headline ?? null : null,
        avatarUrl: iAmEmployer ? sp?.avatarUrl ?? null : c.company?.logoUrl ?? null,
        lastMessageMine: last ? last.senderId === userId : false,
        lastMessageRead: last?.isRead ?? false,
        company: c.company
          ? {
              name: c.company.name,
              slug: c.company.slug,
              logoUrl: c.company.logoUrl,
              isVerified: c.company.isVerified,
              industry: c.company.industry,
              description: c.company.description,
              regionName: c.company.region?.name ?? null,
            }
          : null,
        vacancy: vacancy
          ? {
              title: vacancy.title,
              slug: vacancy.slug,
              isClosed: vacancy.status !== "active",
              employmentType: vacancy.employmentType,
              experienceRequired: vacancy.experienceRequired,
              // Yashirilgan maosh raqamlari javobga umuman qo'shilmaydi
              salaryMin: vacancy.isSalaryHidden ? null : vacancy.salaryMin,
              salaryMax: vacancy.isSalaryHidden ? null : vacancy.salaryMax,
              currency: vacancy.currency,
              regionName: vacancy.region?.name ?? null,
            }
          : null,
      };
    });

    items.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    return { items };
  });

  // Bitta suhbat tarixi (ochilganda o'qilgan deb belgilanadi)
  app.get("/api/conversations/:id/messages", { preHandler: [requireAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parts = await participantsOf(id);
    if (!parts) throw Errors.notFound();
    const me = req.user!.sub;
    if (me !== parts.seekerId && me !== parts.employerId) throw Errors.forbidden();

    const marked = await prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: me }, isRead: false },
      data: { isRead: true },
    });
    // O'qilganini yuboruvchiga real-time bildiramiz (ikki belgi)
    if (marked.count > 0) {
      const otherId = me === parts.seekerId ? parts.employerId : parts.seekerId;
      sendToUser(otherId, JSON.stringify({ type: "read", conversationId: id }));
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });
    return { items: messages, me };
  });

  // Suhbat bo'yicha baho holati: berish mumkinmi, mening bahom, suhbatdoshning o'rtachasi
  app.get("/api/conversations/:id/rating", { preHandler: [requireAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const me = req.user!.sub;
    const parts = await participantsOf(id);
    if (!parts) throw Errors.notFound();
    if (me !== parts.seekerId && me !== parts.employerId) throw Errors.forbidden();
    const otherId = me === parts.seekerId ? parts.employerId : parts.seekerId;

    const [eligible, mine, agg] = await Promise.all([
      isMutualConversation(id, parts.seekerId, parts.employerId),
      prisma.peerRating.findUnique({
        where: { conversationId_raterUserId: { conversationId: id, raterUserId: me } },
        select: { score: true, comment: true },
      }),
      prisma.peerRating.aggregate({
        where: { ratedUserId: otherId },
        _avg: { score: true },
        _count: { _all: true },
      }),
    ]);

    return {
      eligible,
      myScore: mine?.score ?? null,
      myComment: mine?.comment ?? null,
      otherAvg: agg._avg.score ? Math.round(agg._avg.score * 10) / 10 : null,
      otherCount: agg._count._all,
    };
  });

  // Suhbatdoshga 1–5 yulduz baho (faqat ikkala tomon ham yozgan bo'lsa)
  app.post("/api/conversations/:id/rating", { preHandler: [requireAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const me = req.user!.sub;
    const body = rateSchema.parse(req.body);
    const parts = await participantsOf(id);
    if (!parts) throw Errors.notFound();
    if (me !== parts.seekerId && me !== parts.employerId) throw Errors.forbidden();
    const otherId = me === parts.seekerId ? parts.employerId : parts.seekerId;

    const eligible = await isMutualConversation(id, parts.seekerId, parts.employerId);
    if (!eligible) {
      throw new AppError(
        403,
        "RATING_NOT_ELIGIBLE",
        "Baho berish uchun suhbatda ikkala tomon ham yozgan bo'lishi kerak"
      );
    }

    // Baho BIR MARTA beriladi — keyin o'zgartirib bo'lmaydi (adolatli reyting).
    const existing = await prisma.peerRating.findUnique({
      where: { conversationId_raterUserId: { conversationId: id, raterUserId: me } },
    });
    if (existing) {
      throw new AppError(409, "ALREADY_RATED", "Siz bu suhbatdoshga allaqachon baho bergansiz");
    }

    const saved = await prisma.peerRating.create({
      data: {
        conversationId: id,
        raterUserId: me,
        ratedUserId: otherId,
        score: body.score,
        comment: body.comment ?? null,
      },
    });
    return { score: saved.score, comment: saved.comment };
  });

  // Suhbatdoshning qisqa profili (modal uchun). Maxfiylik: faqat oramizda
  // suhbat mavjud bo'lgan foydalanuvchining ma'lumotini ko'rish mumkin.
  app.get("/api/users/:id/summary", { preHandler: [requireAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const me = req.user!.sub;
    const conv = await prisma.conversation.findFirst({
      where: {
        OR: [
          { employerUserId: me, seekerUserId: id },
          { employerUserId: id, seekerUserId: me },
        ],
      },
      select: { id: true },
    });
    if (!conv) throw Errors.forbidden();

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        jobSeekerProfile: {
          include: {
            region: true,
            resumes: {
              orderBy: { updatedAt: "desc" },
              take: 1,
              include: { skills: true },
            },
          },
        },
        ownedCompanies: { take: 1, include: { region: true } },
      },
    });
    if (!user) throw Errors.notFound();

    const agg = await prisma.peerRating.aggregate({
      where: { ratedUserId: id },
      _avg: { score: true },
      _count: { _all: true },
    });

    const p = user.jobSeekerProfile;
    const resume = p?.resumes[0];
    const comp = user.ownedCompanies[0];
    return {
      role: user.role,
      name: p
        ? [p.firstName, p.lastName].filter(Boolean).join(" ") || user.email
        : comp?.name ?? user.email,
      headline: p?.headline ?? null,
      regionName: p?.region?.name ?? comp?.region?.name ?? null,
      ratingAvg: agg._avg.score ? Math.round(agg._avg.score * 10) / 10 : null,
      ratingCount: agg._count._all,
      isOpenToWork: p?.isOpenToWork ?? null,
      resumeTitle: resume?.title ?? null,
      skills: resume?.skills.map((s) => s.skillName) ?? [],
      company: comp
        ? {
            name: comp.name,
            slug: comp.slug,
            logoUrl: comp.logoUrl,
            industry: comp.industry,
            description: comp.description,
          }
        : null,
    };
  });

  // Header uchun: o'qilmagan xabarlar + yangi arizalar
  app.get("/api/inbox/summary", { preHandler: [requireAuth] }, async (req) => {
    const userId = req.user!.sub;
    const isEmployer = req.user!.role === "employer";
    const convs = await prisma.conversation.findMany({
      where: { OR: [{ employerUserId: userId }, { seekerUserId: userId }] },
      select: { id: true },
    });
    const ids = convs.map((c) => c.id);
    const unreadMessages = ids.length
      ? await prisma.message.count({
          where: { conversationId: { in: ids }, senderId: { not: userId }, isRead: false },
        })
      : 0;
    const newApplications = isEmployer
      ? await prisma.application.count({
          where: { vacancy: { company: { ownerUserId: userId } }, status: "sent" },
        })
      : 0;
    return { unreadMessages, newApplications };
  });
}
