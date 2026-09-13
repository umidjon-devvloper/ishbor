import React, { useEffect, useState } from "react";
import { useT, useLocale } from "../../lib/i18n/index.js";
import type { ResumeData, ResumeExperienceItem } from "../../lib/types.js";
import { formatYearMonth } from "../../lib/profile/format.js";
import {
  Button,
  EmptyState,
  Field,
  SaveStatus,
  SectionHeader,
  TextArea,
  TextInput,
  inputClass,
  useSaveState,
} from "./ui.js";
import { IconBriefcase, IconPencil, IconPlus, IconTrash } from "./icons.js";

const EMPTY: ResumeExperienceItem = {
  companyName: "",
  position: "",
  startDate: "",
  endDate: null,
  isCurrent: false,
  description: null,
};

type EditorState = { index: number | "new"; item: ResumeExperienceItem } | null;

/**
 * Ish tajribasi: kartochkalar ro'yxati + bitta ochiq tahrirlovchi.
 * Qo'shish, tahrirlash va o'chirish darhol saqlanadi (butun rezyume bilan).
 */
export function ExperienceList({
  items,
  saveResume,
  headingAs = "h2",
}: {
  items: ResumeExperienceItem[];
  saveResume: (patch: Partial<ResumeData>) => Promise<ResumeData>;
  headingAs?: "h1" | "h2" | "h3";
}) {
  const t = useT();
  const e = t.profileHub.experience;
  const [editor, setEditor] = useState<EditorState>(null);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const saver = useSaveState();

  async function commit(next: ResumeExperienceItem[]) {
    const ok = await saver.run(() => saveResume({ experience: next }));
    return Boolean(ok);
  }

  async function remove(index: number) {
    if (await commit(items.filter((_, i) => i !== index))) setConfirmIndex(null);
  }

  return (
    <div>
      <SectionHeader
        as={headingAs}
        title={t.resume.experience}
        subtitle={e.subtitle}
        icon={headingAs === "h1" ? <IconBriefcase size={19} /> : undefined}
        action={
          <>
          <SaveStatus state={saver.state} errorMessage={saver.error} />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setConfirmIndex(null);
              setEditor({ index: "new", item: { ...EMPTY } });
            }}
            disabled={editor?.index === "new"}
          >
            <IconPlus size={15} /> {t.resume.addExperience}
          </Button>
          </>
        }
      />

      <div className="mt-5 flex flex-col gap-3">
        {editor?.index === "new" && (
          <ExperienceEditor
            title={e.newTitle}
            initial={editor.item}
            saving={saver.state === "saving"}
            onCancel={() => setEditor(null)}
            onSubmit={async (item) => {
              if (await commit([item, ...items])) setEditor(null);
            }}
          />
        )}

        {items.length === 0 && editor?.index !== "new" ? (
          <EmptyState
            icon={<IconBriefcase size={20} />}
            title={t.resume.emptyExperience}
            hint={e.emptyHint}
            action={
              <Button size="sm" onClick={() => setEditor({ index: "new", item: { ...EMPTY } })}>
                <IconPlus size={15} /> {t.resume.addExperience}
              </Button>
            }
          />
        ) : (
          items.map((item, index) =>
            editor?.index === index ? (
              <ExperienceEditor
                key={`edit-${index}`}
                title={e.editTitle}
                initial={editor.item}
                saving={saver.state === "saving"}
                onCancel={() => setEditor(null)}
                onSubmit={async (next) => {
                  if (await commit(items.map((x, i) => (i === index ? next : x)))) setEditor(null);
                }}
              />
            ) : (
              <ExperienceCard
                key={`${item.companyName}-${item.startDate}-${index}`}
                item={item}
                confirming={confirmIndex === index}
                busy={saver.state === "saving"}
                onEdit={() => {
                  setConfirmIndex(null);
                  setEditor({ index, item });
                }}
                onAskDelete={() => setConfirmIndex(index)}
                onCancelDelete={() => setConfirmIndex(null)}
                onDelete={() => void remove(index)}
              />
            )
          )
        )}
      </div>
    </div>
  );
}

function ExperienceCard({
  item,
  confirming,
  busy,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  item: ResumeExperienceItem;
  confirming: boolean;
  busy: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const e = t.profileHub.experience;
  const range = `${formatYearMonth(item.startDate, locale)} — ${
    item.isCurrent || !item.endDate ? t.profileHub.resume.present : formatYearMonth(item.endDate, locale)
  }`;

  return (
    <article className="group rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-signal/25 sm:p-5">
      <div className="flex gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-signal-soft text-signal" aria-hidden>
          <IconBriefcase size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold leading-snug text-ink">{item.position}</h3>
              <p className="mt-0.5 text-[13.5px] font-medium text-ink/75">{item.companyName}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-dusk">
                <span>{range}</span>
                {item.isCurrent && (
                  <span className="rounded-full bg-growth/10 px-2 py-0.5 text-[11px] font-semibold text-growth">
                    {t.resume.current}
                  </span>
                )}
              </p>
            </div>
            {!confirming && (
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`${e.edit}: ${item.position}`}>
                  <IconPencil size={15} />
                  <span className="hidden sm:inline">{e.edit}</span>
                </Button>
                <Button variant="danger" size="sm" onClick={onAskDelete} aria-label={`${e.delete}: ${item.position}`}>
                  <IconTrash size={15} />
                </Button>
              </div>
            )}
          </div>
          {item.description && (
            <p className="mt-2.5 whitespace-pre-line text-[13.5px] leading-relaxed text-ink/80">{item.description}</p>
          )}
          {confirming && (
            <div className="mt-3 flex animate-fade-in flex-wrap items-center gap-2 rounded-xl bg-danger/5 px-3 py-2.5" role="alert">
              <span className="mr-auto text-[13px] font-medium text-danger">{e.confirmDelete}</span>
              <Button variant="ghost" size="sm" onClick={onCancelDelete}>
                {t.profileHub.states.cancel}
              </Button>
              <Button size="sm" className="!bg-danger hover:!bg-danger/90" onClick={onDelete} loading={busy}>
                {e.delete}
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ExperienceEditor({
  title,
  initial,
  saving,
  onCancel,
  onSubmit,
}: {
  title: string;
  initial: ResumeExperienceItem;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (item: ResumeExperienceItem) => void | Promise<void>;
}) {
  const t = useT();
  const hub = t.profileHub;
  const [item, setItem] = useState<ResumeExperienceItem>(initial);
  const [errors, setErrors] = useState<Partial<Record<"position" | "companyName" | "startDate" | "endDate", string>>>({});

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!item.position.trim()) next.position = hub.states.required;
    if (!item.companyName.trim()) next.companyName = hub.states.required;
    if (!/^\d{4}-\d{2}$/.test(item.startDate)) next.startDate = hub.states.required;
    if (!item.isCurrent && item.endDate && item.startDate && item.endDate < item.startDate) {
      next.endDate = hub.experience.invalidDates;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <form
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!validate()) return;
        void onSubmit({
          ...item,
          position: item.position.trim(),
          companyName: item.companyName.trim(),
          endDate: item.isCurrent ? null : item.endDate || null,
          description: item.description?.trim() || null,
        });
      }}
      className="animate-fade-in rounded-2xl border border-signal/30 bg-signal-soft/40 p-4 sm:p-5"
      aria-label={title}
    >
      <p className="font-display text-[15px] font-bold text-ink">{title}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label={t.resume.position} required error={errors.position}>
          {(p) => (
            <TextInput
              id={p.id}
              describedBy={p.describedBy}
              invalid={p.invalid}
              value={item.position}
              maxLength={120}
              autoFocus
              onChange={(v) => setItem({ ...item, position: v })}
              placeholder={t.resume.jobTitlePlaceholder}
            />
          )}
        </Field>
        <Field label={t.resume.companyName} required error={errors.companyName}>
          {(p) => (
            <TextInput
              id={p.id}
              describedBy={p.describedBy}
              invalid={p.invalid}
              value={item.companyName}
              maxLength={120}
              onChange={(v) => setItem({ ...item, companyName: v })}
            />
          )}
        </Field>
        <Field label={t.resume.startDate} required error={errors.startDate}>
          {(p) => (
            <input
              id={p.id}
              type="month"
              aria-invalid={p.invalid || undefined}
              aria-describedby={p.describedBy}
              value={item.startDate}
              onChange={(ev) => setItem({ ...item, startDate: ev.target.value })}
              className={`h-11 px-3.5 ${inputClass(p.invalid)}`}
            />
          )}
        </Field>
        <Field label={t.resume.endDate} error={errors.endDate}>
          {(p) => (
            <input
              id={p.id}
              type="month"
              aria-invalid={p.invalid || undefined}
              aria-describedby={p.describedBy}
              value={item.isCurrent ? "" : item.endDate ?? ""}
              disabled={item.isCurrent}
              onChange={(ev) => setItem({ ...item, endDate: ev.target.value || null })}
              className={`h-11 px-3.5 ${inputClass(p.invalid)}`}
            />
          )}
        </Field>
      </div>

      <label className="mt-3.5 inline-flex cursor-pointer items-center gap-2.5 text-[13.5px] font-medium text-ink/85">
        <input
          type="checkbox"
          checked={item.isCurrent}
          onChange={(ev) => setItem({ ...item, isCurrent: ev.target.checked, endDate: ev.target.checked ? null : item.endDate })}
          className="h-[18px] w-[18px] cursor-pointer rounded-md border-line accent-signal"
        />
        {t.resume.current}
      </label>

      <Field label={t.resume.descriptionLabel} className="mt-4">
        {(p) => (
          <TextArea
            id={p.id}
            describedBy={p.describedBy}
            value={item.description ?? ""}
            onChange={(v) => setItem({ ...item, description: v })}
            rows={4}
            maxLength={2000}
          />
        )}
      </Field>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          {hub.states.cancel}
        </Button>
        <Button type="submit" loading={saving}>
          {t.profile.save}
        </Button>
      </div>
    </form>
  );
}
