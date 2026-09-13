import { useCallback, useEffect, useRef, useState } from "react";
import { deleteNotification, markAllNotificationsRead, markNotificationRead } from "../apiExtra.js";
import { mapNotificationToViewModel, type NotificationView } from "./adapter.js";
import { NOTIFICATIONS_LIMIT, fetchNotificationCenter, type NotificationCenterData } from "./api.js";
import { NOTIFICATION_RECEIVED, emitNotificationsChanged } from "./events.js";

export type CenterStatus = "loading" | "ready" | "error";

interface CenterState {
  status: CenterStatus;
  items: NotificationView[];
  unreadCount: number;
}

/**
 * `/notifications` markazi holati. Amallar mavjud endpointlar bilan, optimistik:
 * UI darhol o'zgaradi, server rad etsa aynan o'sha o'zgarish qaytariladi (boshqa
 * o'zgarishlar ustidan yozilmaydi) va `false` qaytadi — sahifa xabar ko'rsatadi.
 * Muvaffaqiyatdan keyin header qo'ng'irog'i yangilanadi. StrictMode'da takroriy so'rov yo'q.
 */
export function useNotificationCenter(token: string) {
  const [state, setState] = useState<CenterState>({ status: "loading", items: [], unreadCount: 0 });
  const stateRef = useRef(state);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const inflight = useRef<Promise<NotificationCenterData> | null>(null);

  const commit = useCallback((next: CenterState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const reload = useCallback(async () => {
    commit({ ...stateRef.current, status: "loading" });
    inflight.current ??= fetchNotificationCenter(tokenRef.current).finally(() => {
      inflight.current = null;
    });
    try {
      const data = await inflight.current;
      commit({ status: "ready", items: data.items, unreadCount: data.unreadCount });
    } catch {
      commit({ ...stateRef.current, status: "error" });
    }
  }, [commit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Header qo'ng'irog'i WebSocket orqali olgan yangi bildirishnoma — ro'yxat boshiga
  useEffect(() => {
    const onReceived = (event: Event) => {
      const view = mapNotificationToViewModel((event as CustomEvent).detail);
      const current = stateRef.current;
      if (!view || current.status !== "ready" || current.items.some((item) => item.id === view.id)) return;
      commit({ ...current, items: [view, ...current.items], unreadCount: current.unreadCount + (view.isRead ? 0 : 1) });
    };
    window.addEventListener(NOTIFICATION_RECEIVED, onReceived);
    return () => window.removeEventListener(NOTIFICATION_RECEIVED, onReceived);
  }, [commit]);

  const markRead = useCallback(
    async (id: string): Promise<boolean> => {
      const current = stateRef.current;
      const target = current.items.find((item) => item.id === id);
      if (!target || target.isRead) return true;
      commit({
        ...current,
        items: current.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
        unreadCount: Math.max(0, current.unreadCount - 1),
      });
      try {
        await markNotificationRead(tokenRef.current, id);
        emitNotificationsChanged();
        return true;
      } catch {
        const now = stateRef.current;
        const still = now.items.some((item) => item.id === id);
        commit({
          ...now,
          items: now.items.map((item) => (item.id === id ? { ...item, isRead: false } : item)),
          unreadCount: still ? now.unreadCount + 1 : now.unreadCount,
        });
        return false;
      }
    },
    [commit]
  );

  const markAllRead = useCallback(async (): Promise<boolean> => {
    const current = stateRef.current;
    const unreadIds = new Set(current.items.filter((item) => !item.isRead).map((item) => item.id));
    const previousCount = current.unreadCount;
    if (previousCount === 0 && unreadIds.size === 0) return true;
    commit({ ...current, items: current.items.map((item) => (item.isRead ? item : { ...item, isRead: true })), unreadCount: 0 });
    try {
      await markAllNotificationsRead(tokenRef.current);
      emitNotificationsChanged();
      return true;
    } catch {
      const now = stateRef.current;
      commit({ ...now, items: now.items.map((item) => (unreadIds.has(item.id) ? { ...item, isRead: false } : item)), unreadCount: previousCount });
      return false;
    }
  }, [commit]);

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      const current = stateRef.current;
      const index = current.items.findIndex((item) => item.id === id);
      if (index < 0) return true;
      const removed = current.items[index];
      commit({
        ...current,
        items: current.items.filter((item) => item.id !== id),
        unreadCount: removed.isRead ? current.unreadCount : Math.max(0, current.unreadCount - 1),
      });
      try {
        await deleteNotification(tokenRef.current, id);
        emitNotificationsChanged();
        return true;
      } catch {
        const now = stateRef.current;
        if (!now.items.some((item) => item.id === id)) {
          const items = [...now.items];
          items.splice(Math.min(index, items.length), 0, removed);
          commit({ ...now, items, unreadCount: removed.isRead ? now.unreadCount : now.unreadCount + 1 });
        }
        return false;
      }
    },
    [commit]
  );

  return {
    ...state,
    /** Backend chegarasiga yetdi — eski bildirishnomalar ro'yxatga sig'madi. */
    truncated: state.items.length >= NOTIFICATIONS_LIMIT,
    reload,
    markRead,
    markAllRead,
    remove,
  };
}

export type NotificationCenter = ReturnType<typeof useNotificationCenter>;
