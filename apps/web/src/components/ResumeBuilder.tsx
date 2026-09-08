import React, { useState } from "react";
import { saveResume } from "../lib/api.js";
import type { ResumeData, ResumeExperienceItem, ResumeEducationItem } from "../lib/types.js";
import { useT } from "../lib/i18n/index.js";

const emptyExp: ResumeExperienceItem = {
  companyName: "",
  position: "",
  startDate: "",
  endDate: null,
  isCurrent: false,
  description: null,
};
const emptyEdu: ResumeEducationItem = {
  institution: "",
  degree: null,
  field: null,
  startYear: new Date().getFullYear(),
  endYear: null,
};

export function ResumeBuilder({ token, initial }: { token: string; initial: ResumeData | null }) {
  const t = useT();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [desiredSalary, setDesiredSalary] = useState(
    initial?.desiredSalary ? String(initial.desiredSalary) : ""
  );
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState<ResumeExperienceItem[]>(initial?.experience ?? []);
  const [education, setEducation] = useState<ResumeEducationItem[]>(initial?.education ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillInput("");
  }

  function updateExp(i: number, patch: Partial<ResumeExperienceItem>) {
    setExperience(experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function updateEdu(i: number, patch: Partial<ResumeEducationItem>) {
    setEducation(education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await saveResume(token, {
        title: title.trim() || t.resume.jobTitle,
        summary: summary.trim() || null,
        desiredSalary: desiredSalary ? Number(desiredSalary) : null,
        skills,
        experience: experience.filter((x) => x.position && x.companyName && /^\d{4}-\d{2}$/.test(x.startDate)),
        education: education.filter((x) => x.institution && x.startYear >= 1950),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
      <h2 className="font-display text-lg font-600 text-ink">{t.resume.sectionTitle}</h2>
      <p className="mt-1 text-sm text-dusk">{t.resume.sectionHint}</p>

      <div className="mt-5 space-y-4">
        <Labeled label={t.resume.jobTitle}>
          <Input value={title} onChange={setTitle} placeholder={t.resume.jobTitlePlaceholder} />
        </Labeled>
        <Labeled label={t.resume.summary}>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={t.resume.summaryPlaceholder}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
          />
        </Labeled>
        <Labeled label={t.resume.desiredSalary}>
          <Input value={desiredSalary} onChange={setDesiredSalary} type="number" placeholder="10000000" />
        </Labeled>

        {/* Ko'nikmalar */}
        <Labeled label={t.resume.skills}>
          <div className="mt-1.5 flex flex-wrap gap-2 rounded-xl border border-line bg-surface-2 p-2.5">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-ink">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className="text-dusk hover:text-signal">
                  ×
                </button>
              </span>
            ))}
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder={t.resume.skillsPlaceholder}
              className="min-w-[140px] flex-1 bg-transparent px-1 text-sm text-ink placeholder:text-dusk focus:outline-none"
            />
          </div>
        </Labeled>
      </div>

      {/* Ish tajribasi */}
      <Divider title={t.resume.experience} onAdd={() => setExperience([...experience, { ...emptyExp }])} addLabel={t.resume.addExperience} />
      {experience.length === 0 && <Empty text={t.resume.emptyExperience} />}
      <div className="space-y-4">
        {experience.map((exp, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface-2 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input value={exp.position} onChange={(v) => updateExp(i, { position: v })} placeholder={t.resume.position} />
              <Input value={exp.companyName} onChange={(v) => updateExp(i, { companyName: v })} placeholder={t.resume.companyName} />
              <MonthInput label={t.resume.startDate} value={exp.startDate} onChange={(v) => updateExp(i, { startDate: v })} />
              <MonthInput
                label={t.resume.endDate}
                value={exp.endDate ?? ""}
                onChange={(v) => updateExp(i, { endDate: v || null })}
                disabled={exp.isCurrent}
              />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-dusk">
              <input
                type="checkbox"
                checked={exp.isCurrent}
                onChange={(e) => updateExp(i, { isCurrent: e.target.checked, endDate: e.target.checked ? null : exp.endDate })}
                className="h-4 w-4 rounded border-line text-signal focus:ring-signal/40"
              />
              {t.resume.current}
            </label>
            <textarea
              value={exp.description ?? ""}
              onChange={(e) => updateExp(i, { description: e.target.value || null })}
              placeholder={t.resume.descriptionLabel}
              rows={2}
              className="mt-3 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-dusk focus:border-signal focus:outline-none"
            />
            <RemoveBtn onClick={() => setExperience(experience.filter((_, idx) => idx !== i))} label={t.resume.remove} />
          </div>
        ))}
      </div>

      {/* Ta'lim */}
      <Divider title={t.resume.education} onAdd={() => setEducation([...education, { ...emptyEdu }])} addLabel={t.resume.addEducation} />
      {education.length === 0 && <Empty text={t.resume.emptyEducation} />}
      <div className="space-y-4">
        {education.map((edu, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface-2 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input value={edu.institution} onChange={(v) => updateEdu(i, { institution: v })} placeholder={t.resume.institution} />
              <Input value={edu.field ?? ""} onChange={(v) => updateEdu(i, { field: v || null })} placeholder={t.resume.field} />
              <Input value={edu.degree ?? ""} onChange={(v) => updateEdu(i, { degree: v || null })} placeholder={t.resume.degree} />
              <div className="grid grid-cols-2 gap-2">
                <Input value={String(edu.startYear || "")} onChange={(v) => updateEdu(i, { startYear: Number(v) || 0 })} type="number" placeholder={t.resume.startYear} />
                <Input value={edu.endYear ? String(edu.endYear) : ""} onChange={(v) => updateEdu(i, { endYear: v ? Number(v) : null })} type="number" placeholder={t.resume.endYear} />
              </div>
            </div>
            <RemoveBtn onClick={() => setEducation(education.filter((_, idx) => idx !== i))} label={t.resume.remove} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-signal px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-signal-dark disabled:opacity-60"
        >
          {saving ? t.resume.saving : t.resume.save}
        </button>
        {saved && <span className="text-sm font-medium text-growth">{t.resume.saved}</span>}
      </div>
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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
    />
  );
}

function MonthInput({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-dusk">{label}</span>
      <input
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-signal focus:bg-surface focus:outline-none disabled:opacity-50"
      />
    </label>
  );
}

function Divider({ title, onAdd, addLabel }: { title: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="mb-4 mt-7 flex items-center justify-between border-t border-line pt-5">
      <h3 className="font-display text-base font-600 text-ink">{title}</h3>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-signal hover:text-signal"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {addLabel}
      </button>
    </div>
  );
}

function RemoveBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="mt-3 text-xs font-medium text-dusk transition-colors hover:text-signal">
      {label}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="mb-4 text-sm text-dusk">{text}</p>;
}
