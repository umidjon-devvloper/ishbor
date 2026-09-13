import { prisma } from "../../common/prisma.js";
import { env } from "../../common/env.js";
import { escapeHtml } from "../../common/mailer.js";
import { notify } from "../notifications/notifications.service.js";
import { listVacancies, type VacancyListQuery } from "../vacancies/vacancies.service.js";

/**
 * Saqlangan qidiruv bo'yicha xabarnoma ("bu so'rov bo'yicha yangi vakansiya
 * chiqsa menga xabar bering").
 *
 * Ishlash tartibi: har `ALERTS_INTERVAL_MINUTES` daqiqada barcha obunalar
 * ko'rib chiqiladi. Har biri uchun oxirgi xabardan keyin **chop etilgan**
 * vakansiyalar qidiriladi; topilsa foydalanuvchiga bitta yig'ma bildirishnoma
 * boradi va `lastNotifiedAt` yangilanadi.
 *
 * `frequency`:
 *   instant — har tekshiruvda yuboriladi
 *   daily   — oxirgi xabardan kamida 20 soat o'tgan bo'lsa
 */

const DAILY_GAP_MS = 20 * 60 * 60 * 1000;
/** Bir xabarnomada nechta vakansiya nomi ko'rsatiladi. */
const PREVIEW_COUNT = 5;

export interface SavedSearchParams {
  text?: string;
  categorySlug?: string;
  /** Vergul bilan bir nechta bo'lishi mumkin (area, experience, employment, company). */
  area?: string;
  experience?: string;
  employment?: string;
  salary?: number;
  salaryTo?: number;
  company?: string;
  verified?: boolean;
  premium?: boolean;
}

/** API enum → sayt URL'idagi o'qiladigan qiymat (apps/web/src/lib/vacancies/query.ts bilan bir xil). */
const EXPERIENCE_URL: Record<string, string> = { none: "junior", one_to_three: "middle", three_to_six: "senior", six_plus: "lead" };
const EMPLOYMENT_URL: Record<string, string> = { full_time: "full-time", part_time: "part-time", remote: "remote", shift: "shift" };

/** Json ustunidan qidiruv parametrlarini xavfsiz o'qiydi. */
export function parseQueryParams(value: unknown): SavedSearchParams {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  const str = (k: string) => (typeof raw[k] === "string" && raw[k] ? String(raw[k]) : undefined);
  const num = (k: string) => {
    const n = Number(raw[k]);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  return {
    text: str("text"),
    categorySlug: str("categorySlug"),
    area: str("area"),
    experience: str("experience"),
    employment: str("employment"),
    salary: num("salary"),
    salaryTo: num("salaryTo"),
    company: str("company"),
    verified: raw.verified === true ? true : undefined,
    premium: raw.premium === true ? true : undefined,
  };
}

/** Saqlangan qidiruvni sayt URL'iga aylantiradi (xabarnomadagi havola uchun): `/vacancies?q=&region=…`. */
export function paramsToUrl(params: SavedSearchParams): string {
  const qs = new URLSearchParams();
  const list = (value: string | undefined, map?: Record<string, string>) =>
    (value ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => map?.[v] ?? v)
      .join(",");
  if (params.text) qs.set("q", params.text);
  if (params.categorySlug) qs.set("category", params.categorySlug);
  if (params.area) qs.set("region", list(params.area));
  if (params.employment) qs.set("workType", list(params.employment, EMPLOYMENT_URL));
  if (params.experience) qs.set("experience", list(params.experience, EXPERIENCE_URL));
  if (params.salary) qs.set("salaryFrom", String(params.salary));
  if (params.salaryTo) qs.set("salaryTo", String(params.salaryTo));
  if (params.company) qs.set("company", list(params.company));
  if (params.verified) qs.set("verified", "1");
  if (params.premium) qs.set("premium", "1");
  const str = qs.toString();
  return str ? `/vacancies?${str}` : "/vacancies";
}

interface SweepResult {
  checked: number;
  notified: number;
  matched: number;
}

/**
 * Bir marta to'liq aylanib chiqadi. Qo'lda ham chaqirsa bo'ladi
 * (admin paneldagi "obunalarni hozir tekshirish" tugmasi).
 */
export async function runAlertSweep(): Promise<SweepResult> {
  const now = new Date();
  const searches = await prisma.savedSearch.findMany({
    where: { emailAlertsEnabled: true },
    include: { user: { select: { id: true, isBlocked: true } } },
  });

  let notified = 0;
  let matched = 0;

  for (const search of searches) {
    if (search.user.isBlocked) continue;

    // Kunlik obuna — kuniga bir marta
    if (
      search.frequency === "daily" &&
      search.lastNotifiedAt &&
      now.getTime() - search.lastNotifiedAt.getTime() < DAILY_GAP_MS
    ) {
      continue;
    }

    // Birinchi tekshiruvda eski bazani "yangilik" deb yubormaymiz —
    // faqat vaqt belgisini qo'yamiz va keyingi safardan boshlab kuzatamiz.
    if (!search.lastNotifiedAt) {
      await prisma.savedSearch.update({
        where: { id: search.id },
        data: { lastNotifiedAt: now },
      });
      continue;
    }

    const params = parseQueryParams(search.queryParams);
    const query: VacancyListQuery = { ...params, sort: "date", page: 1, pageSize: 20 };
    const { items } = await listVacancies(query);

    const fresh = (items as { id: string; title: string; slug: string; publishedAt: Date | null }[])
      .filter((v) => v.publishedAt && v.publishedAt > search.lastNotifiedAt!);

    await prisma.savedSearch.update({
      where: { id: search.id },
      data: { lastNotifiedAt: now },
    });

    if (fresh.length === 0) continue;

    matched += fresh.length;
    notified += 1;

    const preview = fresh.slice(0, PREVIEW_COUNT);
    const listHtml = preview
      .map(
        (v) =>
          `<li style="margin:0 0 6px"><a href="${env.WEB_ORIGIN}/vacancies/${encodeURIComponent(
            v.slug
          )}" style="color:#1f6feb;text-decoration:none">${escapeHtml(v.title)}</a></li>`
      )
      .join("");
    const more =
      fresh.length > preview.length
        ? `<p style="margin:10px 0 0;color:#6b7280">...va yana ${fresh.length - preview.length} ta</p>`
        : "";

    await notify({
      userId: search.userId,
      type: "new_vacancy_match",
      title: `"${search.name}" bo'yicha ${fresh.length} ta yangi vakansiya`,
      body: preview.map((v) => v.title).join(", "),
      url: paramsToUrl(params),
      payload: { savedSearchId: search.id, count: fresh.length },
      ctaLabel: "Barchasini ko'rish",
      emailHtml: `<p style="margin:0 0 12px">Siz obuna bo'lgan <b>${escapeHtml(
        search.name
      )}</b> so'rovi bo'yicha yangi vakansiyalar chiqdi:</p>
        <ul style="margin:0;padding-left:18px">${listHtml}</ul>${more}`,
    }).catch(() => undefined);
  }

  return { checked: searches.length, notified, matched };
}

let timer: NodeJS.Timeout | null = null;

/** Rejalashtirilgan tekshiruvni yoqadi (server ko'tarilganda chaqiriladi). */
export function startAlertScheduler(log?: { info: (o: unknown, m?: string) => void }): void {
  if (timer) return;
  const intervalMs = Math.max(env.ALERTS_INTERVAL_MINUTES, 1) * 60 * 1000;

  const tick = async () => {
    try {
      const result = await runAlertSweep();
      if (result.notified > 0) {
        log?.info(result, "Obuna xabarnomalari yuborildi");
      }
    } catch (e) {
      console.warn("[alerts] tekshiruv xatosi:", (e as Error).message);
    }
  };

  // Server ko'tarilishini kutamiz (birinchi tekshiruv 1 daqiqadan keyin)
  setTimeout(tick, 60_000).unref?.();
  timer = setInterval(tick, intervalMs);
  timer.unref?.();
}
