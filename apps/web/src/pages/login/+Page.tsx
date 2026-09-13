import React, { useState } from "react";
import { loginUser, ApiError } from "../../lib/api.js";
import { useAuth } from "../../components/AuthContext.js";
import { AuthShell } from "../../components/AuthShell.js";
import {
  AuthTabs,
  AuthField,
  PasswordField,
  AuthSubmit,
  MailIcon,
} from "../../components/AuthForm.js";
import { SocialLogin } from "../../components/SocialLogin.js";
import { useT, useHref } from "../../lib/i18n/index.js";

export default function Page() {
  const { login } = useAuth();
  const t = useT();
  const l = useHref();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken } = await loginUser({ email, password });
      await login(accessToken);
      window.location.assign(l("/"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.login.connError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell active="login">
      <h1 className="font-display text-[1.85rem] font-extrabold leading-tight tracking-tight text-ink sm:text-[2rem]">
        {t.login.title} <span className="text-shine">{t.login.titleAccent}</span>
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-dusk">{t.login.subtitle}</p>

      <div className="mt-5">
        <AuthTabs active="login" />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <AuthField
          label={t.login.identifier}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={t.login.identifierPlaceholder}
          autoComplete="username"
          required
          icon={<MailIcon />}
        />
        <PasswordField
          label={t.login.password}
          value={password}
          onChange={setPassword}
          placeholder={t.login.passwordPlaceholder}
          autoComplete="current-password"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] font-medium text-ink/85">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-[18px] w-[18px] cursor-pointer rounded-md border-line text-signal accent-signal focus:ring-signal"
            />
            {t.login.remember}
          </label>
          <a
            href={l("/support")}
            className="text-[13.5px] font-semibold text-signal transition-colors hover:text-signal-dark"
          >
            {t.login.forgot}
          </a>
        </div>

        {error && (
          <p className="animate-fade-in rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <AuthSubmit loading={loading} label={t.login.submit} loadingLabel={t.login.submitting} />
      </form>

      <SocialLogin onDone={() => window.location.assign(l("/"))} />

      <p className="mt-4 text-center text-[13.5px] text-dusk">
        {t.login.noAccount}{" "}
        <a
          href={l("/signup")}
          className="group inline-flex items-center gap-1 font-bold text-signal transition-colors hover:text-signal-dark"
        >
          {t.login.signupLink}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </p>
    </AuthShell>
  );
}
