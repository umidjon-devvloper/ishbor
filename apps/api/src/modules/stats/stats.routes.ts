import type { FastifyInstance } from "fastify";
import { prisma } from "../../common/prisma.js";
import { salaryQuerySchema, salaryStats } from "./salary.stats.js";

/**
 * Statistika: bosh sahifa ko'rsatkichlari va maosh tahlili
 * (hisob-kitob — salary.stats.ts).
 */
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

  // Maosh statistikasi: ?role=&q=&categorySlug=&area=&experience=
  app.get("/api/stats/salary", async (req) => {
    const query = salaryQuerySchema.parse(req.query);
    return salaryStats(query);
  });
}
