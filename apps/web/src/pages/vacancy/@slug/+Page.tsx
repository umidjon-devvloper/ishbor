import React, { useState } from "react";
import { useData } from "vike-react/useData";
import type { data } from "./+data.js";
import { formatSalary, formatRelativeDays } from "../../../lib/format.js";
import { useT, useHref } from "../../../lib/i18n/index.js";
import { useAuth } from "../../../components/AuthContext.js";
import { applyToVacancy } from "../../../lib/api.js";
import { useFavorites } from "../../../lib/useFavorites.js";
import { PhoneGateNotice, isPhoneGateError } from "../../../components/PhoneGateNotice.js";

type ApplyState = "idle" | "applying" | "done" | "error" | "gated";

export default function Page() {
  const vacancy = useData<Awaited<ReturnType<typeof data>>>();
  const t = useT();
  const l = useHref();
  const { status, accessToken, user } = useAuth();
  const [applyState, setApplyState] = useState<ApplyState>("idle");
  const isEmployer = status === "authed" && user?.role === "employer";
  const favorites = useFavorites();

  async function handleApply() {
    if (status !== "authed" || !accessToken) {
      window.location.assign(l("/login"));
      return;
    }
    setApplyState("applying");
    try {
      await applyToVacancy(vacancy.id, accessToken);
      setApplyState("done");
    } catch (err) {
      setApplyState(isPhoneGateError(err) ? "gated" : "error");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-5 text-sm text-dusk">
        <a href={l("/")} className="hover:text-signal">
          {t.search.breadcrumbHome}
        </a>{" "}
        /{" "}
        <a href={l("/search/vacancy")} className="hover:text-signal">
          {t.search.breadcrumbVacancies}
        </a>{" "}
        / <span className="text-ink">{vacancy.title}</span>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 animate-fade-up">
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {vacancy.isPremium && (
                <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[11px] font-700 uppercase tracking-wide text-gold-deep">
                  {t.vacancyCard.premium}
                </span>
              )}
              {vacancy.isUrgent && (
                <span className="rounded-md bg-signal/10 px-2 py-0.5 text-[11px] font-700 uppercase tracking-wide text-signal">
                  {t.vacancyCard.urgent}
                </span>
              )}
              <span className="text-sm text-dusk">
                {formatRelativeDays(vacancy.publishedAt, t.fmt)} {t.vacancy.posted}
              </span>
            </div>

            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-2 font-display text-2xl font-700 text-ink">
                {vacancy.companyLogoUrl ? (
                  <img src={vacancy.companyLogoUrl} alt="" width={56} height={56} decoding="async" className="h-full w-full object-cover" />
                ) : (
                  vacancy.companyName.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-700 leading-tight text-ink sm:text-3xl">
                  {vacancy.title}
                </h1>
                <a
                  href={l(`/employer/${vacancy.companySlug}`)}
                  className="mt-1 inline-block text-sm font-medium text-dusk transition-colors hover:text-signal"
                >
                  {vacancy.companyName}
                  {vacancy.regionName ? ` · ${vacancy.regionName}` : ""}
                </a>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-growth/10 px-3 py-1.5 font-mono text-base font-600 text-growth">
                {formatSalary(vacancy.salaryMin, vacancy.salaryMax, t.fmt, vacancy.isSalaryHidden)}
              </span>
              <Pill>{t.enums.experience[vacancy.experienceRequired]}</Pill>
              <Pill>{t.enums.employment[vacancy.employmentType]}</Pill>
            </div>
          </div>

          {vacancy.description && (
            <Section title={t.vacancy.descriptionTitle}>
              <p className="leading-relaxed text-ink/80">{vacancy.description}</p>
            </Section>
          )}

          {vacancy.requirements.length > 0 && (
            <Section title={t.vacancy.requirementsTitle}>
              <ul className="space-y-2.5">
                {vacancy.requirements.map((r) => (
                  <li key={r} className="flex gap-3 text-ink/80">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                    {r}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {vacancy.conditions.length > 0 && (
            <Section title={t.vacancy.conditionsTitle}>
              <ul className="space-y-2.5">
                {vacancy.conditions.map((c) => (
                  <li key={c} className="flex gap-3 text-ink/80">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-growth" />
                    {c}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* Yon panel */}
        <aside style={{ animationDelay: "100ms" }} className="w-full shrink-0 animate-fade-up lg:w-80">
          <div className="sticky top-24 rounded-2xl border border-line bg-surface p-6">
            {isEmployer ? (
              <div className="rounded-xl bg-surface-2 px-4 py-3 text-center text-sm text-dusk">
                {t.vacancy.employerCannotApply}
              </div>
            ) : applyState === "done" ? (
              <div className="rounded-xl bg-growth/10 px-4 py-3 text-center text-sm font-medium text-growth">
                {t.vacancy.applied}
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={applyState === "applying"}
                className="glow-signal w-full rounded-xl bg-signal py-3 text-sm font-semibold text-white hover:bg-signal-dark active:scale-[0.98] disabled:opacity-60"
              >
                {applyState === "applying" ? t.vacancy.applying : t.vacancy.apply}
              </button>
            )}
            {applyState === "error" && (
              <p className="mt-2 text-center text-xs text-signal">{t.vacancy.applyError}</p>
            )}
            {applyState === "gated" && <PhoneGateNotice className="mt-3" />}
            {!isEmployer && <p className="mt-2 text-center text-xs text-dusk">{t.vacancy.applyNote}</p>}

            {favorites.enabled && (
              <button
                type="button"
                onClick={() => void favorites.toggle(vacancy.id)}
                aria-pressed={favorites.isFavorite(vacancy.id)}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                  favorites.isFavorite(vacancy.id)
                    ? "border-signal/40 bg-signal/10 text-signal"
                    : "border-line text-ink hover:border-signal hover:text-signal"
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={favorites.isFavorite(vacancy.id) ? "currentColor" : "none"}
                  aria-hidden
                >
                  <path
                    d="M12 20.5l-1.45-1.32C5.4 14.5 2 11.4 2 7.6 2 4.8 4.2 2.6 7 2.6c1.6 0 3.1.74 4 1.93.9-1.19 2.4-1.93 4-1.93 2.8 0 5 2.2 5 5 0 3.8-3.4 6.9-8.55 11.6L12 20.5z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
                {favorites.isFavorite(vacancy.id) ? t.favorites.remove : t.favorites.add}
              </button>
            )}

            {(vacancy.contactEmail || vacancy.contactTelegram || vacancy.contactPhone) && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm font-semibold text-ink">{t.vacancy.contactsTitle}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {vacancy.contactPhone && (
                    <ContactRow href={`tel:${vacancy.contactPhone.replace(/[^+\d]/g, "")}`} label={vacancy.contactPhone}>
                      <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </ContactRow>
                  )}
                  {vacancy.contactTelegram && (
                    <ContactRow href={`https://t.me/${vacancy.contactTelegram.replace(/^@+/, "")}`} label={`@${vacancy.contactTelegram.replace(/^@+/, "")}`} external>
                      <path d="M21 4.5L3.5 11l5.2 1.9L10.5 19l3-3.6 4.4 3.1L21 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </ContactRow>
                  )}
                  {vacancy.contactEmail && (
                    <ContactRow href={`mailto:${vacancy.contactEmail}`} label={vacancy.contactEmail}>
                      <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </ContactRow>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-line pt-6">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-surface-2 font-display text-lg font-700 text-ink">
                {vacancy.companyLogoUrl ? (
                  <img src={vacancy.companyLogoUrl} alt="" width={48} height={48} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                ) : (
                  vacancy.companyName.charAt(0)
                )}
              </div>
              <a
                href={l(`/employer/${vacancy.companySlug}`)}
                className="mt-3 block font-display text-sm font-600 text-ink transition-colors hover:text-signal"
              >
                {vacancy.companyName}
              </a>
              {vacancy.companyReviewCount > 0 && (
                <div className="mt-1 flex items-center gap-1 text-xs text-dusk">
                  <span className="text-gold" aria-hidden>{"★".repeat(Math.round(vacancy.companyRating))}</span>
                  <span>
                    {t.vacancy.reviewLabel(vacancy.companyRating.toFixed(1), vacancy.companyReviewCount)}
                  </span>
                </div>
              )}
              <a
                href={l(`/employer/${vacancy.companySlug}`)}
                className="mt-3 inline-block text-sm font-medium text-dusk transition-colors hover:text-signal"
              >
                {t.vacancy.viewAllVacancies}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h2 className="flex items-center gap-3 font-display text-lg font-600 text-ink">
        <span className="h-5 w-1 shrink-0 rounded bg-gold" aria-hidden />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Bog'lanish qatori: ikonka + havola (tel:/mailto:/t.me). */
function ContactRow({
  href,
  label,
  external = false,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/60 px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-signal/40 hover:text-signal"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0 text-dusk transition-colors group-hover:text-signal" aria-hidden>
        {children}
      </svg>
      <span className="truncate">{label}</span>
    </a>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm font-medium text-dusk">{children}</span>
  );
}
