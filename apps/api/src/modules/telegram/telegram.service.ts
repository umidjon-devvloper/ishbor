import { prisma } from "../../common/prisma.js";
import { env, isProd } from "../../common/env.js";
import { maskPhone, normalizePhone } from "../../common/phone.js";
import { recordSecurityEvent } from "../../common/security-events.js";
import { consumeQuota } from "../../common/quota.js";
import { acquireLock, releaseLock, renewLock } from "../../common/redis.js";
import { invalidateAuthUser } from "../../common/auth-cache.js";
import {
  completeChallenge,
  findOpenChallenge,
  issueResetToken,
  latestAwaitingContact,
  markAwaitingContact,
  phoneOwner,
  telegramOwner,
  PAYLOAD_RE,
} from "../auth/challenges.js";
import { revokeUserSessions } from "../auth/auth.service.js";

/**
 * Telegram bot — qo'shimcha kutubxonasiz (fetch + long-polling).
 *
 * Vazifalari (audit R3, Rule A–K):
 *  1) Telefonni tasdiqlash va hisobga bog'lash (deep-link challenge + kontakt ulashish)
 *  2) Telefonni almashtirish va zaxira raqam
 *  3) Parolni tiklash (reset havolasi FAQAT shu yerdan boradi)
 *  4) Qo'lda tiklashni yakunlash (admin tasdiqlagandan keyin)
 *  5) Bildirishnomalar va support relay
 *
 * TELEGRAM ORQALI KIRISH YO'Q (D-041): bot hech qachon seans ochmaydi. Barcha auth oqimlari
 * faqat PRIVATE chatda ishlaydi va identity = `message.from.id` (D-043).
 */

const API = () => `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

/** Test rejimida (D-062) bot mavjud deb hisoblanadi va polling ishga tushmaydi. */
const TEST_BOT_USERNAME = "ishbor_test_bot";
/** Oxirgi muvaffaqiyatli `getUpdates` shu vaqtdan eski bo'lsa — bot "mavjud emas" (D-051). */
const AVAILABILITY_WINDOW_MS = 90_000;
/** Bitta chatdan daqiqasiga qabul qilinadigan update soni (D-046); ortiqchasi jimgina tashlanadi. */
const CHAT_UPDATES_PER_MINUTE = 30;
/** Telegram xabari 4096 belgi; matnni shu chegaradan oldin kesamiz. */
const MAX_TEXT = 3900;
/**
 * Long-polling qulfi (audit: scale-redis-6): bir vaqtda faqat bitta nusxa `getUpdates`
 * so'raydi. Muddat `getUpdates` timeout'idan (25 s) uzun — lider har aylanishda uzaytiradi;
 * yiqilsa, o'rnini boshqa nusxa taxminan shu muddat ichida egallaydi.
 */
const POLL_LOCK = "telegram:poll";
const POLL_LEASE_MS = 60_000;

let botUsername: string | null = null;
let lastPollOkAt = 0;
let stopped = false;
let lastOffset = 0;
let logger: { info: (o: unknown, m?: string) => void; warn: (o: unknown, m?: string) => void } = {
  info: console.log,
  warn: console.warn,
};

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms).unref());

/** 429 javobidagi `retry_after` (soniya) shu chegaradan oshmasa — kutib, bir marta qayta uriniladi. */
const TG_MAX_RETRY_AFTER_S = 30;
/** Bitta Telegram so'rovining kutish chegarasi (getUpdates'da long-poll `timeout` ustiga qo'shiladi). */
const TG_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Testlar uchun transport (D-062): faqat TARMOQ qismi almashtiriladi — challenge, identity,
 * yagonalik va seans mantiqi haqiqiy kod va haqiqiy bazada tekshiriladi.
 */
export type TelegramTransport = (method: string, payload?: Record<string, unknown>) => Promise<unknown>;
let transport: TelegramTransport | null = null;

export function setTelegramTransportForTests(fn: TelegramTransport | null): void {
  if (isProd) throw new Error("setTelegramTransportForTests production'da ishlatilmaydi");
  transport = fn;
}

interface TgResult<T> {
  ok: boolean;
  result?: T;
  errorCode?: number;
}

async function tgCall<T = unknown>(method: string, payload?: Record<string, unknown>): Promise<TgResult<T>> {
  if (transport) {
    try {
      return { ok: true, result: (await transport(method, payload)) as T };
    } catch (e) {
      logger.warn({ method, err: String(e) }, "Telegram test transport xatosi");
      return { ok: false };
    }
  }
  if (!env.TELEGRAM_BOT_TOKEN) return { ok: false };
  // Telegram 429 (Too Many Requests): `retry_after` <= 30s bo'lsa kutib BIR MARTA qayta urinamiz
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${API()}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
        // Osilib qolgan so'rov (undici sukuti 300s) yuborishni daqiqalab to'xtatmasin
        signal: AbortSignal.timeout(
          TG_REQUEST_TIMEOUT_MS + (typeof payload?.timeout === "number" ? payload.timeout * 1000 : 0)
        ),
      });
      const json = (await res.json()) as {
        ok: boolean;
        result?: T;
        description?: string;
        error_code?: number;
        parameters?: { retry_after?: number };
      };
      if (!json.ok) {
        const retryAfter = json.parameters?.retry_after;
        const rateLimited = json.error_code === 429 || res.status === 429;
        if (
          rateLimited &&
          attempt === 0 &&
          typeof retryAfter === "number" &&
          retryAfter >= 0 &&
          retryAfter <= TG_MAX_RETRY_AFTER_S
        ) {
          logger.warn({ method, retryAfter }, "Telegram 429 — kutib qayta urinamiz");
          await pause(retryAfter * 1000);
          continue;
        }
        logger.warn({ method, description: json.description }, "Telegram API xatosi");
        return { ok: false, errorCode: json.error_code ?? res.status };
      }
      return { ok: true, result: json.result };
    } catch (e) {
      logger.warn({ method, err: String(e) }, "Telegram API ulanish xatosi");
      return { ok: false };
    }
  }
}

async function tg<T = unknown>(method: string, payload?: Record<string, unknown>): Promise<T | null> {
  const res = await tgCall<T>(method, payload);
  return res.ok ? res.result ?? null : null;
}

/**
 * Xabar matnini Telegram chegarasiga sig'diradi (audit R3, telegram-11).
 *
 * `parse_mode: "HTML"` bo'lgani uchun kesish HTML mohiyati (`&amp;`, `&lt;`) O'RTASIDAN
 * tushmasligi kerak: yarim qolgan `&am` Telegram'da "can't parse entities" xatosi beradi va
 * uzun support xabari umuman yetkazilmasdi. Shuning uchun oxiridagi tugallanmagan `&...`
 * bo'lagi kesib tashlanadi (audit R3 reviewer).
 */
function clip(text: string): string {
  if (text.length <= MAX_TEXT) return text;
  let cut = text.slice(0, MAX_TEXT);
  const amp = cut.lastIndexOf("&");
  if (amp >= 0 && !cut.slice(amp).includes(";")) cut = cut.slice(0, amp);
  return `${cut}…`;
}

export function sendTelegramMessage(chatId: string | number, text: string, extra?: Record<string, unknown>) {
  return tg<{ message_id?: number }>("sendMessage", { chat_id: chatId, text: clip(text), parse_mode: "HTML", ...extra });
}

/** Foydalanuvchi matnini HTML parse_mode uchun xavfsizlaydi ("<" xabarni buzmasin). */
export function tgEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------------------------------------------------------
// Bot holati
// ---------------------------------------------------------

export function getBotUsername(): string | null {
  if (env.TELEGRAM_TEST_MODE) return TEST_BOT_USERNAME;
  return botUsername;
}

/**
 * Bot haqiqatan ishlayaptimi (D-051): token bor, username ma'lum va oxirgi muvaffaqiyatli
 * `getUpdates` 90 soniya ichida bo'lgan. Ilgari `getMe` bir marta tekshirilar, keyin polling
 * yiqilsa ham havolalar berilaverardi (telegram-9).
 */
export function isTelegramAvailable(): boolean {
  if (env.TELEGRAM_TEST_MODE) return true;
  if (!env.TELEGRAM_BOT_TOKEN || !botUsername) return false;
  return Date.now() - lastPollOkAt < AVAILABILITY_WINDOW_MS;
}

/** Deep-link havolasi. Bot mavjud bo'lmasa `null` — chaqiruvchi 503 qaytaradi. */
export function telegramDeepLink(payload: string): string | null {
  const username = getBotUsername();
  if (!username) return null;
  return `https://t.me/${username}?start=${payload}`;
}

/** Foydalanuvchiga (bog'langan bo'lsa) Telegram orqali bildirishnoma. */
export async function notifyUserViaTelegram(userId: string, text: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true },
  });
  if (!user?.telegramChatId) return;
  await sendTelegramMessage(user.telegramChatId, text);
}

// ---------------------------------------------------------
// Update turlari
// ---------------------------------------------------------

interface TgUser {
  id: number;
  first_name?: string;
}
interface TgMessage {
  message_id: number;
  from?: TgUser;
  chat: { id: number; type?: string };
  text?: string;
  contact?: { phone_number: string; user_id?: number };
  reply_to_message?: TgMessage;
}
interface TgCallbackQuery {
  id: string;
  from: TgUser;
  data?: string;
  message?: TgMessage;
}
export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
}

const CONTACT_KEYBOARD = {
  reply_markup: {
    keyboard: [[{ text: "📱 Telefon raqamni ulashish", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};
const REMOVE_KEYBOARD = { reply_markup: { remove_keyboard: true } };

/**
 * Bot javoblari o'zbekcha (D-059: foydalanuvchi tili saqlanmaydi, Telegram matnlari tarjima qilinmaydi).
 * Yaroqsiz, eskirgan, ishlatilgan yoki identity mos kelmagan payload uchun BITTA umumiy javob —
 * hisob mavjudligi hech qachon oshkor qilinmaydi (D-046).
 */
const MSG_INVALID = "⚠️ Havola yaroqsiz yoki muddati tugagan. Saytdan qaytadan urinib ko'ring.";
const MSG_ERROR = "⚠️ Kutilmagan xatolik yuz berdi. Saytdan qaytadan urinib ko'ring.";

/** Saytga o'tish tugmasi: Telegram inline URL tugmasi faqat https havolani qabul qiladi. */
function siteButton(url: string, text: string): Record<string, unknown> | undefined {
  if (!/^https:\/\//i.test(url)) return undefined;
  return { reply_markup: { inline_keyboard: [[{ text, url }]] } };
}

/** Payloadsiz `/start` — saytga havola va botning vazifasi (D-046, Rule C). */
async function handleStartPlain(chatId: string) {
  const loginUrl = `${env.WEB_ORIGIN}/login`;
  await sendTelegramMessage(
    chatId,
    "👋 <b>ISH BOR!</b> botiga xush kelibsiz.\n\n" +
      `🔗 Saytga kirish: ${tgEscape(loginUrl)}\n\n` +
      "Bu bot faqat <b>telefon raqamni tasdiqlash</b> va <b>parolni tiklash</b> uchun ishlatiladi — " +
      "bot orqali saytga kirilmaydi.\n\n" +
      "• Telefonni tasdiqlash: saytdagi profil sahifasining Telegram bo'limidan boshlang.\n" +
      "• Parolni unutdingizmi? Kirish sahifasidagi «Parolni tiklash» ni tanlang.\n" +
      "• Savolingiz bo'lsa — shu yerga yozing, support jamoasi javob beradi.",
    siteButton(loginUrl, "ISH BOR! saytiga kirish")
  );
}

/** Maqsad bo'yicha kontakt so'rash matni. */
const CONTACT_PROMPT: Record<string, string> = {
  telegram_link:
    "📱 Telefon raqamingizni tasdiqlash uchun pastdagi tugmani bosing.\n\n" +
    "Faqat <b>o'z</b> raqamingizni ulashing — boshqa odamning kontakti qabul qilinmaydi.\n\n" +
    "⚠️ Bu havolani <b>siz</b> saytdan olmagan bo'lsangiz, raqamingizni ulashmang: " +
    "u boshqa odamning hisobini sizning raqamingiz bilan tasdiqlaydi.",
  phone_change:
    "📱 Yangi telefon raqamingizni tasdiqlash uchun pastdagi tugmani bosing.\n\n" +
    "⚠️ Raqam o'zgargach barcha qurilmalardagi seanslar tugaydi va qaytadan kirish kerak bo'ladi.",
  backup_phone:
    "📱 Zaxira raqamni tasdiqlash uchun pastdagi tugmani bosing.\n\n" +
    "Zaxira raqam asosiy raqamdan farq qilishi kerak — u parolni tiklashda ishlatiladi.",
  manual_recovery:
    "📱 Hisobni tiklash uchun yangi telefon raqamingizni tasdiqlang.\n\n" +
    "Tasdiqlangandan so'ng parolni o'rnatish havolasini shu yerga yuboramiz.",
};

async function handleStart(msg: TgMessage, payload: string) {
  const chatId = String(msg.chat.id);

  if (!payload) return handleStartPlain(chatId);

  // Auth oqimlari faqat shaxsiy chatda (D-043, telegram-10): guruh chati identity emas
  if ((msg.chat.type ?? "private") !== "private" || !msg.from) {
    await sendTelegramMessage(chatId, MSG_INVALID);
    return;
  }
  const fromId = String(msg.from.id);

  // Format bazaga so'rovdan OLDIN tekshiriladi (D-046)
  if (!PAYLOAD_RE.test(payload)) {
    await sendTelegramMessage(chatId, MSG_INVALID);
    return;
  }

  const challenge = await findOpenChallenge(payload);
  if (!challenge) {
    await sendTelegramMessage(chatId, MSG_INVALID);
    return;
  }

  if (challenge.purpose === "password_recovery") {
    return handleRecoveryStart(chatId, fromId, challenge.id, challenge.userId, challenge.phoneKind);
  }

  if (!challenge.userId) {
    await sendTelegramMessage(chatId, MSG_INVALID);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: challenge.userId },
    select: { id: true, isBlocked: true, telegramChatId: true },
  });
  if (!user || user.isBlocked) {
    await sendTelegramMessage(chatId, MSG_INVALID);
    return;
  }

  // Bitta Telegram identity — bitta hisob (D-043). Jim qayta bog'lash YO'Q.
  if (await telegramOwner(fromId, user.id)) {
    await sendTelegramMessage(chatId, MSG_INVALID);
    return;
  }

  // Zaxira raqam boshqa Telegram hisobida bo'lishi kerak (D-047)
  if (challenge.purpose === "backup_phone" && user.telegramChatId === fromId) {
    await sendTelegramMessage(
      chatId,
      "⚠️ Zaxira raqam asosiy hisobingizdan BOSHQA Telegram hisobida bo'lishi kerak. " +
        "Zaxira raqam ulangan Telegram hisobidan havolani oching."
    );
    return;
  }

  // Qo'lda tiklash: so'rov tasdiqlangan va muddati o'tmagan bo'lishi shart (D-049)
  if (challenge.purpose === "manual_recovery" && !(await usableRecoveryRequest(challenge.recoveryRequestId))) {
    await sendTelegramMessage(chatId, MSG_INVALID);
    return;
  }

  if (!(await markAwaitingContact(challenge.id, fromId))) {
    await sendTelegramMessage(chatId, MSG_INVALID);
    return;
  }
  await sendTelegramMessage(chatId, CONTACT_PROMPT[challenge.purpose] ?? CONTACT_PROMPT.telegram_link, CONTACT_KEYBOARD);
}

/** Qo'lda tiklash so'rovi hali ishlatilishi mumkinmi (tasdiqlangan va 72 soat ichida). */
async function usableRecoveryRequest(requestId: string | null): Promise<boolean> {
  if (!requestId) return false;
  const request = await prisma.recoveryRequest.findUnique({
    where: { id: requestId },
    select: { status: true, continueExpiresAt: true },
  });
  if (!request || request.status !== "approved") return false;
  return (request.continueExpiresAt?.getTime() ?? 0) > Date.now();
}

/**
 * Parolni tiklash (D-045): identity hisobning asosiy yoki zaxira Telegram identity'si bilan
 * mos kelsa — reset havolasi yuboriladi. Mos kelmasa umumiy javob (hisob bor-yo'qligi bilinmaydi).
 */
async function handleRecoveryStart(
  chatId: string,
  fromId: string,
  challengeId: string,
  userId: string | null,
  phoneKind: string | null
) {
  if (!userId) {
    await sendTelegramMessage(chatId, MSG_INVALID);
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isBlocked: true, telegramChatId: true, backupTelegramId: true },
  });
  const expected = phoneKind === "backup" ? user?.backupTelegramId : user?.telegramChatId;
  if (!user || user.isBlocked || !expected || expected !== fromId) {
    await sendTelegramMessage(chatId, MSG_INVALID);
    return;
  }

  const reset = await issueResetToken(challengeId);
  if (!reset) {
    await sendTelegramMessage(chatId, MSG_INVALID);
    return;
  }
  recordSecurityEvent({ type: "recovery_verified", userId: user.id, meta: { phoneKind: phoneKind ?? "primary" } });

  const url = `${env.WEB_ORIGIN}/login?reset=${reset.token}`;
  await sendTelegramMessage(
    chatId,
    "🔐 <b>Parolni tiklash</b>\n\n" +
      `Yangi parol o'rnatish havolasi (15 daqiqa amal qiladi):\n${tgEscape(url)}\n\n` +
      "⚠️ Agar parolni tiklashni <b>siz</b> so'ramagan bo'lsangiz — bu xabarni e'tiborsiz qoldiring va havolani hech kimga bermang.",
    siteButton(url, "Yangi parol o'rnatish")
  );
}

// ---------------------------------------------------------
// Kontakt (telefon tasdiqlash)
// ---------------------------------------------------------

type ContactUser = {
  id: string;
  phone: string | null;
  isPhoneVerified: boolean;
  telegramChatId: string | null;
  backupPhone: string | null;
};

async function handleContact(msg: TgMessage) {
  const chatId = String(msg.chat.id);
  const contact = msg.contact!;

  if ((msg.chat.type ?? "private") !== "private" || !msg.from) {
    await sendTelegramMessage(chatId, MSG_INVALID);
    return;
  }
  // Faqat O'ZINING kontakti qabul qilinadi (boshqa odamnikini yuborib bo'lmaydi)
  if (contact.user_id !== msg.from.id) {
    await sendTelegramMessage(chatId, "⚠️ Iltimos, tugma orqali o'z raqamingizni ulashing.", CONTACT_KEYBOARD);
    return;
  }
  const fromId = String(msg.from.id);

  // Faol challenge bo'lmasa telefon o'zgarmaydi (D-044): ilgari bog'langan chatdan
  // istalgan vaqtda kontakt yuborib raqamni almashtirish mumkin edi.
  const challenge = await latestAwaitingContact(fromId);
  if (!challenge || !challenge.userId) {
    await sendTelegramMessage(
      chatId,
      "⚠️ Hozir tasdiqlanayotgan so'rov yo'q. Telefonni tasdiqlash yoki almashtirishni <b>saytdan</b> boshlang.",
      REMOVE_KEYBOARD
    );
    return;
  }

  const phone = normalizePhone(contact.phone_number);
  if (!phone) {
    await sendTelegramMessage(chatId, "⚠️ Telefon raqami tanilmadi. Saytdan qaytadan urinib ko'ring.", REMOVE_KEYBOARD);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: challenge.userId },
    select: { id: true, isBlocked: true, phone: true, isPhoneVerified: true, telegramChatId: true, backupPhone: true },
  });
  if (!user || user.isBlocked) {
    await sendTelegramMessage(chatId, MSG_INVALID, REMOVE_KEYBOARD);
    return;
  }

  // Telefon yagonaligi (D-043): tasdiqlangan raqam bir vaqtda faqat bitta hisobda
  if (await phoneOwner(phone, user.id)) {
    await sendTelegramMessage(
      chatId,
      "⚠️ Bu telefon raqam boshqa hisobga biriktirilgan. Boshqa raqamdan foydalaning yoki qo'llab-quvvatlash xizmatiga murojaat qiling.",
      REMOVE_KEYBOARD
    );
    return;
  }

  switch (challenge.purpose) {
    case "telegram_link":
      return applyTelegramLink(chatId, fromId, challenge.id, user, phone);
    case "phone_change":
      return applyPhoneChange(chatId, fromId, challenge.id, user, phone);
    case "backup_phone":
      return applyBackupPhone(chatId, fromId, challenge.id, user, phone);
    case "manual_recovery":
      return applyManualRecovery(chatId, fromId, challenge.id, challenge.recoveryRequestId, user, phone);
    default:
      await sendTelegramMessage(chatId, MSG_INVALID, REMOVE_KEYBOARD);
  }
}

async function applyTelegramLink(chatId: string, fromId: string, challengeId: string, user: ContactUser, phone: string) {
  // Tasdiqlangan BOSHQA raqam bo'lsa — telefonni almashtirish oqimi kerak (D-044)
  if (user.isPhoneVerified && user.phone && user.phone !== phone) {
    await sendTelegramMessage(
      chatId,
      "⚠️ Hisobingizda allaqachon boshqa tasdiqlangan raqam bor. Raqamni o'zgartirish uchun saytdagi " +
        "«Telefon raqamni o'zgartirish» oqimidan foydalaning.",
      REMOVE_KEYBOARD
    );
    return;
  }
  if (!(await completeChallenge(challengeId, "awaiting_contact"))) {
    await sendTelegramMessage(chatId, MSG_INVALID, REMOVE_KEYBOARD);
    return;
  }
  const identityChanged = user.telegramChatId !== fromId;
  await prisma.user.update({
    where: { id: user.id },
    data: { phone, isPhoneVerified: true, phoneVerifiedAt: new Date(), telegramChatId: fromId },
  });
  // Tasdiq darhol kuchga kirsin: holat keshidagi eski "tasdiqlanmagan" qiymat qolmasin (perf-auth-1)
  invalidateAuthUser(user.id);
  if (identityChanged) recordSecurityEvent({ type: "telegram_linked", userId: user.id, actorId: user.id });
  recordSecurityEvent({
    type: "phone_verified",
    userId: user.id,
    actorId: user.id,
    meta: { phone: maskPhone(phone) ?? "" },
  });

  await sendTelegramMessage(
    chatId,
    `✅ Telefon raqamingiz tasdiqlandi: <b>${tgEscape(phone)}</b>\n\n` +
      "Saytdagi profilingizda «Tasdiqlangan» belgisi paydo bo'ldi va yangi xabarlar shu yerga keladi.",
    REMOVE_KEYBOARD
  );
}

async function applyPhoneChange(chatId: string, fromId: string, challengeId: string, user: ContactUser, phone: string) {
  if (user.phone === phone) {
    await sendTelegramMessage(
      chatId,
      "⚠️ Bu raqam allaqachon hisobingizda asosiy raqam sifatida turibdi.",
      REMOVE_KEYBOARD
    );
    return;
  }
  if (user.backupPhone === phone) {
    await sendTelegramMessage(
      chatId,
      "⚠️ Bu raqam hisobingizda zaxira raqam sifatida turibdi. Avval zaxira raqamni olib tashlang.",
      REMOVE_KEYBOARD
    );
    return;
  }
  if (!(await completeChallenge(challengeId, "awaiting_contact"))) {
    await sendTelegramMessage(chatId, MSG_INVALID, REMOVE_KEYBOARD);
    return;
  }
  const previousIdentity = user.telegramChatId;
  await prisma.user.update({
    where: { id: user.id },
    data: { phone, isPhoneVerified: true, phoneVerifiedAt: new Date(), telegramChatId: fromId },
  });
  // Tasdiq darhol kuchga kirsin: holat keshidagi eski "tasdiqlanmagan" qiymat qolmasin (perf-auth-1)
  invalidateAuthUser(user.id);
  recordSecurityEvent({
    type: "phone_changed",
    userId: user.id,
    actorId: user.id,
    meta: { phone: maskPhone(phone) ?? "", previous: maskPhone(user.phone) ?? "" },
  });
  if (previousIdentity !== fromId) {
    if (previousIdentity) recordSecurityEvent({ type: "telegram_unlinked", userId: user.id, actorId: user.id });
    recordSecurityEvent({ type: "telegram_linked", userId: user.id, actorId: user.id });
  }
  // Tiklash kanali o'zgardi — barcha seanslar tugaydi (D-048, D-054)
  await revokeUserSessions(user.id);
  recordSecurityEvent({
    type: "sessions_invalidated",
    userId: user.id,
    actorId: user.id,
    meta: { reason: "phone_changed" },
  });

  await sendTelegramMessage(
    chatId,
    `✅ Asosiy telefon raqamingiz o'zgartirildi: <b>${tgEscape(phone)}</b>\n\n` +
      "🔐 Xavfsizlik uchun barcha qurilmalardagi seanslar tugatildi — saytga qaytadan kiring.",
    REMOVE_KEYBOARD
  );
}

async function applyBackupPhone(chatId: string, fromId: string, challengeId: string, user: ContactUser, phone: string) {
  if (user.phone === phone) {
    await sendTelegramMessage(chatId, "⚠️ Zaxira raqam asosiy raqamdan farq qilishi kerak.", REMOVE_KEYBOARD);
    return;
  }
  if (!(await completeChallenge(challengeId, "awaiting_contact"))) {
    await sendTelegramMessage(chatId, MSG_INVALID, REMOVE_KEYBOARD);
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { backupPhone: phone, backupPhoneVerifiedAt: new Date(), backupTelegramId: fromId },
  });
  recordSecurityEvent({
    type: "backup_phone_added",
    userId: user.id,
    actorId: user.id,
    meta: { phone: maskPhone(phone) ?? "" },
  });
  await sendTelegramMessage(
    chatId,
    `✅ Zaxira raqam tasdiqlandi: <b>${tgEscape(phone)}</b>\n\nEndi parolni shu raqam orqali ham tiklash mumkin.`,
    REMOVE_KEYBOARD
  );
  // Asosiy chatga ogohlantirish (D-047): o'g'irlangan seans zaxira raqam qo'shsa egasi bilib qoladi
  if (user.telegramChatId) {
    await sendTelegramMessage(
      user.telegramChatId,
      "🔐 <b>Xavfsizlik ogohlantirishi</b>\n\nHisobingizga zaxira telefon raqam qo'shildi " +
        `(${tgEscape(maskPhone(phone) ?? "")}). Agar bu siz bo'lmasangiz — darhol parolingizni o'zgartiring.`
    );
  }
}

async function applyManualRecovery(
  chatId: string,
  fromId: string,
  challengeId: string,
  recoveryRequestId: string | null,
  user: ContactUser,
  phone: string
) {
  if (!(await usableRecoveryRequest(recoveryRequestId))) {
    await sendTelegramMessage(chatId, MSG_INVALID, REMOVE_KEYBOARD);
    return;
  }
  // Reset tokeni challenge'ni `verified` ga o'tkazadi — shartli yozuv poygani ham hal qiladi
  const reset = await issueResetToken(challengeId);
  if (!reset) {
    await sendTelegramMessage(chatId, MSG_INVALID, REMOVE_KEYBOARD);
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { phone, isPhoneVerified: true, phoneVerifiedAt: new Date(), telegramChatId: fromId },
  });
  // Tasdiq darhol kuchga kirsin: holat keshidagi eski "tasdiqlanmagan" qiymat qolmasin (perf-auth-1)
  invalidateAuthUser(user.id);
  recordSecurityEvent({ type: "phone_verified", userId: user.id, meta: { phone: maskPhone(phone) ?? "", manual: true } });
  recordSecurityEvent({ type: "telegram_linked", userId: user.id, meta: { manual: true } });

  // Ikkita xabar: avval klaviatura olib tashlanadi, keyin havola inline tugma bilan beriladi
  // (bitta xabarda `reply_markup` faqat bitta bo'lishi mumkin)
  await sendTelegramMessage(chatId, `✅ Telefon raqamingiz tasdiqlandi: <b>${tgEscape(phone)}</b>`, REMOVE_KEYBOARD);
  const url = `${env.WEB_ORIGIN}/login?reset=${reset.token}`;
  await sendTelegramMessage(
    chatId,
    `🔐 Yangi parol o'rnatish havolasi (15 daqiqa amal qiladi):\n${tgEscape(url)}`,
    siteButton(url, "Yangi parol o'rnatish")
  );
}

// ---------------------------------------------------------
// Support relay
// ---------------------------------------------------------

/**
 * Admin chatidagi xabar ID'si -> foydalanuvchi chati (audit R3, files-xss-8, telegram-11).
 *
 * Ilgari yo'nalish xabar MATNIDAGI birinchi `#u<id>` bo'yicha topilardi, matn boshida esa
 * foydalanuvchi boshqaradigan ism turardi — u o'z ismiga `#u<boshqa chat>` yozib, adminning
 * javobini boshqa odamga yuborishi mumkin edi. Endi asosiy manba shu xotiradagi jadval,
 * matndagi belgi esa faqat BIRINCHI QATORdan va to'liq moslik bilan o'qiladi.
 */
const supportThreads = new Map<number, { chatId: string; expiresAt: number }>();
const SUPPORT_ROUTE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SUPPORT_ROUTE_MAX = 5000;

function rememberSupportThread(messageId: number | undefined, chatId: string): void {
  if (!messageId) return;
  const now = Date.now();
  if (supportThreads.size >= SUPPORT_ROUTE_MAX) {
    for (const [key, value] of supportThreads) {
      if (value.expiresAt <= now) supportThreads.delete(key);
    }
    if (supportThreads.size >= SUPPORT_ROUTE_MAX) {
      const oldest = supportThreads.keys().next().value;
      if (oldest !== undefined) supportThreads.delete(oldest);
    }
  }
  supportThreads.set(messageId, { chatId, expiresAt: now + SUPPORT_ROUTE_TTL_MS });
}

function lookupSupportThread(messageId: number | undefined): string | null {
  if (!messageId) return null;
  const entry = supportThreads.get(messageId);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    supportThreads.delete(messageId);
    return null;
  }
  return entry.chatId;
}

/** Foydalanuvchi matnidagi "#u123" ko'rinishini zararsizlantiradi (yo'naltirish belgisiga o'xshamasin). */
function stripRoutingTag(text: string): string {
  return text.replace(/#u(?=-?\d)/gi, "# u");
}

async function handleSupport(msg: TgMessage) {
  const chatId = String(msg.chat.id);
  const admin = env.TELEGRAM_ADMIN_CHAT_ID;

  if (!admin) {
    await sendTelegramMessage(
      chatId,
      "🛟 Xabaringiz qabul qilindi, lekin support hozircha sozlanmagan. Iltimos keyinroq urinib ko'ring."
    );
    return;
  }

  const user = await prisma.user.findFirst({
    where: { telegramChatId: chatId },
    select: { email: true, role: true },
  });
  const who = user ? `${user.email} (${user.role})` : `${msg.from?.first_name ?? "Noma'lum"} (saytga bog'lanmagan)`;

  // Yo'naltirish belgisi BIRINCHI QATORDA va foydalanuvchi matnidan oldin
  const sent = await sendTelegramMessage(
    admin,
    `#u${chatId}\n🛟 <b>Support xabari</b>\nKimdan: ${tgEscape(stripRoutingTag(who))}\n\n${tgEscape(
      stripRoutingTag(msg.text ?? "")
    )}`
  );
  if (!sent) {
    await sendTelegramMessage(chatId, "⚠️ Xabarni yuborib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.");
    return;
  }
  rememberSupportThread(sent.message_id, chatId);
  await sendTelegramMessage(chatId, "🛟 Xabaringiz qabul qilindi — tez orada javob beramiz.");
}

/** Admin support xabariga reply qilsa — javob foydalanuvchiga qaytadi. */
async function handleAdminReply(msg: TgMessage) {
  const replied = msg.reply_to_message;
  const mapped = lookupSupportThread(replied?.message_id);
  // Zaxira yo'l (restartdan keyin): faqat BIRINCHI qatordagi to'liq `#u<id>` belgisi
  const firstLine = (replied?.text ?? "").split("\n", 1)[0].trim();
  const tagged = /^#u(-?\d+)$/.exec(firstLine)?.[1] ?? null;
  const target = mapped ?? tagged;
  if (!target) {
    await sendTelegramMessage(msg.chat.id, "⚠️ Javob yuborish uchun support xabariga reply qiling.");
    return;
  }
  const delivered = await sendTelegramMessage(target, `🛟 <b>Support javobi:</b>\n\n${tgEscape(msg.text ?? "")}`);
  await sendTelegramMessage(msg.chat.id, delivered ? "✅ Javob yuborildi." : "⚠️ Javobni yetkazib bo'lmadi.");
}

// ---------------------------------------------------------
// Update marshruti
// ---------------------------------------------------------

/** Callback tugmalari endi ishlatilmaydi (Telegram orqali kirish olib tashlandi — D-041). */
async function handleCallbackQuery(query: TgCallbackQuery) {
  await tg("answerCallbackQuery", { callback_query_id: query.id });
}

async function handleUpdate(update: TgUpdate) {
  if (update.callback_query) return handleCallbackQuery(update.callback_query);
  const msg = update.message;
  if (!msg) return;
  const chatId = String(msg.chat.id);
  const text = msg.text ?? "";

  // Chat bo'yicha yumshoq limit (D-046): ortiqcha update jimgina tashlanadi
  if (!(await consumeQuota(`tg:chat:${chatId}`, CHAT_UPDATES_PER_MINUTE, 60_000))) return;

  if (msg.contact) return handleContact(msg);

  if (text.startsWith("/start")) return handleStart(msg, text.slice(6).trim());
  // Chat ID faqat support hali sozlanmaganda kerak (audit R3, telegram-15)
  if ((text === "/myid" || text === "/id") && !env.TELEGRAM_ADMIN_CHAT_ID) {
    return sendTelegramMessage(chatId, `🆔 Chat ID: <code>${tgEscape(chatId)}</code>`);
  }

  // Admin reply -> foydalanuvchiga relay
  if (env.TELEGRAM_ADMIN_CHAT_ID && chatId === env.TELEGRAM_ADMIN_CHAT_ID && msg.reply_to_message) {
    return handleAdminReply(msg);
  }

  // Oddiy matn -> support
  if (text) return handleSupport(msg);
}

/**
 * Bitta update'ni ishlaydi. Handler xato tashlasa foydalanuvchi javobsiz qolmasin
 * (audit R3, api-errors-11): umumiy xabar yuboriladi, ichki tafsilotlar chiqmaydi.
 * Testlar shu funksiyani to'g'ridan-to'g'ri chaqiradi (D-062).
 */
export async function handleTelegramUpdate(update: TgUpdate): Promise<void> {
  try {
    await handleUpdate(update);
  } catch (e) {
    logger.warn({ err: String(e), kind: update.callback_query ? "callback_query" : "message" }, "Telegram update xatosi");
    const chatId = update.message?.chat.id;
    if (chatId !== undefined) {
      await sendTelegramMessage(chatId, MSG_ERROR).catch(() => undefined);
    }
  }
}

// ---------------------------------------------------------
// Long-polling
// ---------------------------------------------------------

export async function startTelegramBot(log?: typeof logger) {
  if (log) logger = log;
  if (env.TELEGRAM_TEST_MODE) {
    logger.info({}, "TELEGRAM_TEST_MODE — bot test rejimida (polling yo'q)");
    return;
  }
  if (!env.TELEGRAM_BOT_TOKEN) {
    logger.info({}, "TELEGRAM_BOT_TOKEN yo'q — bot ishga tushirilmadi");
    return;
  }
  stopped = false;

  // Tarmoq vaqtincha uzilgan bo'lsa bot restartgacha o'chiq qolmasin — 30s dan 5 daqiqagacha qayta urinamiz
  let me = await tg<{ username: string }>("getMe");
  let delay = 30_000;
  while (!me && !stopped) {
    logger.warn({ retryInSeconds: delay / 1000 }, "Telegram bot token yaroqsiz yoki tarmoq xatosi — qayta urinamiz");
    await pause(delay);
    delay = Math.min(delay * 2, 5 * 60_000);
    me = await tg<{ username: string }>("getMe");
  }
  if (!me) return;
  botUsername = me.username;
  lastPollOkAt = Date.now();
  logger.info({ username: me.username }, "Telegram bot ishga tushdi (long-polling)");

  // Fon sikli — server bilan birga yashaydi, shutdown'da `stopTelegramBot()` to'xtatadi
  void (async () => {
    let failures = 0;
    while (!stopped) {
      /**
       * Long-polling'ni FAQAT BITTA nusxa bajaradi (audit: scale-redis-6).
       *
       * Telegram bir vaqtda ikkita `getUpdates` so'roviga 409 qaytaradi — ilgari shu sababli
       * `numReplicas: 1` majburiy edi. Endi nusxalar Redis qulfi orqali kelishadi: qulfni
       * olgani so'raydi, qolganlari kutadi va lider yiqilsa (qulf muddati tugaydi) o'rnini
       * egallaydi. Xabar YUBORISH hamma nusxada ishlayveradi — u qulfga bog'liq emas.
       * Redis sozlanmagan bo'lsa qulf har doim beriladi (bitta nusxali deploy).
       */
      if (!(await acquireLock(POLL_LOCK, POLL_LEASE_MS, "deny")) && !(await renewLock(POLL_LOCK, POLL_LEASE_MS))) {
        await pause(POLL_LEASE_MS / 2);
        continue;
      }
      const res = await tgCall<TgUpdate[]>("getUpdates", {
        offset: lastOffset,
        timeout: 25,
        allowed_updates: ["message", "callback_query"],
      });
      if (!res.ok) {
        failures += 1;
        // 401 (token bekor qilingan) yoki 409 (webhook o'rnatilgan) — qayta urinishning foydasi yo'q.
        // `botUsername` tozalanadi: endpointlar 503 TELEGRAM_UNAVAILABLE qaytaradi (D-051).
        if (res.errorCode === 401) {
          botUsername = null;
          logger.warn({ errorCode: res.errorCode }, "Telegram bot to'xtadi — token bekor qilingan");
          return;
        }
        // 409: boshqa getUpdates so'rovi (redeploy paytida eski nusxa hali ishlayapti) yoki webhook.
        // Birinchisi vaqtinchalik — to'xtab qolish botni keyingi restartgacha o'chirardi
        // (audit R3 ikkinchi audit, frontend-docs-2). Oshib boruvchi kutish bilan qayta urinamiz;
        // uzoq davom etsa 90 soniyalik mavjudlik oynasi tugaydi va endpointlar 503 qaytaradi.
        if (res.errorCode === 409) {
          if (failures % 6 === 1) logger.warn({ failures }, "Telegram getUpdates 409 — boshqa nusxa yoki webhook, qayta urinilmoqda");
          await pause(Math.min(60_000, 5000 * failures));
          continue;
        }
        // Uzluksiz xatoda 90 soniyalik "mavjudlik" oynasi tugaydi va havolalar berilmaydi.
        // Log toshib ketmasin: har 12-xatoda bir marta (taxminan daqiqada bir) yoziladi.
        if (failures % 12 === 1) logger.warn({ failures }, "Telegram getUpdates xatosi");
        await pause(5000);
        continue;
      }
      failures = 0;
      lastPollOkAt = Date.now();
      for (const u of res.result ?? []) {
        lastOffset = u.update_id + 1;
        await handleTelegramUpdate(u);
      }
      // Qulf egaligi uzaytiriladi; yo'qotilgan bo'lsa keyingi aylanishda qaytadan so'raladi
      await renewLock(POLL_LOCK, POLL_LEASE_MS);
    }
  })();
}

/**
 * Graceful shutdown: long-poll sikli keyingi aylanishda to'xtaydi va oxirgi bo'lak
 * Telegram tomonida TASDIQLANADI (audit R3, headers-infra-15) — aks holda restartdan
 * keyin o'sha update'lar qaytadan kelardi.
 */
export function stopTelegramBot(): void {
  stopped = true;
  // Qulf darhol bo'shatiladi — deploy paytida yangi nusxa muddat tugashini kutmasin
  void releaseLock(POLL_LOCK);
  if (lastOffset > 0 && env.TELEGRAM_BOT_TOKEN && !env.TELEGRAM_TEST_MODE) {
    void tg("getUpdates", { offset: lastOffset, timeout: 0, limit: 1 }).catch(() => undefined);
  }
}
