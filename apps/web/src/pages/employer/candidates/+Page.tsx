import React, { useEffect, useState } from "react";
import { useT, useHref } from "../../../lib/i18n/index.js";
import { useAuth } from "../../../components/AuthContext.js";
import { Skeleton } from "../../../components/Skeleton.js";
import { fetchCandidates, startConversation } from "../../../lib/api.js";
import { StarRating } from "../../../components/StarRating.js";
import { PhoneGateNotice, isPhoneGateError } from "../../../components/PhoneGateNotice.js";
import { useRequireRole } from "../../../lib/useRoleGuard.js";
import type { Candidate, ApplicantResume } from "../../../lib/types.js";

const fmtYm = (iso: string) => iso.slice(0, 7).replace("-", ".");

function candName(c: Candidate) {
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email;
}

export default function Page() {
  const t = useT();
  const l = useHref();
  const { status, accessToken, user } = useAuth();
  useRequireRole("employer", "/");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [gated, setGated] = useState(false);

  useEffect(() => {
    if (status !== "authed" || user?.role !== "employer" || !accessToken) return;
    fetchCandidates(accessToken).then((c) => {
      setItems(c);
      setLoading(false);
    });
  }, [status, accessToken, user]);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!accessToken) return;
    setLoading(true);
    setActiveId(null);
    const c = await fetchCandidates(accessToken, q.trim() || undefined);
    setItems(c);
    setLoading(false);
  }

  async function openChat(candidateUserId: string) {
    if (!accessToken) return;
    try {
      const id = await startConversation(accessToken, { candidateUserId });
      window.location.assign(l(`/messages?c=${id}`));
    } catch (err) {
      if (isPhoneGateError(err)) setGated(true);
    }
  }

  const active = items.find((c) => c.userId === activeId) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-700 text-ink sm:text-3xl">{t.candidatesPage.title}</h1>
        <p className="mt-1 text-sm text-dusk">{t.candidatesPage.subtitle}</p>
      </div>

      {gated && <PhoneGateNotice className="mb-5" />}

      <form onSubmit={runSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dusk"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.candidatesPage.searchPlaceholder}
            className="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-dusk focus:border-signal focus:outline-none focus:ring-4 focus:ring-signal/10"
          />
        </div>
        <button
          type="submit"
          className="h-12 shrink-0 rounded-xl bg-signal px-6 text-sm font-semibold text-white transition-all hover:bg-signal-dark hover:shadow-sm active:scale-[0.98]"
        >
          {t.candidatesPage.searchButton}
        </button>
      </form>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="animate-fade-up rounded-2xl border border-line bg-surface p-12 text-center">
          <p className="font-display text-lg font-600 text-ink">{t.candidatesPage.empty}</p>
          <p className="mt-1 text-sm text-dusk">{t.candidatesPage.emptyHint}</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs font-600 uppercase tracking-wide text-dusk">
            {t.candidatesPage.resultsCount(items.length)}
          </p>
          <div className="grid min-h-[60vh] grid-cols-1 overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-[minmax(300px,360px)_1fr]">
            {/* Ro'yxat */}
            <div className={`flex-col border-line md:flex md:border-r ${activeId ? "hidden" : "flex"}`}>
              <div className="max-h-[70vh] flex-1 overflow-y-auto">
                {items.map((c) => {
                  const name = candName(c);
                  return (
                    <button
                      key={c.userId}
                      onClick={() => setActiveId(c.userId)}
                      className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors hover:bg-surface-2 ${
                        c.userId === activeId ? "bg-surface-2" : ""
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display text-sm font-700 text-ink">
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-600 text-ink">{name}</span>
                          {c.ratingAvg !== null && c.ratingCount > 0 && (
                            <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-600 text-gold-deep">
                              <span aria-hidden className="text-gold">★</span>
                              {c.ratingAvg.toFixed(1)}
                            </span>
                          )}
                        </span>
                        {c.headline && <span className="block truncate text-xs text-dusk">{c.headline}</span>}
                        {c.regionName && <span className="block truncate text-[11px] text-dusk">{c.regionName}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detal */}
            <div className={`flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
              {active ? (
                <CandidateDetail c={active} onBack={() => setActiveId(null)} onChat={() => openChat(active.userId)} />
              ) : (
                <div className="flex h-full items-center justify-center p-10 text-sm text-dusk">
                  {t.candidatesPage.selectHint}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CandidateDetail({ c, onBack, onChat }: { c: Candidate; onBack: () => void; onChat: () => void }) {
  const t = useT();
  const name = candName(c);
  return (
    <div className="flex max-h-[70vh] flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-dusk transition-colors hover:bg-surface-2 md:hidden"
          aria-label={t.empApplications.back}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal font-display text-base font-700 text-white">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-base font-700 text-ink">{name}</span>
            {c.ratingAvg !== null && c.ratingCount > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-xs text-dusk">
                <StarRating value={c.ratingAvg} className="text-xs" />
                {c.ratingAvg.toFixed(1)} ({c.ratingCount})
              </span>
            )}
          </div>
          {c.headline && <p className="truncate text-sm text-dusk">{c.headline}</p>}
        </div>
        <button
          onClick={onChat}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-signal px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-signal-dark active:scale-[0.98]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          {t.candidatesPage.message}
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        <section className="rounded-xl border border-line bg-surface-2/40 p-4">
          <h2 className="mb-3 font-display text-xs font-700 uppercase tracking-wide text-dusk">
            {t.empApplications.contactInfo}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-dusk">Email</div>
              <a href={`mailto:${c.email}`} className="block truncate text-sm font-500 text-ink hover:text-signal">
                {c.email}
              </a>
            </div>
            {c.phone && (
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-dusk">{t.profile.phone}</div>
                <a href={`tel:${c.phone}`} className="block truncate text-sm font-500 text-ink hover:text-signal">
                  {c.phone}
                </a>
              </div>
            )}
            {c.regionName && (
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-dusk">{t.empApplications.regionLabel}</div>
                <div className="truncate text-sm font-500 text-ink">{c.regionName}</div>
              </div>
            )}
          </div>
          {c.isOpenToWork && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-growth/10 px-2.5 py-1 text-xs font-600 text-growth">
              <span className="h-1.5 w-1.5 rounded-full bg-growth" />
              {t.empApplications.openToWork}
            </span>
          )}
        </section>

        {c.resume ? (
          <ResumeView resume={c.resume} />
        ) : (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-dusk">
            {t.empApplications.noResume}
          </p>
        )}
      </div>
    </div>
  );
}

function ResumeView({ resume }: { resume: ApplicantResume }) {
  const t = useT();
  return (
    <div className="space-y-4 rounded-xl border border-line bg-surface-2/40 p-4 text-sm">
      {resume.summary && (
        <div>
          <h3 className="font-600 text-ink">{t.empApplications.resumeSummary}</h3>
          <p className="mt-1 whitespace-pre-wrap text-dusk">{resume.summary}</p>
        </div>
      )}
      {resume.desiredSalary ? (
        <p className="text-dusk">
          {t.empApplications.desiredSalary}:{" "}
          <span className="font-mono font-600 text-growth">
            {new Intl.NumberFormat("ru-RU").format(resume.desiredSalary)}
          </span>
        </p>
      ) : null}
      {resume.skills.length > 0 && (
        <div>
          <h3 className="font-600 text-ink">{t.empApplications.resumeSkills}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {resume.skills.map((s) => (
              <span key={s.skillName} className="rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-ink">
                {s.skillName}
              </span>
            ))}
          </div>
        </div>
      )}
      {resume.experience.length > 0 && (
        <div>
          <h3 className="font-600 text-ink">{t.empApplications.resumeExperience}</h3>
          <ul className="mt-1.5 space-y-2">
            {resume.experience.map((e, i) => (
              <li key={i} className="text-dusk">
                <span className="font-500 text-ink">{e.position}</span> · {e.companyName}
                <span className="ml-1 text-xs">
                  ({fmtYm(e.startDate)} – {e.endDate ? fmtYm(e.endDate) : "..."})
                </span>
                {e.description && <p className="mt-0.5 text-xs">{e.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {resume.education.length > 0 && (
        <div>
          <h3 className="font-600 text-ink">{t.empApplications.resumeEducation}</h3>
          <ul className="mt-1.5 space-y-1.5">
            {resume.education.map((e, i) => (
              <li key={i} className="text-dusk">
                <span className="font-500 text-ink">{e.institution}</span>
                {e.field ? ` · ${e.field}` : ""}
                <span className="ml-1 text-xs">
                  ({e.startYear}–{e.endYear ?? "..."})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
