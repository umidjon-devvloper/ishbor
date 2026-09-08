import React, { useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { registerUser, ApiError } from "../../lib/api.js";
import { useAuth } from "../../components/AuthContext.js";
import { HeroBackdrop } from "../../components/HeroBackdrop.js";
import { SocialLogin } from "../../components/SocialLogin.js";
import { BrandPanel } from "../login/+Page.js";
import { useT, useHref } from "../../lib/i18n/index.js";

export default function Page() {
  const { login } = useAuth();
  const t = useT();
  const l = useHref();
  const pageContext = usePageContext();
  const initialRole =
    (pageContext.urlParsed?.search?.role as string) === "employer" ? "employer" : "job_seeker";
  const [role, setRole] = useState<"job_seeker" | "employer">(initialRole);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken } = await registerUser({
        email,
        password,
        role,
        firstName: role === "job_seeker" ? firstName : undefined,
        lastName: role === "job_seeker" ? lastName : undefined,
        companyName: role === "employer" ? companyName : undefined,
      });
      await login(accessToken);
      window.location.assign(l(role === "employer" ? "/employer" : "/profile"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.signup.connError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[82vh] max-w-7xl lg:grid-cols-2">
      <div className="relative flex items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
        <HeroBackdrop variant="soft" />
        <div className="relative w-full max-w-sm animate-card-in">
        <h1 className="font-display text-3xl font-700 tracking-tight text-ink">{t.signup.title}</h1>
        <p className="mt-2 text-sm text-dusk">{t.signup.subtitle}</p>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
          <RoleTab active={role === "job_seeker"} onClick={() => setRole("job_seeker")} label={t.signup.roleSeeker} />
          <RoleTab active={role === "employer"} onClick={() => setRole("employer")} label={t.signup.roleEmployer} />
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {role === "job_seeker" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label={t.signup.firstName} value={firstName} onChange={setFirstName} placeholder="Aziz" />
              <Field label={t.signup.lastName} value={lastName} onChange={setLastName} placeholder="Aliyev" />
            </div>
          ) : (
            <Field
              label={t.signup.companyName}
              value={companyName}
              onChange={setCompanyName}
              placeholder={t.signup.companyNamePlaceholder}
              required
            />
          )}
          <Field label={t.signup.email} type="email" value={email} onChange={setEmail} placeholder="ism@email.com" required />
          <Field label={t.signup.password} type="password" value={password} onChange={setPassword} placeholder={t.signup.passwordHint} required />

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
            {loading ? t.signup.submitting : t.signup.submit}
          </button>
        </form>

        {/* Google — tanlangan rol bilan hisob yaratadi. Telegram kirish faqat
            mavjud (bog'langan) hisoblar uchun, shuning uchun bu yerda ko'rsatilmaydi. */}
        <SocialLogin
          role={role}
          showTelegram={false}
          onDone={() => window.location.assign(l(role === "employer" ? "/employer" : "/profile"))}
        />

        <p className="mt-6 text-sm text-dusk">
          {t.signup.haveAccount}{" "}
          <a href={l("/login")} className="font-medium text-ink underline underline-offset-4 hover:text-gold-deep">
            {t.signup.loginLink}
          </a>
        </p>
        </div>
      </div>

      <BrandPanel />
    </div>
  );
}

function RoleTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
        active ? "bg-surface text-ink shadow-xs" : "text-dusk hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type?: string;
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
