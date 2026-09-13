import { API_URL, ApiError } from "../api.js";
import { mapConversationToViewModel, mapMessageToViewModel, type ConversationView, type MessageView } from "./adapter.js";

/**
 * Mavjud chat endpointlari (`GET /api/conversations`, `GET /api/conversations/:id/messages`).
 * `fetchConversations`/`fetchMessages` dan farqi: xato yoki uzilishda bo'sh ro'yxat emas,
 * xato uloqtiradi — aks holda API xatosi "Xabarlar yo'q" bo'lib ko'rinardi.
 * Backend faqat token egasi ishtirok etgan suhbatlarni beradi, begona suhbat tarixi — 403.
 */
async function getJson(path: string, token: string): Promise<Record<string, unknown> | null> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new ApiError(0, "Tarmoq xatosi");
  }
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) throw new ApiError(res.status, typeof json?.message === "string" ? json.message : "Kutilmagan xatolik", typeof json?.error === "string" ? json.error : undefined);
  return json;
}

export async function fetchConversationList(token: string): Promise<ConversationView[]> {
  const json = await getJson("/api/conversations", token);
  const rows = Array.isArray(json?.items) ? json.items : [];
  return rows.map(mapConversationToViewModel).filter((item): item is ConversationView => item !== null);
}

/** Suhbat tarixi. Server shu so'rovda qarshi tomon xabarlarini o'qilgan deb belgilaydi. */
export async function fetchConversationMessages(token: string, conversationId: string): Promise<MessageView[]> {
  const json = await getJson(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, token);
  const rows = Array.isArray(json?.items) ? json.items : [];
  return rows.map(mapMessageToViewModel).filter((item): item is MessageView => item !== null);
}
