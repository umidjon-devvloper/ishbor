// Real backend bilan ishlovchi data qatlami — faqat haqiqiy API'dan o'qiydi
// (namunaviy/mock ma'lumot ishlatilmaydi). Server o'chiq bo'lsa bo'sh natija qaytadi.
import type {
  Vacancy,
  VacancyDetail,
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

export async function applyToVacancy(vacancyId: string, token: string): Promise<void> {
  await authRequest(`/api/vacancies/${vacancyId}/apply`, { source: "site" }, token);
}

// ---------------------------------------------------------
// Mapperlar (Prisma JSON -> frontend tiplari)
// ---------------------------------------------------------

function splitLines(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

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
  };
}

function mapVacancyDetail(raw: any): VacancyDetail {
  const { rating, count } = avgRating(raw.company?.reviews);
  return {
    ...mapVacancy(raw),
    companyLogoUrl: raw.company?.logoUrl ? absoluteUploadUrl(raw.company.logoUrl) : null,
    description: raw.description ?? "",
    requirements: splitLines(raw.requirements),
    conditions: splitLines(raw.conditions),
    applyWithoutResume: raw.applyWithoutResume ?? false,
    contactEmail: raw.contactEmail ?? null,
    contactTelegram: raw.contactTelegram ?? null,
    contactPhone: raw.contactPhone ?? null,
    companyRating: rating,
    companyReviewCount: count,
  };
}

function mapCompany(raw: any): Company {
  const { rating, count } = avgRating(raw.reviews);
  return {
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
    activeVacancyCount: Array.isArray(raw.vacancies) ? raw.vacancies.length : 0,
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

export async function fetchVacancy(slug: string): Promise<VacancyDetail | null> {
  const res = await tryFetch(`/api/vacancies/${slug}`);
  if (!res || !res.ok) return null;
  return mapVacancyDetail(await res.json());
}

// ---------------------------------------------------------
// Kompaniyalar
// ---------------------------------------------------------

export async function fetchCompanies(text?: string): Promise<Company[]> {
  const qs = text ? `?text=${encodeURIComponent(text)}` : "";
  const res = await tryFetch(`/api/companies${qs}`);
  if (!res || !res.ok) return [];
  const json = await res.json();
  return (json.items ?? []).map(mapCompany);
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
