import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSavedCompanyIds, saveCompany, unsaveCompany } from "../apiExtra.js";
import { useAuth } from "../../components/AuthContext.js";

/**
 * Saqlangan kompaniyalar (ID to'plami) — kartalardagi yurakchalar uchun.
 * Vakansiyalar sevimlilari (useFavorites) bilan bir xil naqsh: bir marta
 * yuklanadi, bosilganda optimistik almashadi, server rad etsa qaytariladi.
 */
export function useSavedCompanies() {
  const { status, user, accessToken } = useAuth();
  const enabled = status === "authed" && user?.role === "job_seeker" && Boolean(accessToken);
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !accessToken) {
      setIds(new Set());
      return;
    }
    let cancelled = false;
    fetchSavedCompanyIds(accessToken)
      .then((list) => {
        if (!cancelled) setIds(new Set(list));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled, accessToken]);

  // toggle barqaror bo'lsin (kartalar memo) — joriy to'plam ref orqali o'qiladi
  const idsRef = useRef(ids);
  idsRef.current = ids;

  const toggle = useCallback(
    async (companyId: string) => {
      if (!enabled || !accessToken) return;
      const wasSaved = idsRef.current.has(companyId);
      const flip = (add: boolean) =>
        setIds((prev) => {
          const next = new Set(prev);
          if (add) next.add(companyId);
          else next.delete(companyId);
          return next;
        });

      flip(!wasSaved);
      try {
        if (wasSaved) await unsaveCompany(accessToken, companyId);
        else await saveCompany(accessToken, companyId);
      } catch {
        flip(wasSaved);
      }
    },
    [enabled, accessToken]
  );

  return {
    /** Faqat ish izlovchi saqlay oladi; mehmonga kirish taklif qilinadi. */
    enabled,
    authLoading: status === "loading",
    accessToken,
    isSaved: useCallback((id: string) => ids.has(id), [ids]),
    toggle,
  };
}
