import type { FastifyInstance } from "fastify";
import { prisma } from "../../common/prisma.js";
import { env } from "../../common/env.js";

/**
 * robots.txt va sitemap'lar API'da generatsiya qilinadi, lekin ular ICHIDAGI
 * havolalar OMMAVIY sayt manziliga (Vercel domeni) ishora qilishi kerak —
 * qidiruv tizimlari API domenini emas, saytni indeksga oladi.
 *
 * Fayllarning o'zi ham sayt domenida ochilishi shart: buning uchun Vercel
 * `/robots.txt` va `/sitemap*.xml` so'rovlarini API'ga uzatadi
 * (apps/web/vercel.json dagi rewrites).
 */
const PUBLIC_ORIGIN = env.WEB_ORIGIN;
const LOCALES = ["uz", "ru", "en"] as const;

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Til prefiksli yo'l: uz — prefikssiz, ru/en — /ru, /en. */
function loc(locale: string, path: string): string {
  if (locale === "uz") return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

// Indekslanmaydigan (shaxsiy) yo'llar — har uch tilda taqiqlanadi
const PRIVATE_PATHS = [
  "/dashboard",
  "/admin",
  "/account",
  "/profile",
  "/messages",
  "/applications",
  "/login",
  "/signup",
  "/favorites",
  "/notifications",
  "/alerts",
  "/employer/vacancies",
  "/employer/applications",
  "/employer/candidates",
];

export async function seoRoutes(app: FastifyInstance) {
  app.get("/robots.txt", async (_req, reply) => {
    reply.header("Content-Type", "text/plain");
    const lines = ["User-agent: *", "Disallow: /api"];
    for (const p of PRIVATE_PATHS) {
      lines.push(`Disallow: ${p}`);
      lines.push(`Disallow: /ru${p}`);
      lines.push(`Disallow: /en${p}`);
    }
    lines.push("", `Sitemap: ${PUBLIC_ORIGIN}/sitemap.xml`);
    return lines.join("\n");
  });

  // Asosiy sitemap - sub-sitemaplarga yo'naltiradi
  app.get("/sitemap.xml", async (_req, reply) => {
    reply.header("Content-Type", "application/xml");
    return [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      `<sitemap><loc>${PUBLIC_ORIGIN}/sitemap-static.xml</loc></sitemap>`,
      `<sitemap><loc>${PUBLIC_ORIGIN}/sitemap-vacancy.xml</loc></sitemap>`,
      `<sitemap><loc>${PUBLIC_ORIGIN}/sitemap-employer.xml</loc></sitemap>`,
      `</sitemapindex>`,
    ].join("\n");
  });

  app.get("/sitemap-static.xml", async (_req, reply) => {
    reply.header("Content-Type", "application/xml");
    const staticPaths = [
      "/",
      "/vacancies",
      "/companies",
      "/salaries",
      "/article",
      "/employer",
      "/pricing",
      "/support",
      "/contact",
    ];

    // Har bir kasb va hudud uchun alohida maosh sahifasi — hh.uz'dagidek
    // "Frontend dasturchi maoshi" kabi so'rovlar bo'yicha organik trafik beradi.
    const [categories, regions] = await Promise.all([
      prisma.vacancyCategory.findMany({ select: { slug: true } }),
      prisma.region.findMany({ where: { parentId: { not: null } }, select: { slug: true } }),
    ]);
    const salaryPaths = [
      ...categories.map((c: { slug: string }) => `/salaries?category=${c.slug}`),
      ...regions.map((r: { slug: string }) => `/salaries?region=${r.slug}`),
    ];

    return buildUrlSet([...staticPaths, ...salaryPaths]);
  });

  app.get("/sitemap-vacancy.xml", async (_req, reply) => {
    reply.header("Content-Type", "application/xml");
    const vacancies = await prisma.vacancy.findMany({
      where: { status: "active" },
      select: { slug: true, updatedAt: true },
      take: 50000,
    });
    return buildUrlSet(
      vacancies.map((v: { slug: string }) => `/vacancies/${v.slug}`),
      vacancies.map((v: { updatedAt: Date }) => v.updatedAt)
    );
  });

  app.get("/sitemap-employer.xml", async (_req, reply) => {
    reply.header("Content-Type", "application/xml");
    const companies = await prisma.company.findMany({
      select: { slug: true, updatedAt: true },
      take: 50000,
    });
    return buildUrlSet(
      // Ochiq kompaniya profili — /companies/:slug (/employer/:slug endi faqat redirect)
      companies.map((c: { slug: string }) => `/companies/${c.slug}`),
      companies.map((c: { updatedAt: Date }) => c.updatedAt)
    );
  });
}

// Har bir yo'l uchun uch tilli hreflang alternates bilan <url> hosil qiladi.
function buildUrlSet(paths: string[], dates?: Date[]) {
  const entries = paths.map((path, i) => {
    const lastmod = dates?.[i] ? `<lastmod>${dates[i].toISOString()}</lastmod>` : "";
    const alts = LOCALES.map(
      (lc) => `<xhtml:link rel="alternate" hreflang="${lc}" href="${xmlEscape(PUBLIC_ORIGIN + loc(lc, path))}"/>`
    ).join("");
    const xdefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(PUBLIC_ORIGIN + path)}"/>`;
    return `<url><loc>${xmlEscape(PUBLIC_ORIGIN + path)}</loc>${alts}${xdefault}${lastmod}</url>`;
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...entries,
    `</urlset>`,
  ].join("\n");
}
