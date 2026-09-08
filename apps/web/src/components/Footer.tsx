import React from "react";
import { useT, useHref } from "../lib/i18n/index.js";

export default function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-line">
      {/* Yirik so'z-belgi qatori — editorial imzo */}
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <p
          aria-hidden
          className="select-none font-display text-[17vw] font-700 leading-[0.85] tracking-tight text-ink/[0.06] sm:text-[8.5rem] lg:text-[11rem]"
        >
          ISH BOR<span className="text-gold/40">!</span>
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 border-t border-line px-4 py-12 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="font-display text-base font-700 text-ink">
            ISH BOR<span className="text-gold" aria-hidden>!</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-dusk">{t.footer.tagline}</p>
        </div>

        <FooterColumn
          title={t.footer.seekersTitle}
          links={[
            { label: t.footer.seekersVacancies, href: "/search/vacancy" },
            { label: t.footer.seekersResume, href: "/profile" },
            { label: t.footer.seekersSalary, href: "/salaries" },
            { label: t.footer.seekersArticles, href: "/article" },
          ]}
        />
        <FooterColumn
          title={t.footer.employersTitle}
          links={[
            { label: t.footer.employersPost, href: "/employer" },
            { label: t.footer.employersBase, href: "/employer" },
            { label: t.footer.employersPricing, href: "/pricing" },
          ]}
        />
        <FooterColumn
          title={t.footer.companyTitle}
          links={[
            { label: t.footer.companyCompanies, href: "/companies" },
            { label: t.footer.companyContact, href: "/contact" },
            { label: t.footer.companySupport, href: "/support" },
          ]}
        />
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 text-xs text-dusk sm:px-6">
          <span>{t.footer.rights(new Date().getFullYear())}</span>
          <span className="font-mono tabular-nums" aria-hidden>
            UZ · RU · EN
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  const l = useHref();
  return (
    <div>
      {/* Sarlavha emas (h1→h4 sakramasin) — vizual uslub saqlangan */}
      <p className="text-[11px] font-600 uppercase tracking-[0.14em] text-dusk">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm text-ink/80">
        {links.map((link) => (
          <li key={link.label}>
            <a href={l(link.href)} className="transition-colors hover:text-ink hover:underline underline-offset-4">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
