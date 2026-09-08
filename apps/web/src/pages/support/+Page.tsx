import React, { useState } from "react";
import { useT, useHref } from "../../lib/i18n/index.js";

export default function Page() {
  const t = useT();
  const l = useHref();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-2 text-sm text-dusk">
        <a href={l("/")} className="hover:text-signal">
          {t.search.breadcrumbHome}
        </a>{" "}
        / {t.support.breadcrumb}
      </div>
      <h1 className="font-display text-2xl font-700 text-ink sm:text-3xl">{t.support.title}</h1>
      <p className="mt-1 text-sm text-dusk">{t.support.subtitle}</p>

      <h2 className="mt-8 font-display text-lg font-700 text-ink">{t.support.faqTitle}</h2>
      <div className="mt-4 space-y-3">
        {t.support.faq.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
              >
                <span className="font-display text-sm font-600 text-ink">{item.q}</span>
                <span className={`shrink-0 text-dusk transition-transform duration-200 ${isOpen ? "rotate-45 text-signal" : ""}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div className="animate-slide-down px-5 pb-4 text-sm leading-relaxed text-dusk">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-surface-2 px-6 py-7 text-center">
        <h3 className="font-display text-lg font-700 text-ink">{t.support.stillTitle}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-dusk">{t.support.stillDesc}</p>
        <a
          href={l("/contact")}
          className="mt-4 inline-block rounded-xl bg-signal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-signal-dark"
        >
          {t.support.contactButton}
        </a>
      </div>
    </div>
  );
}
