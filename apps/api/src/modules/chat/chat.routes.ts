import type { FastifyInstance } from "fastify";
import { Prisma, type ApplicationStatus } from "@prisma/client";
import type { SocketStream } from "@fastify/websocket";
import { z } from "zod";
import { idParams, isObjectId, objectId } from "../../common/validation.js";
import { prisma } from "../../common/prisma.js";
import { Errors, AppError } from "../../common/errors.js";
import { env, features } from "../../common/env.js";
import { requireAuth, requirePhoneVerified } from "../../common/auth-guard.js";
import { verifyAccessToken, type AccessTokenPayload } from "../../common/jwt.js";
import { addSocket, removeSocket, sendToUser, isOnline } from "../../common/realtime.js";
import { ownedVacancyIds, primaryCompany } from "../../common/ownership.js";
import { keyedCache } from "../../common/cache.js";
import { assertQuota, consumeQuota, HOUR_MS, MINUTE_MS } from "../../common/quota.js";
import { isChannelEnabled } from "../notifications/notifications.service.js";
import { notifyUserViaTelegram } from "../telegram/telegram.service.js";

async function participantsOf(conversationId: string) {
  if (!isObjectId(conversationId)) return null;
  const c = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { employerUserId: true, seekerUserId: true },
  });
  if (!c) return null;
  return { employerId: c.employerUserId, seekerId: c.seekerUserId };
}

/** Juftlik bo'yicha suhbatni topadi yoki yaratadi. */
export async function getOrCreateConversation(
  employerUserId: string,
  seekerUserId: string,
  companyId?: string | null
) {
  const existing = await prisma.conversation.findUnique({
    where: { employerUserId_seekerUserId: { employerUserId, seekerUserId } },
  });
  if (existing) {
    // Kompaniya konteksti keyinroq aniqlansa — yozib qo'yamiz
    if (!existing.companyId && companyId) {
      return prisma.conversation.update({ where: { id: existing.id }, data: { companyId } });
    }
    return existing;
  }
  try {
    const created = await prisma.conversation.create({
      data: { employerUserId, seekerUserId, companyId: companyId ?? null },
    });
    // Yangi suhbat — ikkala tomonning ID keshi darrov bekor qilinadi (audit R3, scale-10k-7)
    dropConversationIdsCache(employerUserId, seekerUserId);
    return created;
  } catch (error) {
    // Parallel so'rov suhbatni allaqachon yaratdi (unique juftlik) — o'shani qaytaramiz
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const created = await prisma.conversation.findUnique({
        where: { employerUserId_seekerUserId: { employerUserId, seekerUserId } },
      });
      if (created) {
        dropConversationIdsCache(employerUserId, seekerUserId);
        return created;
      }
    }
    throw error;
  }
}

/**
 * `/api/inbox/summary` uchun foydalanuvchining suhbat ID'lari (audit R3, scale-10k-7).
 *
 * Header hisoblagichi har ochiq varaqdan 20 soniyada bir marta keladi va har safar
 * foydalanuvchining BARCHA suhbatlari qayta o'qilardi. Endi ro'yxat 60 soniya keshlanadi;
 * yangi suhbat ochilganda kesh ikkala tomon uchun darrov bekor qilinadi, shuning uchun
 * yangi suhbatdagi birinchi xabar ham hisobga kechikmasdan tushadi.
 * Kesh faqat ID ro'yxati — o'qilmaganlar soni har safar bazadan hisoblanadi.
 */
const CONVERSATION_IDS_TTL_MS = 60_000;
const CONVERSATION_IDS_MAX_USERS = 5000;
const conversationIdsCache = new Map<string, { at: number; ids: string[] }>();

function dropConversationIdsCache(...userIds: string[]): void {
  for (const userId of userIds) conversationIdsCache.delete(userId);
}

async function conversationIdsOf(userId: string): Promise<string[]> {
  const now = Date.now();
  const hit = conversationIdsCache.get(userId);
  if (hit && now - hit.at <= CONVERSATION_IDS_TTL_MS) return hit.ids;
  const rows = await prisma.conversation.findMany({
    where: { OR: [{ employerUserId: userId }, { seekerUserId: userId }] },
    select: { id: true },
  });
  const ids = rows.map((c: { id: string }) => c.id);
  // Map qo'shilish tartibini saqlaydi: qayta yozishdan oldin o'chirsak, eng eski FOYDALANILGAN yozuv chiqadi
  conversationIdsCache.delete(userId);
  conversationIdsCache.set(userId, { at: now, ids });
  while (conversationIdsCache.size > CONVERSATION_IDS_MAX_USERS) {
    const oldest = conversationIdsCache.keys().next().value;
    if (oldest === undefined) break;
    conversationIdsCache.delete(oldest);
  }
  return ids;
}

/**
 * Xabarni saqlaydi va real-time yetkazadi: ikkala tomonning ochiq oynalariga WS orqali,
 * qabul qiluvchi saytda bo'lmasa — Telegram orqali. WS handler ham, ariza holati izohi ham
 * shu yagona yo'ldan o'tadi (audit ISSUE-060).
 */
export async function deliverMessage(
  conversationId: string,
  senderId: string,
  receiverId: string,
  body: string,
  clientId?: string
) {
  const saved = await prisma.message.create({
    data: { conversationId, senderId, body: body.slice(0, 4000) },
  });
  const message = {
    id: saved.id,
    conversationId,
    senderId,
    body: saved.body,
    isRead: false,
    createdAt: saved.createdAt,
  };
  // Yuboruvchi oynasi o'z `clientId`sini qaytarib oladi — "yuborilmoqda" pufagi shu bilan tasdiqlanadi
  sendToUser(senderId, JSON.stringify({ type: "message", message, ...(clientId ? { clientId } : {}) }));
  sendToUser(receiverId, JSON.stringify({ type: "message", message }));

  if (!(await isOnline(receiverId))) {
    void chatTelegramAlert(receiverId, conversationId).catch(() => undefined);
  }
  return saved;
}

/** Bitta suhbat bo'yicha Telegram ogohlantirishi orasidagi eng qisqa vaqt (audit R3, realtime-3). */
const CHAT_ALERT_WINDOW_MS = 10 * 60 * 1000;

/**
 * Chat Telegram ogohlantirishi (audit R3, realtime-4 / D-078).
 *
 * 1. Bot sozlanmagan bo'lsa — hech narsa qilinmaydi (audit R3, realtime-5).
 * 2. Bitta suhbat bo'yicha 10 daqiqada ko'pi bilan bitta xabar: ilgari HAR bir xabar
 *    alohida Telegram so'rovi edi — bitta hisob suhbatdoshning Telegram'ini to'ldirib,
 *    Telegram global limitiga urib, boshqa foydalanuvchilarning xabarini kechiktirardi.
 * 3. Foydalanuvchining bildirishnoma sozlamasiga bo'ysunadi. Chat uchun alohida
 *    `NotificationType` yo'q (sxema o'zgarishi bu guruh mulki emas), shuning uchun eng yaqin
 *    mavjud tur — `system` + `telegram` kanali: "Tizim / Telegram" ni o'chirgan foydalanuvchi
 *    chat ogohlantirishini ham olmaydi va buning uchun Telegram'ni uzishi shart emas.
 * 4. Xabar MATNI yuborilmaydi (audit R3, telegram-13): ilgari shaxsiy xabarning birinchi
 *    200 belgisi Telegram'ga (va qurilma qulflangan ekraniga) chiqardi. Endi faqat
 *    "yangi xabar bor" signali va saytdagi havola boradi.
 */
async function chatTelegramAlert(receiverId: string, conversationId: string): Promise<void> {
  if (!features.telegram) return;
  if (!(await consumeQuota(`chat:tg:${receiverId}:${conversationId}`, 1, CHAT_ALERT_WINDOW_MS))) return;
  if (!(await isChannelEnabled(receiverId, "system", "telegram"))) return;
  await notifyUserViaTelegram(
    receiverId,
    `💬 <b>Yangi xabar keldi</b>\n\nSuhbatni saytda o'qishingiz mumkin.\n\n👉 ${env.WEB_ORIGIN}/messages`
  );
}

const startSchema = z.object({
  candidateUserId: objectId().optional(),
  companySlug: z.string().max(200).optional(),
});

interface LastMessage {
  id: string;
  senderId: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
}

/** `aggregateRaw` Extended JSON qaytaradi: `{ $oid }`, `{ $date }`. */
const rawId = (value: unknown): string =>
  typeof value === "string" ? value : ((value as { $oid?: string } | null)?.$oid ?? "");
const rawDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  const inner = (value as { $date?: unknown } | null)?.$date;
  if (typeof inner === "string") return new Date(inner);
  if (inner && typeof inner === "object" && "$numberLong" in inner) return new Date(Number((inner as { $numberLong: string }).$numberLong));
  return new Date(0);
};

/**
 * Har suhbatning oxirgi xabari — bitta aggregatsiya (`[conversation_id, created_at]` indeksi bo'yicha).
 * Ilgari `include: { messages: { take: 1 } }` har suhbat uchun alohida so'rov berardi: 500 suhbatli ish
 * beruvchida ro'yxat p95 ~4 s edi (audit PHASE 5.3 benchmark).
 */
async function lastMessages(conversationIds: string[]): Promise<Map<string, LastMessage>> {
  if (conversationIds.length === 0) return new Map();
  const rows = (await prisma.message.aggregateRaw({
    pipeline: [
      { $match: { conversation_id: { $in: conversationIds.map((id) => ({ $oid: id })) } } },
      { $sort: { conversation_id: -1, created_at: -1 } },
      {
        $group: {
          _id: "$conversation_id",
          messageId: { $first: "$_id" },
          senderId: { $first: "$sender_id" },
          // Ro'yxatda faqat qisqa ko'rinish kerak: to'liq matn (4000 belgigacha) har suhbat uchun
          // javob hajmini bekorga o'stirardi (audit R3, db-perf-7 / scale-10k-6)
          body: { $first: { $substrCP: [{ $ifNull: ["$body", ""] }, 0, LAST_MESSAGE_PREVIEW] } },
          isRead: { $first: "$is_read" },
          createdAt: { $first: "$created_at" },
        },
      },
    ],
  })) as unknown as { _id: unknown; messageId: unknown; senderId: unknown; body: unknown; isRead: unknown; createdAt: unknown }[];
  return new Map(
    rows.map((row) => [
      rawId(row._id),
      {
        id: rawId(row.messageId),
        senderId: rawId(row.senderId),
        body: typeof row.body === "string" ? row.body : "",
        isRead: row.isRead === true,
        createdAt: rawDate(row.createdAt),
      },
    ])
  );
}

/**
 * Suhbat kartasida maosh ko'rsatilmaydigan holatlar (audit ISSUE-033, audit R3 gap4-2):
 * e'lon egasi maoshni yashirgan yoki e'lon moderatsiyada/rad etilgan.
 */
const hideSalary = (vacancy: { isSalaryHidden: boolean; status: string }): boolean =>
  vacancy.isSalaryHidden || vacancy.status === "moderation" || vacancy.status === "rejected";

/** Suhbat kontekstidagi arizani tanlash tartibi: taklif/qabul — faol muloqot, rad etilgan — oxirida. */
const CONTEXT_RANK: Record<ApplicationStatus, number> = { invited: 0, accepted: 1, viewed: 2, sent: 3, rejected: 4 };

/**
 * Sahifalash chegaralari (audit R3, D-078 / db-perf-10 / scale-10k-9).
 * Suhbat tarixi ilgari bir javobda eng yangi 1000 ta xabarni (4 MB gacha) qaytarardi va
 * undan eskisiga umuman yetib bo'lmasdi; endi `?before=<messageId>` bilan orqaga yuriladi.
 */
const MESSAGES_PAGE_DEFAULT = 50;
const MESSAGES_PAGE_MAX = 100;
/** Suhbatlar ro'yxati: bitta sahifa (audit R3, db-perf-7 / scale-10k-6). */
const CONVERSATIONS_PAGE_DEFAULT = 30;
const CONVERSATIONS_PAGE_MAX = 50;
/** Ro'yxatdagi oxirgi xabar ko'rinishi (belgi). */
const LAST_MESSAGE_PREVIEW = 300;
/** Vakansiya konteksti uchun o'qiladigan arizalar chegarasi (sahifadagi nomzodlar bo'yicha). */
const CONTEXT_APPLICATION_LIMIT = 1000;
/** Bir foydalanuvchi bir kunda ochadigan YANGI suhbatlar soni (audit R3, authz-idor-10). */
const NEW_CONVERSATIONS_PER_DAY = 50;
const DAY_MS = 24 * HOUR_MS;

/** WS: bitta ulanishdan 10 soniyada ko'pi bilan ~20 ta hodisa (token bucket). */
const WS_BUCKET_CAPACITY = 20;
const WS_REFILL_PER_MS = WS_BUCKET_CAPACITY / 10_000;
/** WS: bitta HISOB bir daqiqada yuboradigan xabarlar (barcha ulanishlari bo'yicha, audit R3, realtime-3). */
const WS_MESSAGES_PER_MINUTE = 120;
/**
 * WS: bitta hisobning "o'qildi" kadrlari (audit R3, realtime-3). Har kadr `updateMany` so'rovi —
 * ulanish bo'yicha token bucket bir nechta ulanish bilan ko'paytirilardi. Chegara odatdagi
 * ishlatishdan ancha yuqori; oshib ketgan kadr jimgina tashlanadi (klient uchun zararsiz).
 */
const WS_READS_PER_MINUTE = 300;

const conversationsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(CONVERSATIONS_PAGE_MAX).optional(),
  /** Oldingi sahifaning oxirgi suhbati: ID yoki uning `lastMessageAt` (ISO) qiymati. */
  before: z.string().trim().max(64).optional(),
});

const messagesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(MESSAGES_PAGE_MAX).optional(),
  /** Shu xabardan ESKIROQLARI (oldingi sahifaning eng eski xabari ID'si). */
  before: z.string().trim().max(64).optional(),
});

/**
 * Ish beruvchining vakansiya ID'lari — 60 s kesh (audit R3, scale-10k-7).
 * Header hisoblagichi har 20 soniyada so'raladi va har safar barcha vakansiya ID'lari qayta o'qilardi.
 * Kesh vakansiya/kompaniya yozuvida `bumpDataVersion()` bilan ham bekor bo'ladi.
 */
const cachedOwnedVacancyIds = keyedCache<string[]>(60_000, 2000);

const rateSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

/**
 * Baho berish sharti: suhbatda IKKALA tomon ham kamida bittadan xabar yozgan
 * bo'lishi kerak. Bir tomonlama yozib (javob olmasdan) baho qo'yib bo'lmaydi.
 */
async function isMutualConversation(conversationId: string, a: string, b: string) {
  const [fromA, fromB] = await Promise.all([
    prisma.message.count({ where: { conversationId, senderId: a }, take: 1 }),
    prisma.message.count({ where: { conversationId, senderId: b }, take: 1 }),
  ]);
  return fromA > 0 && fromB > 0;
}

export async function chatRoutes(app: FastifyInstance) {
  // Real-time chat — WebSocket. Brauzer header yubora olmagani uchun token query'da
  // (loglarda URL'dagi token yashiriladi — server.ts `redactUrl`).
  app.get("/ws/chat", { websocket: true }, (connection: SocketStream, req) => {
    const ws = connection.socket;
    let auth: AccessTokenPayload;
    try {
      const url = new URL(req.url ?? "", "http://localhost");
      auth = verifyAccessToken(url.searchParams.get("token") ?? "");
    } catch {
      // 4401 — klient buni tarmoq uzilishidan ajratadi va yangi token bilan ulanadi
      ws.close(4401, "unauthorized");
      return;
    }
    const userId = auth.sub;
    let closed = false;
    /**
     * Telefon tasdig'i (audit R3, realtime-2 / gap2-6): REST `POST /api/conversations/start`
     * `requirePhoneVerified` bilan himoyalangan, WS esa umuman tekshirmasdi — tasdiqlanmagan hisob
     * mavjud suhbatda cheksiz yozishi mumkin edi.
     */
    let phoneVerified = false;

    /** Klientga xato kadri (audit R3, api-errors-6): ilgari rad etilgan yuborish jimgina yo'qolardi. */
    const sendError = (code: string, clientId?: string) => {
      if (ws.readyState !== 1) return;
      try {
        ws.send(JSON.stringify({ type: "error", code, ...(clientId ? { clientId } : {}) }));
      } catch {
        /* ulanish yopilayapti */
      }
    };

    // Uch xil natija (audit PHASE 6, U2/U12): baza xatosi — 1011 (vaqtinchalik, klient backoff bilan qayta
    // ulanadi); hisob yo'q yoki bloklangan — 4403; token versiyasi eskirgan — 4401 (klient seansni yangilaydi).
    // Ilgari baza xatosi ham 4403 edi va klient sahifa yangilanguncha qayta ulanmasdi.
    const tokenVersion = (auth as { v?: unknown }).v;
    const ready: Promise<boolean> = prisma.user
      .findUnique({
        where: { id: userId },
        select: { isBlocked: true, tokenVersion: true, isPhoneVerified: true },
      })
      .then(
        (u) => {
          if (!u || u.isBlocked) {
            ws.close(4403, "forbidden");
            return false;
          }
          // `v` siz eski tokenlar muddati tugaguncha qabul qilinadi
          if (typeof tokenVersion === "number" && tokenVersion !== (u.tokenVersion ?? 0)) {
            ws.close(4401, "session revoked");
            return false;
          }
          phoneVerified = u.isPhoneVerified === true;
          // Ulanish faqat tekshiruvdan SO'NG ro'yxatga olinadi (audit R3, realtime-14): ilgari
          // bloklangan yoki seansi bekor qilingan hisob ham tekshiruv tugaguncha jonli xabar olardi.
          if (!closed && ws.readyState === 1) addSocket(userId, ws);
          return true;
        },
        (err: unknown) => {
          req.log.warn({ err }, "WS ulanishida foydalanuvchini tekshirib bo'lmadi");
          ws.close(1011, "try again");
          return false;
        }
      );

    // Token muddati tugaganda ulanish yopiladi — klient yangi token bilan qayta ulanadi va blok holati qayta tekshiriladi
    let expiryTimer: NodeJS.Timeout | undefined;
    const scheduleExpiry = (exp?: number) => {
      if (expiryTimer) clearTimeout(expiryTimer);
      expiryTimer = undefined;
      if (!exp) return;
      expiryTimer = setTimeout(() => ws.close(4401, "token expired"), Math.max(0, exp * 1000 - Date.now()));
      expiryTimer.unref?.();
    };
    scheduleExpiry(auth.exp);

    /**
     * `{ type: "auth", token }` kadri (audit R3, realtime-15): klient ulanishni uzmasdan yangi
     * token yuboradi va muddat qaytadan hisoblanadi. Eski klient bu kadrni yubormaydi —
     * u avvalgidek 4401 dan keyin qayta ulanadi.
     */
    const handleAuthFrame = (token: unknown) => {
      if (typeof token !== "string" || token.length > 4096) return;
      try {
        const fresh = verifyAccessToken(token);
        if (fresh.sub !== userId) {
          ws.close(4401, "unauthorized");
          return;
        }
        scheduleExpiry(fresh.exp);
        if (ws.readyState === 1) ws.send(JSON.stringify({ type: "auth", ok: true }));
      } catch {
        ws.close(4401, "unauthorized");
      }
    };

    let bucket = WS_BUCKET_CAPACITY;
    let lastRefill = Date.now();
    const allow = () => {
      const now = Date.now();
      bucket = Math.min(WS_BUCKET_CAPACITY, bucket + (now - lastRefill) * WS_REFILL_PER_MS);
      lastRefill = now;
      if (bucket < 1) return false;
      bucket -= 1;
      return true;
    };

    const handle = async (raw: { toString(): string }) => {
      let data: unknown;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!data || typeof data !== "object") return;
      const { type, conversationId, body, clientId, token } = data as Record<string, unknown>;
      const safeClientId = typeof clientId === "string" && clientId.length <= 64 ? clientId : undefined;
      // Token yangilash kadri bazaga bormaydi — `ready` dan oldin ham javob beradi.
      // Token bucket bu kadrga HAM tegishli (audit R3, realtime-3 review): aks holda bitta ulanish
      // cheksiz `auth` kadri yuborib, har biri uchun imzo tekshiruvi va javob kadri olardi —
      // ulanish bo'yicha yagona chegara chetlab o'tilardi. Haqiqiy klient 15 daqiqada bir marta yuboradi.
      if (type === "auth") {
        if (allow()) handleAuthFrame(token);
        return;
      }
      if (!(await ready)) return;
      if (type !== "read" && type !== "message") return;
      // Noto'g'ri formatdagi ID Prisma'ga yetmaydi (audit ISSUE-003: ilgari butun jarayonni yiqitardi)
      if (typeof conversationId !== "string" || !isObjectId(conversationId)) {
        if (type === "message") sendError("FORBIDDEN", safeClientId);
        return;
      }
      if (!allow()) {
        sendError("RATE_LIMITED", safeClientId);
        return;
      }
      // Token bucket ULANISH bo'yicha ishlaydi, shuning uchun hisob bo'yicha ham chegara bor
      // (audit R3, realtime-3): bir nechta ulanish ochib chegarani ko'paytirib bo'lmaydi.
      if (type === "message" && !(await consumeQuota(`ws:msg:${userId}`, WS_MESSAGES_PER_MINUTE, MINUTE_MS))) {
        sendError("RATE_LIMITED", safeClientId);
        return;
      }

      const parts = await participantsOf(conversationId);
      if (!parts || (userId !== parts.seekerId && userId !== parts.employerId)) {
        if (type === "message") sendError("FORBIDDEN", safeClientId);
        return;
      }
      const otherId = userId === parts.seekerId ? parts.employerId : parts.seekerId;

      if (type === "read") {
        if (!(await consumeQuota(`ws:read:${userId}`, WS_READS_PER_MINUTE, MINUTE_MS))) return;
        // Suhbatni o'qidim — yuboruvchini xabardor qilamiz (ikki belgi)
        await prisma.message.updateMany({
          where: { conversationId, senderId: { not: userId }, isRead: false },
          data: { isRead: true },
        });
        sendToUser(otherId, JSON.stringify({ type: "read", conversationId }));
        return;
      }

      if (typeof body !== "string") return;
      const text = body.trim();
      if (!text) return;

      // Telefon tasdig'i REST bilan bir xil (audit R3, realtime-2 / gap2-6). Bayroq ulanish
      // boshida o'qilgani uchun, tasdiqlanmagan bo'lsa bazadan bir marta qayta tekshiriladi:
      // foydalanuvchi boshqa varaqda tasdiqlagan bo'lsa qayta ulanishni kutmaydi.
      if (!phoneVerified) {
        const fresh = await prisma.user
          .findUnique({ where: { id: userId }, select: { isPhoneVerified: true } })
          .catch(() => null);
        phoneVerified = fresh?.isPhoneVerified === true;
        if (!phoneVerified) {
          sendError("PHONE_NOT_VERIFIED", safeClientId);
          return;
        }
      }

      try {
        await deliverMessage(conversationId, userId, otherId, text, safeClientId);
      } catch (err) {
        req.log.warn({ err }, "WS xabarini saqlab bo'lmadi");
        sendError("SERVER_ERROR", safeClientId);
      }
    };

    // Kadrlar KETMA-KET qayta ishlanadi (audit R3, realtime-13): ilgari har kadr mustaqil
    // ishlagani uchun tez yozilgan ikki xabar bazaga teskari tartibda tushishi mumkin edi.
    let queue: Promise<void> = Promise.resolve();
    ws.on("message", (raw) => {
      // Har qanday xato shu ulanish doirasida qoladi — jarayon yiqilmaydi
      queue = queue
        .then(() => handle(raw))
        .catch((err: unknown) => req.log.warn({ err }, "WS xabarini qayta ishlab bo'lmadi"));
    });

    ws.on("close", () => {
      closed = true;
      if (expiryTimer) clearTimeout(expiryTimer);
      removeSocket(userId, ws);
    });
    ws.on("error", () => {
      closed = true;
      removeSocket(userId, ws);
    });
  });

  // Suhbat ochish/topish: ish beruvchi -> nomzod yoki nomzod -> kompaniya
  app.post("/api/conversations/start", { preHandler: [requireAuth, requirePhoneVerified] }, async (req) => {
    const me = req.user!.sub;
    const role = req.user!.role;
    const body = startSchema.parse(req.body);

    /**
     * Yangi suhbat ochish chegarasi (audit R3, authz-idor-10): mavjud suhbatda yozish
     * cheklanmaydi, faqat YANGI suhbat ochish kuniga `NEW_CONVERSATIONS_PER_DAY` marta.
     */
    const limitNewConversation = async (employerUserId: string, seekerUserId: string) => {
      const existing = await prisma.conversation.findUnique({
        where: { employerUserId_seekerUserId: { employerUserId, seekerUserId } },
        select: { id: true },
      });
      if (!existing) await assertQuota(`conv:new:${me}`, NEW_CONVERSATIONS_PER_DAY, DAY_MS);
    };

    let conv;
    if (role === "employer" || role === "admin") {
      if (!body.candidateUserId) throw Errors.badRequest("candidateUserId kerak");
      const candidate = await prisma.user.findUnique({
        where: { id: body.candidateUserId },
        select: {
          id: true,
          role: true,
          isBlocked: true,
          jobSeekerProfile: {
            select: { isOpenToWork: true, resumes: { where: { status: "published" }, select: { id: true }, take: 1 } },
          },
        },
      });
      // Bloklangan hisob bilan suhbat ochilmaydi (audit R3, ma'lumot yaxlitligi xaritasi)
      if (!candidate || candidate.role !== "job_seeker" || candidate.isBlocked) throw Errors.notFound();

      if (role === "employer") {
        // Ish beruvchi faqat ish qidirayotgan (ochiq rezyumeli) yoki o'z vakansiyasiga ariza
        // yuborgan nomzodga yozadi (audit ISSUE-039). Mavjud suhbat davom etaveradi.
        const discoverable = Boolean(candidate.jobSeekerProfile?.isOpenToWork && candidate.jobSeekerProfile.resumes.length);
        let allowed = discoverable;
        if (!allowed) {
          const existing = await prisma.conversation.findUnique({
            where: { employerUserId_seekerUserId: { employerUserId: me, seekerUserId: candidate.id } },
            select: { id: true },
          });
          allowed = Boolean(existing);
        }
        if (!allowed) {
          const vacancyIds = await ownedVacancyIds(me);
          allowed = vacancyIds.length > 0 && Boolean(
            await prisma.application.findFirst({
              where: { jobSeekerId: candidate.id, vacancyId: { in: vacancyIds } },
              select: { id: true },
            })
          );
        }
        if (!allowed) {
          throw new AppError(403, "CANDIDATE_NOT_AVAILABLE", "Bu nomzod hozir ish qidirmayapti va vakansiyangizga ariza yubormagan");
        }
      }

      const company = await primaryCompany(me);
      await limitNewConversation(me, candidate.id);
      conv = await getOrCreateConversation(me, candidate.id, company?.id ?? null);
    } else if (role === "job_seeker") {
      // job_seeker -> kompaniyaga yozadi
      if (!body.companySlug) throw Errors.badRequest("companySlug kerak");
      const company = await prisma.company.findUnique({
        where: { slug: body.companySlug },
        select: { id: true, ownerUserId: true, owner: { select: { isBlocked: true } } },
      });
      // Egasi bloklangan kompaniya bilan suhbat ochilmaydi (audit R3, ma'lumot yaxlitligi xaritasi):
      // bunday kompaniya katalogda ham ko'rinmaydi, xabar esa hech qachon o'qilmasdi.
      if (!company || company.owner.isBlocked) throw Errors.notFound();
      await limitNewConversation(company.ownerUserId, me);
      conv = await getOrCreateConversation(company.ownerUserId, me, company.id);
    } else {
      // Kontent jamoasi (muharrir/muallif) nomzod sifatida yozishmaydi
      throw Errors.forbidden();
    }
    return { id: conv.id };
  });

  /**
   * Joriy foydalanuvchining suhbatlari — kursor bilan sahifalanadi (audit R3, D-078 / db-perf-7 /
   * employer-flows-9 / scale-10k-6).
   *
   * Ilgari BARCHA suhbatlar og'ir maydonlari (kompaniya tavsifi, nomzod profili) bilan bir javobda
   * kelardi, so'ng har kompaniya vakansiyalarining hammasi va ularning arizalari o'qilardi:
   * 500 suhbatli ish beruvchida ~500 KB va p95 ~1.1 s. Endi:
   *   1) yengil ro'yxat (faqat ID va ishtirokchilar) + bitta agregatsiya bilan oxirgi xabarlar,
   *   2) xotirada tartiblash va kursor bo'yicha kesish,
   *   3) og'ir maydonlar, o'qilmaganlar va vakansiya konteksti FAQAT shu sahifa uchun.
   * `Conversation.lastMessageAt` denormalizatsiyasi sxema o'zgarishini talab qiladi (bu guruh mulki emas).
   */
  app.get("/api/conversations", { preHandler: [requireAuth] }, async (req) => {
    const userId = req.user!.sub;
    const { limit, before } = conversationsQuery.parse(req.query);
    const take = limit ?? CONVERSATIONS_PAGE_DEFAULT;

    const light = await prisma.conversation.findMany({
      where: { OR: [{ employerUserId: userId }, { seekerUserId: userId }] },
      select: { id: true, createdAt: true },
    });
    const lastByConversation = await lastMessages(light.map((c) => c.id));
    const ordered = light
      .map((c) => ({ id: c.id, at: (lastByConversation.get(c.id)?.createdAt ?? c.createdAt).getTime() }))
      // Teng vaqtda ID bo'yicha barqaror tartib — kursor sahifalari kesishmaydi
      .sort((a, b) => b.at - a.at || (a.id < b.id ? 1 : -1));

    // Kursor: oldingi sahifaning oxirgi suhbati ID'si yoki uning `lastMessageAt` (ISO) qiymati
    let start = 0;
    if (before) {
      if (isObjectId(before)) {
        const index = ordered.findIndex((o) => o.id === before);
        // Suhbat topilmasa (o'chirilgan) — sahifa hisoblab bo'lmaydi: bo'sh javob, halqa yo'q
        start = index >= 0 ? index + 1 : ordered.length;
      } else {
        const at = new Date(before).getTime();
        if (Number.isNaN(at)) throw Errors.badRequest("before noto'g'ri");
        const index = ordered.findIndex((o) => o.at < at);
        start = index >= 0 ? index : ordered.length;
      }
    }
    const window = ordered.slice(start, start + take + 1);
    const hasMore = window.length > take;
    const pageOrder = hasMore ? window.slice(0, take) : window;
    const pageIds = pageOrder.map((o) => o.id);
    if (pageIds.length === 0) return { items: [], nextCursor: null };

    const rows = await prisma.conversation.findMany({
      where: { id: { in: pageIds } },
      include: {
        company: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
            industry: true,
            description: true,
            region: { select: { name: true } },
          },
        },
        // Email umuman o'qilmaydi (audit PHASE 6, V1): ilgari ism bo'sh nomzodning emaili sarlavha
        // bo'lib ish beruvchiga, kompaniyasiz suhbatda ish beruvchi/admin emaili nomzodga ochilardi
        seeker: {
          select: {
            jobSeekerProfile: { select: { firstName: true, lastName: true, headline: true, avatarUrl: true } },
          },
        },
        employer: { select: { role: true } },
      },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const convs = pageIds.map((id) => byId.get(id)).filter((c): c is (typeof rows)[number] => Boolean(c));

    const unreadRows = await prisma.message.groupBy({
      by: ["conversationId"],
      where: { conversationId: { in: pageIds }, senderId: { not: userId }, isRead: false },
      _count: { _all: true },
    });
    const unreadMap = new Map(unreadRows.map((r) => [r.conversationId, r._count._all]));

    // Vakansiya konteksti: suhbatda vakansiya maydoni yo'q — nomzodning shu kompaniya
    // vakansiyalariga bergan arizasidan olinadi (bir nechta bo'lsa — faol bosqichdagisi).
    // Endi qidiruv NOMZOD bo'yicha (indekslangan `jobSeekerId`) va faqat shu sahifadagi suhbatlar uchun:
    // ilgari kompaniyaning BARCHA vakansiya ID'lari `$in` ro'yxatiga yig'ilardi — katta kompaniya bilan
    // yozishgan nomzodda bu ro'yxat minglab element bo'lardi (audit R3, scale-10k-6).
    const withCompany = convs.filter((c) => c.companyId);
    const companyIds = new Set(withCompany.map((c) => c.companyId as string));
    const applications = withCompany.length
      ? await prisma.application.findMany({
          where: { jobSeekerId: { in: [...new Set(withCompany.map((c) => c.seekerUserId))] } },
          select: {
            jobSeekerId: true,
            status: true,
            createdAt: true,
            vacancy: {
              select: {
                companyId: true,
                title: true,
                slug: true,
                status: true,
                employmentType: true,
                experienceRequired: true,
                salaryMin: true,
                salaryMax: true,
                currency: true,
                isSalaryHidden: true,
                region: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: CONTEXT_APPLICATION_LIMIT,
        })
      : [];
    const contextOf = new Map<string, (typeof applications)[number]>();
    for (const application of applications) {
      if (!companyIds.has(application.vacancy.companyId)) continue;
      const key = `${application.jobSeekerId}:${application.vacancy.companyId}`;
      const current = contextOf.get(key);
      const rank = CONTEXT_RANK[application.status];
      if (
        !current ||
        rank < CONTEXT_RANK[current.status] ||
        (rank === CONTEXT_RANK[current.status] && application.createdAt > current.createdAt)
      ) {
        contextOf.set(key, application);
      }
    }

    const items = convs.map((c) => {
      const iAmEmployer = c.employerUserId === userId;
      const sp = c.seeker.jobSeekerProfile;
      // Nom bo'lmasa — `null` (klient rol yorlig'ini chizadi), email hech qachon (audit PHASE 6, V1)
      const seekerName = [sp?.firstName, sp?.lastName].filter(Boolean).join(" ") || null;
      const title = iAmEmployer ? seekerName : c.company?.name ?? null;
      const subtitle = iAmEmployer ? sp?.headline ?? null : c.company?.name ? "Ish beruvchi" : null;
      const last = lastByConversation.get(c.id);
      const vacancy = c.companyId ? contextOf.get(`${c.seekerUserId}:${c.companyId}`)?.vacancy : undefined;
      return {
        id: c.id,
        title,
        subtitle,
        companySlug: c.company?.slug ?? null,
        otherUserId: iAmEmployer ? c.seekerUserId : c.employerUserId,
        lastMessage: last?.body ?? null,
        lastMessageAt: last?.createdAt ?? c.createdAt,
        unread: unreadMap.get(c.id) ?? 0,
        // /messages sahifasi uchun qo'shimcha (ixtiyoriy) maydonlar
        otherRole: iAmEmployer ? "job_seeker" : c.employer.role,
        otherHeadline: iAmEmployer ? sp?.headline ?? null : null,
        avatarUrl: iAmEmployer ? sp?.avatarUrl ?? null : c.company?.logoUrl ?? null,
        lastMessageMine: last ? last.senderId === userId : false,
        lastMessageRead: last?.isRead ?? false,
        company: c.company
          ? {
              name: c.company.name,
              slug: c.company.slug,
              logoUrl: c.company.logoUrl,
              isVerified: c.company.isVerified,
              industry: c.company.industry,
              description: c.company.description,
              regionName: c.company.region?.name ?? null,
            }
          : null,
        vacancy: vacancy
          ? {
              title: vacancy.title,
              slug: vacancy.slug,
              isClosed: vacancy.status !== "active",
              // Moderatsiyadagi yoki rad etilgan e'lonning maosh raqamlari ko'rsatilmaydi
              // (audit R3, gap4-2 — GET /api/applications bilan bir xil qoida)
              isUnavailable: vacancy.status === "moderation" || vacancy.status === "rejected",
              employmentType: vacancy.employmentType,
              experienceRequired: vacancy.experienceRequired,
              // Yashirilgan maosh raqamlari javobga umuman qo'shilmaydi
              salaryMin: hideSalary(vacancy) ? null : vacancy.salaryMin,
              salaryMax: hideSalary(vacancy) ? null : vacancy.salaryMax,
              currency: vacancy.currency,
              regionName: vacancy.region?.name ?? null,
            }
          : null,
      };
    });

    // Tartib yuqorida (kursor bilan bir xil ro'yxatda) aniqlangan — qayta tartiblash kerak emas
    return {
      items,
      /** Keyingi sahifa uchun `?before=` qiymati; yana suhbat bo'lmasa `null` (audit R3, D-078). */
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  });

  /**
   * Bitta suhbat tarixi. Parametrsiz — eng yangi sahifa (ochilganda o'qilgan deb belgilanadi),
   * `?before=<messageId>` — undan eskiroqlari (audit R3, D-078 / db-perf-10 / scale-10k-9).
   * Javob shakli o'zgarmadi: `items` (xronologik tartibda) va `me`; `hasMore` qo'shildi.
   */
  app.get("/api/conversations/:id/messages", { preHandler: [requireAuth] }, async (req) => {
    const { id } = idParams.parse(req.params);
    const { limit, before } = messagesQuery.parse(req.query);
    const take = limit ?? MESSAGES_PAGE_DEFAULT;
    const parts = await participantsOf(id);
    if (!parts) throw Errors.notFound();
    const me = req.user!.sub;
    if (me !== parts.seekerId && me !== parts.employerId) throw Errors.forbidden();

    // Eski sahifani yuklash o'qilgan belgisini qo'ymaydi — belgilash faqat eng yangi sahifada
    if (!before) {
      const marked = await prisma.message.updateMany({
        where: { conversationId: id, senderId: { not: me }, isRead: false },
        data: { isRead: true },
      });
      // O'qilganini yuboruvchiga real-time bildiramiz (ikki belgi)
      if (marked.count > 0) {
        const otherId = me === parts.seekerId ? parts.employerId : parts.seekerId;
        sendToUser(otherId, JSON.stringify({ type: "read", conversationId: id }));
      }
    }

    // Kursor: shu xabardan eskiroqlari. Xabar shu suhbatga tegishli bo'lishi shart — begona
    // suhbat xabarining vaqti bilan sahifalash mumkin emas.
    let cursorWhere: object = {};
    if (before) {
      if (!isObjectId(before)) throw Errors.badRequest("before noto'g'ri");
      const anchor = await prisma.message.findFirst({
        where: { id: before, conversationId: id },
        select: { createdAt: true },
      });
      if (!anchor) throw Errors.notFound();
      cursorWhere = {
        OR: [{ createdAt: { lt: anchor.createdAt } }, { createdAt: anchor.createdAt, id: { lt: before } }],
      };
    }

    const recent = await prisma.message.findMany({
      where: { conversationId: id, ...cursorWhere },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      // Bittasi ortiqcha — eskiroq xabar borligini shundan bilamiz
      take: take + 1,
    });
    const hasMore = recent.length > take;
    // Javob doim xronologik tartibda (eskisidan yangisiga) — klient shu tartibni kutadi
    const ascending = (hasMore ? recent.slice(0, take) : recent).reverse();
    return {
      items: ascending,
      me,
      /** Yana eskiroq xabar bormi (klient "eskiroq xabarlar" tugmasini shunga qarab chizadi). */
      hasMore,
      /** Keyingi (eskiroq) sahifa uchun `?before=` qiymati — shu sahifadagi ENG ESKI xabar. */
      nextCursor: hasMore ? ascending[0]?.id ?? null : null,
    };
  });

  // Suhbat bo'yicha baho holati: berish mumkinmi, mening bahom, suhbatdoshning o'rtachasi
  app.get("/api/conversations/:id/rating", { preHandler: [requireAuth] }, async (req) => {
    const { id } = idParams.parse(req.params);
    const me = req.user!.sub;
    const parts = await participantsOf(id);
    if (!parts) throw Errors.notFound();
    if (me !== parts.seekerId && me !== parts.employerId) throw Errors.forbidden();
    const otherId = me === parts.seekerId ? parts.employerId : parts.seekerId;

    const [eligible, mine, agg] = await Promise.all([
      isMutualConversation(id, parts.seekerId, parts.employerId),
      prisma.peerRating.findUnique({
        where: { conversationId_raterUserId: { conversationId: id, raterUserId: me } },
        select: { score: true, comment: true },
      }),
      prisma.peerRating.aggregate({
        where: { ratedUserId: otherId },
        _avg: { score: true },
        _count: { _all: true },
      }),
    ]);

    return {
      eligible,
      myScore: mine?.score ?? null,
      myComment: mine?.comment ?? null,
      otherAvg: agg._avg.score ? Math.round(agg._avg.score * 10) / 10 : null,
      otherCount: agg._count._all,
    };
  });

  // Suhbatdoshga 1–5 yulduz baho (faqat ikkala tomon ham yozgan bo'lsa)
  app.post("/api/conversations/:id/rating", { preHandler: [requireAuth] }, async (req) => {
    const { id } = idParams.parse(req.params);
    const me = req.user!.sub;
    const body = rateSchema.parse(req.body);
    const parts = await participantsOf(id);
    if (!parts) throw Errors.notFound();
    if (me !== parts.seekerId && me !== parts.employerId) throw Errors.forbidden();
    const otherId = me === parts.seekerId ? parts.employerId : parts.seekerId;

    const eligible = await isMutualConversation(id, parts.seekerId, parts.employerId);
    if (!eligible) {
      throw new AppError(
        403,
        "RATING_NOT_ELIGIBLE",
        "Baho berish uchun suhbatda ikkala tomon ham yozgan bo'lishi kerak"
      );
    }

    // Baho BIR MARTA beriladi — keyin o'zgartirib bo'lmaydi (adolatli reyting).
    const existing = await prisma.peerRating.findUnique({
      where: { conversationId_raterUserId: { conversationId: id, raterUserId: me } },
    });
    if (existing) {
      throw new AppError(409, "ALREADY_RATED", "Siz bu suhbatdoshga allaqachon baho bergansiz");
    }

    const saved = await prisma.peerRating.create({
      data: {
        conversationId: id,
        raterUserId: me,
        ratedUserId: otherId,
        score: body.score,
        comment: body.comment ?? null,
      },
    });
    return { score: saved.score, comment: saved.comment };
  });

  // Suhbatdoshning qisqa profili (modal uchun). Maxfiylik: faqat oramizda
  // suhbat mavjud bo'lgan foydalanuvchining ma'lumotini ko'rish mumkin.
  app.get("/api/users/:id/summary", { preHandler: [requireAuth] }, async (req) => {
    const { id } = idParams.parse(req.params);
    const me = req.user!.sub;
    const conv = await prisma.conversation.findFirst({
      where: {
        OR: [
          { employerUserId: me, seekerUserId: id },
          { employerUserId: id, seekerUserId: me },
        ],
      },
      select: { id: true },
    });
    if (!conv) throw Errors.forbidden();

    const user = await prisma.user.findUnique({
      where: { id },
      // Faqat kerakli maydonlar: email (va parol xeshi) umuman o'qilmaydi (audit PHASE 6, V1)
      select: {
        role: true,
        jobSeekerProfile: {
          include: {
            region: true,
            // Faqat chop etilgan rezyume (qoralama mazmuni ochilmaydi)
            resumes: {
              where: { status: "published" },
              orderBy: { updatedAt: "desc" },
              take: 1,
              include: { skills: true },
            },
          },
        },
        ownedCompanies: { take: 1, orderBy: { createdAt: "asc" }, include: { region: true } },
      },
    });
    if (!user) throw Errors.notFound();

    const agg = await prisma.peerRating.aggregate({
      where: { ratedUserId: id },
      _avg: { score: true },
      _count: { _all: true },
    });

    const p = user.jobSeekerProfile;
    const resume = p?.resumes[0];
    const comp = user.ownedCompanies[0];
    const fullName = p ? [p.firstName, p.lastName].filter(Boolean).join(" ") : "";
    return {
      role: user.role,
      // Ism yoki kompaniya nomi; ikkalasi ham bo'lmasa — `null`, email emas (audit PHASE 6, V1)
      name: fullName || comp?.name || null,
      headline: p?.headline ?? null,
      regionName: p?.region?.name ?? comp?.region?.name ?? null,
      ratingAvg: agg._avg.score ? Math.round(agg._avg.score * 10) / 10 : null,
      ratingCount: agg._count._all,
      isOpenToWork: p?.isOpenToWork ?? null,
      resumeTitle: resume?.title ?? null,
      skills: resume?.skills.map((s) => s.skillName) ?? [],
      company: comp
        ? {
            name: comp.name,
            slug: comp.slug,
            logoUrl: comp.logoUrl,
            industry: comp.industry,
            description: comp.description,
          }
        : null,
    };
  });

  // Header uchun: o'qilmagan xabarlar + yangi arizalar
  app.get("/api/inbox/summary", { preHandler: [requireAuth] }, async (req) => {
    const userId = req.user!.sub;
    const isEmployer = req.user!.role === "employer";
    // Suhbat ID'lari 60 s keshlanadi, yangi suhbatda darrov bekor bo'ladi (audit R3, scale-10k-7)
    const ids = await conversationIdsOf(userId);
    const [unreadMessages, newApplications] = await Promise.all([
      ids.length
        ? prisma.message.count({
            where: { conversationId: { in: ids }, senderId: { not: userId }, isRead: false },
          })
        : Promise.resolve(0),
      // Relation filter ($lookup) o'rniga: o'z vakansiyalari → [vacancyId, status] indeksi (audit ISSUE-046).
      // Vakansiya ID'lari 60 s keshlanadi (audit R3, scale-10k-7): bu so'rov har varaqdan 20 soniyada
      // bir marta keladi va har safar barcha ID'lar qayta o'qilardi (500 vakansiyada ~125 ms).
      isEmployer
        ? cachedOwnedVacancyIds(userId, () => ownedVacancyIds(userId)).then((vacancyIds) =>
            vacancyIds.length ? prisma.application.count({ where: { vacancyId: { in: vacancyIds }, status: "sent" } }) : 0
          )
        : Promise.resolve(0),
    ]);
    return { unreadMessages, newApplications };
  });
}
