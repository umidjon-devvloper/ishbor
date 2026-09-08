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

/** ISO sanadan «Bugun / Kecha / N kun oldin» (joriy tilda). */
export function formatRelativeDays(publishedAt: string | null, fmt: Messages["fmt"]): string {
  if (!publishedAt) return "";
  const diff = Date.now() - new Date(publishedAt).getTime();
  const days = Math.max(0, Math.floor(diff / 86_400_000));
  if (days === 0) return fmt.today;
  if (days === 1) return fmt.yesterday;
  return fmt.daysAgo(days);
}
