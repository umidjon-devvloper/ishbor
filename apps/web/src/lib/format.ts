import type { Messages } from "./i18n/messages.js";

const numberFmt = new Intl.NumberFormat("ru-RU");

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

/** Maoshni joriy tilga mos formatlaydi. */
export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  fmt: Messages["fmt"],
  isHidden = false
): string {
  if (isHidden || (!min && !max)) return fmt.salaryHidden;
  const f = (n: number) => numberFmt.format(n);
  if (min && max) return fmt.salaryRange(f(min), f(max));
  if (min) return fmt.salaryFrom(f(min));
  return fmt.salaryTo(f(max!));
}

/**
 * Brauzerlarning ko'pchiligida (Chrome ICU) o'zbekcha oy nomlari yo'q —
 * `Intl` "2026 M09 07" ga tushib qoladi, Node esa "07-sen, 2026" beradi va
 * SSR sahifada hydration xatosi chiqadi. Shuning uchun o'zbekcha nomlar qo'lda.
 */
export const UZ_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

const DATE_TAG: Record<string, string> = { uz: "uz-Latn-UZ", ru: "ru-RU", en: "en-US" };
// Server (UTC) va brauzer bir xil kunni ko'rsatsin
const TIME_ZONE = "Asia/Tashkent";

/** ISO sana -> "07 sen 2026" / "07 сент. 2026 г." / "Sep 07, 2026". */
export function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (locale === "uz") {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, day: "2-digit", month: "numeric", year: "numeric" }).formatToParts(date);
    const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return `${part("day")} ${UZ_MONTHS[Number(part("month")) - 1]} ${part("year")}`;
  }
  return date.toLocaleDateString(DATE_TAG[locale] ?? locale, { timeZone: TIME_ZONE, day: "2-digit", month: "short", year: "numeric" });
}

/** ISO sanadan «Bugun / Kecha / N kun oldin» (joriy tilda). */
export function formatRelativeDays(publishedAt: string | null, fmt: Messages["fmt"]): string {
  if (!publishedAt) return "";
  const diff = Date.now() - new Date(publishedAt).getTime();
  const days = Math.max(0, Math.floor(diff / 86_400_000));
  if (days === 0) return fmt.today;
  if (days === 1) return fmt.yesterday;
  return fmt.daysAgo(days);
}
