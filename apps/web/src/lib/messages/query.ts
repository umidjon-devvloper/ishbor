import { normalizeSearch, searchWords } from "../list.js";
import type { ConversationView } from "./adapter.js";

/**
 * `/messages` holati URL'da: `?c=<suhbat id>&unread=true&q=...`.
 * `?c=` — mavjud arxitektura (arizalar, kompaniya va nomzodlar sahifalaridagi
 * "Yozish" tugmalari shu manzilga olib keladi), shuning uchun nomi o'zgarmaydi.
 */
export interface MessagesQuery {
  conversation: string | null;
  unread: boolean;
  q: string;
}

type SearchSource = URLSearchParams | Record<string, string | undefined>;

function read(source: SearchSource, key: string): string | undefined {
  return source instanceof URLSearchParams ? source.get(key) ?? undefined : source[key];
}

export function parseMessagesQuery(source: SearchSource): MessagesQuery {
  const conversation = read(source, "c")?.trim().slice(0, 64);
  const unread = read(source, "unread")?.trim().toLowerCase();
  return {
    conversation: conversation || null,
    unread: unread === "true" || unread === "1",
    q: (read(source, "q") ?? "").slice(0, 100),
  };
}

/** Standart qiymatlar URL'ga yozilmaydi: `/messages` — toza manzil. */
export function messagesSearch(query: MessagesQuery): string {
  const params = new URLSearchParams();
  if (query.conversation) params.set("c", query.conversation);
  if (query.unread) params.set("unread", "true");
  if (query.q.trim()) params.set("q", query.q.trim());
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** Qidiruv: suhbatdosh nomi, kompaniya, soha, lavozim, vakansiya va oxirgi xabar bo'yicha. */
export function filterConversations(items: ConversationView[], query: Pick<MessagesQuery, "unread" | "q">): ConversationView[] {
  const words = searchWords(query.q);
  return items.filter((item) => {
    if (query.unread && item.unread === 0) return false;
    if (words.length === 0) return true;
    const haystack = normalizeSearch(
      [item.title, item.headline, item.company?.name, item.company?.industry, item.vacancy?.title, item.lastMessage].filter(Boolean).join(" ")
    );
    return words.every((word) => haystack.includes(word));
  });
}
