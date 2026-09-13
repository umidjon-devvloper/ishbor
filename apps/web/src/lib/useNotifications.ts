import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "./api.js";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification as deleteNotificationApi,
} from "./apiExtra.js";
import { NOTIFICATIONS_CHANGED, emitNotificationReceived } from "./notifications/events.js";
import type { AppNotification } from "./types.js";

/**
 * Header qo'ng'irog'i uchun (to'liq markaz — `/notifications`, `useNotificationCenter`).
 *
 * Ikki manba: WebSocket (darrov keladi, sayt ochiq bo'lsa) va davriy so'rov
 * (socket uzilib qolsa ham son to'g'ri qoladi). Ikkalasi bir-birini to'ldiradi —
 * WS xabari kelganda ro'yxat boshiga qo'shiladi, so'rov esa to'liq holatni tiklaydi.
 * Kelgan xabar sahifaga ham uzatiladi; sahifada o'zgarish bo'lsa son qayta so'raladi.
 */
export function useNotifications(token: string | null, options?: { limit?: number }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = options?.limit ?? 30;

  const refresh = useCallback(async () => {
    if (!token) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    const data = await fetchNotifications(token, { limit });
    setItems(data.items);
    setUnreadCount(data.unreadCount);
  }, [token, limit]);

  // Birinchi yuklash + davriy yangilash + boshqa sahifadan qaytganda
  useEffect(() => {
    if (!token) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    void refresh().finally(() => setLoading(false));

    const id = window.setInterval(() => void refresh(), 45_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    // `/notifications` sahifasida o'qildi/o'chirildi — son va ro'yxat yangilansin
    window.addEventListener(NOTIFICATIONS_CHANGED, onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(NOTIFICATIONS_CHANGED, onFocus);
    };
  }, [token, refresh]);

  // Real-time: server `notification` turidagi xabar yuboradi
  const socketRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (!token || typeof window === "undefined") return;
    const ws = new WebSocket(`${WS_URL}/ws/chat?token=${encodeURIComponent(token)}`);
    socketRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type !== "notification" || !data.notification) return;
        const incoming = data.notification as AppNotification;
        setItems((prev) =>
          prev.some((n) => n.id === incoming.id) ? prev : [incoming, ...prev].slice(0, limit)
        );
        setUnreadCount((c) => c + 1);
        emitNotificationReceived(incoming);
      } catch {
        /* noto'g'ri JSON — e'tiborsiz qoldiramiz */
      }
    };
    return () => {
      socketRef.current = null;
      ws.onmessage = ws.onerror = ws.onclose = null;
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener("open", () => ws.close(), { once: true });
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [token, limit]);

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationRead(token, id).catch(() => undefined);
    },
    [token]
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsRead(token).catch(() => undefined);
  }, [token]);

  const remove = useCallback(
    async (id: string) => {
      if (!token) return;
      const removed = items.find((n) => n.id === id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      await deleteNotificationApi(token, id).catch(() => undefined);
    },
    [token, items]
  );

  return { items, unreadCount, loading, refresh, markRead, markAllRead, remove };
}
