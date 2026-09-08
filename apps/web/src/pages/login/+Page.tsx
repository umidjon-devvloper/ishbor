import React, { useState } from "react";
import { loginUser, ApiError } from "../../lib/api.js";
import { useAuth } from "../../components/AuthContext.js";
import { HeroBackdrop } from "../../components/HeroBackdrop.js";
import { SocialLogin } from "../../components/SocialLogin.js";
import { useT, useHref } from "../../lib/i18n/index.js";

export default function Page() {
  const { login } = useAuth();
  const t = useT();
  const l = useHref();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="mx-auto grid min-h-[82vh] max-w-7xl lg:grid-cols-2">
      {/* Chap: forma ustuni */}
      <div className="relative flex items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
        <HeroBackdrop variant="soft" />
        <div className="relative w-full max-w-sm animate-card-in">
        <h1 className="font-display text-3xl font-700 tracking-tight text-ink">{t.login.title}</h1>
        <p className="mt-2 text-sm text-dusk">{t.login.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label={t.login.email} type="email" value={email} onChange={setEmail} placeholder="ism@email.com" required />
          <Field label={t.login.password} type="password" value={password} onChange={setPassword} placeholder="••••••••" required />

          {error && (
            <p className="animate-fade-in rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glow-signal w-full rounded-xl bg-signal py-3 text-sm font-semibold text-white hover:bg-signal-dark active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? t.login.submitting : t.login.submit}
          </button>
        </form>

        <SocialLogin onDone={() => window.location.assign(l("/"))} />

        <p className="mt-6 text-sm text-dusk">
          {t.login.noAccount}{" "}
          <a href={l("/signup")} className="font-medium text-ink underline underline-offset-4 hover:text-gold-deep">
            {t.login.signupLink}
          </a>
        </p>
        </div>
      </div>

      {/* O'ng: brend paneli (faqat katta ekran) */}
      <BrandPanel />
    </div>
  );
}

/** Auth sahifalarning o'ng brend paneli — siyoh fon, yirik so'z-belgi. */
export function BrandPanel() {
  const t = useT();
  return (
    <div className="grain relative my-6 mr-4 hidden overflow-hidden rounded-3xl bg-signal lg:flex lg:flex-col lg:justify-between lg:p-12 sm:mr-6" aria-hidden>
      <p className="font-display text-xl font-700 text-white">
        ISH BOR<span className="text-gold">!</span>
      </p>
      <div>
        <p className="max-w-md font-display text-4xl font-700 leading-[1.12] tracking-tight text-white">
          {t.footer.tagline}
        </p>
        <span className="mt-8 block h-1 w-16 rounded bg-gold" />
      </div>
      <p className="font-mono text-xs tabular-nums text-white/70">ishbor.uz · {new Date().getFullYear()}</p>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
      />
    </label>
  );
}
