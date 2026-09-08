import React, { useState } from "react";
import { useData } from "vike-react/useData";
import type { data } from "./+data.js";
import { CompanyCard } from "../../components/CompanyCard.js";
import { CompanyCardSkeleton, SkeletonGrid } from "../../components/Skeleton.js";
import { fetchCompanies } from "../../lib/api.js";
import type { Company } from "../../lib/types.js";
import { useT, useHref } from "../../lib/i18n/index.js";
import { useRedirectRole } from "../../lib/useRoleGuard.js";

export default function Page() {
  const initial = useData<Awaited<ReturnType<typeof data>>>();
  const t = useT();
  const l = useHref();
  useRedirectRole("employer", "/employer/candidates");
  const [companies, setCompanies] = useState<Company[]>(initial.companies);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await fetchCompanies(text || undefined);
    setCompanies(result);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-2 text-sm text-dusk">
        <a href={l("/")} className="hover:text-signal">
          {t.search.breadcrumbHome}
        </a>{" "}
        / {t.companies.breadcrumb}
      </div>
      <h1 className="font-display text-2xl font-700 text-ink sm:text-3xl">{t.companies.title}</h1>
      <p className="mt-1 text-sm text-dusk">{t.companies.subtitle(companies.length)}</p>

      <form onSubmit={runSearch} className="mt-5 flex max-w-xl gap-2">
        <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface px-4 focus-within:border-signal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-dusk" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.companies.searchPlaceholder}
            className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-dusk focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-11 shrink-0 rounded-xl bg-signal px-5 text-sm font-semibold text-white transition-colors hover:bg-signal-dark"
        >
          {t.home.searchButton}
        </button>
      </form>

      <div className="mt-7">
        {loading ? (
          <SkeletonGrid count={6} Item={CompanyCardSkeleton} className="grid grid-cols-1 gap-4 sm:grid-cols-2" />
        ) : companies.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-dusk">
            {t.companies.empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {companies.map((c, i) => (
              <CompanyCard key={c.slug} company={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
