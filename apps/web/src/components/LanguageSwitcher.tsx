import React, { useRef, useState } from "react";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-react/usePageContext";
import { useLocale } from "../lib/i18n/index.js";
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT, localizeHref, type Locale } from "../lib/i18n/config.js";
import { useClickOutside } from "../lib/useClickOutside.js";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale } = useLocale();
  const pageContext = usePageContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    // Til almashtirish = shu sahifaning boshqa tildagi URL'iga o'tish (SPA)
    const logical = (pageContext.localePathname as string) || "/";
    const suffix = typeof window !== "undefined" ? window.location.search + window.location.hash : "";
    navigate(localizeHref(logical, next) + suffix);
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-dusk transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
        {LOCALE_SHORT[locale]}
      </button>

      {open && (
        <>
          <ul
            role="listbox"
            className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop"
          >
            {LOCALES.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l === locale}
                  onClick={() => choose(l)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2 ${
                    l === locale ? "font-semibold text-signal" : "text-ink"
                  }`}
                >
                  {LOCALE_LABELS[l]}
                  <span className="text-xs text-dusk">{LOCALE_SHORT[l]}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
