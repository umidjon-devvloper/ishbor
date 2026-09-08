import type { WebSocket } from "ws";

/**
 * Ochiq WebSocket ulanishlarining yagona ro'yxati (userId -> socketlar).
 *
 * Chat ham, bildirishnoma ham shu ro'yxatdan foydalanadi: foydalanuvchi saytda
 * ochiq bo'lsa xabar darrov socket orqali boradi, oflayn bo'lsa —
 * notification xizmati Telegram/push/email kanallariga o'tadi.
 */
const sockets = new Map<string, Set<WebSocket>>();

export function addSocket(userId: string, ws: WebSocket): void {
  let set = sockets.get(userId);
  if (!set) {
    set = new Set();
    sockets.set(userId, set);
  }
  set.add(ws);
}

export function removeSocket(userId: string, ws: WebSocket): void {
  const set = sockets.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) sockets.delete(userId);
}

/** Foydalanuvchining barcha ochiq oynalariga JSON matn yuboradi. */
export function sendToUser(userId: string, payload: string): void {
  const set = sockets.get(userId);
  if (!set) return;
  for (const ws of set) {
    if (ws.readyState === 1) ws.send(payload);
  }
}

/** Foydalanuvchi ayni damda saytda ochiqmi. */
export function isOnline(userId: string): boolean {
  return sockets.has(userId);
}
