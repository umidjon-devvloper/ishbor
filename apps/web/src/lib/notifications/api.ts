import { API_URL, ApiError } from "../api.js";
import { mapNotificationToViewModel, type NotificationView } from "./adapter.js";

/** Backend bitta so'rovda qaytaradigan eng ko'p son (`limit` ≤ 100, sahifalash yo'q). */
export const NOTIFICATIONS_LIMIT = 100;

export interface NotificationCenterData {
  items: NotificationView[];
  /** Serverdagi aniq o'qilmaganlar soni (ro'yxat chegarasidan qat'i nazar). */
  unreadCount: number;
}

/**
 * Markaz ro'yxati — mavjud `GET /api/notifications` (yangi endpoint yo'q).
 * `fetchNotifications` dan farqi: xato yoki uzilishda bo'sh ro'yxat emas, xato
 * uloqtiradi — aks holda API xatosi "Bildirishnomalar yo'q" bo'lib ko'rinardi.
 * O'qildi/o'chirish — mavjud `markNotificationRead` va boshqalar (apiExtra).
 */
export async function fetchNotificationCenter(token: string): Promise<NotificationCenterData> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/notifications?limit=${NOTIFICATIONS_LIMIT}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new ApiError(0, "Tarmoq xatosi");
  }
  const json = (await res.json().catch(() => null)) as { items?: unknown[]; unreadCount?: unknown; message?: string; error?: string } | null;
  if (!res.ok) throw new ApiError(res.status, json?.message ?? "Kutilmagan xatolik", json?.error);
  const items = (Array.isArray(json?.items) ? json.items : [])
    .map(mapNotificationToViewModel)
    .filter((item): item is NotificationView => item !== null);
  const count = typeof json?.unreadCount === "number" && json.unreadCount >= 0 ? json.unreadCount : items.filter((item) => !item.isRead).length;
  return { items, unreadCount: count };
}
