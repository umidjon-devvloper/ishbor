import React from "react";
import { useT } from "../lib/i18n/index.js";
import type { EmploymentType, ExperienceLevel } from "../lib/types.js";

export interface FilterValues {
  experience: ExperienceLevel | "";
  employment: EmploymentType | "";
  salaryFrom: string;
  salaryTo: string;
}

export const EMPTY_FILTERS: FilterValues = {
  experience: "",
  employment: "",
  salaryFrom: "",
  salaryTo: "",
};

export function FilterSidebar({
  value,
  onChange,
  onApply,
}: {
  value: FilterValues;
  onChange: (next: FilterValues) => void;
  onApply: () => void;
}) {
  const t = useT();

  const experienceOptions: { key: ExperienceLevel; label: string }[] = [
    { key: "none", label: t.filters.experienceOptions.none },
    { key: "one_to_three", label: t.filters.experienceOptions.oneToThree },
    { key: "three_to_six", label: t.filters.experienceOptions.threeToSix },
    { key: "six_plus", label: t.filters.experienceOptions.sixPlus },
  ];
  const employmentOptions: { key: EmploymentType; label: string }[] = [
    { key: "full_time", label: t.filters.scheduleOptions.full },
    { key: "part_time", label: t.filters.scheduleOptions.part },
    { key: "remote", label: t.filters.scheduleOptions.remote },
    { key: "shift", label: t.filters.scheduleOptions.shift },
  ];

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <Group title={t.filters.experience}>
          <div className="flex flex-wrap gap-2">
            {experienceOptions.map((opt) => (
              <Chip
                key={opt.key}
                label={opt.label}
                active={value.experience === opt.key}
                onClick={() =>
                  onChange({ ...value, experience: value.experience === opt.key ? "" : opt.key })
                }
              />
            ))}
          </div>
        </Group>

        <Group title={t.filters.jobType}>
          <div className="flex flex-wrap gap-2">
            {employmentOptions.map((opt) => (
              <Chip
                key={opt.key}
                label={opt.label}
                active={value.employment === opt.key}
                onClick={() =>
                  onChange({ ...value, employment: value.employment === opt.key ? "" : opt.key })
                }
              />
            ))}
          </div>
        </Group>

        <Group title={t.filters.salary} last>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder={t.filters.from}
              value={value.salaryFrom}
              onChange={(e) => onChange({ ...value, salaryFrom: e.target.value })}
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder={t.filters.to}
              value={value.salaryTo}
              onChange={(e) => onChange({ ...value, salaryTo: e.target.value })}
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
            />
          </div>
        </Group>

        <button
          type="button"
          onClick={onApply}
          className="mt-5 w-full rounded-xl bg-signal py-2.5 text-sm font-semibold text-white transition-colors hover:bg-signal-dark"
        >
          {t.filters.apply}
        </button>
      </div>
    </aside>
  );
}

function Group({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? "" : "mb-5 border-b border-line pb-5"}>
      {/* Sarlavha emas (h1→h3 sakramasin) — filtr guruhi yorlig'i */}
      <p className="mb-3 font-display text-sm font-semibold text-ink">{title}</p>
      {children}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-signal text-white"
          : "bg-surface-2 text-dusk hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
