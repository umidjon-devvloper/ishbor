import type { UserRole } from "@prisma/client";
import { env } from "./env.js";
import { CHANNEL, INSTANCE_ID, publishMessage, subscribeToChannel } from "./redis.js";

/**
 * Foydalanuvchi holatining QISQA MUDDATLI keshi (audit: perf-auth-1).
 *
 * Har bir autentifikatsiyalangan so'rov bazadan bitta qator o'qirdi. 10 ming
 * foydalanuvchida bu bazadagi eng katta bir xil yuk edi: bitta sahifa 5-10 ta
 * so'rov qilsa, shuncha marta AYNAN bir xil hujjat o'qilardi.
 *
 * Xavfsizlik (audit PHASE 6, V5) saqlanadi: qator muddati tugaganda emas, holat
 * O'ZGARGANDA keshdan chiqariladi. Bloklash, rol o'zgarishi, logout, parol tiklash,
 * telefon almashtirish — hammasi `revokeUserSessions` dan o'tadi, u esa
 * `invalidateAuthUser` ni chaqiradi; telefon tasdiqlash ham alohida chaqiradi.
 * Redis bo'lsa signal BARCHA nusxalarga boradi, ya'ni bloklash bir zumda hamma
 * joyda kuchga kiradi.
 *
 * TTL — faqat zaxira to'r: kodni chetlab o'tib bazada QO'LDA o'zgartirilgan qiymat
 * ham 10 soniyadan keyin amal qiladi.
 *
 * Bu alohida modul, chunki uni ham `auth-guard`, ham `auth.service` ishlatadi —
 * bir modulda bo'lsa import halqasi hosil bo'lardi.
 */

/** requireAuth bazadan o'qiydigan foydalanuvchi holati (audit PHASE 6, V5). */
export interface AuthUser {
  role: UserRole;
  isBlocked: boolean;
  tokenVersion: number | null;
  isPhoneVerified: boolean;
}

const TTL_MS = env.AUTH_CACHE_MS;
const MAX_ENTRIES = 20_000;
const cache = new Map<string, { at: number; user: AuthUser }>();

export function getCachedAuthUser(userId: string): AuthUser | null {
  if (TTL_MS === 0) return null;
  const hit = cache.get(userId);
  if (!hit || Date.now() - hit.at >= TTL_MS) return null;
  return hit.user;
}

export function cacheAuthUser(userId: string, user: AuthUser): void {
  if (TTL_MS === 0) return;
  // Map qo'shilish tartibini saqlaydi — chegaraga yetganda eng eskisi chiqadi
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(userId, { at: Date.now(), user });
}

/** Holat o'zgardi: shu nusxada ham, qolganlarida ham keshdan chiqariladi. */
export function invalidateAuthUser(userId: string): void {
  cache.delete(userId);
  publishMessage(CHANNEL.auth, { from: INSTANCE_ID, userId });
}

subscribeToChannel(CHANNEL.auth, (payload) => {
  const msg = payload as { from?: string; userId?: string };
  if (!msg || msg.from === INSTANCE_ID || typeof msg.userId !== "string") return;
  cache.delete(msg.userId);
});
