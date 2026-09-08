import React, { useEffect, useState } from "react";
import { useT, useLocale, useHref } from "../../../lib/i18n/index.js";
import { regionName } from "../../../lib/i18n/regions.js";
import { useAuth } from "../../../components/AuthContext.js";
import { Skeleton } from "../../../components/Skeleton.js";
import { Select } from "../../../components/Select.js";
import { formatSalary } from "../../../lib/format.js";
import {
  fetchEmployerBoard,
  fetchCategories,
  fetchRegions,
  fetchMyCompany,
  createVacancy,
  updateVacancy,
  setVacancyStatus,
  deleteVacancy,
} from "../../../lib/api.js";
import { PhoneGateNotice, isPhoneGateError } from "../../../components/PhoneGateNotice.js";
import { useRequireRole } from "../../../lib/useRoleGuard.js";
import type {
  EmployerVacancy,
  Category,
  Region,
  EmploymentType,
  ExperienceLevel,
  SubscriptionState,
} from "../../../lib/types.js";

export default function Page() {
  const t = useT();
  const l = useHref();
  const { status, accessToken, user } = useAuth();
  useRequireRole("employer", "/");
  const [vacancies, setVacancies] = useState<EmployerVacancy[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmployerVacancy | null>(null);
  const [hasCompany, setHasCompany] = useState(true);

  useEffect(() => {
    if (status !== "authed" || user?.role !== "employer" || !accessToken) return;
    Promise.all([
      fetchEmployerBoard(accessToken),
      fetchCategories(),
      fetchRegions(),
      fetchMyCompany(accessToken),
    ]).then(([board, c, r, company]) => {
      setVacancies(board.items);
      setSubscription(board.subscription);
      setCategories(c);
      setRegions(r);
      setHasCompany(Boolean(company));
      setLoading(false);
    });
  }, [status, accessToken, user]);

  async function reload() {
    if (!accessToken) return;
    const board = await fetchEmployerBoard(accessToken);
    setVacancies(board.items);
    setSubscription(board.subscription);
  }

  async function toggleStatus(v: EmployerVacancy) {
    if (!accessToken) return;
    await setVacancyStatus(accessToken, v.id, v.status === "active" ? "archived" : "active");
    reload();
  }

  async function removeVacancy(v: EmployerVacancy) {
    if (!accessToken) return;
    if (!window.confirm(t.empVacancies.deleteConfirm)) return;
    await deleteVacancy(accessToken, v.id);
    setVacancies((prev) => prev.filter((x) => x.id !== v.id));
  }

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-5 h-28 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-28 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-700 text-ink sm:text-3xl">{t.empVacancies.title}</h1>
          <p className="mt-1 text-sm text-dusk">{t.empVacancies.subtitle}</p>
        </div>
        {hasCompany && (
          <button
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
            className="shrink-0 rounded-xl bg-signal px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-signal-dark hover:shadow-sm active:scale-[0.98]"
          >
            {showForm ? t.empVacancies.cancel : `+ ${t.empVacancies.newButton}`}
          </button>
        )}
      </div>

      {subscription && hasCompany && (
        <div
          className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
            subscription.canPostMore
              ? "border-line bg-surface"
              : "border-gold/40 bg-gold/5"
          }`}
        >
          <span className="text-sm text-ink">
            {t.empVacanciesExtra.planUsage(
              subscription.activeVacancies,
              subscription.maxActiveVacancies,
              subscription.name
            )}
            {!subscription.canPostMore && (
              <span className="block text-xs text-dusk">{t.empVacanciesExtra.limitReached}</span>
            )}
          </span>
          <a
            href={l("/pricing")}
            className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-signal hover:text-signal"
          >
            {t.empVacanciesExtra.upgrade}
          </a>
        </div>
      )}

      {!hasCompany && (
        <div className="mt-7 rounded-2xl border border-gold/40 bg-gold/5 p-8 text-center">
          <h2 className="font-display text-lg font-600 text-ink">{t.empVacancies.needCompanyTitle}</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-dusk">{t.empVacancies.needCompanyDesc}</p>
          <a
            href={l("/profile")}
            className="glow-signal mt-4 inline-block rounded-xl bg-signal px-5 py-2.5 text-sm font-semibold text-white hover:bg-signal-dark active:scale-[0.98]"
          >
            {t.empVacancies.needCompanyButton}
          </a>
        </div>
      )}

      {showForm && hasCompany && (
        <VacancyForm
          key={editing?.id ?? "new"}
          token={accessToken!}
          categories={categories}
          regions={regions}
          vacancy={editing}
          onCreated={() => {
            setShowForm(false);
            setEditing(null);
            reload();
          }}
        />
      )}

      <div className="mt-7 space-y-4">
        {!hasCompany ? null : vacancies.length === 0 && !showForm ? (
          <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-dusk">
            {t.empVacancies.empty}
          </div>
        ) : (
          vacancies.map((v) => (
            <div
              key={v.id}
              className="animate-fade-up rounded-2xl border border-line bg-surface p-5 transition-all duration-200 hover:border-signal/30 hover:shadow-card-hover"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <a
                      href={l(`/vacancy/${v.slug}`)}
                      className="font-display text-base font-600 text-ink hover:text-signal"
                    >
                      {v.title}
                    </a>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-700 uppercase tracking-wide ${
                        v.status === "active" ? "bg-growth/10 text-growth" : "bg-line text-dusk"
                      }`}
                    >
                      {v.status === "active" ? t.empVacancies.statusActive : t.empVacancies.statusArchived}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-dusk">
                    {[v.region?.name, t.enums.employment[v.employmentType]].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1 font-mono text-sm text-growth">
                    {formatSalary(v.salaryMin, v.salaryMax, t.fmt, v.isSalaryHidden)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm font-600 text-ink">
                    {t.empVacancies.applicationsCount(v._count.applications)}
                  </span>
                  <div className="flex gap-2">
                    <a
                      href={l("/employer/applications")}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-signal hover:text-signal"
                    >
                      {t.empVacancies.viewApplications}
                    </a>
                    <button
                      onClick={() => {
                        setEditing(v);
                        setShowForm(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-dusk transition-colors hover:border-signal hover:text-signal"
                    >
                      {t.empVacanciesExtra.edit}
                    </button>
                    <button
                      onClick={() => toggleStatus(v)}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-dusk transition-colors hover:border-signal hover:text-signal"
                    >
                      {v.status === "active" ? t.empVacancies.close : t.empVacancies.reopen}
                    </button>
                    <button
                      onClick={() => removeVacancy(v)}
                      aria-label={t.empVacancies.delete}
                      title={t.empVacancies.delete}
                      className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-dusk transition-colors hover:border-signal hover:bg-signal/5 hover:text-signal"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t.empVacancies.delete}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function VacancyForm({
  token,
  categories,
  regions,
  vacancy,
  onCreated,
}: {
  token: string;
  categories: Category[];
  regions: Region[];
  /** Berilgan bo'lsa — tahrirlash rejimi, aks holda yangi vakansiya. */
  vacancy?: EmployerVacancy | null;
  onCreated: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const isEdit = Boolean(vacancy);
  const [title, setTitle] = useState(vacancy?.title ?? "");
  const [description, setDescription] = useState(vacancy?.description ?? "");
  const [requirements, setRequirements] = useState(vacancy?.requirements ?? "");
  const [conditions, setConditions] = useState(vacancy?.conditions ?? "");
  const [categoryId, setCategoryId] = useState(vacancy?.categoryId ?? "");
  const [regionId, setRegionId] = useState(vacancy?.regionId ?? "");
  const [employment, setEmployment] = useState<EmploymentType>(
    vacancy?.employmentType ?? "full_time"
  );
  const [experience, setExperience] = useState<ExperienceLevel>(
    vacancy?.experienceRequired ?? "none"
  );
  const [salaryMin, setSalaryMin] = useState(vacancy?.salaryMin ? String(vacancy.salaryMin) : "");
  const [salaryMax, setSalaryMax] = useState(vacancy?.salaryMax ? String(vacancy.salaryMax) : "");
  const [applyWithoutResume, setApplyWithoutResume] = useState(
    vacancy?.applyWithoutResume ?? true
  );
  const [contactEmail, setContactEmail] = useState(vacancy?.contactEmail ?? "");
  const [contactTelegram, setContactTelegram] = useState(vacancy?.contactTelegram ?? "");
  const [contactPhone, setContactPhone] = useState(vacancy?.contactPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gated, setGated] = useState(false);

  const employmentOptions = (["full_time", "part_time", "remote", "shift"] as EmploymentType[]).map((k) => ({
    value: k,
    label: t.enums.employment[k],
  }));
  const experienceOptions = (["none", "one_to_three", "three_to_six", "six_plus"] as ExperienceLevel[]).map((k) => ({
    value: k,
    label: t.enums.experience[k],
  }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setGated(false);
    try {
      const payload = {
        title,
        description,
        requirements: requirements || undefined,
        conditions: conditions || undefined,
        categoryId: categoryId || undefined,
        regionId: regionId || undefined,
        employmentType: employment,
        experienceRequired: experience,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        applyWithoutResume,
        // Bo'sh satr — tahrirlashda "o'chirish" ma'nosini beradi
        contactEmail: contactEmail.trim(),
        contactTelegram: contactTelegram.trim(),
        contactPhone: contactPhone.trim(),
      };
      if (vacancy) await updateVacancy(token, vacancy.id, payload);
      else await createVacancy(token, payload);
      onCreated();
    } catch (err) {
      if (isPhoneGateError(err)) setGated(true);
      else setError(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-line bg-surface p-6">
      <h2 className="font-display text-lg font-600 text-ink">
        {isEdit ? t.empVacanciesExtra.editTitle : t.empVacancies.formTitle}
      </h2>
      <div className="mt-4 space-y-4">
        <Labeled label={t.empVacancies.fTitle}>
          <Input value={title} onChange={setTitle} placeholder={t.empVacancies.fTitlePlaceholder} required />
        </Labeled>
        <Labeled label={t.empVacancies.fDescription}>
          <Textarea value={description} onChange={setDescription} placeholder={t.empVacancies.fDescriptionPlaceholder} rows={4} required />
        </Labeled>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Labeled label={t.empVacancies.fRequirements}>
            <Textarea value={requirements} onChange={setRequirements} placeholder={t.empVacancies.fRequirementsPlaceholder} rows={3} />
          </Labeled>
          <Labeled label={t.empVacancies.fConditions}>
            <Textarea value={conditions} onChange={setConditions} placeholder={t.empVacancies.fConditionsPlaceholder} rows={3} />
          </Labeled>
          <Labeled label={t.empVacancies.fCategory}>
            <div className="mt-1.5">
              <Select
                value={categoryId}
                onChange={setCategoryId}
                options={[{ value: "", label: t.empVacancies.select }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                placeholder={t.empVacancies.select}
              />
            </div>
          </Labeled>
          <Labeled label={t.empVacancies.fRegion}>
            <div className="mt-1.5">
              <Select
                value={regionId}
                onChange={setRegionId}
                options={[{ value: "", label: t.empVacancies.select }, ...regions.map((r) => ({ value: r.id, label: regionName(locale, r.slug, r.name) }))]}
                placeholder={t.empVacancies.select}
              />
            </div>
          </Labeled>
          <Labeled label={t.empVacancies.fEmployment}>
            <div className="mt-1.5">
              <Select value={employment} onChange={(v) => setEmployment(v as EmploymentType)} options={employmentOptions} />
            </div>
          </Labeled>
          <Labeled label={t.empVacancies.fExperience}>
            <div className="mt-1.5">
              <Select value={experience} onChange={(v) => setExperience(v as ExperienceLevel)} options={experienceOptions} />
            </div>
          </Labeled>
          <Labeled label={t.empVacancies.fSalaryMin}>
            <Input value={salaryMin} onChange={setSalaryMin} type="number" placeholder="10000000" />
          </Labeled>
          <Labeled label={t.empVacancies.fSalaryMax}>
            <Input value={salaryMax} onChange={setSalaryMax} type="number" placeholder="20000000" />
          </Labeled>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={applyWithoutResume}
            onChange={(e) => setApplyWithoutResume(e.target.checked)}
            className="h-4 w-4 rounded border-line text-signal focus:ring-signal/40"
          />
          {t.empVacancies.fApplyWithoutResume}
        </label>

        {/* Bog'lanish yo'llari — ixtiyoriy */}
        <div className="border-t border-line pt-4">
          <p className="text-sm font-semibold text-ink">{t.empVacancies.fContacts}</p>
          <p className="mt-0.5 text-xs text-dusk">{t.empVacancies.fContactsHint}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Labeled label="Email">
              <Input value={contactEmail} onChange={setContactEmail} type="email" placeholder="hr@kompaniya.uz" />
            </Labeled>
            <Labeled label="Telegram">
              <Input value={contactTelegram} onChange={setContactTelegram} placeholder="@username" />
            </Labeled>
            <Labeled label={t.empVacancies.fContactPhone}>
              <Input value={contactPhone} onChange={setContactPhone} placeholder={t.empVacancies.fContactPhonePlaceholder} />
            </Labeled>
          </div>
        </div>
      </div>

      {gated && <PhoneGateNotice className="mt-3" />}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 rounded-xl bg-signal px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-signal-dark hover:shadow-sm active:scale-[0.98] disabled:opacity-60"
      >
        {saving
          ? t.empVacancies.submitting
          : isEdit
            ? t.empVacanciesExtra.saveChanges
            : t.empVacancies.submit}
      </button>
    </form>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
    />
  );
}
function Textarea({
  value,
  onChange,
  placeholder,
  rows,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows: number;
  required?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
    />
  );
}
