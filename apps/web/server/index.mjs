// Web ilovaning PRODUCTION serveri.
//
// `vike preview` faqat build'ni tez ko'zdan kechirish uchun — Vike ham
// "prod'da ishlatmang" deb ogohlantiradi (u siqmaydi va HTML'ga `no-store`
// qo'yib bfcache'ni o'chiradi). Shu server o'sha uchta bo'shliqni yopadi:
//
//   1. Siqish (brotli/gzip) — SSR HTML ~25 KB dan ~6 KB ga tushadi.
//   2. To'g'ri Cache-Control — hash'langan aktivlar bir yil, HTML `no-cache`
//      (ya'ni qayta tekshiriladi, lekin `no-store` emas → bfcache ishlaydi:
//      "orqaga" tugmasi sahifani qaytadan yuklamaydi).
//   3. Xavfsizlik sarlavhalari — vite.config.ts dagi dev qiymatlari bilan bir xil.
//
// Ishga tushirish (avval `npm run build`):
//   node server/index.mjs            # yoki: npm start
//   PORT=8080 node server/index.mjs
//
// API alohida jarayon (apps/api, 3000-port) — bu server unga tegmaydi,
// brauzer u bilan to'g'ridan-to'g'ri gaplashadi (VITE_API_URL).

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyCompress from "@fastify/compress";
import fastifyStatic from "@fastify/static";
import { renderPage } from "vike/server";

// Build entry'sini import qilish Vike'ning global kontekstini ro'yxatdan
// o'tkazadi — `renderPage()` shundan keyingina ishlaydi. Fayl `npm run build`
// dan keyin paydo bo'ladi.
import "../dist/server/entry.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLIENT_DIR = join(ROOT, "dist", "client");

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

// vite.config.ts dagi SECURITY_HEADERS bilan bir xil bo'lishi kerak —
// dev va prod bir xil sarlavha bersin, Lighthouse'da farq chiqmasin.
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const YEAR = 60 * 60 * 24 * 365;
const WEEK = 60 * 60 * 24 * 7;

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? "info" },
  // Reverse-proxy (nginx/caddy) ortida turganda haqiqiy IP va protokol.
  trustProxy: true,
});

// Siqish: brotli birinchi, keyin gzip. 1 KB dan kichik javoblarni siqish
// foyda bermaydi (paket sarlavhasi siqilgan yutuqdan katta).
await app.register(fastifyCompress, {
  global: true,
  encodings: ["br", "gzip", "deflate"],
  threshold: 1024,
});

app.addHook("onSend", async (_req, reply) => {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) reply.header(k, v);
});

// 1) Statik fayllar (dist/client). `wildcard: false` — plagin ishga tushganda
//    mavjud fayllar uchun aniq marshrutlar yaratadi, shuning uchun fayl bo'lmagan
//    URL'lar pastdagi SSR ishlovchisiga tushadi (`/*` ni yutib yubormaydi).
//
//    Kesh muddati fayl turiga qarab:
//    - /assets/** — nomida kontent hash'i bor, kontent o'zgarsa nom ham
//      o'zgaradi, shuning uchun bir yil + `immutable` xavfsiz;
//    - sw.js — service worker'ni keshlash mumkin emas, aks holda brauzer
//      yangilanishni ko'rmay eski SW'da tirband bo'lib qoladi;
//    - qolgani (shriftlar, logolar) — nomi barqaror, bir hafta.
await app.register(fastifyStatic, {
  root: CLIENT_DIR,
  prefix: "/",
  index: false,
  decorateReply: false,
  cacheControl: false,
  wildcard: false,
  setHeaders: (res, filePath) => {
    const p = filePath.replace(/\\/g, "/");
    const value = p.includes("/assets/")
      ? `public, max-age=${YEAR}, immutable`
      : p.endsWith("/sw.js")
        ? "no-cache"
        : `public, max-age=${WEEK}`;
    res.setHeader("Cache-Control", value);
  },
});

// 2) Qolgani — Vike SSR. `/*` `/` ni ham qamrab oladi. Faqat GET (va Fastify
//    avtomatik qo'shadigan HEAD): sahifalar boshqa metodlarga javob bermaydi,
//    yozuv amallari API'da (:3000).
app.get("/*", async (request, reply) => {
  const pageContext = await renderPage({
    urlOriginal: request.raw.url,
    headersOriginal: request.headers,
  });
  const { httpResponse } = pageContext;

  // Vike noma'lum yo'l uchun ham 404 SAHIFASINI qaytaradi; httpResponse bo'sh
  // bo'lishi — Vike umuman javob bermagan holat (masalan `.png` kabi statik
  // so'rov yuqoridagi plaginlardan o'tib ketgan).
  if (!httpResponse) return reply.callNotFound();

  for (const [name, value] of httpResponse.headers) reply.header(name, value);

  // `no-cache` — brauzer har safar tekshiradi, LEKIN sahifani saqlaydi.
  // `no-store` bo'lsa bfcache o'chadi va "orqaga" har safar to'liq qayta yuklanadi.
  reply.header("Cache-Control", "no-cache");
  reply.status(httpResponse.statusCode);
  return reply.send(await httpResponse.getBody());
});

// SSR paytidagi kutilmagan xato — foydalanuvchiga JSON emas, oddiy sahifa.
// (Vike o'zining xato sahifasini bera olgan holatlar yuqorida hal bo'ladi;
// bu yerga faqat renderPage'ning o'zi yiqilganda tushamiz.)
app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  reply
    .status(500)
    .type("text/html; charset=utf-8")
    .header("Cache-Control", "no-store")
    .send("<!doctype html><meta charset=utf-8><title>Xatolik</title><h1>Kutilmagan xatolik</h1>");
});

// Konteyner/PM2 to'xtatganda ochiq so'rovlarni tugatib, keyin chiqamiz —
// aks holda deploy paytida foydalanuvchi uzilgan javob oladi.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    app.log.info(`${signal} — server to'xtatilmoqda`);
    await app.close();
    process.exit(0);
  });
}

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Sayt http://localhost:${PORT} portida ishlamoqda (production)`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
