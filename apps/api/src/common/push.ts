import webpush from "web-push";
import { env, features } from "./env.js";
import { prisma } from "./prisma.js";

/**
 * Brauzer push xabarnomalari (Web Push / VAPID).
 *
 * VAPID kalitlari .env'da bo'lmasa modul o'zini o'chiradi — sayt oddiy ishlaydi,
 * faqat push bormaydi. Kalit yaratish: `npm run push:keys`.
 */

let configured = false;

function ensureConfigured(): boolean {
  if (!features.push) return false;
  if (!configured) {
    webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
    configured = true;
  }
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Foydalanuvchining barcha qurilmalariga push yuboradi.
 * Obuna eskirgan bo'lsa (404/410) — bazadan tozalanadi.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  let delivered = 0;

  await Promise.all(
    subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
        delivered += 1;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
        }
      }
    })
  );

  return delivered;
}

export function getVapidPublicKey(): string {
  return features.push ? env.VAPID_PUBLIC_KEY : "";
}
