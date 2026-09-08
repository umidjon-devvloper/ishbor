import type { NotificationChannel, NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../common/prisma.js";
import { env } from "../../common/env.js";
import { sendToUser } from "../../common/realtime.js";
import { sendMail, renderEmail, escapeHtml } from "../../common/mailer.js";
import { sendPushToUser } from "../../common/push.js";
import { notifyUserViaTelegram, tgEscape } from "../telegram/telegram.service.js";

/**
 * Bildirishnomalarning yagona kirish nuqtasi.
 *
 * Chaqiruvchi modul (ariza, chat, obuna...) faqat `notify()` ni chaqiradi —
 * qaysi kanalga borishini foydalanuvchining sozlamalari hal qiladi:
 *
 *   in_app   — bazaga yoziladi + saytda ochiq bo'lsa WebSocket orqali darrov
 *   telegram — bot bog'langan bo'lsa
 *   push     — brauzer obunasi bo'lsa (VAPID sozlangan bo'lsa)
 *   email    — SMTP sozlangan bo'lsa
 *
 * Sozlama yozuvi yo'q kanal — YOQILGAN hisoblanadi (foydalanuvchi hech narsa
 * o'zgartirmagan bo'lsa hammasi ishlaydi). O'chirish uchun aniq `false` yoziladi.
 */

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  /** Qisqa matn — in-app ro'yxati, push va Telegram uchun. */
  body: string;
  /** Sayt ichidagi nisbiy yo'l, masalan "/messages". */
  url?: string;
  payload?: Prisma.InputJsonValue;
  /** Email uchun kengaytirilgan HTML (berilmasa `body` ishlatiladi). */
  emailHtml?: string;
  /** Email tugmasi matni (url bilan birga). */
  ctaLabel?: string;
  /** Faqat shu kanallarga cheklash (default — hammasi). */
  channels?: NotificationChannel[];
}

const ALL_CHANNELS: NotificationChannel[] = ["in_app", "telegram", "push", "email"];

/** Foydalanuvchining shu tur uchun o'chirib qo'ygan kanallarini qaytaradi. */
async function disabledChannels(
  userId: string,
  type: NotificationType
): Promise<Set<NotificationChannel>> {
  const rows = await prisma.notificationPreference.findMany({
    where: { userId, notificationType: type, isEnabled: false },
    select: { channel: true },
  });
  return new Set(rows.map((r: { channel: NotificationChannel }) => r.channel));
}

export async function notify(input: NotifyInput): Promise<void> {
  const wanted = input.channels ?? ALL_CHANNELS;
  const off = await disabledChannels(input.userId, input.type);
  const use = (c: NotificationChannel) => wanted.includes(c) && !off.has(c);

  const absoluteUrl = input.url ? `${env.WEB_ORIGIN}${input.url}` : env.WEB_ORIGIN;

  // 1) In-app: bazaga yozamiz va ochiq sahifaga darrov uzatamiz
  if (use("in_app")) {
    const row = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        payload: input.payload ?? { url: input.url ?? null },
      },
    });
    sendToUser(
      input.userId,
      JSON.stringify({
        type: "notification",
        notification: {
          id: row.id,
          type: row.type,
          title: row.title,
          body: row.body,
          url: input.url ?? null,
          isRead: false,
          createdAt: row.createdAt,
        },
      })
    );
  }

  // 2) Telegram
  if (use("telegram")) {
    void notifyUserViaTelegram(
      input.userId,
      `<b>${tgEscape(input.title)}</b>\n${tgEscape(input.body)}\n\n👉 ${absoluteUrl}`
    );
  }

  // 3) Brauzer push
  if (use("push")) {
    void sendPushToUser(input.userId, {
      title: input.title,
      body: input.body,
      url: input.url ?? "/",
      tag: input.type,
    });
  }

  // 4) Email
  if (use("email")) {
    void sendUserEmail(input, absoluteUrl);
  }
}

async function sendUserEmail(input: NotifyInput, absoluteUrl: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true },
  });
  if (!user?.email) return;
  await sendMail({
    to: user.email,
    subject: input.title,
    html: renderEmail({
      title: input.title,
      body: input.emailHtml ?? `<p style="margin:0">${escapeHtml(input.body)}</p>`,
      ctaLabel: input.ctaLabel ?? "Saytda ochish",
      ctaHref: absoluteUrl,
    }),
  });
}

/** Bir nechta foydalanuvchiga bir xil bildirishnoma (ketma-ket, DB'ni bosmaslik uchun). */
export async function notifyMany(userIds: string[], build: (userId: string) => NotifyInput) {
  for (const id of userIds) {
    await notify(build(id)).catch(() => undefined);
  }
}
