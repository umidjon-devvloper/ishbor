import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import websocket from "@fastify/websocket";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { env, isProd, allowedOrigins } from "./common/env.js";
import { prisma } from "./common/prisma.js";
import { AppError } from "./common/errors.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { vacancyRoutes } from "./modules/vacancies/vacancies.routes.js";
import { companyRoutes } from "./modules/companies/companies.routes.js";
import { applicationRoutes } from "./modules/applications/applications.routes.js";
import { reviewRoutes } from "./modules/reviews/reviews.routes.js";
import { seoRoutes } from "./modules/seo/seo.routes.js";
import { ogRoutes } from "./modules/og/og.routes.js";
import { articleRoutes } from "./modules/articles/articles.routes.js";
import { statsRoutes } from "./modules/stats/stats.routes.js";
import { profileRoutes } from "./modules/profile/profile.routes.js";
import { catalogRoutes } from "./modules/catalog/catalog.routes.js";
import { resumeRoutes } from "./modules/resume/resume.routes.js";
import { chatRoutes } from "./modules/chat/chat.routes.js";
import { candidateRoutes } from "./modules/candidates/candidates.routes.js";
import { telegramRoutes } from "./modules/telegram/telegram.routes.js";
import { startTelegramBot } from "./modules/telegram/telegram.service.js";
import { notificationRoutes } from "./modules/notifications/notifications.routes.js";
import { favoriteRoutes } from "./modules/favorites/favorites.routes.js";
import { alertRoutes } from "./modules/alerts/alerts.routes.js";
import { startAlertScheduler } from "./modules/alerts/alerts.service.js";
import { billingRoutes } from "./modules/billing/billing.routes.js";
import { ensurePlans } from "./modules/billing/billing.service.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { warmSearchIndex } from "./modules/search/search.service.js";
import { ensureCatalog } from "./common/ensure-catalog.js";
import { ensureAdminUser } from "./common/ensure-admin.js";
import { UPLOAD_DIR, ensureUploadDir } from "./common/uploads.js";

const app = Fastify({
  logger: true,
  // Railway (va har qanday reverse-proxy) ortida turganda haqiqiy mijoz IP'si
  // X-Forwarded-For sarlavhasida keladi. Busiz rate-limit hamma so'rovni
  // bitta proxy IP'siga yozib, butun saytni bloklab qo'yardi.
  trustProxy: true,
});

// Xavfsizlik sarlavhalari (CSP, HSTS, COOP, X-Frame-Options, X-Content-Type-Options...).
// Eslatma: bular API javoblariga qo'llanadi. Web (Vike) alohida origin'da bo'lgani uchun
// crossOriginResourcePolicy "cross-origin" — aks holda yuklangan avatar/OG rasmlari bloklanadi.
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Inline skriptlar (mavzu/shrift init) + dev'da Vite HMR uchun eval
      scriptSrc: ["'self'", "'unsafe-inline'", ...(isProd ? [] : ["'unsafe-eval'"])],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: [
        "'self'",
        ...allowedOrigins,
        "https://fonts.googleapis.com",
        ...(isProd ? [] : ["ws:", "wss:"]),
      ],
      // Dev http'da so'rovlarni https'ga majburiy o'girmaslik (null — direktivani olib tashlaydi)
      upgradeInsecureRequests: isProd ? [] : null,
    },
  },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  // HSTS faqat prod (HTTPS)da — dev http'da brauzer baribar e'tiborsiz qoldiradi
  strictTransportSecurity: isProd
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
});

// Ruxsat etilgan manzillar `env.ts` da yig'iladi: WEB_ORIGIN + CORS_EXTRA_ORIGINS
// (+ dev'da mahalliy portlar). Vercel'ning preview deploylari uchun
// `*.vercel.app` naqshi ham qabul qilinadi — har bir preview URL'ini qo'lda
// yozib chiqishning iloji yo'q.
const VERCEL_PREVIEW = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

await app.register(cors, {
  origin(origin, cb) {
    // origin bo'lmasa — bu brauzerdan kelmagan so'rov (SSR, curl, mobil ilova).
    // Bunda CORS umuman qo'llanmaydi, bloklashning ma'nosi yo'q.
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || VERCEL_PREVIEW.test(origin)) return cb(null, true);
    cb(new Error("CORS: bu manzilga ruxsat yo'q"), false);
  },
  credentials: true,
});
await app.register(cookie);
await app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: "1 minute" });
await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

ensureUploadDir();
await app.register(fastifyStatic, { root: UPLOAD_DIR, prefix: "/uploads/" });
await app.register(websocket);

app.setErrorHandler((error, _req, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ error: error.code, message: error.message });
  }
  // Zod validatsiya xatosi -> 400 (tushunarli xabar, 500 emas)
  if (error instanceof ZodError) {
    const issue = error.errors[0];
    const field = issue?.path.join(".");
    const message = field ? `${field}: ${issue.message}` : issue?.message ?? "Ma'lumotlar noto'g'ri";
    return reply.status(400).send({ error: "VALIDATION_ERROR", message });
  }
  // Fastify ichki validatsiya xatosi
  if ((error as { validation?: unknown }).validation) {
    return reply.status(400).send({ error: "VALIDATION_ERROR", message: error.message });
  }
  // Prisma ma'lum xatolari
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return reply.status(409).send({ error: "CONFLICT", message: "Bu yozuv allaqachon mavjud" });
    }
    if (error.code === "P2025") {
      return reply.status(404).send({ error: "NOT_FOUND", message: "Topilmadi" });
    }
  }
  // Plugin xatolari (masalan rate-limit 429) — statusCode'ini hurmat qilamiz, 500 qilmaymiz
  const statusCode = (error as { statusCode?: number }).statusCode;
  if (typeof statusCode === "number" && statusCode >= 400 && statusCode < 500) {
    return reply.status(statusCode).send({ error: error.code ?? "ERROR", message: error.message });
  }
  app.log.error(error);
  return reply.status(500).send({ error: "INTERNAL_ERROR", message: "Kutilmagan xatolik" });
});

// Railway healthcheck shu manzilni so'raydi. Baza bilan aloqani ham
// tekshiramiz — aks holda "sog'lom" deb belgilangan, lekin hech narsa
// qaytara olmaydigan konteyner deploy bo'lib qolardi.
app.get("/health", async (_req, reply) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    return { ok: true, db: "up" };
  } catch {
    return reply.status(503).send({ ok: false, db: "down" });
  }
});

// API root — brauzerdan to'g'ridan-to'g'ri kirilsa saytga yo'naltiramiz (404 emas)
app.get("/", async (_req, reply) => reply.redirect(env.WEB_ORIGIN));

await app.register(authRoutes);
await app.register(vacancyRoutes);
await app.register(companyRoutes);
await app.register(applicationRoutes);
await app.register(reviewRoutes);
await app.register(seoRoutes);
await app.register(ogRoutes);
await app.register(articleRoutes);
await app.register(statsRoutes);
await app.register(profileRoutes);
await app.register(catalogRoutes);
await app.register(resumeRoutes);
await app.register(chatRoutes);
await app.register(candidateRoutes);
await app.register(telegramRoutes);
await app.register(notificationRoutes);
await app.register(favoriteRoutes);
await app.register(alertRoutes);
await app.register(billingRoutes);
await app.register(adminRoutes);

/**
 * Fon ishlari: katalog/tariflar/admin hisobi, Telegram bot, qidiruv indeksi va
 * obuna jadvali.
 *
 * Bular `listen` dan KEYIN ishga tushadi. Ilgari ular listen'dan oldin
 * `await` qilinardi va baza sekin javob bersa Railway healthcheck'i port
 * ochilishini kutib timeout bo'lardi. Endi server darrov javob beradi,
 * tayyorgarlik esa fonda tugaydi.
 */
async function bootstrap() {
  try {
    await ensureCatalog();
    await ensurePlans();
    await ensureAdminUser(app.log);
  } catch (e) {
    app.log.error({ err: e }, "Boshlang'ich ma'lumotlarni tayyorlashda xatolik");
  }

  void startTelegramBot(app.log);
  void warmSearchIndex();
  startAlertScheduler(app.log);
}

// Konteyner to'xtatilganda (Railway deploy, SIGTERM) ochiq so'rovlarni
// tugatib, bazani yopib chiqamiz — aks holda foydalanuvchi uzilgan javob oladi.
let shuttingDown = false;
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info(`${signal} — server to'xtatilmoqda`);
    void (async () => {
      try {
        await app.close();
        await prisma.$disconnect();
      } finally {
        process.exit(0);
      }
    })();
  });
}

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`API ${env.PORT} portida ishlamoqda`);
  void bootstrap();
} catch (err) {
  // Ilgari bu yerda faqat `.then()` bor edi: port band bo'lsa yoki listen
  // yiqilsa jarayon "muvaffaqiyatli" tugab, deploy jim qolardi.
  app.log.error(err, "Serverni ishga tushirib bo'lmadi");
  process.exit(1);
}
