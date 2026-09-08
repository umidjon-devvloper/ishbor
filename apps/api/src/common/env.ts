import { z } from "zod";
import { boolish } from "./validation.js";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // MongoDB ulanish satri (Atlas: mongodb+srv://...). Tranzaksiyalar uchun
  // replica set kerak — Atlas'da bu sukut bo'yicha bor.
  //
  // Prefiks ataylab tekshiriladi: loyiha ilgari PostgreSQL'da edi, eski
  // `postgresql://...` satri qolib ketsa Prisma'ning tushunarsiz ichki xatosi
  // o'rniga shu yerda aniq xabar chiqadi.
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((v) => /^mongodb(\+srv)?:\/\//.test(v), {
      message: "MongoDB ulanish satri bo'lishi kerak (mongodb:// yoki mongodb+srv://)",
    }),
  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  // Railway PORT ni o'zi beradi — qo'lda o'rnatmang.
  PORT: z.coerce.number().default(3000),
  // Frontend manzili: CORS uchun ham, xat/Telegram havolalari uchun ham.
  // Vercel'dagi asosiy domen (masalan https://ishbor.vercel.app).
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  // CORS uchun qo'shimcha manzillar (vergul bilan). Vercel preview deploylari
  // yoki o'z domeningiz uchun. Masalan: "https://ishbor.uz,https://www.ishbor.uz"
  CORS_EXTRA_ORIGINS: z.string().optional().default(""),
  // Yuklangan fayllar papkasi. Railway'da fayl tizimi vaqtinchalik, shuning
  // uchun Volume ulab shu yerga uning yo'lini bering (masalan /data/uploads).
  UPLOAD_DIR: z.string().optional().default(""),
  // Bitta IP uchun daqiqadagi so'rov chegarasi. SSR (Vercel) so'rovlari bir
  // nechta umumiy IP dan keladi, shuning uchun chegara keng olingan.
  RATE_LIMIT_MAX: z.coerce.number().int().min(10).default(600),
  TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
  TELEGRAM_ADMIN_CHAT_ID: z.string().optional().default(""),
  // Google orqali kirish uchun (Google Cloud Console'dan OAuth Client ID).
  // Bo'sh bo'lsa — Google login o'chiq, sayt oddiy ishlayveradi.
  GOOGLE_CLIENT_ID: z.string().optional().default(""),

  // --- Email (SMTP). Bo'sh bo'lsa xatlar konsolga yoziladi, xato bermaydi. ---
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().optional().default(587),
  // Diqqat: `z.coerce.boolean()` emas — u "false" satrini true qilardi.
  SMTP_SECURE: boolish().optional().default(false),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default("ISH BOR! <no-reply@localhost>"),

  // --- Web Push (VAPID). Kalitlar bo'sh bo'lsa push o'chiq. ---
  // Kalit juftini yaratish: `npm run push:keys`
  VAPID_PUBLIC_KEY: z.string().optional().default(""),
  VAPID_PRIVATE_KEY: z.string().optional().default(""),
  VAPID_SUBJECT: z.string().optional().default("mailto:admin@localhost"),

  // --- Meilisearch. MEILI_HOST bo'sh bo'lsa MongoDB qidiruviga tushadi. ---
  MEILI_HOST: z.string().optional().default(""),
  MEILI_API_KEY: z.string().optional().default(""),
  MEILI_INDEX: z.string().optional().default("vacancies"),

  // --- To'lov provayderlari (Payme / Click). Bo'sh bo'lsa "qo'lda tasdiqlash" rejimi. ---
  PAYME_MERCHANT_ID: z.string().optional().default(""),
  PAYME_KEY: z.string().optional().default(""),
  CLICK_MERCHANT_ID: z.string().optional().default(""),
  CLICK_SERVICE_ID: z.string().optional().default(""),
  CLICK_SECRET_KEY: z.string().optional().default(""),

  // --- Birinchi admin hisobi (seed paytida yaratiladi) ---
  ADMIN_EMAIL: z.string().optional().default(""),
  ADMIN_PASSWORD: z.string().optional().default(""),

  // Ish qidiruv obunalari (saved search alerts) tekshirilish oralig'i, daqiqada
  ALERTS_INTERVAL_MINUTES: z.coerce.number().optional().default(15),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // Deployda eng ko'p uchraydigan xato — .env to'ldirilmagan. Stack trace
  // o'rniga qaysi o'zgaruvchi yetishmayotganini aniq aytamiz.
  const lines = parsed.error.errors.map((e) => `  - ${e.path.join(".")}: ${e.message}`);
  console.error(`Sozlamalar (env) noto'g'ri:\n${lines.join("\n")}`);
  process.exit(1);
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === "production";

/**
 * CORS uchun ruxsat etilgan manzillar.
 * Dev'da mahalliy portlar ham qo'shiladi (`vite preview` va `npm start`).
 */
export const allowedOrigins: string[] = [
  env.WEB_ORIGIN,
  ...env.CORS_EXTRA_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  ...(isProd ? [] : ["http://localhost:5173", "http://localhost:4173", "http://localhost:3001"]),
].filter((v, i, all) => v && all.indexOf(v) === i);

/** Xizmat sozlanganmi — modullar shu bayroqlar bo'yicha o'zini o'chiradi. */
export const features = {
  email: Boolean(env.SMTP_HOST),
  push: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
  telegram: Boolean(env.TELEGRAM_BOT_TOKEN),
  meilisearch: Boolean(env.MEILI_HOST),
  payme: Boolean(env.PAYME_MERCHANT_ID),
  click: Boolean(env.CLICK_MERCHANT_ID && env.CLICK_SERVICE_ID),
};
