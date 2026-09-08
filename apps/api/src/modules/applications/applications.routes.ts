import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { objectId } from "../../common/validation.js";
import { prisma } from "../../common/prisma.js";
import { Errors } from "../../common/errors.js";
import { requireAuth, requireRole, requirePhoneVerified } from "../../common/auth-guard.js";
import { escapeHtml } from "../../common/mailer.js";
import { getOrCreateConversation } from "../chat/chat.routes.js";
import { notify } from "../notifications/notifications.service.js";
import type { Prisma } from "@prisma/client";

const applySchema = z.object({
  resumeId: objectId().optional(),
  coverLetter: z.string().optional(),
  source: z.enum(["site", "telegram"]).default("site"),
});

const statusSchema = z.object({
  status: z.enum(["viewed", "invited", "rejected", "accepted"]),
  reason: z.string().trim().max(4000).optional(),
});

export async function applicationRoutes(app: FastifyInstance) {
  // Nomzod ariza yuboradi
  app.post(
    "/api/vacancies/:id/apply",
    { preHandler: [requireAuth, requireRole("job_seeker"), requirePhoneVerified] },
    async (req, reply) => {
      const { id: vacancyId } = req.params as { id: string };
      const body = applySchema.parse(req.body);

      const vacancy = await prisma.vacancy.findUnique({
        where: { id: vacancyId },
        include: { company: { select: { ownerUserId: true } } },
      });
      if (!vacancy || vacancy.status !== "active") throw Errors.notFound();

      // Rezyume talab qilinsa va berilmagan bo'lsa — nomzodning rezyumesini avtomatik biriktiramiz
      let resumeId = body.resumeId;
      if (!resumeId && !vacancy.applyWithoutResume) {
        const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.user!.sub } });
        const resume = profile
          ? await prisma.resume.findFirst({ where: { jobSeekerId: profile.id }, orderBy: { createdAt: "asc" } })
          : null;
        if (!resume) {
          throw Errors.badRequest("Bu vakansiyaga ariza yuborish uchun avval rezyumeni to'ldiring");
        }
        resumeId = resume.id;
      }

      // Bir nomzod bir vakansiyaga faqat bir marta ariza yuborsin
      const existing = await prisma.application.findFirst({
        where: { vacancyId, jobSeekerId: req.user!.sub },
      });
      if (existing) return reply.status(200).send(existing);

      const application = await prisma.application.create({
        data: {
          vacancyId,
          jobSeekerId: req.user!.sub,
          resumeId,
          coverLetter: body.coverLetter,
          source: body.source,
        },
      });

      // Bildirishnoma — qaysi kanalga borishini notify() xizmati hal qiladi
      // (sayt ichida + Telegram + brauzer push + email, sozlamaga qarab)
      void notify({
        userId: vacancy.company.ownerUserId,
        type: "new_application",
        title: "Yangi ariza",
        body: `"${vacancy.title}" vakansiyasiga yangi nomzod ariza yubordi`,
        url: "/employer/applications",
        payload: { applicationId: application.id, vacancyId },
        ctaLabel: "Arizani ko'rish",
        emailHtml: `<p style="margin:0">«<b>${escapeHtml(
          vacancy.title
        )}</b>» vakansiyangizga yangi nomzod ariza yubordi.</p>`,
      });

      return reply.status(201).send(application);
    }
  );

  // Nomzodning o'z arizalari
  app.get(
    "/api/applications",
    { preHandler: [requireAuth, requireRole("job_seeker")] },
    async (req) => {
      return prisma.application.findMany({
        where: { jobSeekerId: req.user!.sub },
        include: { vacancy: { include: { company: true } } },
        orderBy: { createdAt: "desc" },
      });
    }
  );

  // Ish beruvchi - barcha vakansiyalariga kelgan arizalar (nomzod + rezyume bilan)
  app.get(
    "/api/employer/applications",
    { preHandler: [requireAuth, requireRole("employer", "admin")] },
    async (req) => {
      const items = await prisma.application.findMany({
        where: { vacancy: { company: { ownerUserId: req.user!.sub } } },
        include: {
          vacancy: { select: { id: true, title: true, slug: true } },
          jobSeeker: {
            select: {
              email: true,
              phone: true,
              jobSeekerProfile: {
                select: {
                  firstName: true,
                  lastName: true,
                  headline: true,
                  isOpenToWork: true,
                  avatarUrl: true,
                  region: { select: { name: true } },
                },
              },
            },
          },
          resume: {
            include: {
              experience: { orderBy: { startDate: "desc" } },
              education: { orderBy: { startYear: "desc" } },
              skills: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return { items };
    }
  );

  // Ish beruvchi - vakansiya bo'yicha arizalar
  app.get(
    "/api/vacancies/:id/applications",
    { preHandler: [requireAuth, requireRole("employer", "admin")] },
    async (req) => {
      const { id: vacancyId } = req.params as { id: string };

      // Faqat O'Z vakansiyasi. Bunday tekshiruv yo'q edi: istalgan ish beruvchi
      // boshqasining vakansiya ID'sini kiritib, nomzodlarning ismi, telefoni,
      // emaili va rezyumesini to'liq ko'ra olardi.
      const vacancy = await prisma.vacancy.findUnique({
        where: { id: vacancyId },
        select: { company: { select: { ownerUserId: true } } },
      });
      if (!vacancy) throw Errors.notFound();
      if (vacancy.company.ownerUserId !== req.user!.sub && req.user!.role !== "admin") {
        throw Errors.forbidden();
      }

      return prisma.application.findMany({
        where: { vacancyId },
        include: { resume: true, jobSeeker: { include: { jobSeekerProfile: true } } },
        orderBy: { createdAt: "desc" },
      });
    }
  );

  // Ariza holatini o'zgartirish
  app.patch(
    "/api/applications/:id/status",
    { preHandler: [requireAuth, requireRole("employer", "admin")] },
    async (req) => {
      const { id } = req.params as { id: string };
      const { status, reason } = statusSchema.parse(req.body);

      const application = await prisma.application.findUnique({
        where: { id },
        include: { vacancy: { include: { company: { select: { ownerUserId: true } } } } },
      });
      if (!application) throw Errors.notFound();
      // Faqat vakansiya egasi (ish beruvchi) holatni o'zgartira oladi
      if (application.vacancy.company.ownerUserId !== req.user!.sub && req.user!.role !== "admin") {
        throw Errors.forbidden();
      }

      const reasonText = reason?.trim();

      const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const app2 = await tx.application.update({ where: { id }, data: { status } });
        await tx.applicationStatusHistory.create({
          data: {
            applicationId: id,
            oldStatus: application.status,
            newStatus: status,
            changedBy: req.user!.sub,
          },
        });
        return app2;
      });

      // Sabab yozilgan bo'lsa — nomzod bilan suhbatga xabar sifatida yuboramiz
      if (reasonText) {
        const conv = await getOrCreateConversation(
          req.user!.sub,
          application.jobSeekerId,
          application.vacancy.companyId
        );
        await prisma.message.create({
          data: { conversationId: conv.id, senderId: req.user!.sub, body: reasonText.slice(0, 4000) },
        });
      }

      // Nomzodga holat o'zgarishi haqida bildirishnoma (barcha yoqilgan kanallarga)
      const STATUS_UZ: Record<string, string> = {
        viewed: "Ko'rildi 👀",
        invited: "Suhbatga taklif qilindingiz 🎉",
        accepted: "Qabul qilindingiz ✅",
        rejected: "Rad etildi ❌",
      };
      const statusLabel = STATUS_UZ[status] ?? status;
      void notify({
        userId: application.jobSeekerId,
        type: "application_status_changed",
        title: "Ariza holati o'zgardi",
        body: `«${application.vacancy.title}» bo'yicha: ${statusLabel}`,
        url: "/messages",
        payload: { applicationId: id, status },
        ctaLabel: "Suhbatni ochish",
        emailHtml:
          `<p style="margin:0 0 8px">«<b>${escapeHtml(application.vacancy.title)}</b>» bo'yicha ` +
          `arizangiz holati: <b>${escapeHtml(statusLabel)}</b></p>` +
          (reasonText
            ? `<p style="margin:0;color:#57606a">Izoh: ${escapeHtml(reasonText.slice(0, 400))}</p>`
            : ""),
      });

      return updated;
    }
  );
}
