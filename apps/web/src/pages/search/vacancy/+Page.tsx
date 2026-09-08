import React, { useState } from "react";
import { useData } from "vike-react/useData";
import type { data } from "./+data.js";
import { FilterSidebar, type FilterValues } from "../../../components/FilterSidebar.js";
import { VacancyCard } from "../../../components/VacancyCard.js";
import { SaveSearchButton } from "../../../components/SaveSearchButton.js";
import { VacancyCardSkeleton, SkeletonGrid } from "../../../components/Skeleton.js";
import { fetchVacancies, type VacancyQuery } from "../../../lib/api.js";
import type { Vacancy, ExperienceLevel, EmploymentType } from "../../../lib/types.js";
import { useT, useHref } from "../../../lib/i18n/index.js";
import { useRedirectRole } from "../../../lib/useRoleGuard.js";
import { useFavorites } from "../../../lib/useFavorites.js";

type SortValue = NonNullable<VacancyQuery["sort"]>;

export default function Page() {
  const initial = useData<Awaited<ReturnType<typeof data>>>();
  const t = useT();
  const l = useHref();

  // Ish beruvchi ish qidirish sahifasiga emas, nomzodlar sahifasiga o'tadi
  useRedirectRole("employer", "/employer/candidates");
  const favorites = useFavorites();

  const [results, setResults] = useState<Vacancy[]>(initial.items);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const [appliedText, setAppliedText] = useState(initial.params.text ?? "");
  const [textInput, setTextInput] = useState(initial.params.text ?? "");
  // URL'dagi saralash server tomonda ham qo'llangan — tanlov ro'yxati unga mos
  // turishi kerak, aks holda havola ochilganda "mosligi bo'yicha" ko'rinardi.
  const [sort, setSort] = useState<SortValue>(initial.params.sort ?? "relevance");
  const [filters, setFilters] = useState<FilterValues>({
    experience: (initial.params.experience as ExperienceLevel) ?? "",
    employment: (initial.params.employment as EmploymentType) ?? "",
    salaryFrom: initial.params.salary ?? "",
    salaryTo: initial.params.salaryTo ?? "",
  });

  /** Joriy holatdan API/obuna uchun bir xil parametrlar to'plamini yasaydi. */
  function buildParams(text: string, f: FilterValues, sortValue: SortValue): VacancyQuery {
    return {
      text: text || undefined,
      categorySlug: initial.params.categorySlug || undefined,
      area: initial.params.area || undefined,
      experience: f.experience || undefined,
      employment: f.employment || undefined,
      salary: f.salaryFrom || undefined,
      salaryTo: f.salaryTo || undefined,
      sort: sortValue === "relevance" ? undefined : sortValue,
    };
  }

  async function runSearch(text: string, f: FilterValues, sortValue: SortValue = sort) {
    setLoading(true);
    setAppliedText(text);
    const params = buildParams(text, f, sortValue);

    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, String(v));
    });
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", l(`/search/vacancy${qs.toString() ? `?${qs}` : ""}`));
    }

    const { items, total: serverTotal } = await fetchVacancies(params);
    setResults(items);
    setTotal(serverTotal);
    setLoading(false);
  }

  function clearAll() {
    const empty: FilterValues = { experience: "", employment: "", salaryFrom: "", salaryTo: "" };
    setFilters(empty);
    setTextInput("");
    runSearch("", empty);
  }

  const hasFilters = Boolean(
    appliedText || filters.experience || filters.employment || filters.salaryFrom
  );

  // Obuna uchun — API'dagi kalitlar bilan bir xil nomlar
  const alertParams = {
    text: appliedText || undefined,
    categorySlug: initial.params.categorySlug || undefined,
    area: initial.params.area || undefined,
    experience: filters.experience || undefined,
    employment: filters.employment || undefined,
    salary: filters.salaryFrom ? Number(filters.salaryFrom) : undefined,
    salaryTo: filters.salaryTo ? Number(filters.salaryTo) : undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-2 text-sm text-dusk">
        <a href={l("/")} className="hover:text-signal">
          {t.search.breadcrumbHome}
        </a>{" "}
        / {t.search.breadcrumbVacancies}
      </div>
      <h1 className="font-display text-2xl font-700 text-ink sm:text-3xl">
        {appliedText ? t.search.titleQuery(appliedText) : t.search.titleAll}
      </h1>
      <p className="mt-1 text-sm text-dusk">{t.search.found(total)}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(textInput, filters);
        }}
        className="mt-5 flex max-w-2xl gap-2"
      >
        <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface px-4 focus-within:border-signal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-dusk" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={t.home.searchPlaceholder}
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

      {hasFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {appliedText && <Chip label={`"${appliedText}"`} />}
          {filters.experience && <Chip label={t.enums.experience[filters.experience]} />}
          {filters.employment && <Chip label={t.enums.employment[filters.employment]} />}
          {filters.salaryFrom && <Chip label={t.search.salaryChip(filters.salaryFrom)} />}
          <button onClick={clearAll} className="text-xs font-medium text-dusk hover:text-signal">
            {t.search.clear}
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-dusk">
          {t.sortLabels.label}
          <select
            value={sort}
            onChange={(e) => {
              const next = e.target.value as SortValue;
              setSort(next);
              void runSearch(appliedText, filters, next);
            }}
            className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-signal focus:outline-none"
          >
            <option value="relevance">{t.sortLabels.relevance}</option>
            <option value="date">{t.sortLabels.date}</option>
            <option value="salary_desc">{t.sortLabels.salaryDesc}</option>
            <option value="salary_asc">{t.sortLabels.salaryAsc}</option>
          </select>
        </label>

        <SaveSearchButton
          params={alertParams}
          defaultName={appliedText || t.search.titleAll}
        />
      </div>

      <div className="mt-5 flex flex-col gap-8 lg:flex-row">
        <FilterSidebar value={filters} onChange={setFilters} onApply={() => runSearch(textInput, filters)} />

        <div className="flex-1">
          {loading ? (
            <SkeletonGrid count={6} Item={VacancyCardSkeleton} className="grid grid-cols-1 gap-3" />
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-10 text-center">
              <p className="font-display text-lg font-600 text-ink">{t.search.emptyTitle}</p>
              <p className="mt-1 text-sm text-dusk">{t.search.emptyDesc}</p>
              <button onClick={clearAll} className="mt-4 inline-block text-sm font-medium text-signal hover:underline">
                {t.search.emptyCta}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {results.map((v, i) => (
                <VacancyCard
                  key={v.id}
                  vacancy={v}
                  index={i}
                  favorite={favorites.enabled ? favorites.isFavorite(v.id) : undefined}
                  onToggleFavorite={favorites.enabled ? favorites.toggle : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink">
      {label}
    </span>
  );
}
