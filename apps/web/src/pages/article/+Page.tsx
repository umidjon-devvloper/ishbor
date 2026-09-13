import React from "react";
import { useData } from "vike-react/useData";
import type { data } from "./+data.js";
import { useT, useHref } from "../../lib/i18n/index.js";
import { useRedirectRole } from "../../lib/useRoleGuard.js";

export default function Page() {
  const { articles } = useData<Awaited<ReturnType<typeof data>>>();
  const t = useT();
  const l = useHref();
  useRedirectRole("employer", "/employer/candidates");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-2 text-sm text-dusk">
        <a href={l("/")} className="hover:text-signal">
          {t.search.breadcrumbHome}
        </a>{" "}
        / {t.articles.breadcrumb}
      </div>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{t.articles.title}</h1>
      <p className="mt-1 text-sm text-dusk">{t.articles.subtitle}</p>

      <div className="mt-7 space-y-4">
        {articles.map((a, i) => (
          <div
            key={a.slug}
            style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
            className="group animate-fade-up cursor-pointer rounded-2xl border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-signal/40 hover:shadow-card-hover"
          >
            <h2 className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-signal">
              {a.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-dusk">{a.excerpt}</p>
            <p className="mt-3 text-xs font-medium text-dusk">{t.articles.readMinutes(a.readMinutes)}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-dusk">
        {t.articles.comingSoon}
      </p>
    </div>
  );
}
