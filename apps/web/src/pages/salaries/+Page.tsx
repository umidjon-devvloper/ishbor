import React from "react";
import { useData } from "vike-react/useData";
import type { data } from "./+data.js";
import { useT, useHref } from "../../lib/i18n/index.js";
import { formatNumber } from "../../lib/format.js";
import type { SalaryGroup } from "../../lib/types.js";

/**
 * Maosh statistikasi — saytdagi real vakansiyalar asosida.
 * Filtrlar URL query'da saqlanadi, shuning uchun har bir kesim alohida
 * indekslanadigan sahifa bo'ladi (masalan /salaries?categorySlug=it).
 */
export default function Page() {
  const { stats, categories, regions, params } = useData<Awaited<ReturnType<typeof data>>>();
  const t = useT();
  const l = useHref();

  const { summary, distribution, byCategory, byRegion } = stats;
  const hasData = summary.count > 0;
  const maxBucket = Math.max(1, ...distribution.map((b) => b.count));

  /** Filtrni URL orqali almashtiradi (SSR qayta yuklanadi). */
  function applyFilter(key: "categorySlug" | "area", value: string) {
    const next = new URLSearchParams();
    const merged = { ...params, [key]: value } as Record<string, string | undefined>;
    for (const [k, v] of Object.entries(merged)) {
      if (v) next.set(k, v);
    }
    const qs = next.toString();
    window.location.assign(l(`/salaries${qs ? `?${qs}` : ""}`));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-2 text-sm text-dusk">
        <a href={l("/")} className="hover:text-signal">
          {t.search.breadcrumbHome}
        </a>{" "}
        / {t.salaries.breadcrumb}
      </div>
      <h1 className="font-display text-2xl font-700 text-ink sm:text-3xl">{t.salaries.title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-dusk">{t.salaries.subtitle}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <FilterSelect
          label={t.salaries.allCategories}
          value={params.categorySlug ?? ""}
          options={categories.map((c) => ({ value: c.slug, label: c.name }))}
          onChange={(v) => applyFilter("categorySlug", v)}
        />
        <FilterSelect
          label={t.salaries.allRegions}
          value={params.area ?? ""}
          options={regions.map((r) => ({ value: r.slug, label: r.name }))}
          onChange={(v) => applyFilter("area", v)}
        />
      </div>

      {!hasData ? (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-10 text-center">
          <p className="font-display text-base font-600 text-ink">{t.salaries.noData}</p>
          <p className="mt-1.5 text-sm text-dusk">{t.salaries.noDataHint}</p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-xs uppercase tracking-wide text-dusk">
            {t.salaries.basedOn(summary.count)}
          </p>

          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <StatCard
              label={t.salaries.median}
              value={`${formatNumber(summary.median)} ${t.fmt.currency}`}
              hint={t.salaries.medianHint}
              accent
            />
            <StatCard
              label={t.salaries.average}
              value={`${formatNumber(summary.average)} ${t.fmt.currency}`}
              hint={t.salaries.averageHint}
            />
            <StatCard
              label={t.salaries.middleRange}
              value={`${formatNumber(summary.p25)} – ${formatNumber(summary.p75)}`}
              hint={t.salaries.middleRangeHint}
            />
          </div>

          <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-base font-700 text-ink">{t.salaries.distribution}</h2>
            <p className="mt-1 text-sm text-dusk">{t.salaries.distributionHint}</p>

            <ul className="mt-5 space-y-3">
              {distribution.map((bucket) => (
                <li key={bucket.label} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-right font-mono text-xs text-dusk">
                    {bucket.label}
                  </span>
                  <span className="h-6 flex-1 overflow-hidden rounded-md bg-surface-2">
                    <span
                      className="block h-full rounded-md bg-signal/70 transition-all duration-500"
                      style={{ width: `${Math.round((bucket.count / maxBucket) * 100)}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 font-mono text-xs text-ink">{bucket.count}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <GroupTable title={t.salaries.byCategory} rows={byCategory} />
            <GroupTable title={t.salaries.byRegion} rows={byRegion} />
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? "border-signal/40 bg-signal/[0.05]" : "border-line bg-surface"
      }`}
    >
      <p className="text-xs font-600 uppercase tracking-wide text-dusk">{label}</p>
      <p className="mt-1.5 font-display text-xl font-700 text-ink">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-dusk">{hint}</p>
    </div>
  );
}

function GroupTable({ title, rows }: { title: string; rows: SalaryGroup[] }) {
  const t = useT();
  if (rows.length === 0) return null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-base font-700 text-ink">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-dusk">
              <th className="py-2 pr-3 font-600">{t.salaries.columnName}</th>
              <th className="px-2 py-2 text-right font-600">{t.salaries.columnMedian}</th>
              <th className="px-2 py-2 text-right font-600">{t.salaries.columnAverage}</th>
              <th className="pl-2 py-2 text-right font-600">{t.salaries.columnCount}</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map((row) => (
              <tr key={row.slug} className="border-b border-line/60 last:border-0">
                <td className="py-2.5 pr-3 text-ink">{row.name}</td>
                <td className="px-2 py-2.5 text-right font-mono text-[13px] text-growth">
                  {formatNumber(row.median)}
                </td>
                <td className="px-2 py-2.5 text-right font-mono text-[13px] text-dusk">
                  {formatNumber(row.average)}
                </td>
                <td className="py-2.5 pl-2 text-right text-dusk">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-signal focus:outline-none"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
