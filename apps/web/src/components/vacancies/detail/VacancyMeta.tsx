import React from "react";
import type { VacancyDetailVM } from "../../../lib/vacancies/detail.js";
import { useT } from "../../../lib/i18n/index.js";
import { IconBriefcase, IconCalendar, IconClock, IconPin } from "./icons.js";

/**
 * Asosiy shartlar qatori: tajriba, bandlik, ish jadvali, manzil. Har biri faqat
 * bazada bo'lsa chiqadi; "Ofisda/Gibrid" kabi maydon bazada yo'q — ko'rsatilmaydi.
 * Hech biri bo'lmasa qator umuman render qilinmaydi.
 */
export function VacancyMeta({ vacancy, className = "" }: { vacancy: VacancyDetailVM; className?: string }) {
  const t = useT();
  const d = t.vacancyDetail;

  const items: { key: string; icon: React.ReactNode; label: string; value: string }[] = [];
  if (vacancy.experience) {
    items.push({ key: "experience", icon: <IconBriefcase size={18} />, label: d.experience, value: t.enums.experience[vacancy.experience] });
  }
  if (vacancy.employment) {
    items.push({ key: "employment", icon: <IconClock size={18} />, label: d.employment, value: t.enums.employment[vacancy.employment] });
  }
  if (vacancy.schedule) {
    items.push({ key: "schedule", icon: <IconCalendar size={18} />, label: d.schedule, value: t.vacanciesPage.schedule[vacancy.schedule] });
  }
  if (vacancy.address) {
    items.push({ key: "location", icon: <IconPin size={18} />, label: d.location, value: vacancy.address });
  }
  if (items.length === 0) return null;

  return (
    <ul aria-label={d.metaLabel} className={`flex flex-wrap gap-x-6 gap-y-2.5 text-[14.5px] text-ink/80 ${className}`}>
      {items.map((item) => (
        <li key={item.key} className="inline-flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-dusk">{item.icon}</span>
          <span className="sr-only">{item.label}: </span>
          <span className="min-w-0 [overflow-wrap:anywhere]">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
