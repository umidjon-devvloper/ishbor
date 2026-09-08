import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../common/prisma.js";
import { Errors } from "../../common/errors.js";
import { requireAuth, requireRole } from "../../common/auth-guard.js";
import { assertCanSearchCandidates } from "../billing/billing.service.js";

// Ish beruvchi uchun nomzodlar (rezyumesi borlar) qidiruvi
export async function candidateRoutes(app: FastifyInstance) {
  app.get(
    "/api/candidates",
    { preHandler: [requireAuth, requireRole("employer", "admin")] },
    async (req) => {
      // Nomzodlar bazasi — Standart va Premium tariflarda (adminda cheklov yo'q)
      if (req.user!.role !== "admin") {
        const company = await prisma.company.findFirst({
          where: { ownerUserId: req.user!.sub },
          select: { id: true },
        });
        if (!company) throw Errors.badRequest("Avval kompaniya profilini to'ldiring");
        await assertCanSearchCandidates(company.id);
      }

      const query = req.query as { text?: string; region?: string };
      const q = (query.text ?? "").trim();
      const like = (v: string): Prisma.StringFilter => ({ contains: v, mode: "insensitive" });

      const where: Prisma.JobSeekerProfileWhereInput = {
        user: { role: "job_seeker" },
        isOpenToWork: true,
        resumes: { some: {} },
        ...(query.region ? { regionId: query.region } : {}),
        ...(q
          ? {
              OR: [
                { headline: like(q) },
                { firstName: like(q) },
                { lastName: like(q) },
                { resumes: { some: { title: like(q) } } },
                { resumes: { some: { skills: { some: { skillName: like(q) } } } } },
              ],
            }
          : {}),
      };

      const profiles = await prisma.jobSeekerProfile.findMany({
        where,
        take: 50,
        orderBy: { userId: "asc" },
        include: {
          user: { select: { id: true, email: true, phone: true } },
          region: { select: { name: true } },
          resumes: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            include: {
              skills: true,
              experience: { orderBy: { startDate: "desc" } },
              education: { orderBy: { startYear: "desc" } },
            },
          },
        },
      });

      // Nomzodlarning o'zaro baho (peer rating) o'rtachasi — bitta groupBy so'rov
      const userIds = profiles.map((p) => p.user.id);
      const ratingRows = userIds.length
        ? await prisma.peerRating.groupBy({
            by: ["ratedUserId"],
            where: { ratedUserId: { in: userIds } },
            _avg: { score: true },
            _count: { _all: true },
          })
        : [];
      const ratingMap = new Map(
        ratingRows.map((r) => [
          r.ratedUserId,
          { avg: Math.round((r._avg.score ?? 0) * 10) / 10, count: r._count._all },
        ])
      );

      const items = profiles.map((p) => {
        const r = p.resumes[0];
        const rating = ratingMap.get(p.user.id);
        return {
          userId: p.user.id,
          ratingAvg: rating?.avg ?? null,
          ratingCount: rating?.count ?? 0,
          email: p.user.email,
          phone: p.user.phone,
          firstName: p.firstName,
          lastName: p.lastName,
          headline: p.headline,
          regionName: p.region?.name ?? null,
          isOpenToWork: p.isOpenToWork,
          resume: r
            ? {
                title: r.title,
                summary: r.summary,
                desiredSalary: r.desiredSalary,
                skills: r.skills.map((s) => ({ skillName: s.skillName })),
                experience: r.experience.map((e) => ({
                  companyName: e.companyName,
                  position: e.position,
                  startDate: e.startDate.toISOString(),
                  endDate: e.endDate ? e.endDate.toISOString() : null,
                  isCurrent: e.isCurrent,
                  description: e.description,
                })),
                education: r.education.map((e) => ({
                  institution: e.institution,
                  degree: e.degree,
                  field: e.field,
                  startYear: e.startYear,
                  endYear: e.endYear,
                })),
              }
            : null,
        };
      });

      return { items };
    }
  );
}
