import React from "react";
import { useData } from "vike-react/useData";
import type { data } from "./+data.js";
import { VacancyCard } from "../../../components/VacancyCard.js";
import { CompanyReviews } from "../../../components/CompanyReviews.js";
import { PhoneGateNotice, isPhoneGateError } from "../../../components/PhoneGateNotice.js";
import { useT, useHref } from "../../../lib/i18n/index.js";
import { useAuth } from "../../../components/AuthContext.js";
import { startConversation } from "../../../lib/api.js";

export default function Page() {
  const { company, vacancies, reviews } = useData<Awaited<ReturnType<typeof data>>>();
  const t = useT();
  const l = useHref();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-5 text-sm text-dusk">
        <a href={l("/")} className="hover:text-signal">
          {t.search.breadcrumbHome}
        </a>{" "}
        /{" "}
        <a href={l("/companies")} className="hover:text-signal">
          {t.companies.breadcrumb}
        </a>{" "}
        / <span className="text-ink">{company.name}</span>
      </div>

      <div className="flex animate-fade-up flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-2 font-display text-2xl font-700 text-ink">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt="" width={64} height={64} decoding="async" className="h-full w-full object-cover" />
            ) : (
              company.name.charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-700 text-ink">{company.name}</h1>
              {company.isVerified && (
                <span className="rounded-md bg-growth/10 px-2 py-0.5 text-[11px] font-700 uppercase tracking-wide text-growth">
                  {t.company.verified}
                </span>
              )}
            </div>
            {company.reviewCount > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-dusk">
                <span className="text-gold" aria-hidden>{"★".repeat(Math.round(company.rating))}</span>
                <span>
                  {company.rating.toFixed(1)} · {t.company.reviews(company.reviewCount)}
                </span>
              </div>
            )}
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/75">{company.description}</p>
            <MessageCompanyButton slug={company.slug} />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-surface-2 p-4 text-sm sm:w-56 sm:shrink-0">
          <Meta label={t.company.metaIndustry} value={company.industry} />
          <Meta label={t.company.metaRegion} value={company.regionName} />
          <Meta label={t.company.metaEmployees} value={company.employeeCount} />
          <Meta label={t.company.metaFounded} value={company.foundedYear ? String(company.foundedYear) : null} />
        </dl>
      </div>

      <h2 className="mt-10 font-display text-xl font-700 text-ink">
        {t.company.activeVacancies(vacancies.length)}
      </h2>
      {vacancies.length === 0 ? (
        <p className="mt-3 text-sm text-dusk">{t.company.noVacancies}</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {vacancies.map((v, i) => (
            <VacancyCard key={v.id} vacancy={v} index={i} />
          ))}
        </div>
      )}

      <CompanyReviews slug={company.slug} initialReviews={reviews} />
    </div>
  );
}

function MessageCompanyButton({ slug }: { slug: string }) {
  const t = useT();
  const l = useHref();
  const { status, accessToken, user } = useAuth();
  const [busy, setBusy] = React.useState(false);
  const [gated, setGated] = React.useState(false);
  if (status !== "authed" || user?.role !== "job_seeker" || !accessToken) return null;

  async function onClick() {
    if (!accessToken) return;
    setBusy(true);
    try {
      const id = await startConversation(accessToken, { companySlug: slug });
      window.location.assign(l(`/messages?c=${id}`));
    } catch (err) {
      if (isPhoneGateError(err)) setGated(true);
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={onClick}
        disabled={busy}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-signal-dark hover:shadow-sm active:scale-[0.98] disabled:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        {t.candidatesPage.message}
      </button>
      {gated && <PhoneGateNotice className="mt-3 max-w-md" />}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-dusk">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value ?? "—"}</dd>
    </div>
  );
}
