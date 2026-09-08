import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { useT, useHref } from "../lib/i18n/index.js";
import { useAuth } from "./AuthContext.js";

/**
 * Admin sahifalarining umumiy qobig'i: rol tekshiruvi + yon navigatsiya.
 *
 * Rol tekshiruvi ikki qavatli — bu yerda UI yashiriladi, serverda esa har bir
 * `/api/admin/*` yo'li `requireRole("admin")` bilan himoyalangan.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const l = useHref();
  const { status, user } = useAuth();
  const pageContext = usePageContext();
  const pathname = (pageContext.localePathname as string) ?? "/admin";

  const links = [
    { href: "/admin", label: t.admin.nav.overview },
    { href: "/admin/users", label: t.admin.nav.users },
    { href: "/admin/vacancies", label: t.admin.nav.vacancies },
    { href: "/admin/companies", label: t.admin.nav.companies },
    { href: "/admin/reviews", label: t.admin.nav.reviews },
    { href: "/admin/payments", label: t.admin.nav.payments },
  ];

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-2" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    );
  }

  if (status !== "authed" || user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-xl font-700 text-ink">{t.admin.common.accessDenied}</h1>
        <a
          href={l("/")}
          className="mt-5 inline-block rounded-xl bg-signal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-signal-dark"
        >
          {t.search.breadcrumbHome}
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-700 text-ink sm:text-3xl">{t.admin.title}</h1>

      <nav className="mt-5 flex flex-wrap gap-1.5 border-b border-line pb-3">
        {links.map((link) => {
          const active =
            link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <a
              key={link.href}
              href={l(link.href)}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-signal/10 text-signal" : "text-dusk hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {link.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}

/** Admin jadvallari uchun bir xil ko'rinishdagi konteyner. */
export function AdminTable({
  head,
  children,
  minWidth = 720,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-dusk">
            {head}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** Sahifalar orasida o'tish (oldingi / keyingi). */
export function Pager({
  page,
  pageCount,
  total,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const t = useT();
  if (total === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-dusk">{t.admin.common.total(total)}</span>
      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-dusk transition-colors hover:text-ink disabled:opacity-40"
          >
            {t.admin.common.prev}
          </button>
          <span className="font-mono text-sm text-dusk">{t.admin.common.page(page, pageCount)}</span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => onChange(page + 1)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-dusk transition-colors hover:text-ink disabled:opacity-40"
          >
            {t.admin.common.next}
          </button>
        </div>
      )}
    </div>
  );
}

/** Jadval ustidagi qidiruv/filtr qatori. */
export function AdminFilters({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2.5">{children}</div>;
}

export function AdminSearchInput({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 focus-within:border-signal"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-dusk" aria-hidden>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full bg-transparent text-sm text-ink placeholder:text-dusk focus:outline-none"
      />
    </form>
  );
}

export function AdminSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-signal focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Jadvaldagi kichik amal tugmasi. */
export function RowButton({
  onClick,
  children,
  tone = "neutral",
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "danger";
}) {
  const toneClass = {
    neutral: "border-line text-dusk hover:text-ink",
    primary: "border-signal/40 text-signal hover:bg-signal/10",
    danger: "border-line text-dusk hover:border-signal hover:text-signal",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${toneClass}`}
    >
      {children}
    </button>
  );
}
