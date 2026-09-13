import React, { useEffect, useId, useState } from "react";
import { useT } from "../../lib/i18n/index.js";
import { absoluteUploadUrl } from "../../lib/api.js";
import type { ApplicationStatus } from "../../lib/types.js";
import { IconAlert, IconCheck, IconRefresh } from "./icons.js";

/* ==================================================================
 * Profil markazining UI asoslari. Rang va o'lchamlar faqat global.css
 * tokenlaridan (paper/surface/line/ink/dusk/signal/gold/growth/danger) —
 * kunduzgi va tungi rejim o'z-o'zidan ishlaydi.
 * ================================================================== */

export function Card({
  children,
  className = "",
  as: Tag = "section",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`rounded-3xl border border-line bg-surface shadow-card ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  icon,
  as: Heading = "h2",
  id,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-soft text-signal">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <Heading id={id} className="font-display text-[17px] font-bold leading-tight tracking-tight text-ink">
            {title}
          </Heading>
          {subtitle && <p className="mt-1 text-[13.5px] leading-relaxed text-dusk">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/* ---------------------------- forma ---------------------------- */

const inputBase =
  "w-full rounded-xl border bg-surface-2 text-sm text-ink transition-[border-color,background-color,box-shadow] placeholder:text-dusk/80 focus:bg-surface focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60";

export function inputClass(invalid = false) {
  return `${inputBase} ${
    invalid ? "border-danger focus:border-danger focus:ring-danger/10" : "border-line focus:border-signal focus:ring-signal/10"
  }`;
}

/** Yorliq + maydon + izoh/xato. `children` ga `id` beriladi (render-prop orqali). */
export function Field({
  label,
  hint,
  error,
  required,
  className = "",
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            *
          </span>
        )}
      </label>
      <div className="mt-1.5">{children({ id, describedBy, invalid: Boolean(error) })}</div>
      {error ? (
        <p id={errorId} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger">
          <IconAlert size={13} /> {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-dusk">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  className = "",
  ...rest
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={`h-11 px-3.5 ${inputClass(invalid)} ${className}`}
      {...rest}
    />
  );
}

export function TextArea({
  id,
  value,
  onChange,
  invalid,
  describedBy,
  rows = 4,
  maxLength,
  ...rest
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  rows?: number;
  maxLength?: number;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  return (
    <div className="relative">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`resize-y px-3.5 py-2.5 leading-relaxed ${inputClass(invalid)}`}
        {...rest}
      />
      {maxLength && (
        <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[11px] tabular-nums text-dusk/80" aria-hidden>
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}

/** Kirish tugmasi: `role="switch"` — ekran o'quvchi holatni "yoqilgan/o'chirilgan" deb o'qiydi. */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={hint ? `${id}-hint` : undefined}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-line bg-surface-2/60 px-4 py-3.5 text-left transition-colors hover:border-signal/30"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {hint && (
          <span id={`${id}-hint`} className="mt-0.5 block text-xs text-dusk">
            {hint}
          </span>
        )}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? "bg-signal" : "bg-line"}`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/* ---------------------------- tugmalar ---------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-signal text-white shadow-xs hover:bg-signal-dark",
  secondary: "border border-line bg-surface text-ink hover:border-signal/40 hover:text-signal",
  ghost: "text-dusk hover:bg-surface-2 hover:text-ink",
  danger: "text-danger hover:bg-danger/10",
};

export function buttonClass(variant: ButtonVariant = "primary", size: "sm" | "md" = "md") {
  return `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${
    size === "sm" ? "h-9 px-3 text-[13px]" : "h-11 px-5 text-sm"
  } ${buttonVariants[variant]}`;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      className={`${buttonClass(variant, size)} ${className}`}
      {...rest}
      disabled={rest.disabled || loading}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------- holatlar ---------------------------- */

export type SaveState = "idle" | "saving" | "saved" | "error";

/** Saqlash holati. `aria-live` — ekran o'quvchi natijani e'lon qiladi. */
export function SaveStatus({ state, errorMessage }: { state: SaveState; errorMessage?: string | null }) {
  const t = useT();
  return (
    <span aria-live="polite" className="inline-flex min-h-[20px] items-center text-[13px] font-medium">
      {state === "saving" && (
        <span className="inline-flex items-center gap-1.5 text-dusk">
          <Spinner className="h-3.5 w-3.5" /> {t.profile.saving}
        </span>
      )}
      {state === "saved" && (
        <span className="inline-flex animate-fade-in items-center gap-1.5 text-growth">
          <IconCheck size={15} /> {t.profileHub.states.saved}
        </span>
      )}
      {state === "error" && (
        <span className="inline-flex animate-fade-in items-center gap-1.5 text-danger">
          <IconAlert size={15} /> {errorMessage || t.profileHub.states.saveError}
        </span>
      )}
    </span>
  );
}

/** "saved" holatini bir necha soniyadan keyin o'zi tozalaydi. */
export function useSaveState() {
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (state !== "saved") return;
    const timer = window.setTimeout(() => setState("idle"), 2600);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function run<T>(task: () => Promise<T>): Promise<T | undefined> {
    setState("saving");
    setError(null);
    try {
      const result = await task();
      setState("saved");
      return result;
    } catch (err) {
      setError(err instanceof Error && err.message && err.message !== "Xatolik" ? err.message : null);
      setState("error");
      return undefined;
    }
  }

  return { state, error, run, setState };
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
  compact = false,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface-2/40 text-center ${
        compact ? "px-5 py-7" : "px-6 py-10"
      }`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-signal shadow-xs ring-1 ring-line">
        {icon}
      </span>
      <p className="mt-3.5 font-display text-[15px] font-bold text-ink">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-[13.5px] leading-relaxed text-dusk">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry, compact = false }: { onRetry: () => void; compact?: boolean }) {
  const t = useT();
  return (
    <div
      role="alert"
      className={`flex flex-col items-center rounded-2xl border border-danger/20 bg-danger/5 text-center ${
        compact ? "px-5 py-6" : "px-6 py-10"
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <IconAlert size={20} />
      </span>
      <p className="mt-3 font-display text-[15px] font-bold text-ink">{t.profileHub.states.loadError}</p>
      <p className="mt-1 text-[13.5px] text-dusk">{t.profileHub.states.loadErrorHint}</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
        <IconRefresh size={15} /> {t.profileHub.states.retry}
      </Button>
    </div>
  );
}

/* ---------------------------- vizual ---------------------------- */

const STATUS_STYLE: Record<ApplicationStatus, { box: string; dot: string }> = {
  sent: { box: "bg-surface-2 text-dusk", dot: "bg-dusk/60" },
  viewed: { box: "bg-signal-soft text-signal", dot: "bg-signal" },
  invited: { box: "bg-gold/15 text-gold-deep", dot: "bg-gold" },
  accepted: { box: "bg-growth/10 text-growth", dot: "bg-growth" },
  rejected: { box: "bg-danger/10 text-danger", dot: "bg-danger" },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const t = useT();
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.sent;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style.box}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {t.profileHub.applications.status[status]}
    </span>
  );
}

/** Logotip bo'lmasa — nomning bosh harfi, nomga bog'liq barqaror rang bilan. */
const AVATAR_HUES = [
  { bg: "rgb(59 130 246 / 0.12)", fg: "#2563EB" },
  { bg: "rgb(16 185 129 / 0.13)", fg: "#059669" },
  { bg: "rgb(245 158 11 / 0.15)", fg: "#B45309" },
  { bg: "rgb(139 92 246 / 0.13)", fg: "#7C3AED" },
  { bg: "rgb(236 72 153 / 0.12)", fg: "#DB2777" },
];

export function CompanyAvatar({
  name,
  logoUrl,
  size = 44,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const hash = Array.from(name).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const hue = AVATAR_HUES[hash % AVATAR_HUES.length];
  const style = { width: size, height: size };

  if (logoUrl && !broken) {
    return (
      <img
        src={absoluteUploadUrl(logoUrl)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        style={style}
        className="shrink-0 rounded-xl border border-line bg-surface object-contain p-1"
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ ...style, background: hue.bg, color: hue.fg }}
      className="flex shrink-0 items-center justify-center rounded-xl font-display text-[15px] font-bold"
    >
      {(name.trim().charAt(0) || "?").toUpperCase()}
    </span>
  );
}

/** Aylana progress. Birinchi chizishda 0 dan qiymatgacha yumshoq to'ladi. */
export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  children,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  label?: string;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, shown)) / 100) * c;
  const gradientId = useId();

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={value >= 100 ? "rgb(var(--growth))" : `url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-line/70"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full ${value >= 100 ? "bg-growth" : "bg-gradient-to-r from-signal to-[#8B5CF6]"}`}
        style={{ width: `${shown}%`, transition: "width 0.9s cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
    </div>
  );
}

/** Profil ichidagi bo'limga havola: oddiy `<a>` (yangi tabda ochiladi), bosilganda SPA almashinuv. */
export function TabLink({
  href,
  onNavigate,
  className = "",
  children,
  ...rest
}: {
  href: string;
  onNavigate: () => void;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">) {
  return (
    <a
      href={href}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onNavigate();
      }}
      className={className}
      {...rest}
    >
      {children}
    </a>
  );
}
