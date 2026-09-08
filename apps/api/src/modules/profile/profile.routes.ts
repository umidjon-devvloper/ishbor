import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { objectId } from "../../common/validation.js";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { prisma } from "../../common/prisma.js";
import { Errors } from "../../common/errors.js";
import { requireAuth, requireRole } from "../../common/auth-guard.js";
import { UPLOAD_DIR, ensureUploadDir } from "../../common/uploads.js";

const updateSchema = z.object({
  firstName: z.string().max(60).optional(),
  lastName: z.string().max(60).optional(),
  phone: z.string().max(30).nullable().optional(),
  additionalPhone: z.string().max(30).nullable().optional(),
  headline: z.string().max(140).nullable().optional(),
  regionId: objectId().nullable().optional(),
  isOpenToWork: z.boolean().optional(),
});

async function loadProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { jobSeekerProfile: { include: { region: true } } },
  });
  if (!user) throw Errors.unauthorized();
  const p = user.jobSeekerProfile;
  return {
    email: user.email,
    role: user.role,
    phone: user.phone,
    isPhoneVerified: user.isPhoneVerified,
    additionalPhone: p?.additionalPhone ?? null,
    firstName: p?.firstName ?? "",
    lastName: p?.lastName ?? "",
    headline: p?.headline ?? null,
    regionId: p?.regionId ?? null,
    regionName: p?.region?.name ?? null,
    isOpenToWork: p?.isOpenToWork ?? true,
    resumeUrl: p?.resumeUrl ?? null,
  };
}

export async function profileRoutes(app: FastifyInstance) {
  app.get(
    "/api/profile",
    { preHandler: [requireAuth, requireRole("job_seeker")] },
    async (req) => loadProfile(req.user!.sub)
  );

  app.patch(
    "/api/profile",
    { preHandler: [requireAuth, requireRole("job_seeker")] },
    async (req) => {
      const body = updateSchema.parse(req.body);
      const userId = req.user!.sub;

      // Asosiy telefon Telegram orqali tasdiqlangan bo'lsa — o'zgartirib bo'lmaydi
      // (soxta raqamning oldini oladi). Aks holda qo'lda kiritilgan raqam saqlanadi.
      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPhoneVerified: true },
      });
      if (body.phone !== undefined && !current?.isPhoneVerified) {
        await prisma.user.update({ where: { id: userId }, data: { phone: body.phone } });
      }

      await prisma.jobSeekerProfile.upsert({
        where: { userId },
        update: {
          firstName: body.firstName,
          lastName: body.lastName,
          additionalPhone: body.additionalPhone,
          headline: body.headline,
          regionId: body.regionId,
          isOpenToWork: body.isOpenToWork,
        },
        create: {
          userId,
          firstName: body.firstName ?? "",
          lastName: body.lastName ?? "",
          additionalPhone: body.additionalPhone ?? null,
          headline: body.headline ?? null,
          regionId: body.regionId ?? null,
          isOpenToWork: body.isOpenToWork ?? true,
        },
      });

      return loadProfile(userId);
    }
  );

  // Rezyume (PDF) yuklash
  app.post(
    "/api/profile/resume",
    { preHandler: [requireAuth, requireRole("job_seeker")] },
    async (req, reply) => {
      const data = await req.file();
      if (!data) throw Errors.badRequest("Fayl topilmadi");
      if (data.mimetype !== "application/pdf") throw Errors.badRequest("Faqat PDF fayl qabul qilinadi");

      ensureUploadDir();
      const filename = `resume-${req.user!.sub}-${Date.now()}.pdf`;
      const dest = path.join(UPLOAD_DIR, filename);
      await pipeline(data.file, fs.createWriteStream(dest));

      if (data.file.truncated) {
        fs.unlinkSync(dest);
        throw Errors.badRequest("Fayl juda katta (maksimal 5MB)");
      }

      const resumeUrl = `/uploads/${filename}`;
      await prisma.jobSeekerProfile.upsert({
        where: { userId: req.user!.sub },
        update: { resumeUrl },
        create: { userId: req.user!.sub, firstName: "", lastName: "", resumeUrl },
      });
      return reply.send({ resumeUrl });
    }
  );

  app.delete(
    "/api/profile/resume",
    { preHandler: [requireAuth, requireRole("job_seeker")] },
    async (req) => {
      await prisma.jobSeekerProfile
        .update({ where: { userId: req.user!.sub }, data: { resumeUrl: null } })
        .catch(() => undefined);
      return { ok: true };
    }
  );
}
