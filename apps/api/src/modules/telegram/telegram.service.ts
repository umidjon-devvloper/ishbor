import crypto from "node:crypto";
import { prisma } from "../../common/prisma.js";
import { env } from "../../common/env.js";

/**
 * Telegram bot — qo'shimcha kutubxonasiz (fetch + long-polling).
 * Vazifalari:
 *  1) Hisobni bog'lash (saytdan deep-link: /start <token>)
 *  2) Telefonni tasdiqlash (kontakt ulashish — soxtalab bo'lmaydi)
 *  3) Bildirishnomalar (oflayn foydalanuvchiga yangi xabar haqida)
 *  4) Support: foydalanuvchi botga yozadi -> adminga boradi; admin reply qilsa -> qaytadi
 */

const API = () => `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

let botUsername: string | null = null;
let logger: { info: (o: unknown, m?: string) => void; warn: (o: unknown, m?: string) => void } = {
  info: console.log,
  warn: console.warn,
};

async function tg<T = unknown>(method: string, payload?: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${API()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
    if (!json.ok) {
      logger.warn({ method, description: json.description }, "Telegram API xatosi");
      return null;
    }
    return json.result ?? null;
  } catch (e) {
    logger.warn({ method, err: String(e) }, "Telegram API ulanish xatosi");
    return null;
  }
}

export function sendTelegramMessage(chatId: string | number, text: string, extra?: Record<string, unknown>) {
  return tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });
}

/** Foydalanuvchi matnini HTML parse_mode uchun xavfsizlaydi ("<" xabarni buzmasin). */
export function tgEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Deep-link tokenlari — Telegram `?start=` parametri maksimal 64 belgi va
 * faqat [A-Za-z0-9_-] qabul qiladi, shuning uchun JWT emas, qisqa tasodifiy
 * token ishlatiladi. Bot va API bir jarayonda — xotirada saqlash yetarli.
 */
const linkTokens = new Map<string, { userId: string; expiresAt: number }>();
const LINK_TTL_MS = 30 * 60 * 1000;

export function createLinkToken(userId: string): string {
  // Eskirganlarini tozalab turamiz
  const now = Date.now();
  for (const [k, v] of linkTokens) {
    if (v.expiresAt < now) linkTokens.delete(k);
  }
  const token = crypto.randomBytes(24).toString("base64url"); // 32 belgi, [A-Za-z0-9_-]
  linkTokens.set(token, { userId, expiresAt: now + LINK_TTL_MS });
  return token;
}

function verifyLinkToken(token: string): string | null {
  const entry = linkTokens.get(token);
  if (!entry) return null;
  linkTokens.delete(token); // bir martalik
  if (entry.expiresAt < Date.now()) return null;
  return entry.userId;
}

/**
 * Telegram orqali KIRISH oqimi: sayt token yaratadi -> foydalanuvchi botda
 * /start lg<token> bosadi -> bot chatId bo'yicha bog'langan hisobni topib
 * tokenni tasdiqlaydi -> brauzer polling bilan natijani oladi.
 */
type LoginEntry = {
  status: "pending" | "confirmed" | "not_linked";
  userId?: string;
  expiresAt: number;
};
const loginTokens = new Map<string, LoginEntry>();
const LOGIN_TTL_MS = 5 * 60 * 1000;
const LOGIN_PREFIX = "lg"; // deep-link payload: "lg" + 32 belgi = 34 (limit 64) ✓

export function createLoginToken(): { token: string; payload: string } {
  const now = Date.now();
  for (const [k, v] of loginTokens) {
    if (v.expiresAt < now) loginTokens.delete(k);
  }
  const token = crypto.randomBytes(24).toString("base64url");
  loginTokens.set(token, { status: "pending", expiresAt: now + LOGIN_TTL_MS });
  return { token, payload: `${LOGIN_PREFIX}${token}` };
}

/** Polling: natija tayyor bo'lsa BIR MARTA beriladi (token o'chadi). */
export function consumeLoginToken(token: string): LoginEntry | null {
  const entry = loginTokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    loginTokens.delete(token);
    return null;
  }
  if (entry.status !== "pending") loginTokens.delete(token);
  return entry;
}

async function handleLoginStart(chatId: string, token: string) {
  const entry = loginTokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    await sendTelegramMessage(chatId, "⚠️ Kirish havolasi eskirgan. Saytdan qaytadan urinib ko'ring.");
    return;
  }
  const user = await prisma.user.findFirst({ where: { telegramChatId: chatId } });
  if (!user) {
    entry.status = "not_linked";
    await sendTelegramMessage(
      chatId,
      "⚠️ Bu Telegram hisob saytdagi hisobga bog'lanmagan.\n\n" +
        "Avval saytga email/parol bilan kirib, profil sahifasida «Telegram orqali tasdiqlash» tugmasini bosing — keyin Telegram orqali kira olasiz."
    );
    return;
  }
  entry.status = "confirmed";
  entry.userId = user.id;
  await sendTelegramMessage(chatId, "✅ Kirish tasdiqlandi! Brauzerga qayting — sayt sizni avtomatik kiritadi.");
}

export function getBotUsername(): string | null {
  return botUsername;
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
// Update ishlovchilari
// ---------------------------------------------------------

interface TgUser {
  id: number;
  first_name?: string;
}
interface TgMessage {
  message_id: number;
  from?: TgUser;
  chat: { id: number };
  text?: string;
  contact?: { phone_number: string; user_id?: number };
  reply_to_message?: TgMessage;
}
interface TgUpdate {
  update_id: number;
  message?: TgMessage;
}

const CONTACT_KEYBOARD = {
  reply_markup: {
    keyboard: [[{ text: "📱 Telefon raqamni ulashish", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};
const REMOVE_KEYBOARD = { reply_markup: { remove_keyboard: true } };

async function handleStart(msg: TgMessage, payload: string) {
  const chatId = String(msg.chat.id);

  // Kirish oqimi (saytdan "Telegram orqali kirish"). Xaritada borligini ham
  // tekshiramiz — oddiy bog'lash tokeni tasodifan "lg" bilan boshlanishi mumkin.
  if (payload.startsWith(LOGIN_PREFIX) && loginTokens.has(payload.slice(LOGIN_PREFIX.length))) {
    return handleLoginStart(chatId, payload.slice(LOGIN_PREFIX.length));
  }

  if (!payload) {
    await sendTelegramMessage(
      chatId,
      "👋 <b>ISH BOR!</b> botiga xush kelibsiz.\n\n" +
        "• Hisobingizni bog'lash uchun saytdagi profil sahifasidan <b>«Telegram orqali tasdiqlash»</b> tugmasini bosing.\n" +
        "• Savolingiz bo'lsa — shu yerga yozing, support jamoasi javob beradi."
    );
    return;
  }

  const userId = verifyLinkToken(payload);
  if (!userId) {
    await sendTelegramMessage(chatId, "⚠️ Havola eskirgan. Saytdan qaytadan urinib ko'ring.");
    return;
  }

  // Bu chat boshqa hisobga ulangan bo'lsa — eski bog'lanishni uzamiz
  await prisma.user.updateMany({
    where: { telegramChatId: chatId, id: { not: userId } },
    data: { telegramChatId: null },
  });
  await prisma.user.update({ where: { id: userId }, data: { telegramChatId: chatId } });

  await sendTelegramMessage(
    chatId,
    "✅ Hisobingiz bog'landi! Endi saytdagi yangi xabarlar shu yerga keladi.\n\n" +
      "Telefon raqamingizni tasdiqlash uchun quyidagi tugmani bosing:",
    CONTACT_KEYBOARD
  );
}

async function handleContact(msg: TgMessage) {
  const chatId = String(msg.chat.id);
  const contact = msg.contact!;

  // Faqat O'ZINING kontakti qabul qilinadi (boshqa odamnikini yuborib bo'lmaydi)
  if (!msg.from || contact.user_id !== msg.from.id) {
    await sendTelegramMessage(chatId, "⚠️ Iltimos, tugma orqali o'z raqamingizni ulashing.");
    return;
  }

  const user = await prisma.user.findFirst({ where: { telegramChatId: chatId } });
  if (!user) {
    await sendTelegramMessage(chatId, "⚠️ Avval saytdan hisobingizni bog'lang (profil sahifasida).");
    return;
  }

  const phone = `+${contact.phone_number.replace(/\D/g, "")}`;
  await prisma.user.update({
    where: { id: user.id },
    data: { phone, isPhoneVerified: true },
  });

  await sendTelegramMessage(
    chatId,
    `✅ Telefon raqamingiz tasdiqlandi: <b>${phone}</b>\nSaytdagi profilingizda «Tasdiqlangan» belgisi paydo bo'ldi.`,
    REMOVE_KEYBOARD
  );
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

  const user = await prisma.user.findFirst({ where: { telegramChatId: chatId } });
  const who = user
    ? `${user.email} (${user.role})`
    : `${msg.from?.first_name ?? "Noma'lum"} (saytga bog'lanmagan)`;

  await sendTelegramMessage(
    admin,
    `🛟 <b>Support xabari</b>\nKimdan: ${tgEscape(who)}\n#u${chatId}\n\n${tgEscape(msg.text ?? "")}`
  );
  await sendTelegramMessage(chatId, "🛟 Xabaringiz qabul qilindi — tez orada javob beramiz.");
}

/** Admin support xabariga reply qilsa — javob foydalanuvchiga qaytadi. */
async function handleAdminReply(msg: TgMessage) {
  const repliedText = msg.reply_to_message?.text ?? "";
  const match = repliedText.match(/#u(-?\d+)/);
  if (!match) {
    await sendTelegramMessage(msg.chat.id, "⚠️ Javob yuborish uchun support xabariga reply qiling.");
    return;
  }
  await sendTelegramMessage(match[1], `🛟 <b>Support javobi:</b>\n\n${tgEscape(msg.text ?? "")}`);
  await sendTelegramMessage(msg.chat.id, "✅ Javob yuborildi.");
}

async function handleUpdate(update: TgUpdate) {
  const msg = update.message;
  if (!msg) return;
  const chatId = String(msg.chat.id);
  const text = msg.text ?? "";

  if (msg.contact) return handleContact(msg);

  if (text.startsWith("/start")) return handleStart(msg, text.slice(6).trim());
  if (text === "/myid" || text === "/id") {
    return sendTelegramMessage(
      chatId,
      `🆔 Chat ID: <code>${chatId}</code>\nAdmin bo'lsangiz — buni .env dagi TELEGRAM_ADMIN_CHAT_ID ga qo'ying.`
    );
  }

  // Admin reply -> foydalanuvchiga relay
  if (env.TELEGRAM_ADMIN_CHAT_ID && chatId === env.TELEGRAM_ADMIN_CHAT_ID && msg.reply_to_message) {
    return handleAdminReply(msg);
  }

  // Oddiy matn -> support
  if (text) return handleSupport(msg);
}

// ---------------------------------------------------------
// Long-polling
// ---------------------------------------------------------

export async function startTelegramBot(log?: typeof logger) {
  if (log) logger = log;
  if (!env.TELEGRAM_BOT_TOKEN) {
    logger.info({}, "TELEGRAM_BOT_TOKEN yo'q — bot ishga tushirilmadi");
    return;
  }

  const me = await tg<{ username: string }>("getMe");
  if (!me) {
    logger.warn({}, "Telegram bot token yaroqsiz yoki tarmoq xatosi — bot o'chiq");
    return;
  }
  botUsername = me.username;
  logger.info({ username: me.username }, "Telegram bot ishga tushdi (long-polling)");

  let offset = 0;
  // Fon sikli — server bilan birga yashaydi
  void (async () => {
    for (;;) {
      const updates = await tg<TgUpdate[]>("getUpdates", {
        offset,
        timeout: 25,
        allowed_updates: ["message"],
      });
      if (!updates) {
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      for (const u of updates) {
        offset = u.update_id + 1;
        try {
          await handleUpdate(u);
        } catch (e) {
          logger.warn({ err: String(e) }, "Telegram update xatosi");
        }
      }
    }
  })();
}
