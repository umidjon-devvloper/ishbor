import React, { useEffect, useState } from "react";
import { VacancyCard } from "../../components/VacancyCard.js";
import { VacancyCardSkeleton, SkeletonGrid } from "../../components/Skeleton.js";
import { useT, useHref } from "../../lib/i18n/index.js";
import { useAuth } from "../../components/AuthContext.js";
import { useRequireRole } from "../../lib/useRoleGuard.js";
import { fetchFavorites, removeFavorite } from "../../lib/apiExtra.js";
import type { FavoriteVacancy } from "../../lib/types.js";

/** Ish izlovchi saqlab qo'ygan vakansiyalar. */
export default function Page() {
  const t = useT();
  const l = useHref();
  const { status, user, accessToken } = useAuth();
  useRequireRole("job_seeker", "/employer/candidates");

  const [items, setItems] = useState<FavoriteVacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authed" || user?.role !== "job_seeker" || !accessToken) return;
    let cancelled = false;
    setLoading(true);
    fetchFavorites(accessToken)
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, user, accessToken]);

  async function drop(vacancyId: string) {
    if (!accessToken) return;
    const previous = items;
    setItems((prev) => prev.filter((v) => v.id !== vacancyId));
    try {
      await removeFavorite(accessToken, vacancyId);
    } catch {
      setItems(previous);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-2 text-sm text-dusk">
        <a href={l("/")} className="hover:text-signal">
          {t.search.breadcrumbHome}
        </a>{" "}
        / {t.favorites.title}
      </div>
      <h1 className="font-display text-2xl font-700 text-ink sm:text-3xl">{t.favorites.title}</h1>
      <p className="mt-1 text-sm text-dusk">
        {loading ? t.favorites.subtitle : t.favorites.count(items.length)}
      </p>

      <div className="mt-7">
        {loading ? (
          <SkeletonGrid count={4} Item={VacancyCardSkeleton} className="grid grid-cols-1 gap-4 sm:grid-cols-2" />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="font-display text-base font-600 text-ink">{t.favorites.empty}</p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-dusk">{t.favorites.emptyHint}</p>
            <a
              href={l("/search/vacancy")}
              className="mt-5 inline-block rounded-xl bg-signal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-signal-dark"
            >
              {t.favorites.browse}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((vacancy, i) => (
              <div key={vacancy.id} className="relative">
                {vacancy.isClosed && (
                  <span className="absolute right-4 top-4 z-20 rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-700 uppercase tracking-wide text-dusk">
                    {t.favorites.closed}
                  </span>
                )}
                <VacancyCard
                  vacancy={vacancy}
                  index={i}
                  favorite
                  onToggleFavorite={() => drop(vacancy.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
