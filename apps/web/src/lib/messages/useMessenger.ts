import { useCallback, useEffect, useRef, useState } from "react";
import { fetchConversationRating, fetchUserSummary, submitConversationRating } from "../api.js";
import type { ConversationRating, UserSummary } from "../types.js";
import { useChatSocket, type SocketMessage } from "../useChatSocket.js";
import { mapMessageToViewModel, type ConversationView, type MessageStatus, type MessageView } from "./adapter.js";
import { fetchConversationList, fetchConversationMessages } from "./api.js";
import { emitInboxChanged } from "./events.js";

/** Server tasdig'i shu vaqtda kelmasa — xabar "Yuborilmadi" deb belgilanadi. */
export const SEND_TIMEOUT_MS = 10_000;

export type ListState = { status: "loading" } | { status: "error" } | { status: "ready"; items: ConversationView[] };

export interface ThreadState {
  status: "loading" | "error" | "ready";
  items: MessageView[];
  /** Suhbat ochilganda o'qilmagan bo'lgan birinchi xabar — "Yangi xabarlar" ajratgichi. */
  newFromId: string | null;
}

export type PartnerState = UserSummary | "loading" | "error";

function makeClientId(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  return c?.randomUUID ? c.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Suhbatni yangilab ro'yxat boshiga ko'taradi. */
function bump(items: ConversationView[], id: string, patch: (c: ConversationView) => ConversationView): ConversationView[] {
  const index = items.findIndex((c) => c.id === id);
  if (index < 0) return items;
  const next = items.slice();
  const [item] = next.splice(index, 1);
  return [patch(item), ...next];
}

/**
 * `/messages` ma'lumot qatlami: suhbatlar ro'yxati, ochilgan suhbat tarixi va mavjud
 * WebSocket (`/ws/chat`) orqali real-time xabar/o'qildi hodisalari.
 *
 * - Suhbat ochilganda tarix REST orqali olinadi (server o'qilgan deb belgilaydi) va
 *   header'dagi "Xabarlar" soni yangilanadi.
 * - Yuborish: pufak darhol "yuborilmoqda" holatida chiziladi, server `clientId` bilan
 *   qaytargach "yuborildi"ga o'tadi; ulanish yo'q yoki tasdiq kelmasa — "Yuborilmadi"
 *   va "Qayta yuborish".
 * - `activeId` — ekranda ochiq turgan suhbat (mobil ro'yxat ko'rinishida `null`).
 */
export function useMessenger(token: string, userId: string, activeId: string | null) {
  const [list, setList] = useState<ListState>({ status: "loading" });
  const [threads, setThreads] = useState<Record<string, ThreadState>>({});
  const [ratings, setRatings] = useState<Record<string, ConversationRating | null>>({});
  const [partners, setPartners] = useState<Record<string, PartnerState>>({});

  const listRef = useRef(list);
  listRef.current = list;
  const threadsRef = useRef(threads);
  threadsRef.current = threads;
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  const listInflight = useRef<Promise<void> | null>(null);
  const threadInflight = useRef(new Map<string, Promise<void>>());
  const timers = useRef(new Map<string, number>());

  const reloadList = useCallback(
    (silent = false) => {
      if (listInflight.current) return listInflight.current;
      if (!silent) setList({ status: "loading" });
      const request = fetchConversationList(token)
        .then(
          (items) => {
            // Ochiq suhbat tarixi allaqachon olingan — server hisobidagi eski o'qilmaganlar ko'rinmasin
            const active = activeRef.current;
            const loaded = active ? threadsRef.current[active]?.status === "ready" : false;
            setList({ status: "ready", items: loaded ? items.map((c) => (c.id === active ? { ...c, unread: 0 } : c)) : items });
          },
          () => {
            if (!silent || listRef.current.status !== "ready") setList({ status: "error" });
          }
        )
        .finally(() => {
          listInflight.current = null;
        });
      listInflight.current = request;
      return request;
    },
    [token]
  );

  const loadThread = useCallback(
    (id: string, silent = false) => {
      const pending = threadInflight.current.get(id);
      if (pending) return pending;
      const current = listRef.current;
      const unreadBefore = current.status === "ready" ? current.items.find((c) => c.id === id)?.unread ?? 0 : 0;
      if (!silent) {
        setThreads((prev) => ({ ...prev, [id]: { status: "loading", items: prev[id]?.items ?? [], newFromId: prev[id]?.newFromId ?? null } }));
      }
      const request = fetchConversationMessages(token, id)
        .then(
          (items) => {
            setThreads((prev) => {
              const local = (prev[id]?.items ?? []).filter((m) => m.status !== "sent");
              const incoming = items.filter((m) => m.senderId !== userId);
              const newFromId =
                unreadBefore > 0 && incoming.length > 0
                  ? incoming[Math.max(0, incoming.length - unreadBefore)].id
                  : silent
                    ? prev[id]?.newFromId ?? null
                    : null;
              return { ...prev, [id]: { status: "ready", items: [...items, ...local], newFromId } };
            });
            if (unreadBefore > 0) {
              setList((prev) =>
                prev.status === "ready" ? { status: "ready", items: prev.items.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) } : prev
              );
              emitInboxChanged();
            }
          },
          () => {
            setThreads((prev) =>
              silent && prev[id]?.status === "ready" ? prev : { ...prev, [id]: { status: "error", items: prev[id]?.items ?? [], newFromId: null } }
            );
          }
        )
        .finally(() => {
          threadInflight.current.delete(id);
        });
      threadInflight.current.set(id, request);
      return request;
    },
    [token, userId]
  );

  const setStatus = useCallback((conversationId: string, clientId: string, status: MessageStatus) => {
    setThreads((prev) => {
      const thread = prev[conversationId];
      if (!thread) return prev;
      const index = thread.items.findIndex((m) => m.clientId === clientId && m.status !== "sent");
      if (index < 0) return prev;
      const items = thread.items.slice();
      items[index] = { ...items[index], status, ...(status === "pending" ? { createdAt: new Date().toISOString() } : {}) };
      return { ...prev, [conversationId]: { ...thread, items } };
    });
  }, []);

  const clearTimer = (clientId: string) => {
    const timer = timers.current.get(clientId);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(clientId);
  };

  const socket = useChatSocket(token, {
    onMessage: (raw: SocketMessage) => {
      const message = mapMessageToViewModel(raw);
      if (!message) return;
      const mine = message.senderId === userId;
      const conversationId = message.conversationId;
      const isActive = conversationId === activeRef.current;
      if (raw.clientId) clearTimer(raw.clientId);

      setThreads((prev) => {
        const thread = prev[conversationId];
        if (!thread || thread.items.some((m) => m.id === message.id)) return prev;
        const index = raw.clientId ? thread.items.findIndex((m) => m.clientId === raw.clientId) : -1;
        const items = thread.items.slice();
        if (index >= 0) items[index] = { ...message, clientId: raw.clientId ?? null };
        else items.push(message);
        return { ...prev, [conversationId]: { ...thread, items } };
      });

      const current = listRef.current;
      if (current.status !== "ready" || !current.items.some((c) => c.id === conversationId)) {
        // Yangi suhbat (masalan, ish beruvchi birinchi marta yozdi) — ro'yxat qayta olinadi
        void reloadList(true);
        if (!mine) emitInboxChanged();
        return;
      }
      setList((prev) =>
        prev.status !== "ready"
          ? prev
          : {
              status: "ready",
              items: bump(prev.items, conversationId, (c) => ({
                ...c,
                lastMessage: message.body.trim(),
                lastMessageAt: message.createdAt,
                lastMessageMine: mine,
                lastMessageRead: false,
                unread: mine || isActive ? c.unread : c.unread + 1,
              })),
            }
      );
      if (!mine && isActive) {
        socket.markRead(conversationId);
        // Server o'qildi yozuvini saqlab ulgursin — keyin header soni so'raladi
        window.setTimeout(emitInboxChanged, 500);
      } else if (!mine) {
        emitInboxChanged();
      }
    },
    onRead: (conversationId) => {
      // Qarshi tomon o'qidi — mening xabarlarim ikki belgiga o'tadi
      setThreads((prev) => {
        const thread = prev[conversationId];
        if (!thread) return prev;
        return {
          ...prev,
          [conversationId]: { ...thread, items: thread.items.map((m) => (m.senderId === userId && m.status === "sent" ? { ...m, isRead: true } : m)) },
        };
      });
      setList((prev) =>
        prev.status === "ready"
          ? { status: "ready", items: prev.items.map((c) => (c.id === conversationId && c.lastMessageMine ? { ...c, lastMessageRead: true } : c)) }
          : prev
      );
    },
    onOpen: (reconnected) => {
      if (!reconnected) return;
      // Uzilish paytida o'tkazib yuborilgan xabarlar
      void reloadList(true);
      if (activeRef.current) void loadThread(activeRef.current, true);
    },
  });

  const dispatch = useCallback(
    (message: MessageView) => {
      const clientId = message.clientId as string;
      clearTimer(clientId);
      if (!socket.send(message.conversationId, message.body, clientId)) {
        setStatus(message.conversationId, clientId, "failed");
        return;
      }
      timers.current.set(
        clientId,
        window.setTimeout(() => {
          timers.current.delete(clientId);
          setStatus(message.conversationId, clientId, "failed");
        }, SEND_TIMEOUT_MS)
      );
    },
    [socket.send, setStatus] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const send = useCallback(
    (conversationId: string, body: string) => {
      const text = body.trim();
      if (!text) return;
      const clientId = makeClientId();
      const message: MessageView = {
        id: `local-${clientId}`,
        conversationId,
        senderId: userId,
        body: text,
        isRead: false,
        createdAt: new Date().toISOString(),
        status: "pending",
        clientId,
      };
      setThreads((prev) => {
        const thread = prev[conversationId] ?? { status: "ready" as const, items: [], newFromId: null };
        return { ...prev, [conversationId]: { ...thread, items: [...thread.items, message] } };
      });
      dispatch(message);
    },
    [userId, dispatch]
  );

  const retry = useCallback(
    (conversationId: string, clientId: string) => {
      const message = threadsRef.current[conversationId]?.items.find((m) => m.clientId === clientId && m.status === "failed");
      if (!message) return;
      setStatus(conversationId, clientId, "pending");
      dispatch(message);
    },
    [dispatch, setStatus]
  );

  const discard = useCallback((conversationId: string, clientId: string) => {
    clearTimer(clientId);
    setThreads((prev) => {
      const thread = prev[conversationId];
      if (!thread) return prev;
      return { ...prev, [conversationId]: { ...thread, items: thread.items.filter((m) => !(m.clientId === clientId && m.status !== "sent")) } };
    });
  }, []);

  const loadRating = useCallback(
    (conversationId: string) => {
      fetchConversationRating(token, conversationId).then((rating) => setRatings((prev) => ({ ...prev, [conversationId]: rating })));
    },
    [token]
  );

  /** Baho bir marta beriladi; xato bo'lsa uloqtiradi (dialog xabarni ko'rsatadi). */
  const rate = useCallback(
    async (conversationId: string, score: number, comment?: string) => {
      await submitConversationRating(token, conversationId, score, comment);
      setRatings((prev) => {
        const r = prev[conversationId];
        if (!r) return prev;
        const otherAvg = Math.round((((r.otherAvg ?? 0) * r.otherCount + score) / (r.otherCount + 1)) * 10) / 10;
        return { ...prev, [conversationId]: { ...r, myScore: score, myComment: comment ?? null, otherAvg, otherCount: r.otherCount + 1 } };
      });
    },
    [token]
  );

  /** Suhbatdoshning qisqa profili (ish beruvchi ko'rinishidagi nomzod paneli uchun). */
  const loadPartner = useCallback(
    (otherUserId: string, force = false) => {
      const state = partnersRef.current[otherUserId];
      if (!force && state && state !== "error") return;
      setPartners((prev) => ({ ...prev, [otherUserId]: "loading" }));
      fetchUserSummary(token, otherUserId).then((summary) =>
        setPartners((prev) => ({ ...prev, [otherUserId]: summary ?? "error" }))
      );
    },
    [token]
  );
  const partnersRef = useRef(partners);
  partnersRef.current = partners;

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  // Suhbat ochildi: tarix (keshlangan bo'lsa — jimgina yangilanadi) va baho holati
  const listReady = list.status === "ready";
  useEffect(() => {
    if (!activeId || !listReady) return;
    const exists = (listRef.current as Extract<ListState, { status: "ready" }>).items.some((c) => c.id === activeId);
    if (!exists) return;
    const thread = threadsRef.current[activeId];
    void loadThread(activeId, thread?.status === "ready");
    if (!(activeId in ratingsRef.current)) loadRating(activeId);
  }, [activeId, listReady, loadThread, loadRating]);
  const ratingsRef = useRef(ratings);
  ratingsRef.current = ratings;

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => window.clearTimeout(timer));
      map.clear();
    };
  }, []);

  return {
    list,
    threads,
    ratings,
    partners,
    connected: socket.connected,
    reloadList,
    loadThread,
    send,
    retry,
    discard,
    rate,
    loadPartner,
  };
}

export type Messenger = ReturnType<typeof useMessenger>;
