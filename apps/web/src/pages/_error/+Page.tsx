import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { useT, useHref } from "../../lib/i18n/index.js";

export default function Page() {
  const pageContext = usePageContext();
  const is404 = pageContext.is404;
  const t = useT();
  const l = useHref();

  return (
    <div className="flex min-h-[72vh] items-center justify-center px-4">
      <div className="animate-fade-up text-center">
        {/* Dekorativ katta raqam (past kontrast ataylab) — h1 mazmunni beradi */}
        <div className="font-display text-7xl font-700 text-line sm:text-8xl" aria-hidden>
          {is404 ? "404" : "500"}
        </div>
        <h1 className="mt-2 font-display text-2xl font-700 text-ink sm:text-3xl">
          {is404 ? t.error.title404 : t.error.title500}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-dusk">{is404 ? t.error.desc404 : t.error.desc500}</p>

        <div className="mt-7 flex items-center justify-center gap-3">
          <a
            href={l("/")}
            className="rounded-xl bg-signal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-signal-dark"
          >
            {t.error.backHome}
          </a>
          <a
            href={l("/search/vacancy")}
            className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-signal hover:text-signal"
          >
            {t.error.viewVacancies}
          </a>
        </div>
      </div>
    </div>
  );
}
