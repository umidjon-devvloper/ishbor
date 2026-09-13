import React, { useRef, useState } from "react";
import { saveMyCompany, uploadCompanyLogo, deleteCompanyLogo, absoluteUploadUrl } from "../lib/api.js";
import type { MyCompany, Region } from "../lib/types.js";
import { useT, useLocale, useHref } from "../lib/i18n/index.js";
import { regionName } from "../lib/i18n/regions.js";
import { Select } from "./Select.js";

const EMPLOYEE_RANGES = ["1–10", "11–50", "51–100", "101–500", "500+"];

export function EmployerCompanyForm({
  token,
  regions,
  initial,
}: {
  token: string;
  regions: Region[];
  initial: MyCompany | null;
}) {
  const t = useT();
  const { locale } = useLocale();
  const l = useHref();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [regionId, setRegionId] = useState(initial?.regionId ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [employeeCount, setEmployeeCount] = useState(initial?.employeeCount ?? "");
  const [foundedYear, setFoundedYear] = useState(initial?.foundedYear ? String(initial.foundedYear) : "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial?.logoUrl ?? null);
  const [logoBusy, setLogoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasCompany = Boolean(initial || slug);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // bir xil faylni qayta tanlash ham ishlasin
    if (!file) return;
    setLogoBusy(true);
    setError(null);
    try {
      const url = await uploadCompanyLogo(token, file);
      setLogoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLogoBusy(false);
    }
  }

  async function handleLogoRemove() {
    setLogoBusy(true);
    setError(null);
    try {
      await deleteCompanyLogo(token);
      setLogoUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLogoBusy(false);
    }
  }

  const regionOptions = [
    { value: "", label: t.employerProfile.regionPlaceholder },
    ...regions.map((r) => ({ value: r.id, label: regionName(locale, r.slug, r.name) })),
  ];
  const employeeOptions = [
    { value: "", label: "—" },
    ...EMPLOYEE_RANGES.map((r) => ({ value: r, label: r })),
  ];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const company = await saveMyCompany(token, {
        name: name.trim(),
        description: description.trim() || null,
        website: website.trim() || null,
        regionId: regionId || null,
        industry: industry.trim() || null,
        employeeCount: employeeCount || null,
        foundedYear: foundedYear ? Number(foundedYear) : null,
      });
      setSlug(company.slug);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-7">
      {!initial && (
        <div className="mb-5 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink">
          {t.employerProfile.createHint}
        </div>
      )}

      {/* Kompaniya logosi */}
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface-2">
          {logoUrl ? (
            <img
              src={absoluteUploadUrl(logoUrl)}
              alt=""
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-2xl font-bold text-dusk">
              {(name || "?").charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{t.employerProfile.logo}</p>
          {hasCompany ? (
            <>
              <p className="mt-0.5 text-xs text-dusk">{t.employerProfile.logoHint}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={logoBusy}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-signal hover:text-signal disabled:opacity-60"
                >
                  {logoBusy ? t.employerProfile.logoUploading : t.employerProfile.logoUpload}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    disabled={logoBusy}
                    onClick={handleLogoRemove}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-dusk transition-colors hover:text-signal disabled:opacity-60"
                  >
                    {t.employerProfile.logoRemove}
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="hidden"
              />
            </>
          ) : (
            <p className="mt-0.5 text-xs text-dusk">{t.employerProfile.logoSaveFirst}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Labeled label={t.employerProfile.name}>
            <Input value={name} onChange={setName} placeholder={t.employerProfile.namePlaceholder} required />
          </Labeled>
        </div>
        <div className="sm:col-span-2">
          <Labeled label={t.employerProfile.description}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.employerProfile.descriptionPlaceholder}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
            />
          </Labeled>
        </div>
        <Labeled label={t.employerProfile.industry}>
          <Input value={industry} onChange={setIndustry} placeholder={t.employerProfile.industryPlaceholder} />
        </Labeled>
        <Labeled label={t.employerProfile.region}>
          <div className="mt-1.5">
            <Select value={regionId} onChange={setRegionId} options={regionOptions} placeholder={t.employerProfile.regionPlaceholder} />
          </div>
        </Labeled>
        <Labeled label={t.employerProfile.employeeCount}>
          <div className="mt-1.5">
            <Select value={employeeCount} onChange={setEmployeeCount} options={employeeOptions} placeholder="—" />
          </div>
        </Labeled>
        <Labeled label={t.employerProfile.foundedYear}>
          <Input value={foundedYear} onChange={setFoundedYear} type="number" placeholder="2020" />
        </Labeled>
        <div className="sm:col-span-2">
          <Labeled label={t.employerProfile.website}>
            <Input value={website} onChange={setWebsite} placeholder="https://example.uz" />
          </Labeled>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-xl bg-signal px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-signal-dark disabled:opacity-60"
        >
          {saving ? t.employerProfile.saving : t.employerProfile.save}
        </button>
        {saved && <span className="text-sm font-medium text-growth">{t.employerProfile.saved}</span>}
        {slug && (
          <a href={l(`/companies/${slug}`)} className="text-sm font-medium text-dusk hover:text-signal">
            {t.employerProfile.view} →
          </a>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-signal">{error}</p>}
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
  required = false,
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
