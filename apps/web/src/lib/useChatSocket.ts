import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "./api.js";
import type { ChatMessage } from "./types.js";

/** Server qaytargan xabar — yuborgan oynaga `clientId` ham qaytadi (tasdiq uchun). */
export type SocketMessage = ChatMessage & { clientId?: string };

interface Handlers {
  onMessage: (m: SocketMessage) => void;
  onRead?: (conversationId: string) => void;
  /** Ulanish o'rnatildi; `reconnected` — uzilishdan keyin qayta ulanish (o'tkazib yuborilganlarni yuklash uchun). */
  onOpen?: (reconnected: boolean) => void;
}

/**
 * Foydalanuvchi uchun bitta WebSocket ulanish (real-time chat).
 * `onMessage` — yangi xabar; `onRead` — suhbat qarshi tomonda o'qilganda.
 * Ulanish uzilsa (server qayta ishga tushdi, tarmoq) — 1s, 2s, 4s … 30s oralig'ida qayta ulanadi.
 */
export function useChatSocket(token: string | null, handlers: Handlers) {
  const wsRef = useRef<WebSocket | null>(null);
  const ref = useRef(handlers);
  ref.current = handlers;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || typeof window === "undefined") return;
    let socket: WebSocket | null = null;
    let timer = 0;
    let attempt = 0;
    let everOpened = false;
    let disposed = false;

    const connect = () => {
      const ws = new WebSocket(`${WS_URL}/ws/chat?token=${encodeURIComponent(token)}`);
      socket = ws;
      wsRef.current = ws;
      ws.onopen = () => {
        attempt = 0;
        setConnected(true);
        ref.current.onOpen?.(everOpened);
        everOpened = true;
      };
      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
        setConnected(false);
        if (disposed) return;
        timer = window.setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempt));
        attempt += 1;
      };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "message" && data.message) {
            const clientId = typeof data.clientId === "string" ? data.clientId : undefined;
            ref.current.onMessage({ ...(data.message as ChatMessage), clientId });
          } else if (data.type === "read" && data.conversationId) ref.current.onRead?.(data.conversationId);
        } catch {
          /* noop */
        }
      };
    };
    connect();

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      wsRef.current = null;
      const ws = socket;
      if (!ws) return;
      ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
      // Hali ulanish o'rnatilmagan bo'lsa — "closed before established" ogohlantirishining
      // oldini olib, ulangach yopamiz.
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener("open", () => ws.close(), { once: true });
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [token]);

  const send = useCallback((conversationId: string, body: string, clientId?: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "message", conversationId, body, ...(clientId ? { clientId } : {}) }));
      return true;
    }
    return false;
  }, []);

  const markRead = useCallback((conversationId: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "read", conversationId }));
    }
  }, []);

  return { send, markRead, connected };
}
