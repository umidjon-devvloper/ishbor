import { useCallback, useEffect, useState } from "react";
import { fetchInboxSummary } from "./api.js";
import { INBOX_CHANGED } from "./messages/events.js";
import type { InboxSummary } from "./types.js";

const EMPTY: InboxSummary = { unreadMessages: 0, newApplications: 0 };

/**
 * Header uchun o'qilmagan xabarlar + yangi arizalar sonini oladi.
 * Mount'da bir marta yuklab, keyin har ~20 soniyada yangilab turadi.
 */
export function useInboxSummary(token: string | null) {
  const [summary, setSummary] = useState<InboxSummary>(EMPTY);

  const refresh = useCallback(() => {
    if (!token) {
      setSummary(EMPTY);
      return;
    }
    fetchInboxSummary(token).then(setSummary).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) {
      setSummary(EMPTY);
      return;
    }
    refresh();
    const id = window.setInterval(refresh, 20000);
    // Boshqa sahifadan qaytganda va /messages'da suhbat o'qilganda darrov yangilash uchun
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener(INBOX_CHANGED, onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(INBOX_CHANGED, onFocus);
    };
  }, [token, refresh]);

  return { summary, refresh };
}
