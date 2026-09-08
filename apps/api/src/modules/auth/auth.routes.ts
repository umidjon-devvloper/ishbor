import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { registerUser, loginUser, refreshSession, getMe, googleLogin, telegramLogin } from "./auth.service.js";
import { requireAuth } from "../../common/auth-guard.js";
import { env, isProd } from "../../common/env.js";
import {
  createLoginToken,
  consumeLoginToken,
  getBotUsername,
} from "../telegram/telegram.service.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["job_seeker", "employer"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().max(160).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Refresh cookie sozlamalari.
 *
 * Prodda sayt (Vercel) va API (Railway) HAR XIL domenda turadi, ya'ni har bir
 * `/api/auth/refresh` so'rovi cross-site hisoblanadi. `sameSite: "lax"` bunday
 * so'rovga cookie'ni QO'SHMAYDI — foydalanuvchi har safar sahifani yangilaganda
 * seansdan chiqib ketardi. Shuning uchun prodda `sameSite: "none"` + `secure`
 * (brauzer "none" ni faqat HTTPS bilan qabul qiladi).
 *
 * Dev'da ikkalasi ham localhost (http) — u yerda "none" ishlamaydi, "lax" mos.
 */
const REFRESH_COOKIE = {
  httpOnly: true,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  secure: isProd,
  path: "/api/auth",
} as const;

function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie("refreshToken", token, { ...REFRESH_COOKIE, maxAge: 60 * 60 * 24 * 30 });
}

function clearRefreshCookie(reply: FastifyReply) {
  // Tozalashda ham AYNAN o'sha atributlar bo'lishi shart, aks holda brauzer
  // boshqa cookie deb biladi va eskisi joyida qolib ketadi.
  reply.clearCookie("refreshToken", REFRESH_COOKIE);
}

// Brute-force himoyasi: login/register uchun umumiy limitdan qattiqroq chegara
const strictRateLimit = {
  config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
};

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/register", strictRateLimit, async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const tokens = await registerUser(body);
    setRefreshCookie(reply, tokens.refreshToken);
    return reply.send({ accessToken: tokens.accessToken });
  });

  app.post("/api/auth/login", strictRateLimit, async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const tokens = await loginUser(body.email, body.password);
    setRefreshCookie(reply, tokens.refreshToken);
    return reply.send({ accessToken: tokens.accessToken });
  });

  app.post("/api/auth/refresh", async (req, reply) => {
    // Seans yo'qligi XATO emas — mehmon (guest) holati. 401 o'rniga 200 + null
    // qaytaramiz, aks holda brauzer konsolida keraksiz qizil xato ko'rinadi.
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return reply.send({ accessToken: null });
    try {
      const tokens = await refreshSession(refreshToken);
      setRefreshCookie(reply, tokens.refreshToken);
      return reply.send({ accessToken: tokens.accessToken });
    } catch {
      // Yaroqsiz/muddati o'tgan token — buzuq cookie'ni tozalaymiz, guest sifatida davom
      clearRefreshCookie(reply);
      return reply.send({ accessToken: null });
    }
  });

  app.post("/api/auth/logout", async (_req, reply) => {
    clearRefreshCookie(reply);
    return reply.send({ ok: true });
  });

  app.get("/api/auth/me", { preHandler: [requireAuth] }, async (req) => {
    return getMe(req.user!.sub);
  });

  // -------------------------------------------------------
  // Telegram orqali kirish: token -> bot deep-link -> polling
  // -------------------------------------------------------

  app.post("/api/auth/telegram/start", strictRateLimit, async (_req, reply) => {
    const username = getBotUsername();
    if (!username) {
      return reply.status(503).send({
        error: "BOT_OFFLINE",
        message: "Telegram bot hozircha ishga tushmagan. Keyinroq urinib ko'ring.",
      });
    }
    const { token, payload } = createLoginToken();
    return { token, link: `https://t.me/${username}?start=${payload}` };
  });

  app.post("/api/auth/telegram/poll", async (req, reply) => {
    const { token } = z.object({ token: z.string().min(10).max(64) }).parse(req.body);
    const entry = consumeLoginToken(token);
    if (!entry) return { status: "expired" };
    if (entry.status === "pending") return { status: "pending" };
    if (entry.status === "not_linked") return { status: "not_linked" };
    const tokens = await telegramLogin(entry.userId!);
    setRefreshCookie(reply, tokens.refreshToken);
    return reply.send({ status: "ok", accessToken: tokens.accessToken });
  });

  // -------------------------------------------------------
  // Google orqali kirish (GIS ID token -> server tekshiruvi)
  // -------------------------------------------------------

  app.post("/api/auth/google", strictRateLimit, async (req, reply) => {
    if (!env.GOOGLE_CLIENT_ID) {
      return reply.status(503).send({
        error: "GOOGLE_OFF",
        message: "Google orqali kirish hozircha sozlanmagan.",
      });
    }
    const body = z
      .object({
        credential: z.string().min(20),
        role: z.enum(["job_seeker", "employer"]).optional(),
      })
      .parse(req.body);
    const tokens = await googleLogin(body.credential, body.role);
    setRefreshCookie(reply, tokens.refreshToken);
    return reply.send({ accessToken: tokens.accessToken });
  });
}
