import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { objectId } from "../../common/validation.js";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { prisma } from "../../common/prisma.js";
import { Errors } from "../../common/errors.js";
import { requireAuth, requireRole } from "../../common/auth-guard.js";
import { uniqueSlug } from "../../common/slug.js";
import { UPLOAD_DIR, ensureUploadDir } from "../../common/uploads.js";

const LOGO_MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const createCompanySchema = z.object({
  name: z.string().min(2),
  legalName: z.string().optional(),
  stir: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  regionId: objectId().optional(),
});

const updateCompanySchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(2000).nullable().optional(),
  website: z.string().max(200).nullable().optional(),
  regionId: objectId().nullable().optional(),
  industry: z.string().max(120).nullable().optional(),
  employeeCount: z.string().max(40).nullable().optional(),
  foundedYear: z.coerce.number().int().min(1000).max(9999).nullable().optional(),
});

/** "guthib.com" -> "https://guthib.com" (protokol qo'shilmagan bo'lsa). */
function normalizeWebsite(value?: string | null): string | null {
  const t = (value ?? "").trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export async function companyRoutes(app: FastifyInstance) {
  // Kompaniyalar katalogi (nomi bo'yicha qidiruv + reyting va faol vakansiya soni)
  //
  // `take` chegarasi bor: bu so'rov har bir kompaniya bilan birga uning barcha
  // sharhlari va faol vakansiyalarini tortadi. Chegarasiz u kompaniyalar soni
  // o'sishi bilan bazani ham, javob hajmini ham cheksiz bosardi.
  app.get("/api/companies", async (req) => {
    const { text } = req.query as { text?: string };
    const companies = await prisma.company.findMany({
      where: text ? { name: { contains: text, mode: "insensitive" } } : {},
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        region: true,
        reviews: { where: { status: "approved" }, select: { rating: true } },
        vacancies: { where: { status: "active" }, select: { id: true } },
      },
    });
    return { items: companies };
  });

  // Ish beruvchining o'z kompaniyasi (profil uchun)
  app.get(
    "/api/employer/company",
    { preHandler: [requireAuth, requireRole("employer")] },
    async (req) => {
      const company = await prisma.company.findFirst({
        where: { ownerUserId: req.user!.sub },
        include: { region: true },
      });
      return { company };
    }
  );

  // Ish beruvchi kompaniya ma'lumotini yaratadi/yangilaydi
  app.put(
    "/api/employer/company",
    { preHandler: [requireAuth, requireRole("employer")] },
    async (req) => {
      const body = updateCompanySchema.parse(req.body);
      const website = normalizeWebsite(body.website);
      const existing = await prisma.company.findFirst({ where: { ownerUserId: req.user!.sub } });

      if (existing) {
        const updated = await prisma.company.update({
          where: { id: existing.id },
          data: {
            name: body.name,
            description: body.description,
            website,
            regionId: body.regionId,
            industry: body.industry,
            employeeCount: body.employeeCount,
            foundedYear: body.foundedYear,
          },
          include: { region: true },
        });
        return { company: updated };
      }

      const created = await prisma.company.create({
        data: {
          ownerUserId: req.user!.sub,
          name: body.name,
          description: body.description,
          website,
          regionId: body.regionId,
          industry: body.industry,
          employeeCount: body.employeeCount,
          foundedYear: body.foundedYear,
          slug: uniqueSlug(body.name, "kompaniya"),
        },
        include: { region: true },
      });
      return { company: created };
    }
  );

  // Kompaniya logosini yuklash (PNG/JPG/WebP/SVG, maks 5MB — multipart limiti)
  app.post(
    "/api/employer/company/logo",
    { preHandler: [requireAuth, requireRole("employer")] },
    async (req, reply) => {
      const company = await prisma.company.findFirst({ where: { ownerUserId: req.user!.sub } });
      if (!company) throw Errors.badRequest("Avval kompaniya ma'lumotlarini saqlang");

      const data = await req.file();
      if (!data) throw Errors.badRequest("Fayl topilmadi");
      const ext = LOGO_MIME_EXT[data.mimetype];
      if (!ext) throw Errors.badRequest("Faqat PNG, JPG, WebP yoki SVG rasm qabul qilinadi");

      ensureUploadDir();
      const filename = `company-logo-${company.id}-${Date.now()}.${ext}`;
      const dest = path.join(UPLOAD_DIR, filename);
      await pipeline(data.file, fs.createWriteStream(dest));
      if (data.file.truncated) {
        fs.unlinkSync(dest);
        throw Errors.badRequest("Fayl juda katta (maksimal 5MB)");
      }

      // Eski logo faylini tozalaymiz (disk to'lib ketmasin)
      if (company.logoUrl?.startsWith("/uploads/")) {
        const old = path.join(UPLOAD_DIR, path.basename(company.logoUrl));
        fs.promises.unlink(old).catch(() => undefined);
      }

      const logoUrl = `/uploads/${filename}`;
      await prisma.company.update({ where: { id: company.id }, data: { logoUrl } });
      return reply.send({ logoUrl });
    }
  );

  // Logoni olib tashlash
  app.delete(
    "/api/employer/company/logo",
    { preHandler: [requireAuth, requireRole("employer")] },
    async (req) => {
      const company = await prisma.company.findFirst({ where: { ownerUserId: req.user!.sub } });
      if (!company) throw Errors.notFound();
      if (company.logoUrl?.startsWith("/uploads/")) {
        const old = path.join(UPLOAD_DIR, path.basename(company.logoUrl));
        fs.promises.unlink(old).catch(() => undefined);
      }
      await prisma.company.update({ where: { id: company.id }, data: { logoUrl: null } });
      return { ok: true };
    }
  );

  app.get("/api/companies/:slug", async (req) => {
    const { slug } = req.params as { slug: string };
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        region: true,
        reviews: {
          where: { status: "approved" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            userId: true,
            user: { select: { jobSeekerProfile: { select: { firstName: true, lastName: true } } } },
          },
        },
        vacancies: {
          where: { status: "active" },
          orderBy: { publishedAt: "desc" },
          include: { region: true, category: true },
        },
      },
    });
    if (!company) throw Errors.notFound("Kompaniya topilmadi");
    return company;
  });

  app.post(
    "/api/companies",
    { preHandler: [requireAuth, requireRole("employer")] },
    async (req, reply) => {
      const body = createCompanySchema.parse(req.body);
      const company = await prisma.company.create({
        data: { ...body, ownerUserId: req.user!.sub, slug: uniqueSlug(body.name, "kompaniya") },
      });
      return reply.status(201).send(company);
    }
  );
}
