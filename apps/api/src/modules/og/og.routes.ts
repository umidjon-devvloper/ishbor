import type { FastifyInstance } from "fastify";
import { prisma } from "../../common/prisma.js";
import { renderVacancyOgImage } from "./og.service.js";
import { formatSalaryLabel } from "../../common/format.js";

export async function ogRoutes(app: FastifyInstance) {
  app.get("/api/og/vacancy/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };

    const vacancy = await prisma.vacancy.findUnique({
      where: { slug },
      include: { company: true, region: true },
    });

    if (!vacancy) {
      return reply.status(404).send({ error: "NOT_FOUND" });
    }

    const png = await renderVacancyOgImage({
      title: vacancy.title,
      companyName: vacancy.company.name,
      regionName: vacancy.region?.name ?? "O'zbekiston",
      salaryLabel: formatSalaryLabel(vacancy.salaryMin, vacancy.salaryMax, vacancy.currency),
    });

    reply.header("Content-Type", "image/png");
    reply.header("Cache-Control", "public, max-age=86400, immutable");
    return reply.send(png);
  });
}
