// Yangi bo'limlar uchun API qatlami: sevimlilar, bildirishnomalar, obunalar,
// tariflar, maosh statistikasi va admin paneli.
//
// Asosiy `api.ts` bilan bir xil uslub: xato bo'lsa `ApiError`, ulanish uzilsa
// bo'sh natija — sayt server o'chiq bo'lganda ham ochiladi.
import { API_URL, ApiError } from "./api.js";
import type {
  AdminCompany,
  AdminOverview,
  AdminPayment,
  AdminReview,
  AdminUser,
  AdminVacancy,
  AppNotification,
  CheckoutResult,
  FavoriteVacancy,
  NotificationChannel,
  NotificationList,
  NotificationPref,
  NotificationType,
  Paged,
  PaymentRecord,
  PlanList,
  SalaryStats,
  SavedSearch,
  SavedSearchParams,
  SubscriptionState,
  Vacancy,
} from "./types.js";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Ulanish uzilsa `null` — chaqiruvchi zaxira qiymat beradi. */
async function tryFetch(path: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch {
    return null;
  }
}

async function get<T>(path: string, token: string | null, fallback: T): Promise<T> {
  const res = await tryFetch(path, token ? { headers: authHeaders(token) } : undefined);
  if (!res || !res.ok) return fallback;
  return (await res.json()) as T;
}

/** Xato bo'lsa `ApiError` uloqtiradi — forma va tugmalar shu bo'yicha xabar ko'rsatadi. */
async function send<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  token: string | null,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? authHeaders(token) : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, json?.message ?? "Kutilmagan xatolik", json?.error);
  }
  return json as T;
}

/** Prisma vakansiyasini frontend kartasi shakliga keltiradi. */
function mapVacancyRow(raw: Record<string, unknown>): Vacancy {
  const company = raw.company as { name?: string; slug?: string } | undefined;
  const region = raw.region as { name?: string } | undefined;
  return {
    id: String(raw.id),
    slug: String(raw.slug),
    title: String(raw.title),
    companyName: company?.name ?? "",
    companySlug: company?.slug ?? "",
    regionName: region?.name ?? null,
    salaryMin: (raw.salaryMin as number | null) ?? null,
    salaryMax: (raw.salaryMax as number | null) ?? null,
    currency: (raw.currency as string) ?? "UZS",
    isSalaryHidden: Boolean(raw.isSalaryHidden),
    employmentType: (raw.employmentType as Vacancy["employmentType"]) ?? "full_time",
    experienceRequired: (raw.experienceRequired as Vacancy["experienceRequired"]) ?? "none",
    isPremium: Boolean(raw.isPremium),
    isUrgent: Boolean(raw.isUrgent),
    publishedAt: (raw.publishedAt as string | null) ?? null,
  };
}

// ---------------------------------------------------------
// Sevimlilar
// ---------------------------------------------------------

export async function fetchFavorites(token: string): Promise<FavoriteVacancy[]> {
  const json = await get<{ items: Record<string, unknown>[] }>("/api/favorites", token, { items: [] });
  return json.items.map((raw) => ({
    ...mapVacancyRow(raw),
    favoritedAt: String(raw.favoritedAt),
    isClosed: Boolean(raw.isClosed),
  }));
}

export async function fetchFavoriteIds(token: string): Promise<string[]> {
  const json = await get<{ ids: string[] }>("/api/favorites/ids", token, { ids: [] });
  return json.ids;
}

export function addFavorite(token: string, vacancyId: string) {
  return send<{ ok: true; favorited: boolean }>(`/api/favorites/${vacancyId}`, "POST", token, {});
}

export function removeFavorite(token: string, vacancyId: string) {
  return send<{ ok: true; favorited: boolean }>(`/api/favorites/${vacancyId}`, "DELETE", token);
}

// ---------------------------------------------------------
// Bildirishnomalar
// ---------------------------------------------------------

const EMPTY_NOTIFICATIONS: NotificationList = { items: [], unreadCount: 0 };

export function fetchNotifications(token: string, options?: { unreadOnly?: boolean; limit?: number }) {
  const qs = new URLSearchParams();
  if (options?.unreadOnly) qs.set("unreadOnly", "true");
  if (options?.limit) qs.set("limit", String(options.limit));
  const suffix = qs.toString() ? `?${qs}` : "";
  return get<NotificationList>(`/api/notifications${suffix}`, token, EMPTY_NOTIFICATIONS);
}

export async function fetchUnreadCount(token: string): Promise<number> {
  const json = await get<{ count: number }>("/api/notifications/unread-count", token, { count: 0 });
  return json.count;
}

export function markNotificationRead(token: string, id: string) {
  return send<{ ok: true }>(`/api/notifications/${id}/read`, "POST", token, {});
}

export function markAllNotificationsRead(token: string) {
  return send<{ updated: number }>("/api/notifications/read-all", "POST", token, {});
}

export function deleteNotification(token: string, id: string) {
  return send<{ ok: true }>(`/api/notifications/${id}`, "DELETE", token);
}

export async function fetchNotificationPrefs(token: string): Promise<NotificationPref[]> {
  const json = await get<{ items: NotificationPref[] }>("/api/notifications/preferences", token, {
    items: [],
  });
  return json.items;
}

export function saveNotificationPrefs(
  token: string,
  items: { notificationType: NotificationType; channel: NotificationChannel; isEnabled: boolean }[]
) {
  return send<{ ok: true }>("/api/notifications/preferences", "PUT", token, { items });
}

// --- Brauzer push ---

export async function fetchPushPublicKey(): Promise<string> {
  const json = await get<{ key: string }>("/api/push/public-key", null, { key: "" });
  return json.key;
}

export function subscribePush(
  token: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  return send<{ ok: true }>("/api/push/subscribe", "POST", token, subscription);
}

export function unsubscribePush(token: string, endpoint: string) {
  return send<{ ok: true }>("/api/push/unsubscribe", "POST", token, { endpoint });
}

// ---------------------------------------------------------
// Qidiruv obunalari
// ---------------------------------------------------------

export async function fetchSavedSearches(token: string): Promise<SavedSearch[]> {
  const json = await get<{ items: SavedSearch[] }>("/api/saved-searches", token, { items: [] });
  return json.items;
}

export function createSavedSearch(
  token: string,
  input: { name: string; queryParams: SavedSearchParams; frequency: "instant" | "daily" }
) {
  return send<SavedSearch>("/api/saved-searches", "POST", token, input);
}

export function updateSavedSearch(
  token: string,
  id: string,
  input: { name?: string; frequency?: "instant" | "daily"; emailAlertsEnabled?: boolean }
) {
  return send<{ ok: true }>(`/api/saved-searches/${id}`, "PATCH", token, input);
}

export function deleteSavedSearch(token: string, id: string) {
  return send<{ ok: true }>(`/api/saved-searches/${id}`, "DELETE", token);
}

// ---------------------------------------------------------
// Tariflar va to'lov
// ---------------------------------------------------------

const EMPTY_PLANS: PlanList = { items: [], providers: { payme: false, click: false } };

export function fetchPlans(): Promise<PlanList> {
  return get<PlanList>("/api/plans", null, EMPTY_PLANS);
}

export async function fetchSubscription(token: string): Promise<SubscriptionState | null> {
  const json = await get<{ subscription: SubscriptionState | null }>(
    "/api/employer/subscription",
    token,
    { subscription: null }
  );
  return json.subscription;
}

export async function fetchMyPayments(token: string): Promise<PaymentRecord[]> {
  const json = await get<{ items: PaymentRecord[] }>("/api/employer/payments", token, { items: [] });
  return json.items;
}

export function startCheckout(token: string, planSlug: string, provider: "payme" | "click") {
  return send<CheckoutResult>("/api/employer/subscription/checkout", "POST", token, {
    planSlug,
    provider,
  });
}

// ---------------------------------------------------------
// Maosh statistikasi
// ---------------------------------------------------------

const EMPTY_SALARY: SalaryStats = {
  summary: { count: 0, currency: "UZS", min: 0, max: 0, average: 0, median: 0, p25: 0, p75: 0 },
  distribution: [],
  byCategory: [],
  byRegion: [],
};

export function fetchSalaryStats(params: { categorySlug?: string; area?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.categorySlug) qs.set("categorySlug", params.categorySlug);
  if (params.area) qs.set("area", params.area);
  const suffix = qs.toString() ? `?${qs}` : "";
  return get<SalaryStats>(`/api/stats/salary${suffix}`, null, EMPTY_SALARY);
}

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

function emptyPage<T>(): Paged<T> {
  return { items: [], total: 0, page: 1, pageSize: 25, pageCount: 0 };
}

function adminQuery(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export function fetchAdminOverview(token: string): Promise<AdminOverview | null> {
  return get<AdminOverview | null>("/api/admin/overview", token, null);
}

export function fetchAdminUsers(
  token: string,
  params: { text?: string; role?: string; page?: number } = {}
) {
  return get<Paged<AdminUser>>(`/api/admin/users${adminQuery(params)}`, token, emptyPage<AdminUser>());
}

export function setUserBlocked(token: string, id: string, isBlocked: boolean) {
  return send<{ id: string; isBlocked: boolean }>(`/api/admin/users/${id}/block`, "PATCH", token, {
    isBlocked,
  });
}

export function setUserRole(token: string, id: string, role: "job_seeker" | "employer" | "admin") {
  return send<{ id: string; role: string }>(`/api/admin/users/${id}/role`, "PATCH", token, { role });
}

export function fetchAdminVacancies(
  token: string,
  params: { text?: string; status?: string; page?: number } = {}
) {
  return get<Paged<AdminVacancy>>(
    `/api/admin/vacancies${adminQuery(params)}`,
    token,
    emptyPage<AdminVacancy>()
  );
}

export function moderateVacancy(
  token: string,
  id: string,
  input: { status?: "active" | "rejected" | "archived"; reason?: string; isPremium?: boolean }
) {
  return send<{ id: string; status: string; isPremium: boolean }>(
    `/api/admin/vacancies/${id}/moderate`,
    "PATCH",
    token,
    input
  );
}

export function fetchAdminCompanies(
  token: string,
  params: { text?: string; verified?: boolean; page?: number } = {}
) {
  return get<Paged<AdminCompany>>(
    `/api/admin/companies${adminQuery(params)}`,
    token,
    emptyPage<AdminCompany>()
  );
}

export function verifyCompany(token: string, id: string, isVerified: boolean) {
  return send<{ id: string; isVerified: boolean }>(
    `/api/admin/companies/${id}/verify`,
    "PATCH",
    token,
    { isVerified }
  );
}

export function fetchAdminReviews(token: string, params: { status?: string; page?: number } = {}) {
  return get<Paged<AdminReview>>(
    `/api/admin/reviews${adminQuery(params)}`,
    token,
    emptyPage<AdminReview>()
  );
}

export function setReviewStatus(
  token: string,
  id: string,
  status: "pending" | "approved" | "rejected"
) {
  return send<{ id: string; status: string }>(`/api/admin/reviews/${id}`, "PATCH", token, { status });
}

export function deleteAdminReview(token: string, id: string) {
  return send<{ ok: true }>(`/api/admin/reviews/${id}`, "DELETE", token);
}

export function fetchAdminPayments(token: string, params: { status?: string; page?: number } = {}) {
  return get<Paged<AdminPayment>>(
    `/api/admin/payments${adminQuery(params)}`,
    token,
    emptyPage<AdminPayment>()
  );
}

export function confirmPayment(token: string, transactionId: string) {
  return send<{ ok: true }>(`/api/admin/payments/${transactionId}/confirm`, "POST", token, {});
}

export function reindexSearch(token: string) {
  return send<{ indexed: number; engine: string }>("/api/admin/search/reindex", "POST", token, {});
}

export function runAlertsNow(token: string) {
  return send<{ checked: number; notified: number; matched: number }>(
    "/api/admin/alerts/run",
    "POST",
    token,
    {}
  );
}

export function sendBroadcast(
  token: string,
  input: { title: string; body: string; role: "all" | "job_seeker" | "employer"; url?: string }
) {
  return send<{ sent: number }>("/api/admin/broadcast", "POST", token, input);
}
