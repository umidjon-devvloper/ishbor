import type { FastifyInstance } from "fastify";
import { prisma } from "../../common/prisma.js";
import { Errors } from "../../common/errors.js";

export async function articleRoutes(app: FastifyInstance) {
  app.get("/api/articles", async () => {
    const items = await prisma.article.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
    });
    return { items };
  });

  app.get("/api/articles/:slug", async (req) => {
    const { slug } = req.params as { slug: string };
    const article = await prisma.article.findUnique({ where: { slug } });
    if (!article || !article.publishedAt) throw Errors.notFound("Maqola topilmadi");
    return article;
  });
}
