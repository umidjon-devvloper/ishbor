import React, { useEffect, useState } from "react";
import { useT, useLocale, useHref } from "../../lib/i18n/index.js";
import { regionName } from "../../lib/i18n/regions.js";
import { useAuth } from "../../components/AuthContext.js";
import { Skeleton } from "../../components/Skeleton.js";
import { Select } from "../../components/Select.js";
import { PhoneInput, isPhoneComplete } from "../../components/PhoneInput.js";
import { ResumeBuilder } from "../../components/ResumeBuilder.js";
import { EmployerCompanyForm } from "../../components/EmployerCompanyForm.js";
import { TelegramConnect } from "../../components/TelegramConnect.js";
import { fetchProfile, updateProfile, fetchRegions, fetchResume, fetchMyCompany } from "../../lib/api.js";
import type { Profile, Region, ResumeData, MyCompany } from "../../lib/types.js";

export default function Page() {
  const t = useT();
  const { locale } = useLocale();
  const l = useHref();
  const { status, accessToken, user } = useAuth();
  const isEmployer = user?.role === "employer";

  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<Region[]>([]);
  // job seeker
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    additionalPhone: "",
    headline: "",
    regionId: "",
    isOpenToWork: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phoneErr, setPhoneErr] = useState(false);
  // employer
  const [company, setCompany] = useState<MyCompany | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "guest" || !accessToken) {
      window.location.assign(l("/login"));
      return;
    }
    const token = accessToken;
    fetchRegions().then(setRegions);

    if (user?.role === "employer") {
      fetchMyCompany(token).then((c) => {
        setCompany(c);
        setLoading(false);
      });
    } else {
      Promise.all([fetchProfile(token), fetchResume(token)]).then(([p, r]) => {
        setResume(r);
        setProfile(p);
        setForm({
          firstName: p?.firstName || user?.firstName || "",
          lastName: p?.lastName || user?.lastName || "",
          phone: p?.phone ?? "",
          additionalPhone: p?.additionalPhone ?? "",
          headline: p?.headline ?? "",
          regionId: p?.regionId ?? "",
          isOpenToWork: p?.isOpenToWork ?? true,
        });
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, accessToken]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    const verified = profile?.isPhoneVerified ?? false;
    // Asosiy raqam tasdiqlangan bo'lsa — u qulflangan, tekshirish shart emas
    if (!verified && !isPhoneComplete(form.phone)) {
      setPhoneErr(true);
      return;
    }
    setPhoneErr(false);
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateProfile(accessToken, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: verified ? undefined : form.phone || null,
        additionalPhone: form.additionalPhone || null,
        headline: form.headline || null,
        regionId: form.regionId || null,
        isOpenToWork: form.isOpenToWork,
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-72" />
        <Skeleton className="mt-8 h-72 w-full rounded-2xl" />
        <Skeleton className="mt-5 h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const regionOptions = [
    { value: "", label: t.profile.regionPlaceholder },
    ...regions.map((r) => ({ value: r.id, label: regionName(locale, r.slug, r.name) })),
  ];
  const initial = (
    (isEmployer ? company?.name : form.firstName) ||
    user?.email ||
    "?"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex animate-fade-up items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-signal font-display text-2xl font-700 text-white">
          {initial}
        </span>
        <div>
          <h1 className="font-display text-2xl font-700 text-ink sm:text-3xl">
            {isEmployer ? t.employerProfile.title : t.profile.title}
          </h1>
          <p className="mt-0.5 text-sm text-dusk">
            {isEmployer ? t.employerProfile.subtitle : t.profile.subtitle}
          </p>
        </div>
      </div>

      {isEmployer ? (
        <>
          <EmployerCompanyForm token={accessToken!} regions={regions} initial={company} />
          <TelegramConnect />
        </>
      ) : (
        <>
          <form onSubmit={handleSave} className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-7">
            <h2 className="font-display text-lg font-600 text-ink">{t.profile.personalSection}</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t.profile.firstName} value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
              <Field label={t.profile.lastName} value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
              <div>
                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-medium text-ink">
                    {t.profile.phone}
                    {profile?.isPhoneVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-growth/10 px-2 py-0.5 text-[11px] font-600 text-growth">
                        <span className="h-1.5 w-1.5 rounded-full bg-growth" /> {t.profile.phoneVerified}
                      </span>
                    )}
                  </span>
                  {profile?.isPhoneVerified ? (
                    <div className="mt-1.5 flex h-[46px] items-center rounded-xl border border-growth/30 bg-growth/5 px-3.5 text-sm font-500 text-ink">
                      {profile.phone}
                    </div>
                  ) : (
                    <PhoneInput value={form.phone} onChange={(v) => { setForm({ ...form, phone: v }); setPhoneErr(false); }} invalid={phoneErr} />
                  )}
                </label>
                {phoneErr && <p className="mt-1 text-xs text-signal">{t.profile.phoneInvalid}</p>}
                {!profile?.isPhoneVerified && <p className="mt-1 text-xs text-dusk">{t.profile.phoneVerifyHint}</p>}
              </div>
              <label className="block">
                <span className="text-sm font-medium text-ink">{t.profile.region}</span>
                <div className="mt-1.5">
                  <Select value={form.regionId} onChange={(v) => setForm({ ...form, regionId: v })} options={regionOptions} placeholder={t.profile.regionPlaceholder} />
                </div>
              </label>
              <div className="sm:col-span-2">
                <Field
                  label={t.profile.additionalPhone}
                  value={form.additionalPhone}
                  onChange={(v) => setForm({ ...form, additionalPhone: v })}
                  placeholder={t.profile.additionalPhonePlaceholder}
                />
              </div>
              <div className="sm:col-span-2">
                <Field label={t.profile.headline} value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} placeholder={t.profile.headlinePlaceholder} />
              </div>
              <div className="sm:col-span-2">
                <label className="block">
                  <span className="text-sm font-medium text-ink">{t.profile.email}</span>
                  <input value={profile?.email ?? user?.email ?? ""} disabled className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-dusk" />
                  <span className="mt-1 block text-xs text-dusk">{t.profile.emailHint}</span>
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setForm({ ...form, isOpenToWork: !form.isOpenToWork })}
              className="mt-5 flex w-full items-center justify-between rounded-xl bg-surface-2 px-4 py-3 text-left"
            >
              <span>
                <span className="block text-sm font-medium text-ink">{t.profile.openToWork}</span>
                <span className="block text-xs text-dusk">{t.profile.openToWorkHint}</span>
              </span>
              <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form.isOpenToWork ? "bg-signal" : "bg-line"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${form.isOpenToWork ? "translate-x-5" : "translate-x-0.5"}`} />
              </span>
            </button>

            <div className="mt-5 flex items-center gap-3">
              <button type="submit" disabled={saving} className="rounded-xl bg-signal px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-signal-dark disabled:opacity-60">
                {saving ? t.profile.saving : t.profile.save}
              </button>
              {saved && <span className="text-sm font-medium text-growth">{t.profile.saved}</span>}
            </div>
          </form>

          <TelegramConnect />

          <div className="mt-5">
            <ResumeBuilder token={accessToken!} initial={resume} />
          </div>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
      />
    </label>
  );
}
