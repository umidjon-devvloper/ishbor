import type { NotificationType } from "../types.js";

/** Backend `NotificationType` enum'i (Prisma). */
export const NOTIFICATION_TYPES: readonly NotificationType[] = ["new_application", "application_status_changed", "new_vacancy_match", "system"];

/**
 * UI kategoriyasi — faqat backend turidan (yangi tur o'ylab topilmaydi):
 * ariza holati, obuna bo'yicha yangi vakansiya, tizim, ish beruvchiga yangi ariza.
 * Noma'lum tur (backend kelajakda qo'shsa) — "other", kategoriya belgisi chizilmaydi.
 */
export type NotificationCategory = "application" | "vacancy" | "system" | "applicant" | "other";
export const CATEGORY_ORDER: NotificationCategory[] = ["application", "vacancy", "system", "applicant", "other"];

const CATEGORY_OF: Record<NotificationType, NotificationCategory> = {
  application_status_changed: "application",
  new_vacancy_match: "vacancy",
  system: "system",
  new_application: "applicant",
};

/** Havola qayerga olib borishi — tugma matni shundan tanlanadi. */
export type NotificationTarget =
  | "applications"
  | "vacancy"
  | "vacancies"
  | "company"
  | "companies"
  | "profile"
  | "article"
  | "messages"
  | "alerts"
  | "pricing"
  | "employer"
  | "admin"
  | "page";

export interface NotificationView {
  id: string;
  type: NotificationType | null;
  category: NotificationCategory;
  title: string | null;
  body: string | null;
  /** Faqat sayt ichidagi nisbiy yo'l; yo'q bo'lsa havola tugmasi chizilmaydi. */
  url: string | null;
  target: NotificationTarget | null;
  isRead: boolean;
  createdAt: string | null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isoDate(value: unknown): string | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** Sayt ichidagi yo'l: "/…". "//host" va "/\host" — boshqa saytga olib ketadi, rad etiladi. */
export function safeInternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) return null;
  return url;
}

export function targetOf(url: string): NotificationTarget {
  const path = url.split(/[?#]/)[0];
  if (path === "/applications" || path.startsWith("/applications/")) return "applications";
  if (/^\/vacancies\/[^/]+/.test(path)) return "vacancy";
  if (path === "/vacancies") return "vacancies";
  if (/^\/companies\/[^/]+/.test(path)) return "company";
  if (path === "/companies") return "companies";
  if (path.startsWith("/profile")) return "profile";
  if (path.startsWith("/article")) return "article";
  if (path.startsWith("/messages")) return "messages";
  if (path.startsWith("/alerts")) return "alerts";
  if (path.startsWith("/pricing")) return "pricing";
  if (path.startsWith("/employer")) return "employer";
  if (path.startsWith("/admin")) return "admin";
  return "page";
}

/**
 * `GET /api/notifications` qatori → `NotificationView`. Bo'sh qator/`null`/noma'lum
 * tur normallashtiriladi; sarlavhasi ham, matni ham yo'q qator tashlab yuboriladi.
 * `isRead` aniq `false` bo'lmasa — o'qilgan (soxta "o'qilmagan" chizilmaydi).
 */
export function mapNotificationToViewModel(raw: unknown): NotificationView | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = text(r.id);
  if (!id) return null;
  const title = text(r.title);
  const body = text(r.body);
  if (!title && !body) return null;
  const type = typeof r.type === "string" && (NOTIFICATION_TYPES as readonly string[]).includes(r.type) ? (r.type as NotificationType) : null;
  const url = safeInternalUrl(r.url);
  return {
    id,
    type,
    category: type ? CATEGORY_OF[type] : "other",
    title,
    body,
    url,
    target: url ? targetOf(url) : null,
    isRead: r.isRead !== false,
    createdAt: isoDate(r.createdAt),
  };
}

/** Ish izlovchiga ish beruvchi/admin sahifasiga havola ko'rsatilmaydi (ochilmaydi). */
export function canOpenTarget(target: NotificationTarget | null, role: string | null): boolean {
  if (!target) return false;
  if (target === "admin") return role === "admin";
  if (target === "employer") return role === "employer" || role === "admin";
  return true;
}
