// Real backend bilan ishlovchi data qatlami — faqat haqiqiy API'dan o'qiydi
// (namunaviy/mock ma'lumot ishlatilmaydi). Server o'chiq bo'lsa bo'sh natija qaytadi.
import { extractSkills } from "./vacancies/skills.js";
import { mapVacancyToViewModel, type VacancyDetailVM } from "./vacancies/detail.js";
import { mapCompanyToViewModel, type CompanyDetailVM } from "./companies/detail.js";
import type {
  Vacancy,
  VacancyFacets,
  VacancyPage,
  Company,
  Article,
  Stats,
  CurrentUser,
  Profile,
  ProfileUpdate,
  Region,
  ResumeData,
  ResumeInput,
  MyCompany,
  MyCompanyInput,
  Category,
  EmployerVacancy,
  VacancyCreateInput,
  EmployerApplication,
  Conversation,
  ChatMessage,
  ApplicationStatus,
  InboxSummary,
  MyApplication,
  Candidate,
  CompanyReviewItem,
  TelegramStatus,
  ConversationRating,
  UserSummary,
  SubscriptionState,
} from "./types.js";

const EMPTY_STATS: Stats = { vacancies: 0, companies: 0, applicationsToday: 0 };

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** WebSocket manzili (http -> ws). */
export const WS_URL = API_URL.replace(/^http/i, "ws");

/** "/uploads/x.png" kabi nisbiy yo'lni API origin'iga to'liq URL qiladi. */
export function absoluteUploadUrl(path: string): string {
  return path.startsWith("/") ? `${API_URL}${path}` : path;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Ulanish xatosida null qaytaradi (server o'chiq bo'lsa ham sayt ishlashi uchun). */
async function tryFetch(path: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------
// Auth
// ---------------------------------------------------------

async function authRequest<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Bo'sh tanali POST'da ham "{}" yuboramiz — Fastify application/json parseri
    // bo'sh tanani 400 bilan rad etadi (handler ishlamaydi, cookie tozalanmaydi).
    body: body === undefined ? "{}" : JSON.stringify(body),
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? "Kutilmagan xatolik yuz berdi", data?.error);
  }
  return data as T;
}

export interface AuthResponse {
  accessToken: string;
}

export function registerUser(input: {
  email: string;
  password: string;
  role: "job_seeker" | "employer";
  firstName?: string;
  lastName?: string;
  companyName?: string;
}) {
  return authRequest<AuthResponse>("/api/auth/register", input);
}

export async function submitSupport(input: { name?: string; email?: string; message: string }): Promise<void> {
  const res = await fetch(`${API_URL}/api/support`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
}

export function loginUser(input: { email: string; password: string }) {
  return authRequest<AuthResponse>("/api/auth/login", input);
}

export function logoutUser() {
  return authRequest<{ ok: true }>("/api/auth/logout", undefined);
}

// --- Ijtimoiy kirish -------------------------------------

/** Google ID token bilan kirish (rol berilsa — hisob yo'q bo'lsa yaratiladi). */
export function loginWithGoogle(credential: string, role?: "job_seeker" | "employer") {
  return authRequest<AuthResponse>("/api/auth/google", { credential, ...(role ? { role } : {}) });
}

/** Telegram kirishni boshlaydi: bot deep-link + polling tokeni. */
export function startTelegramLogin() {
  return authRequest<{ token: string; link: string }>("/api/auth/telegram/start", undefined);
}

export type TelegramLoginPoll =
  | { status: "pending" }
  | { status: "expired" }
  | { status: "not_linked" }
  | { status: "ok"; accessToken: string };

export function pollTelegramLogin(token: string) {
  return authRequest<TelegramLoginPoll>("/api/auth/telegram/poll", { token });
}

/** httpOnly refresh cookie orqali yangi access token oladi (muddati tugaganda). */
export async function refreshAccessToken(): Promise<string | null> {
  const res = await tryFetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res || !res.ok) return null;
  const json = await res.json().catch(() => null);
  return (json?.accessToken as string) ?? null;
}

export async function fetchMe(token: string): Promise<CurrentUser | null> {
  const res = await tryFetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
  if (!res || !res.ok) return null;
  return (await res.json()) as CurrentUser;
}

export interface AppliedApplication {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
}

/** Ariza yuboradi. Oldin yuborilgan bo'lsa backend o'sha arizani (haqiqiy holati bilan) qaytaradi. */
export function applyToVacancy(vacancyId: string, token: string): Promise<AppliedApplication> {
  return authRequest<AppliedApplication>(`/api/vacancies/${vacancyId}/apply`, { source: "site" }, token);
}

// ---------------------------------------------------------
// Mapperlar (Prisma JSON -> frontend tiplari)
// ---------------------------------------------------------

function avgRating(reviews: unknown): { rating: number; count: number } {
  const list = Array.isArray(reviews) ? (reviews as { rating: number }[]) : [];
  if (list.length === 0) return { rating: 0, count: 0 };
  const sum = list.reduce((s, r) => s + (r.rating ?? 0), 0);
  return { rating: Math.round((sum / list.length) * 10) / 10, count: list.length };
}

function mapVacancy(raw: any, companyFallback?: { name: string; slug: string }): Vacancy {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    companyName: raw.company?.name ?? companyFallback?.name ?? "",
    companySlug: raw.company?.slug ?? companyFallback?.slug ?? "",
    regionName: raw.region?.name ?? null,
    salaryMin: raw.salaryMin ?? null,
    salaryMax: raw.salaryMax ?? null,
    currency: raw.currency ?? "UZS",
    isSalaryHidden: raw.isSalaryHidden ?? false,
    employmentType: raw.employmentType ?? "full_time",
    experienceRequired: raw.experienceRequired ?? "none",
    isPremium: raw.isPremium ?? false,
    isUrgent: raw.isUrgent ?? false,
    publishedAt: raw.publishedAt ?? null,
    companyLogoUrl: raw.company?.logoUrl ? absoluteUploadUrl(raw.company.logoUrl) : null,
    companyVerified: Boolean(raw.company?.isVerified),
    regionSlug: raw.region?.slug ?? null,
    categoryName: raw.category?.name ?? null,
    scheduleType: raw.scheduleType ?? null,
    skills: extractSkills(`${raw.title ?? ""}\n${raw.requirements ?? ""}`),
  };
}

function mapCompany(raw: any): Company {
  // Katalog (`GET /api/companies`) ko'rsatkichlarni serverda hisoblab beradi;
  // kompaniya sahifasi (`/api/companies/:slug`) esa sharh va vakansiyalar ro'yxatini.
  const fromList = typeof raw.reviewCount === "number";
  const { rating, count } = fromList ? { rating: raw.rating ?? 0, count: raw.reviewCount } : avgRating(raw.reviews);
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? "",
    logoUrl: raw.logoUrl ? absoluteUploadUrl(raw.logoUrl) : null,
    regionName: raw.region?.name ?? null,
    industry: raw.industry ?? null,
    employeeCount: raw.employeeCount ?? null,
    foundedYear: raw.foundedYear ?? null,
    rating,
    reviewCount: count,
    isVerified: raw.isVerified ?? false,
    activeVacancyCount: fromList
      ? raw.activeVacancyCount ?? 0
      : Array.isArray(raw.vacancies)
        ? raw.vacancies.length
        : 0,
  };
}

function mapReview(raw: any): CompanyReviewItem {
  const p = raw.user?.jobSeekerProfile;
  const authorName = [p?.firstName, p?.lastName].filter(Boolean).join(" ") || "Nomzod";
  return {
    id: raw.id,
    rating: raw.rating,
    comment: raw.comment ?? null,
    createdAt: raw.createdAt,
    authorName,
    userId: raw.userId,
  };
}

function mapArticle(raw: any): Article {
  const content: string = raw.content ?? "";
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const excerpt =
    raw.metaDescription ?? (content.length > 160 ? `${content.slice(0, 157)}...` : content);
  return {
    slug: raw.slug,
    title: raw.title,
    excerpt,
    readMinutes: Math.max(1, Math.round(words / 180)),
  };
}

// ---------------------------------------------------------
// Vakansiyalar
// ---------------------------------------------------------

export interface VacancyQuery {
  text?: string;
  categorySlug?: string;
  area?: string;
  experience?: string;
  employment?: string;
  salary?: string;
  salaryTo?: string;
  /** Saralash: mosligi (default), sana yoki maosh bo'yicha. */
  sort?: "relevance" | "date" | "salary_desc" | "salary_asc";
}

function buildQuery(params: VacancyQuery): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export async function fetchVacancies(
  params: VacancyQuery = {}
): Promise<{ items: Vacancy[]; total: number }> {
  const res = await tryFetch(`/api/vacancies${buildQuery(params)}`);
  if (!res || !res.ok) return { items: [], total: 0 };
  const json = await res.json();
  const items: Vacancy[] = (json.items ?? []).map((v: any) => mapVacancy(v));
  return { items, total: json.total ?? items.length };
}

/**
 * `/vacancies` sahifasining bitta sahifasi. `params` — API nomlaridagi
 * parametrlar (lib/vacancies/query.ts → toApiParams). "Natija yo'q" va
 * "yuklab bo'lmadi" farqlanadi: xatoda `ApiError` (tarmoq uzilsa status 0),
 * bekor qilinsa AbortError.
 */
export async function fetchVacancyPage(params: URLSearchParams, signal?: AbortSignal): Promise<VacancyPage> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/vacancies?${params}`, { signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    throw new ApiError(0, "Serverga ulanib bo'lmadi");
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) throw new ApiError(res.status, json?.message ?? "Kutilmagan xatolik", json?.error);
  const items: Vacancy[] = (json.items ?? []).map((v: any) => mapVacancy(v));
  return {
    items,
    total: json.total ?? items.length,
    page: json.page ?? 1,
    pageSize: json.pageSize ?? items.length,
    pageCount: json.pageCount ?? 1,
  };
}

/** Filtr paneli sonlari. Ikkinchi darajali ma'lumot — xatoda `null` (panel sonlarsiz ishlaydi). */
export async function fetchVacancyFacets(params: URLSearchParams, signal?: AbortSignal): Promise<VacancyFacets | null> {
  try {
    const res = await fetch(`${API_URL}/api/vacancies/facets?${params}`, { signal });
    if (!res.ok) return null;
    return (await res.json()) as VacancyFacets;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    return null;
  }
}

/**
 * Detail sahifasi uchun vakansiya (view-model, lib/vacancies/detail.ts).
 * Topilmasa `null` (404); boshqa xatoda `ApiError` (tarmoq uzilsa status 0) —
 * sahifa "topilmadi" va "yuklab bo'lmadi" holatlarini farqlaydi.
 */
export async function fetchVacancyDetail(slug: string, signal?: AbortSignal): Promise<VacancyDetailVM | null> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/vacancies/${encodeURIComponent(slug)}`, { signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    throw new ApiError(0, "Serverga ulanib bo'lmadi");
  }
  if (res.status === 404) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) throw new ApiError(res.status, json?.message ?? "Kutilmagan xatolik", json?.error);
  return mapVacancyToViewModel(json, absoluteUploadUrl);
}

/** "O'xshash vakansiyalar" — ikkinchi darajali blok: xatoda bo'sh ro'yxat (blok yashiriladi). */
export async function fetchSimilarVacancies(slug: string, limit = 4, signal?: AbortSignal): Promise<Vacancy[]> {
  try {
    const res = await fetch(`${API_URL}/api/vacancies/${encodeURIComponent(slug)}/similar?limit=${limit}`, { signal });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.items ?? []).map((v: any) => mapVacancy(v));
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    return [];
  }
}

// ---------------------------------------------------------
// Kompaniyalar
// ---------------------------------------------------------

/** Qisqa ro'yxat (bosh sahifa bloklari uchun) — mashhurlik bo'yicha birinchi `limit` ta. */
export async function fetchCompanies(text?: string, limit = 12): Promise<Company[]> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (text) qs.set("q", text);
  const res = await tryFetch(`/api/companies?${qs}`);
  if (!res || !res.ok) return [];
  const json = await res.json();
  return (json.items ?? []).map(mapCompany);
}

export interface CompanyPage {
  items: Company[];
  nextCursor: string | null;
  /** Faqat birinchi sahifada keladi. */
  total: number | null;
}

/**
 * Katalogning bitta sahifasi. `params` — URL holatidan yasalgan parametrlar
 * (lib/companies/query.ts). Xatoda `ApiError` uloqtiradi: sahifa bo'sh natija
 * bilan "yuklab bo'lmadi" holatini farqlashi kerak.
 */
export async function fetchCompanyPage(
  params: URLSearchParams,
  options: { cursor?: string | null; limit?: number; signal?: AbortSignal; token?: string | null } = {}
): Promise<CompanyPage> {
  const qs = new URLSearchParams(params);
  if (options.limit) qs.set("limit", String(options.limit));
  if (options.cursor) qs.set("cursor", options.cursor);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/companies?${qs}`, {
      signal: options.signal,
      headers: options.token ? { Authorization: `Bearer ${options.token}` } : undefined,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError(0, "Network error");
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Request failed", json?.error);
  return {
    items: (json?.items ?? []).map(mapCompany),
    nextCursor: json?.nextCursor ?? null,
    total: typeof json?.total === "number" ? json.total : null,
  };
}

/** "Top kompaniyalar": tasdiqlangan, hozir ishga olayotgan, mashhurlik bo'yicha. Xatoda — bo'sh (blok yashiriladi). */
export async function fetchFeaturedCompanies(limit = 10): Promise<Company[]> {
  try {
    const page = await fetchCompanyPage(new URLSearchParams({ verified: "1", hiring: "1" }), { limit });
    return page.items;
  } catch {
    return [];
  }
}

export async function fetchCompany(
  slug: string
): Promise<{ company: Company; vacancies: Vacancy[]; reviews: CompanyReviewItem[] } | null> {
  const res = await tryFetch(`/api/companies/${slug}`);
  if (!res || !res.ok) return null;
  const raw = await res.json();
  const company = mapCompany(raw);
  const vacancies: Vacancy[] = (raw.vacancies ?? []).map((v: any) =>
    mapVacancy(v, { name: company.name, slug: company.slug })
  );
  const reviews: CompanyReviewItem[] = (raw.reviews ?? []).map(mapReview);
  return { company, vacancies, reviews };
}

/**
 * Ochiq kompaniya sahifasi uchun (view-model, lib/companies/detail.ts).
 * Topilmasa `null` (404); boshqa xatoda `ApiError` (tarmoq uzilsa status 0).
 */
export async function fetchCompanyDetail(slug: string, signal?: AbortSignal): Promise<CompanyDetailVM | null> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/companies/${encodeURIComponent(slug)}`, { signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    throw new ApiError(0, "Serverga ulanib bo'lmadi");
  }
  if (res.status === 404) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) throw new ApiError(res.status, json?.message ?? "Kutilmagan xatolik", json?.error);
  const owner = { name: json.name, slug: json.slug, logoUrl: json.logoUrl ?? null, isVerified: json.isVerified ?? false };
  const vacancies: Vacancy[] = (json.vacancies ?? []).map((v: any) => mapVacancy({ ...v, company: v.company ?? owner }));
  return mapCompanyToViewModel(json, { resolveUrl: absoluteUploadUrl, vacancies });
}

/** "O'xshash kompaniyalar" — ikkinchi darajali blok: xatoda bo'sh ro'yxat (blok yashiriladi). */
export async function fetchSimilarCompanies(slug: string, limit = 5, signal?: AbortSignal): Promise<Company[]> {
  try {
    const res = await fetch(`${API_URL}/api/companies/${encodeURIComponent(slug)}/similar?limit=${limit}`, { signal });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.items ?? []).map(mapCompany);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    return [];
  }
}

export async function submitReview(
  token: string,
  slug: string,
  input: { rating: number; comment?: string }
): Promise<CompanyReviewItem> {
  const res = await fetch(`${API_URL}/api/companies/${slug}/reviews`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(input),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
  return json as CompanyReviewItem;
}

export async function deleteReview(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/reviews/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new ApiError(res.status, "Xatolik");
}

// ---------------------------------------------------------
// Maqolalar va statistika
// ---------------------------------------------------------

export async function fetchArticles(): Promise<Article[]> {
  const res = await tryFetch("/api/articles");
  if (!res || !res.ok) return [];
  const json = await res.json();
  return (json.items ?? []).map(mapArticle);
}

export async function fetchStats(): Promise<Stats> {
  const res = await tryFetch("/api/stats");
  if (!res || !res.ok) return EMPTY_STATS;
  return (await res.json()) as Stats;
}

// ---------------------------------------------------------
// Profil + hududlar
// ---------------------------------------------------------

export async function fetchRegions(): Promise<Region[]> {
  const res = await tryFetch("/api/regions");
  if (!res || !res.ok) return [];
  const json = await res.json();
  return (json.items ?? []) as Region[];
}

export async function fetchProfile(token: string): Promise<Profile | null> {
  const res = await tryFetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } });
  if (!res || !res.ok) return null;
  return (await res.json()) as Profile;
}

export async function updateProfile(token: string, data: ProfileUpdate): Promise<Profile> {
  const res = await fetch(`${API_URL}/api/profile`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
  return json as Profile;
}

// ---------------------------------------------------------
// Rezyume (saytda to'ldiriladi)
// ---------------------------------------------------------

export async function fetchResume(token: string): Promise<ResumeData | null> {
  const res = await tryFetch("/api/resume", { headers: { Authorization: `Bearer ${token}` } });
  if (!res || !res.ok) return null;
  const json = await res.json();
  return (json.resume ?? null) as ResumeData | null;
}

export async function saveResume(token: string, data: ResumeInput): Promise<ResumeData | null> {
  const res = await fetch(`${API_URL}/api/resume`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
  return (json?.resume ?? null) as ResumeData | null;
}

/** PDF rezyume yuklash — javobda fayl manzili (`/uploads/...`). */
export async function uploadResumeFile(token: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/profile/resume`, {
    method: "POST",
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
  return json.resumeUrl as string;
}

export async function deleteResumeFile(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/profile/resume`, {
    method: "DELETE",
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
  }
}

// ---------------------------------------------------------
// Nomzodning arizalari
// ---------------------------------------------------------

/**
 * Nomzodning o'z arizalari, eng yangisi birinchi.
 * Boshqa ro'yxat funksiyalaridan farqli o'laroq xatoni YASHIRMAYDI: profil
 * sahifasi "ariza yo'q" bilan "yuklab bo'lmadi"ni farqlab ko'rsatishi kerak.
 */
export async function fetchMyApplications(token: string): Promise<MyApplication[]> {
  const res = await tryFetch("/api/applications", { headers: authHeaders(token) });
  if (!res) throw new ApiError(0, "Network");
  if (!res.ok) throw new ApiError(res.status, "Xatolik");
  const rows = (await res.json()) as unknown;
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => row?.vacancy && APPLICATION_STATUSES.includes(row.status)).map(mapMyApplication);
}

const APPLICATION_STATUSES: ApplicationStatus[] = ["sent", "viewed", "invited", "rejected", "accepted"];
const EMPLOYMENT_TYPES = ["full_time", "part_time", "remote", "shift"] as const;
const EXPERIENCE_LEVELS = ["none", "one_to_three", "three_to_six", "six_plus"] as const;

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function positiveInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

/** Backend yozuvi -> `MyApplication`. Yo'q/yaroqsiz maydon `null` bo'ladi, to'qima qiymat qo'yilmaydi. */
function mapMyApplication(row: any): MyApplication {
  const vacancy = row.vacancy;
  const company = vacancy.company ?? {};
  const history = Array.isArray(row.statusHistory) ? row.statusHistory : [];
  return {
    id: String(row.id),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    source: row.source === "telegram" ? "telegram" : "site",
    coverLetter: text(row.coverLetter),
    resume: row.resume?.id && text(row.resume.title) ? { id: String(row.resume.id), title: text(row.resume.title)! } : null,
    history: history
      .filter((h: any) => APPLICATION_STATUSES.includes(h?.newStatus) && typeof h.createdAt === "string")
      .map((h: any) => ({ status: h.newStatus as ApplicationStatus, at: h.createdAt as string })),
    vacancy: {
      id: String(vacancy.id),
      slug: String(vacancy.slug),
      title: text(vacancy.title) ?? "",
      isClosed: vacancy.status !== "active",
      salaryMin: positiveInt(vacancy.salaryMin),
      salaryMax: positiveInt(vacancy.salaryMax),
      isSalaryHidden: vacancy.isSalaryHidden === true,
      employmentType: pick(vacancy.employmentType, EMPLOYMENT_TYPES),
      experienceRequired: pick(vacancy.experienceRequired, EXPERIENCE_LEVELS),
      regionSlug: text(vacancy.region?.slug),
      regionName: text(vacancy.region?.name),
    },
    company: {
      name: text(company.name) ?? "",
      slug: text(company.slug) ?? "",
      logoUrl: text(company.logoUrl),
      isVerified: company.isVerified === true,
    },
  };
}

// ---------------------------------------------------------
// Ish beruvchi kompaniyasi
// ---------------------------------------------------------

export async function fetchMyCompany(token: string): Promise<MyCompany | null> {
  const res = await tryFetch("/api/employer/company", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res || !res.ok) return null;
  const json = await res.json();
  return (json.company ?? null) as MyCompany | null;
}

/** Kompaniya logosini yuklaydi (PNG/JPG/WebP/SVG, maks 5MB). */
export async function uploadCompanyLogo(token: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/employer/company/logo`, {
    method: "POST",
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
  return json.logoUrl as string;
}

export async function deleteCompanyLogo(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/employer/company/logo`, {
    method: "DELETE",
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
  }
}

export async function saveMyCompany(token: string, data: MyCompanyInput): Promise<MyCompany> {
  const res = await fetch(`${API_URL}/api/employer/company`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
  return json.company as MyCompany;
}

// ---------------------------------------------------------
// Ish beruvchi: vakansiyalar va murojaatlar
// ---------------------------------------------------------

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function authGet<T>(path: string, token: string, fallback: T): Promise<T> {
  const res = await tryFetch(path, { headers: authHeaders(token) });
  if (!res || !res.ok) return fallback;
  return (await res.json()) as T;
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await tryFetch("/api/categories");
  if (!res || !res.ok) return [];
  return ((await res.json()).items ?? []) as Category[];
}

export async function fetchEmployerVacancies(token: string): Promise<EmployerVacancy[]> {
  return (await authGet<{ items: EmployerVacancy[] }>("/api/employer/vacancies", token, { items: [] })).items;
}

/**
 * Vakansiyalar + amaldagi tarif holati (limit sarfini ko'rsatish uchun).
 * Server ikkalasini bitta javobda beradi — qo'shimcha so'rov kerak emas.
 */
export async function fetchEmployerBoard(
  token: string
): Promise<{ items: EmployerVacancy[]; subscription: SubscriptionState | null }> {
  return authGet<{ items: EmployerVacancy[]; subscription: SubscriptionState | null }>(
    "/api/employer/vacancies",
    token,
    { items: [], subscription: null }
  );
}

/** Mavjud vakansiyani tahrirlaydi (faqat berilgan maydonlar yangilanadi). */
export async function updateVacancy(
  token: string,
  id: string,
  input: Partial<VacancyCreateInput>
) {
  const res = await fetch(`${API_URL}/api/vacancies/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(input),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
  return json;
}

export async function createVacancy(token: string, input: VacancyCreateInput) {
  const res = await fetch(`${API_URL}/api/vacancies`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(input),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
  return json;
}

export async function setVacancyStatus(token: string, id: string, status: "active" | "archived") {
  const res = await fetch(`${API_URL}/api/vacancies/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new ApiError(res.status, "Xatolik");
}

export async function deleteVacancy(token: string, id: string) {
  const res = await fetch(`${API_URL}/api/vacancies/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new ApiError(res.status, "Xatolik");
}

export async function fetchCandidates(token: string, text?: string): Promise<Candidate[]> {
  const qs = text ? `?text=${encodeURIComponent(text)}` : "";
  return (await authGet<{ items: Candidate[] }>(`/api/candidates${qs}`, token, { items: [] })).items;
}

export async function fetchEmployerApplications(token: string): Promise<EmployerApplication[]> {
  return (await authGet<{ items: EmployerApplication[] }>("/api/employer/applications", token, { items: [] })).items;
}

export async function setApplicationStatus(
  token: string,
  applicationId: string,
  status: "viewed" | "invited" | "rejected" | "accepted",
  reason?: string
) {
  const res = await fetch(`${API_URL}/api/applications/${applicationId}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(reason ? { status, reason } : { status }),
  });
  if (!res.ok) throw new ApiError(res.status, "Xatolik");
}

export async function fetchInboxSummary(token: string): Promise<InboxSummary> {
  return authGet<InboxSummary>("/api/inbox/summary", token, {
    unreadMessages: 0,
    newApplications: 0,
  });
}

// ---------------------------------------------------------
// Telegram (hisob bog'lash + telefon tasdiqlash)
// ---------------------------------------------------------

export async function fetchTelegramStatus(token: string): Promise<TelegramStatus> {
  return authGet<TelegramStatus>("/api/telegram/status", token, {
    linked: false,
    phoneVerified: false,
    phone: null,
    botUsername: null,
  });
}

export async function requestTelegramLink(token: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/telegram/link`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: "{}",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
  return json.link as string;
}

// ---------------------------------------------------------
// Chat
// ---------------------------------------------------------

export async function fetchConversations(token: string): Promise<Conversation[]> {
  return (await authGet<{ items: Conversation[] }>("/api/conversations", token, { items: [] })).items;
}

export async function fetchMessages(token: string, conversationId: string): Promise<ChatMessage[]> {
  return (
    await authGet<{ items: ChatMessage[] }>(`/api/conversations/${conversationId}/messages`, token, {
      items: [],
    })
  ).items;
}

/** Suhbat bo'yicha baho holati (berish mumkinmi, mening bahom, o'rtacha). */
export async function fetchConversationRating(
  token: string,
  conversationId: string
): Promise<ConversationRating | null> {
  const res = await tryFetch(`/api/conversations/${conversationId}/rating`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res || !res.ok) return null;
  return (await res.json()) as ConversationRating;
}

/** Suhbatdoshning qisqa profili (faqat suhbat mavjud bo'lsa server ruxsat beradi). */
export async function fetchUserSummary(token: string, userId: string): Promise<UserSummary | null> {
  const res = await tryFetch(`/api/users/${userId}/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res || !res.ok) return null;
  const json = (await res.json()) as UserSummary;
  if (json.company?.logoUrl) json.company.logoUrl = absoluteUploadUrl(json.company.logoUrl);
  return json;
}

/** Suhbatdoshga 1–5 yulduz baho yuboradi. */
export async function submitConversationRating(
  token: string,
  conversationId: string,
  score: number,
  comment?: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/conversations/${conversationId}/rating`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ score, ...(comment?.trim() ? { comment: comment.trim() } : {}) }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
}

/** Suhbat ochadi yoki mavjudini topadi. Ish beruvchi: candidateUserId; nomzod: companySlug. */
export async function startConversation(
  token: string,
  params: { candidateUserId?: string; companySlug?: string }
): Promise<string> {
  const res = await fetch(`${API_URL}/api/conversations/start`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(params),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Xatolik", json?.error);
  return json.id as string;
}
