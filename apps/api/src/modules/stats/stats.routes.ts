import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../common/prisma.js";

/**
 * Statistika: bosh sahifa ko'rsatkichlari va maosh tahlili.
 *
 * Maosh tahlili — hh.uz'dagi "maosh statistikasi" sahifasining analogi:
 * kasb va hudud kesimida o'rtacha/mediana maosh, taqsimot va eng yaxshi
 * to'lanadigan yo'nalishlar. Faqat maoshi ochiq ko'rsatilgan faol
 * vakansiyalar hisobga olinadi.
 */

const salaryQuerySchema = z.object({
  categorySlug: z.string().max(80).optional(),
  area: z.string().max(80).optional(),
  experience: z.string().max(40).optional(),
});

/** Vakansiyaning "vakil" maoshi — oraliq berilgan bo'lsa o'rtasi. */
function midpoint(min: number | null, max: number | null): number | null {
  if (min && max) return Math.round((min + max) / 2);
  return min ?? max ?? null;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

/** Taqsimot uchun ustunlar: 0–3, 3–6, 6–10, 10–15, 15–25, 25+ mln so'm. */
const BUCKETS: { from: number; to: number | null; label: string }[] = [
  { from: 0, to: 3_000_000, label: "0–3 mln" },
  { from: 3_000_000, to: 6_000_000, label: "3–6 mln" },
  { from: 6_000_000, to: 10_000_000, label: "6–10 mln" },
  { from: 10_000_000, to: 15_000_000, label: "10–15 mln" },
  { from: 15_000_000, to: 25_000_000, label: "15–25 mln" },
  { from: 25_000_000, to: null, label: "25 mln+" },
];

export async function statsRoutes(app: FastifyInstance) {
  // Bosh sahifa statistikasi (real bazadan)
  app.get("/api/stats", async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [vacancies, companies, applicationsToday] = await Promise.all([
      prisma.vacancy.count({ where: { status: "active" } }),
      prisma.company.count(),
      prisma.application.count({ where: { createdAt: { gte: startOfToday } } }),
    ]);

    return { vacancies, companies, applicationsToday };
  });

  // Maosh statistikasi
  app.get("/api/stats/salary", async (req) => {
    const query = salaryQuerySchema.parse(req.query);

    const where: Prisma.VacancyWhereInput = {
      status: "active",
      isSalaryHidden: false,
      OR: [{ salaryMin: { not: null } }, { salaryMax: { not: null } }],
      ...(query.categorySlug ? { category: { slug: query.categorySlug } } : {}),
      ...(query.area ? { region: { slug: query.area } } : {}),
      ...(query.experience ? { experienceRequired: query.experience as never } : {}),
    };

    const rows = await prisma.vacancy.findMany({
      where,
      select: {
        salaryMin: true,
        salaryMax: true,
        currency: true,
        category: { select: { name: true, slug: true } },
        region: { select: { name: true, slug: true } },
      },
      take: 5000,
    });

    // Faqat so'mdagi e'lonlar bir jadvalda taqqoslanadi (valyutalar aralashmasin)
    const values: number[] = [];
    const byCategory = new Map<string, { name: string; slug: string; values: number[] }>();
    const byRegion = new Map<string, { name: string; slug: string; values: number[] }>();

    for (const v of rows) {
      if (v.currency !== "UZS") continue;
      const value = midpoint(v.salaryMin, v.salaryMax);
      if (!value || value <= 0) continue;
      values.push(value);

      if (v.category) {
        const entry = byCategory.get(v.category.slug) ?? {
          name: v.category.name,
          slug: v.category.slug,
          values: [],
        };
        entry.values.push(value);
        byCategory.set(v.category.slug, entry);
      }
      if (v.region) {
        const entry = byRegion.get(v.region.slug) ?? {
          name: v.region.name,
          slug: v.region.slug,
          values: [],
        };
        entry.values.push(value);
        byRegion.set(v.region.slug, entry);
      }
    }

    values.sort((a, b) => a - b);

    const summary = {
      count: values.length,
      currency: "UZS",
      min: values[0] ?? 0,
      max: values[values.length - 1] ?? 0,
      average: values.length ? Math.round(values.reduce((s, n) => s + n, 0) / values.length) : 0,
      median: percentile(values, 0.5),
      p25: percentile(values, 0.25),
      p75: percentile(values, 0.75),
    };

    const distribution = BUCKETS.map((b) => ({
      label: b.label,
      from: b.from,
      to: b.to,
      count: values.filter((v) => v >= b.from && (b.to === null || v < b.to)).length,
    }));

    const groupStats = (map: Map<string, { name: string; slug: string; values: number[] }>) =>
      [...map.values()]
        .filter((g) => g.values.length > 0)
        .map((g) => {
          const sorted = [...g.values].sort((a, b) => a - b);
          return {
            name: g.name,
            slug: g.slug,
            count: sorted.length,
            median: percentile(sorted, 0.5),
            average: Math.round(sorted.reduce((s, n) => s + n, 0) / sorted.length),
          };
        })
        .sort((a, b) => b.median - a.median);

    return {
      summary,
      distribution,
      byCategory: groupStats(byCategory),
      byRegion: groupStats(byRegion),
    };
  });
}
