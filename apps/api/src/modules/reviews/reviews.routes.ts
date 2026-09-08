import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../common/prisma.js";
import { Errors } from "../../common/errors.js";
import { requireAuth, requireRole, requirePhoneVerified } from "../../common/auth-guard.js";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function reviewRoutes(app: FastifyInstance) {
  // Kompaniyaga 5 yulduzli sharh qoldirish (slug bo'yicha).
  // Oldindan moderatsiya yo'q — darrov ko'rinadi (admin keyin o'chira oladi).
  app.post(
    "/api/companies/:slug/reviews",
    { preHandler: [requireAuth, requireRole("job_seeker"), requirePhoneVerified] },
    async (req, reply) => {
      const { slug } = req.params as { slug: string };
      const body = reviewSchema.parse(req.body);

      const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
      if (!company) throw Errors.notFound("Kompaniya topilmadi");

      // Faqat shu kompaniyaga ariza yuborgan nomzod sharh qoldira oladi (haqqoniylik uchun)
      const hasApplied = await prisma.application.findFirst({
        where: { jobSeekerId: req.user!.sub, vacancy: { companyId: company.id } },
        select: { id: true },
      });
      if (!hasApplied) {
        return reply.status(403).send({
          error: "FORBIDDEN",
          message: "Sharh qoldirish uchun avval bu kompaniyaga ariza yuborgan bo'lishingiz kerak",
        });
      }

      // Har bir foydalanuvchidan bitta sharh — mavjud bo'lsa yangilanadi
      const existing = await prisma.companyReview.findFirst({
        where: { companyId: company.id, userId: req.user!.sub },
        select: { id: true },
      });
      const review = existing
        ? await prisma.companyReview.update({
            where: { id: existing.id },
            data: { rating: body.rating, comment: body.comment ?? null, status: "approved" },
          })
        : await prisma.companyReview.create({
            data: {
              companyId: company.id,
              userId: req.user!.sub,
              rating: body.rating,
              comment: body.comment ?? null,
              status: "approved",
            },
          });

      // Muallif ismi bilan qaytaramiz (UI darrov ko'rsatishi uchun)
      const profile = await prisma.jobSeekerProfile.findUnique({
        where: { userId: req.user!.sub },
        select: { firstName: true, lastName: true },
      });
      const authorName =
        [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Nomzod";

      return reply.status(existing ? 200 : 201).send({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        authorName,
        mine: true,
      });
    }
  );

  // Sharhni o'chirish — admin yoki sharh muallifi
  app.delete("/api/reviews/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const review = await prisma.companyReview.findUnique({ where: { id } });
    if (!review) throw Errors.notFound();
    if (review.userId !== req.user!.sub && req.user!.role !== "admin") throw Errors.forbidden();
    await prisma.companyReview.delete({ where: { id } });
    return reply.status(200).send({ ok: true });
  });
}
