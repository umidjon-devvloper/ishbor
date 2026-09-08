import React, { useRef, useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { BrandLogo } from "./BrandLogo.js";
import { ThemeToggle } from "./ThemeToggle.js";
import { LanguageSwitcher } from "./LanguageSwitcher.js";
import { NotificationBell } from "./NotificationBell.js";
import { useT, useHref } from "../lib/i18n/index.js";
import { useAuth } from "./AuthContext.js";
import { useClickOutside } from "../lib/useClickOutside.js";
import { useInboxSummary } from "../lib/useInboxSummary.js";

interface NavLink {
  label: string;
  href: string;
  badge?: number;
}

export default function Header() {
  const t = useT();
  const l = useHref();
  const { status, user, accessToken, logout } = useAuth();
  const pageContext = usePageContext();
  const pathname = (pageContext.localePathname as string) ?? "/";
  const { summary } = useInboxSummary(status === "authed" ? accessToken : null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  useClickOutside(userRef, () => setUserOpen(false), userOpen);

  const isEmployer = status === "authed" && user?.role === "employer";
  const isSeeker = status === "authed" && user?.role === "job_seeker";
  const isAdmin = status === "authed" && user?.role === "admin";
  const navLinks: NavLink[] = isEmployer
    ? [
        { label: t.nav.myVacancies, href: "/employer/vacancies" },
        { label: t.nav.candidates, href: "/employer/candidates" },
        { label: t.nav.applications, href: "/employer/applications", badge: summary.newApplications },
        { label: t.nav.messages, href: "/messages", badge: summary.unreadMessages },
      ]
    : [
        { label: t.nav.vacancies, href: "/search/vacancy" },
        { label: t.nav.companies, href: "/companies" },
        { label: t.navExtra.salaries, href: "/salaries" },
        { label: t.nav.articles, href: "/article" },
        ...(isSeeker
          ? [{ label: t.nav.messages, href: "/messages", badge: summary.unreadMessages }]
          : []),
        ...(isAdmin ? [{ label: t.navExtra.admin, href: "/admin" }] : []),
      ];

  // Ish beruvchining "bosh sahifasi" — xodim qidirish (ish izlovchiniki — ish qidirish)
  const homeHref = isEmployer ? "/employer/candidates" : "/";
  const displayName = user?.firstName || user?.email?.split("@")[0] || "";
  const initial = displayName.charAt(0).toUpperCase();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <div className="mx-auto max-w-7xl rounded-2xl border border-line bg-surface/92 shadow-card backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-5">
        <div className="flex items-center gap-8">
          <a href={l(homeHref)} className="group flex items-center gap-2.5 text-ink">
            <BrandLogo variant="nav" />
            <span className="font-display text-lg font-700 tracking-tight">
              ISH <span className="text-signal">BOR</span>
              {/* Dekorativ "!" — kontrast auditidan chiqadi, ma'no yo'qolmaydi */}
              <span className="text-gold" aria-hidden>!</span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={l(link.href)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`nav-underline relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "nav-underline-active text-ink"
                    : "text-dusk hover:text-ink"
                }`}
              >
                {link.label}
                {link.badge ? <NavBadge count={link.badge} /> : null}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          {status === "authed" && <NotificationBell token={accessToken} />}
          <ThemeToggle className="hidden sm:flex" />
          <LanguageSwitcher className="hidden sm:block" />

          <div className="mx-1 hidden h-6 w-px bg-line sm:block" />

          {status === "authed" ? (
            <div ref={userRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setUserOpen((v) => !v)}
                aria-expanded={userOpen}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-surface-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal font-display text-sm font-700 text-white">
                  {initial}
                </span>
                <span className="max-w-[120px] truncate text-sm font-medium text-ink">
                  {displayName}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`text-dusk transition-transform duration-200 ${userOpen ? "rotate-180" : ""}`}
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {userOpen && (
                <div className="absolute right-0 z-50 mt-2 w-52 origin-top-right animate-pop overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop">
                  <a
                    href={l("/profile")}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-2"
                  >
                    <UserIcon /> {isEmployer ? t.nav.companyProfile : t.nav.profile}
                  </a>
                  <a
                    href={l("/messages")}
                    className="flex items-center justify-between gap-2.5 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-2"
                  >
                    <span className="flex items-center gap-2.5">
                      <ChatIcon /> {t.nav.messages}
                    </span>
                    {summary.unreadMessages > 0 && <NavBadge count={summary.unreadMessages} />}
                  </a>
                  {isSeeker && (
                    <>
                      <a
                        href={l("/favorites")}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-2"
                      >
                        <HeartIcon /> {t.navExtra.favorites}
                      </a>
                      <a
                        href={l("/alerts")}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-2"
                      >
                        <BellIcon /> {t.navExtra.alerts}
                      </a>
                    </>
                  )}
                  {isEmployer && (
                    <a
                      href={l("/pricing")}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-2"
                    >
                      <PlanIcon /> {t.pricing.breadcrumb}
                    </a>
                  )}
                  {isAdmin && (
                    <a
                      href={l("/admin")}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-2"
                    >
                      <ShieldIcon /> {t.navExtra.admin}
                    </a>
                  )}
                  <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-surface-2"
                  >
                    <LogoutIcon /> {t.nav.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <a
                href={l("/employer")}
                className="rounded-lg px-3 py-2 text-sm font-medium text-dusk transition-colors hover:text-ink"
              >
                {t.nav.forEmployers}
              </a>
              <a
                href={l("/login")}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
              >
                {t.nav.login}
              </a>
              <a
                href={l("/signup")}
                className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:bg-signal-dark hover:shadow-sm active:scale-[0.98]"
              >
                {t.nav.signup}
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? t.ui.closeMenu : t.ui.openMenu}
            aria-expanded={menuOpen}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-surface-2 md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
            {!menuOpen && status === "authed" && summary.unreadMessages + summary.newApplications > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-signal ring-2 ring-paper" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="animate-slide-down border-t border-line px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={l(link.href)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(link.href) ? "bg-surface-2 font-semibold text-ink" : "text-ink hover:bg-surface-2"
                }`}
              >
                {link.label}
                {link.badge ? <NavBadge count={link.badge} /> : null}
              </a>
            ))}
          </nav>

          <div className="mt-3 flex items-center gap-2 px-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
            {status === "authed" ? (
              <>
                <a
                  href={l("/profile")}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
                >
                  {isEmployer ? t.nav.companyProfile : t.nav.profile}
                </a>
                {!isEmployer && (
                  <a
                    href={l("/messages")}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
                  >
                    {t.nav.messages}
                    {summary.unreadMessages > 0 && <NavBadge count={summary.unreadMessages} />}
                  </a>
                )}
                <a
                  href={l("/notifications")}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
                >
                  {t.navExtra.notifications}
                </a>
                {isSeeker && (
                  <>
                    <a
                      href={l("/favorites")}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
                    >
                      {t.navExtra.favorites}
                    </a>
                    <a
                      href={l("/alerts")}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
                    >
                      {t.navExtra.alerts}
                    </a>
                  </>
                )}
                {isEmployer && (
                  <a
                    href={l("/pricing")}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
                  >
                    {t.pricing.breadcrumb}
                  </a>
                )}
                <button
                  onClick={() => logout()}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-surface-2"
                >
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <a href={l("/employer")} className="rounded-lg px-3 py-2.5 text-sm font-medium text-dusk hover:bg-surface-2">
                  {t.nav.forEmployers}
                </a>
                <a href={l("/login")} className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-2">
                  {t.nav.login}
                </a>
                <a
                  href={l("/signup")}
                  className="rounded-lg bg-signal px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-signal-dark"
                >
                  {t.nav.signup}
                </a>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </header>
  );
}

function NavBadge({ count }: { count: number }) {
  return (
    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-signal px-1 text-[10px] font-700 leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-dusk" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-dusk" aria-hidden>
      <path d="M14 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 12h10m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-dusk" aria-hidden>
      <path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-dusk" aria-hidden>
      <path
        d="M12 20.5l-1.45-1.32C5.4 14.5 2 11.4 2 7.6 2 4.8 4.2 2.6 7 2.6c1.6 0 3.1.74 4 1.93.9-1.19 2.4-1.93 4-1.93 2.8 0 5 2.2 5 5 0 3.8-3.4 6.9-8.55 11.6L12 20.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-dusk" aria-hidden>
      <path
        d="M18 8.5a6 6 0 10-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13.7 19a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-dusk" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-dusk" aria-hidden>
      <path
        d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.5-4.1-1.6-7-5.3-7-9.5V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
