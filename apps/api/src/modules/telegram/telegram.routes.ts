import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../common/prisma.js";
import { env } from "../../common/env.js";
import { requireAuth } from "../../common/auth-guard.js";
import { createLinkToken, getBotUsername, sendTelegramMessage, tgEscape } from "./telegram.service.js";

const supportSchema = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email().optional(),
  message: z.string().min(3).max(4000),
});

export async function telegramRoutes(app: FastifyInstance) {
  // Bog'lanish holati (har qanday rol uchun)
  app.get("/api/telegram/status", { preHandler: [requireAuth] }, async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { telegramChatId: true, isPhoneVerified: true, phone: true },
    });
    return {
      linked: Boolean(user?.telegramChatId),
      phoneVerified: Boolean(user?.isPhoneVerified),
      phone: user?.phone ?? null,
      botUsername: getBotUsername(),
    };
  });

  // Deep-link: Telegramga o'tib hisobni bog'lash
  app.post("/api/telegram/link", { preHandler: [requireAuth] }, async (req, reply) => {
    const username = getBotUsername();
    if (!username) {
      return reply.status(503).send({
        error: "BOT_OFFLINE",
        message: "Telegram bot hozircha ishga tushmagan. Keyinroq urinib ko'ring.",
      });
    }
    const token = createLinkToken(req.user!.sub);
    return { link: `https://t.me/${username}?start=${token}` };
  });

  // Bog'lanishni uzish
  app.delete("/api/telegram/link", { preHandler: [requireAuth] }, async (req) => {
    await prisma.user.update({
      where: { id: req.user!.sub },
      data: { telegramChatId: null },
    });
    return { ok: true };
  });

  // Saytdagi «Aloqa» formasi -> adminning Telegramiga (spamdan himoya uchun rate-limit)
  app.post(
    "/api/support",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const body = supportSchema.parse(req.body);
      if (!env.TELEGRAM_ADMIN_CHAT_ID) {
        return reply.status(503).send({
          error: "SUPPORT_OFFLINE",
          message: "Aloqa xizmati hozircha sozlanmagan.",
        });
      }
      await sendTelegramMessage(
        env.TELEGRAM_ADMIN_CHAT_ID,
        `✉️ <b>Saytdan aloqa xabari</b>\n` +
          `Ism: ${tgEscape(body.name ?? "—")}\n` +
          `Email: ${tgEscape(body.email ?? "—")}\n\n` +
          `${tgEscape(body.message)}`
      );
      return { ok: true };
    }
  );
}
