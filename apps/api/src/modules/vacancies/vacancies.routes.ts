import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { objectId } from "../../common/validation.js";
import {
  listVacancies,
  getVacancyBySlug,
  createVacancy,
  syncVacancyIndex,
} from "./vacancies.service.js";
import { requireAuth, requireRole, requirePhoneVerified } from "../../common/auth-guard.js";
import { prisma } from "../../common/prisma.js";
import { Errors } from "../../common/errors.js";
import { assertCanPostVacancy, getSubscriptionState } from "../billing/billing.service.js";

const listQuerySchema = z.object({
  text: z.string().optional(),
  categorySlug: z.string().optional(),
  area: z.string().optional(),
  experience: z.string().optional(),
  employment: z.string().optional(),
  salary: z.coerce.number().optional(),
  salaryTo: z.coerce.number().optional(),
  sort: z.enum(["relevance", "date", "salary_desc", "salary_asc"]).optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
});

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  requirements: z.string().optional(),
  conditions: z.string().optional(),
  categoryId: objectId().optional(),
  regionId: objectId().optional(),
  employmentType: z.enum(["full_time", "part_time", "remote", "shift"]),
  experienceRequired: z.enum(["none", "one_to_three", "three_to_six", "six_plus"]).optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  applyWithoutResume: z.boolean().optional(),
  // Bog'lanish yo'llari — ixtiyoriy; bo'sh satr "o'chirish" degani
  contactEmail: z.union([z.string().trim().email().max(120), z.literal("")]).optional(),
  contactTelegram: z
    .string()
    .trim()
    .max(64)
    .transform((v) => v.replace(/^@+/, ""))
    .optional(),
  contactPhone: z.string().trim().max(32).optional(),
});

// Tahrirlashda barcha maydonlar ixtiyoriy (qisman yangilash)
const updateSchema = createSchema.partial();

/** Vakansiya so'ralgan foydalanuvchiga tegishliligini tekshiradi. */
async function ownedVacancy(vacancyId: string, userId: string, role: string) {
  const vacancy = await prisma.vacancy.findUnique({
    where: { id: vacancyId },
    include: { company: { select: { ownerUserId: true, id: true } } },
  });
  if (!vacancy) throw Errors.notFound();
  if (vacancy.company.ownerUserId !== userId && role !== "admin") throw Errors.forbidden();
  return vacancy;
}

export async function vacancyRoutes(app: FastifyInstance) {
  app.get("/api/vacancies", async (req) => {
    const query = listQuerySchema.parse(req.query);
    return listVacancies(query);
  });

  // Ish beruvchining o'z vakansiyalari (ariza soni + tarif limiti bilan)
  app.get(
    "/api/employer/vacancies",
    { preHandler: [requireAuth, requireRole("employer", "admin")] },
    async (req) => {
      const vacancies = await prisma.vacancy.findMany({
        where: { company: { ownerUserId: req.user!.sub } },
        include: {
          region: true,
          category: true,
          company: { select: { id: true, name: true, slug: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const companyId = vacancies[0]?.company.id
        ? vacancies[0].company.id
        : (await prisma.company.findFirst({ where: { ownerUserId: req.user!.sub }, select: { id: true } }))?.id;

      const subscription = companyId ? await getSubscriptionState(companyId) : null;
      return { items: vacancies, subscription };
    }
  );

  app.get("/api/vacancies/:slug", async (req) => {
    const { slug } = req.params as { slug: string };
    return getVacancyBySlug(slug);
  });

  // Vakansiya joylash — ish beruvchining o'z kompaniyasiga (tarif limiti bilan)
  app.post(
    "/api/vacancies",
    { preHandler: [requireAuth, requireRole("employer", "admin"), requirePhoneVerified] },
    async (req, reply) => {
      const body = createSchema.parse(req.body);
      const company = await prisma.company.findFirst({ where: { ownerUserId: req.user!.sub } });
      if (!company) throw Errors.badRequest("Avval kompaniya profilini to'ldiring");

      // Tarif limiti: bepul rejada 3 ta faol vakansiya
      await assertCanPostVacancy(company.id);

      const vacancy = await createVacancy({ ...body, companyId: company.id });
      return reply.status(201).send(vacancy);
    }
  );

  // Vakansiyani tahrirlash
  app.put(
    "/api/vacancies/:id",
    { preHandler: [requireAuth, requireRole("employer", "admin")] },
    async (req) => {
      const { id } = req.params as { id: string };
      const body = updateSchema.parse(req.body);
      await ownedVacancy(id, req.user!.sub, req.user!.role);

      const updated = await prisma.vacancy.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.requirements !== undefined ? { requirements: body.requirements } : {}),
          ...(body.conditions !== undefined ? { conditions: body.conditions } : {}),
          ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
          ...(body.regionId !== undefined ? { regionId: body.regionId } : {}),
          ...(body.employmentType !== undefined ? { employmentType: body.employmentType } : {}),
          ...(body.experienceRequired !== undefined
            ? { experienceRequired: body.experienceRequired }
            : {}),
          ...(body.salaryMin !== undefined ? { salaryMin: body.salaryMin } : {}),
          ...(body.salaryMax !== undefined ? { salaryMax: body.salaryMax } : {}),
          ...(body.applyWithoutResume !== undefined
            ? { applyWithoutResume: body.applyWithoutResume }
            : {}),
          ...(body.contactEmail !== undefined ? { contactEmail: body.contactEmail || null } : {}),
          ...(body.contactTelegram !== undefined
            ? { contactTelegram: body.contactTelegram || null }
            : {}),
          ...(body.contactPhone !== undefined ? { contactPhone: body.contactPhone || null } : {}),
        },
      });

      void syncVacancyIndex(updated.id, updated.status);
      return updated;
    }
  );

  // Vakansiya holatini o'zgartirish (faollashtirish / arxivlash)
  app.patch(
    "/api/vacancies/:id/status",
    { preHandler: [requireAuth, requireRole("employer", "admin")] },
    async (req) => {
      const { id } = req.params as { id: string };
      const { status } = z.object({ status: z.enum(["active", "archived"]) }).parse(req.body);
      const vacancy = await ownedVacancy(id, req.user!.sub, req.user!.role);

      // Arxivdan qaytarish ham limitga kiradi
      if (status === "active" && vacancy.status !== "active") {
        await assertCanPostVacancy(vacancy.company.id);
      }

      const updated = await prisma.vacancy.update({
        where: { id },
        data: {
          status,
          ...(status === "active" && !vacancy.publishedAt ? { publishedAt: new Date() } : {}),
        },
      });
      void syncVacancyIndex(updated.id, updated.status);
      return updated;
    }
  );

  // Vakansiyani butunlay o'chirish (arizalar ham cascade o'chadi)
  app.delete(
    "/api/vacancies/:id",
    { preHandler: [requireAuth, requireRole("employer", "admin")] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      await ownedVacancy(id, req.user!.sub, req.user!.role);
      await prisma.vacancy.delete({ where: { id } });
      void syncVacancyIndex(id, "archived");
      return reply.status(200).send({ ok: true });
    }
  );
}
