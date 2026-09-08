import type { FastifyInstance } from "fastify";
import type { NotificationChannel, NotificationType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../common/prisma.js";
import { Errors } from "../../common/errors.js";
import { requireAuth } from "../../common/auth-guard.js";
import { boolish } from "../../common/validation.js";
import { getVapidPublicKey } from "../../common/push.js";
import { features } from "../../common/env.js";

const NOTIFICATION_TYPES = [
  "new_application",
  "application_status_changed",
  "new_vacancy_match",
  "system",
] as const;

const CHANNELS = ["email", "push", "in_app", "telegram"] as const;

const listQuerySchema = z.object({
  unreadOnly: boolish().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const prefSchema = z.object({
  items: z
    .array(
      z.object({
        notificationType: z.enum(NOTIFICATION_TYPES),
        channel: z.enum(CHANNELS),
        isEnabled: z.boolean(),
      })
    )
    .max(64),
});

const pushSubSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(255), auth: z.string().min(5).max(255) }),
});

/** Notification.payload ichidagi `url` ni xavfsiz o'qiydi (faqat ichki yo'l). */
function urlFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const url = (payload as { url?: unknown }).url;
  return typeof url === "string" && url.startsWith("/") ? url : null;
}

export async function notificationRoutes(app: FastifyInstance) {
  // Bildirishnomalar ro'yxati + o'qilmaganlar soni (qo'ng'iroq belgisi uchun)
  app.get("/api/notifications", { preHandler: [requireAuth] }, async (req) => {
    const { unreadOnly, limit } = listQuerySchema.parse(req.query);
    const userId = req.user!.sub;

    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
        orderBy: { createdAt: "desc" },
        take: limit ?? 30,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items: rows.map((n: (typeof rows)[number]) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        url: urlFromPayload(n.payload),
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
    };
  });

  // Faqat sonini olish (header uchun yengil so'rov)
  app.get("/api/notifications/unread-count", { preHandler: [requireAuth] }, async (req) => {
    const count = await prisma.notification.count({
      where: { userId: req.user!.sub, isRead: false },
    });
    return { count };
  });

  app.post("/api/notifications/:id/read", { preHandler: [requireAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const found = await prisma.notification.findUnique({ where: { id }, select: { userId: true } });
    if (!found) throw Errors.notFound();
    if (found.userId !== req.user!.sub) throw Errors.forbidden();
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    return { ok: true };
  });

  app.post("/api/notifications/read-all", { preHandler: [requireAuth] }, async (req) => {
    const res = await prisma.notification.updateMany({
      where: { userId: req.user!.sub, isRead: false },
      data: { isRead: true },
    });
    return { updated: res.count };
  });

  app.delete("/api/notifications/:id", { preHandler: [requireAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const found = await prisma.notification.findUnique({ where: { id }, select: { userId: true } });
    if (!found) throw Errors.notFound();
    if (found.userId !== req.user!.sub) throw Errors.forbidden();
    await prisma.notification.delete({ where: { id } });
    return { ok: true };
  });

  // ---------------------------------------------------------
  // Kanal sozlamalari
  // ---------------------------------------------------------

  // Sozlamalar jadvali: yozuv yo'q kanal — yoqilgan hisoblanadi
  app.get("/api/notifications/preferences", { preHandler: [requireAuth] }, async (req) => {
    const rows = await prisma.notificationPreference.findMany({
      where: { userId: req.user!.sub },
    });
    const disabled = new Set(
      rows
        .filter((r: { isEnabled: boolean }) => !r.isEnabled)
        .map((r: { notificationType: NotificationType; channel: NotificationChannel }) =>
          `${r.notificationType}:${r.channel}`
        )
    );

    const items = NOTIFICATION_TYPES.flatMap((notificationType) =>
      CHANNELS.map((channel) => ({
        notificationType,
        channel,
        isEnabled: !disabled.has(`${notificationType}:${channel}`),
        // Kanal serverda umuman sozlanmagan bo'lsa UI buni "mavjud emas" deb ko'rsatadi
        available:
          channel === "in_app" ||
          (channel === "email" && features.email) ||
          (channel === "push" && features.push) ||
          (channel === "telegram" && features.telegram),
      }))
    );
    return { items };
  });

  app.put("/api/notifications/preferences", { preHandler: [requireAuth] }, async (req) => {
    const { items } = prefSchema.parse(req.body);
    const userId = req.user!.sub;

    await prisma.$transaction(
      items.map((i) =>
        prisma.notificationPreference.upsert({
          where: {
            userId_notificationType_channel: {
              userId,
              notificationType: i.notificationType,
              channel: i.channel,
            },
          },
          update: { isEnabled: i.isEnabled },
          create: {
            userId,
            notificationType: i.notificationType,
            channel: i.channel,
            isEnabled: i.isEnabled,
          },
        })
      )
    );
    return { ok: true };
  });

  // ---------------------------------------------------------
  // Brauzer push obunasi
  // ---------------------------------------------------------

  app.get("/api/push/public-key", async () => ({ key: getVapidPublicKey() }));

  app.post("/api/push/subscribe", { preHandler: [requireAuth] }, async (req) => {
    if (!features.push) throw Errors.badRequest("Push xabarnomalar serverda sozlanmagan");
    const body = pushSubSchema.parse(req.body);
    const userAgent = String(req.headers["user-agent"] ?? "").slice(0, 255);

    await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: {
        userId: req.user!.sub,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent,
      },
      create: {
        userId: req.user!.sub,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent,
      },
    });
    return { ok: true };
  });

  app.post("/api/push/unsubscribe", { preHandler: [requireAuth] }, async (req) => {
    const { endpoint } = z.object({ endpoint: z.string().max(1000) }).parse(req.body);
    await prisma.pushSubscription
      .deleteMany({ where: { endpoint, userId: req.user!.sub } })
      .catch(() => undefined);
    return { ok: true };
  });
}
