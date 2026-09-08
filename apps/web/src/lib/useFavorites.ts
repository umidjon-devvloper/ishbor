import { useCallback, useEffect, useState } from "react";
import { addFavorite, fetchFavoriteIds, removeFavorite } from "./apiExtra.js";
import { useAuth } from "../components/AuthContext.js";

/**
 * Sevimli vakansiyalar to'plami (ID'lar) va ularni almashtirish.
 *
 * Ro'yxat va qidiruv sahifalarida yuraklarni bo'yash uchun bir marta yuklanadi.
 * Bosilganda UI darrov o'zgaradi (optimistik), server javobi kelmasa oldingi
 * holatga qaytadi — sekin internetda ham tugma "o'lik" bo'lib qolmaydi.
 */
export function useFavorites() {
  const { status, user, accessToken } = useAuth();
  const enabled = status === "authed" && user?.role === "job_seeker" && Boolean(accessToken);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled || !accessToken) {
      setIds(new Set());
      setReady(false);
      return;
    }
    let cancelled = false;
    fetchFavoriteIds(accessToken)
      .then((list) => {
        if (!cancelled) {
          setIds(new Set(list));
          setReady(true);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled, accessToken]);

  const toggle = useCallback(
    async (vacancyId: string) => {
      if (!enabled || !accessToken) return false;
      const wasFavorite = ids.has(vacancyId);

      setIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(vacancyId);
        else next.add(vacancyId);
        return next;
      });

      try {
        if (wasFavorite) await removeFavorite(accessToken, vacancyId);
        else await addFavorite(accessToken, vacancyId);
        return !wasFavorite;
      } catch {
        // Server rad etdi — belgini orqaga qaytaramiz
        setIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(vacancyId);
          else next.delete(vacancyId);
          return next;
        });
        return wasFavorite;
      }
    },
    [enabled, accessToken, ids]
  );

  return {
    /** Faqat ish izlovchi kirgan bo'lsa yuraklar ko'rsatiladi. */
    enabled,
    ready,
    ids,
    isFavorite: useCallback((id: string) => ids.has(id), [ids]),
    toggle,
  };
}
