import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "./api.js";
import type { ChatMessage } from "./types.js";

interface Handlers {
  onMessage: (m: ChatMessage) => void;
  onRead?: (conversationId: string) => void;
}

/**
 * Foydalanuvchi uchun bitta WebSocket ulanish (real-time chat).
 * `onMessage` — yangi xabar; `onRead` — suhbat qarshi tomonda o'qilganda.
 */
export function useChatSocket(token: string | null, handlers: Handlers) {
  const wsRef = useRef<WebSocket | null>(null);
  const ref = useRef(handlers);
  ref.current = handlers;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || typeof window === "undefined") return;
    const ws = new WebSocket(`${WS_URL}/ws/chat?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "message" && data.message) ref.current.onMessage(data.message as ChatMessage);
        else if (data.type === "read" && data.conversationId) ref.current.onRead?.(data.conversationId);
      } catch {
        /* noop */
      }
    };
    return () => {
      wsRef.current = null;
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

  const send = useCallback((conversationId: string, body: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "message", conversationId, body }));
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
