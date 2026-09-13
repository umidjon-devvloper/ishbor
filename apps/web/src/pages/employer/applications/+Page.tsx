import React, { useEffect, useMemo, useState } from "react";
import { useT, useLocale, useHref } from "../../../lib/i18n/index.js";
import { useAuth } from "../../../components/AuthContext.js";
import { Skeleton } from "../../../components/Skeleton.js";
import { fetchEmployerApplications, setApplicationStatus, startConversation } from "../../../lib/api.js";
import { PhoneGateNotice, isPhoneGateError } from "../../../components/PhoneGateNotice.js";
import { useRequireRole } from "../../../lib/useRoleGuard.js";
import { formatDate } from "../../../lib/format.js";
import type { EmployerApplication, ApplicantResume, ApplicationStatus } from "../../../lib/types.js";

const fmtYm = (iso: string) => iso.slice(0, 7).replace("-", ".");
type ActionStatus = "invited" | "accepted" | "rejected";

function applicantName(a: EmployerApplication) {
  const p = a.jobSeeker.jobSeekerProfile;
  return [p?.firstName, p?.lastName].filter(Boolean).join(" ") || a.jobSeeker.email;
}

export default function Page() {
  const t = useT();
  const { locale } = useLocale();
  const l = useHref();
  const { status, accessToken, user } = useAuth();
  useRequireRole("employer", "/");
  const [apps, setApps] = useState<EmployerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<ActionStatus | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [gated, setGated] = useState(false);

  useEffect(() => {
    if (status !== "authed" || user?.role !== "employer" || !accessToken) return;
    fetchEmployerApplications(accessToken).then((a) => {
      setApps(a);
      setLoading(false);
    });
  }, [status, accessToken, user]);

  // Vakansiya bo'yicha guruhlash (arizalar sana bo'yicha kelgan)
  const groups = useMemo(() => {
    const map = new Map<string, { title: string; items: EmployerApplication[] }>();
    for (const a of apps) {
      const g = map.get(a.vacancy.id) ?? { title: a.vacancy.title, items: [] };
      g.items.push(a);
      map.set(a.vacancy.id, g);
    }
    return [...map.values()];
  }, [apps]);

  const active = apps.find((a) => a.id === activeId) ?? null;
  const newTotal = apps.filter((a) => a.status === "sent").length;

  function selectApplicant(a: EmployerApplication) {
    setActiveId(a.id);
    setPending(null);
    setReason("");
    // Ochilishi bilan avtomatik "ko'rildi" holatiga o'tkazamiz
    if (a.status === "sent" && accessToken) {
      setApplicationStatus(accessToken, a.id, "viewed").catch(() => {});
      setApps((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: "viewed" } : x)));
    }
  }

  async function confirmAction() {
    if (!pending || !active || !accessToken) return;
    setBusy(true);
    try {
      const note = reason.trim();
      await setApplicationStatus(accessToken, active.id, pending, note || undefined);
      const next = pending;
      setApps((prev) => prev.map((x) => (x.id === active.id ? { ...x, status: next } : x)));
      setPending(null);
      setReason("");
    } finally {
      setBusy(false);
    }
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

  const fmtDate = (iso: string) => formatDate(iso, locale);

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-5 h-[60vh] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{t.empApplications.title}</h1>
        {newTotal > 0 && (
          <span className="rounded-full bg-signal/10 px-3 py-1 text-xs font-bold text-signal">
            {t.empApplications.newCount(newTotal)}
          </span>
        )}
      </div>

      {gated && <PhoneGateNotice className="mb-5" />}

      {apps.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-12 text-center">
          <p className="font-display text-lg font-semibold text-ink">{t.empApplications.empty}</p>
        </div>
      ) : (
        <div className="grid min-h-[70vh] grid-cols-1 overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-[minmax(300px,360px)_1fr]">
          {/* Ro'yxat — vakansiya bo'yicha guruhlangan */}
          <div className={`flex-col border-line md:flex md:border-r ${activeId ? "hidden" : "flex"}`}>
            <div className="max-h-[70vh] flex-1 overflow-y-auto">
              {groups.map((g) => {
                const gNew = g.items.filter((i) => i.status === "sent").length;
                return (
                  <div key={g.title}>
                    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-surface-2/80 px-4 py-2 backdrop-blur">
                      <span className="truncate font-display text-xs font-bold uppercase tracking-wide text-dusk">
                        {g.title}
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold text-dusk">
                        {g.items.length}
                        {gNew > 0 && (
                          <span className="ml-1 text-signal">
                            · {gNew} {t.empApplications.statusLabel.sent}
                          </span>
                        )}
                      </span>
                    </div>
                    {g.items.map((a) => {
                      const p = a.jobSeeker.jobSeekerProfile;
                      const name = applicantName(a);
                      return (
                        <button
                          key={a.id}
                          onClick={() => selectApplicant(a)}
                          className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors hover:bg-surface-2 ${
                            a.id === activeId ? "bg-surface-2" : ""
                          }`}
                        >
                          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display text-sm font-bold text-ink">
                            {name.charAt(0).toUpperCase()}
                            {a.status === "sent" && (
                              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-signal ring-2 ring-surface" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-ink">{name}</span>
                              <StatusDot status={a.status} />
                            </span>
                            {p?.headline && <span className="block truncate text-xs text-dusk">{p.headline}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detal — nomzod profili + rezyume + amallar */}
          <div className={`flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
            {active ? (
              <ApplicantDetail
                key={active.id}
                a={active}
                onBack={() => setActiveId(null)}
                pending={pending}
                setPending={(p) => {
                  setPending(p);
                  setReason("");
                }}
                reason={reason}
                setReason={setReason}
                busy={busy}
                onConfirm={confirmAction}
                onChat={() => openChat(active.jobSeekerId)}
                fmtDate={fmtDate}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-sm text-dusk">
                {t.empApplications.selectApplicant}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicantDetail({
  a,
  onBack,
  pending,
  setPending,
  reason,
  setReason,
  busy,
  onConfirm,
  onChat,
  fmtDate,
}: {
  a: EmployerApplication;
  onBack: () => void;
  pending: ActionStatus | null;
  setPending: (p: ActionStatus | null) => void;
  reason: string;
  setReason: (v: string) => void;
  busy: boolean;
  onConfirm: () => void;
  onChat: () => void;
  fmtDate: (iso: string) => string;
}) {
  const t = useT();
  const p = a.jobSeeker.jobSeekerProfile;
  const name = applicantName(a);

  return (
    <div className="flex max-h-[70vh] flex-col">
      {/* Sarlavha */}
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
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal font-display text-base font-bold text-white">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-base font-bold text-ink">{name}</span>
            <StatusBadge status={a.status} />
          </div>
          {p?.headline && <p className="truncate text-sm text-dusk">{p.headline}</p>}
        </div>
        <button
          onClick={onChat}
          className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-signal px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-signal-dark active:scale-[0.98] sm:flex"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          {t.empApplications.chat}
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        {/* Profil / aloqa */}
        <section className="rounded-xl border border-line bg-surface-2/40 p-4">
          <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-wide text-dusk">
            {t.empApplications.contactInfo}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <InfoRow label="Email" value={a.jobSeeker.email} href={`mailto:${a.jobSeeker.email}`} />
            {a.jobSeeker.phone && (
              <InfoRow label={t.profile.phone} value={a.jobSeeker.phone} href={`tel:${a.jobSeeker.phone}`} />
            )}
            {p?.region?.name && <InfoRow label={t.empApplications.regionLabel} value={p.region.name} />}
            <InfoRow label={t.empApplications.appliedAt} value={fmtDate(a.createdAt)} />
          </div>
          {p?.isOpenToWork && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-growth/10 px-2.5 py-1 text-xs font-semibold text-growth">
              <span className="h-1.5 w-1.5 rounded-full bg-growth" />
              {t.empApplications.openToWork}
            </span>
          )}
        </section>

        {/* Rezyume */}
        {a.resume ? (
          <ResumeView resume={a.resume} />
        ) : (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-dusk">
            {t.empApplications.noResume}
          </p>
        )}

        {/* Chat (mobil) */}
        <button
          onClick={onChat}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-signal px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-signal-dark active:scale-[0.99] sm:hidden"
        >
          {t.empApplications.chat}
        </button>
      </div>

      {/* Amallar paneli */}
      <div className="border-t border-line bg-surface p-4 sm:px-6">
        {pending ? (
          <div className="animate-slide-down space-y-2">
            <label className="block text-xs font-semibold text-ink">{t.empApplications.reasonOptional}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              autoFocus
              placeholder={t.empApplications.reasonPlaceholder}
              className="w-full resize-none rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
            />
            <p className="text-[11px] text-dusk">{t.empApplications.reasonHint}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={onConfirm}
                disabled={busy}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 ${
                  pending === "rejected" ? "bg-signal hover:bg-signal-dark" : "bg-growth hover:brightness-95"
                }`}
              >
                {busy ? "..." : `${t.empApplications.statusLabel[pending]} · ${t.empApplications.confirm}`}
              </button>
              <button
                onClick={() => setPending(null)}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-dusk transition-colors hover:text-ink"
              >
                {t.empApplications.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <ActionBtn onClick={() => setPending("invited")} label={t.empApplications.actionInvite} tone="growth" />
            <ActionBtn onClick={() => setPending("accepted")} label={t.empApplications.actionAccept} tone="growth" solid />
            <ActionBtn onClick={() => setPending("rejected")} label={t.empApplications.actionReject} tone="signal" />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-dusk">{label}</div>
      {href ? (
        <a href={href} className="block truncate text-sm font-medium text-ink hover:text-signal">
          {value}
        </a>
      ) : (
        <div className="truncate text-sm font-medium text-ink">{value}</div>
      )}
    </div>
  );
}

function ActionBtn({
  onClick,
  label,
  tone,
  solid,
}: {
  onClick: () => void;
  label: string;
  tone: "growth" | "signal";
  solid?: boolean;
}) {
  if (solid) {
    return (
      <button
        onClick={onClick}
        className="rounded-lg bg-growth px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-95 active:scale-[0.98]"
      >
        {label}
      </button>
    );
  }
  const cls =
    tone === "growth" ? "hover:border-growth hover:text-growth" : "hover:border-signal hover:text-signal";
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border border-line px-4 py-2 text-sm font-medium text-dusk transition-colors ${cls}`}
    >
      {label}
    </button>
  );
}

function ResumeView({ resume }: { resume: ApplicantResume }) {
  const t = useT();
  return (
    <div className="space-y-4 rounded-xl border border-line bg-surface-2/40 p-4 text-sm">
      {resume.summary && (
        <div>
          <h3 className="font-semibold text-ink">{t.empApplications.resumeSummary}</h3>
          <p className="mt-1 whitespace-pre-wrap text-dusk">{resume.summary}</p>
        </div>
      )}
      {resume.desiredSalary ? (
        <p className="text-dusk">
          {t.empApplications.desiredSalary}:{" "}
          <span className="font-mono font-semibold text-growth">
            {new Intl.NumberFormat("ru-RU").format(resume.desiredSalary)}
          </span>
        </p>
      ) : null}
      {resume.skills.length > 0 && (
        <div>
          <h3 className="font-semibold text-ink">{t.empApplications.resumeSkills}</h3>
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
          <h3 className="font-semibold text-ink">{t.empApplications.resumeExperience}</h3>
          <ul className="mt-1.5 space-y-2">
            {resume.experience.map((e, i) => (
              <li key={i} className="text-dusk">
                <span className="font-medium text-ink">{e.position}</span> · {e.companyName}
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
          <h3 className="font-semibold text-ink">{t.empApplications.resumeEducation}</h3>
          <ul className="mt-1.5 space-y-1.5">
            {resume.education.map((e, i) => (
              <li key={i} className="text-dusk">
                <span className="font-medium text-ink">{e.institution}</span>
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

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const t = useT();
  const color =
    status === "accepted"
      ? "bg-growth/10 text-growth"
      : status === "rejected"
        ? "bg-signal/10 text-signal"
        : status === "invited"
          ? "bg-gold/15 text-gold-deep"
          : status === "sent"
            ? "bg-signal/10 text-signal"
            : "bg-surface-2 text-dusk";
  return (
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${color}`}>
      {t.empApplications.statusLabel[status] ?? status}
    </span>
  );
}

function StatusDot({ status }: { status: ApplicationStatus }) {
  const color =
    status === "accepted"
      ? "bg-growth"
      : status === "rejected"
        ? "bg-signal"
        : status === "invited"
          ? "bg-gold"
          : status === "sent"
            ? "bg-signal"
            : "bg-line";
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />;
}
