import React, { useState } from "react";
import { submitSupport } from "../../lib/api.js";
import { useT, useHref } from "../../lib/i18n/index.js";

export default function Page() {
  const t = useT();
  const l = useHref();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await submitSupport({ name: name || undefined, email: email || undefined, message });
      setSent(true);
    } catch {
      setError(t.contact.error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-2 text-sm text-dusk">
        <a href={l("/")} className="hover:text-signal">
          {t.search.breadcrumbHome}
        </a>{" "}
        / {t.contact.breadcrumb}
      </div>
      <h1 className="font-display text-2xl font-700 text-ink sm:text-3xl">{t.contact.title}</h1>
      <p className="mt-1 text-sm text-dusk">{t.contact.subtitle}</p>

      <div className="mt-7 grid gap-6 md:grid-cols-[1fr_240px]">
        <div className="animate-fade-up rounded-2xl border border-line bg-surface p-6">
          {sent ? (
            <div className="rounded-xl bg-growth/10 px-4 py-6 text-center text-sm font-medium text-growth">
              {t.contact.success}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label={t.contact.nameLabel} value={name} onChange={setName} required />
              <Field label={t.contact.emailLabel} type="email" value={email} onChange={setEmail} placeholder="ism@email.com" required />
              <label className="block">
                <span className="text-sm font-medium text-ink">{t.contact.messageLabel}</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.contact.messagePlaceholder}
                  required
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-dusk focus:border-signal focus:bg-surface focus:outline-none"
                />
              </label>
              {error && <p className="text-sm text-signal">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="glow-signal w-full rounded-xl bg-signal py-3 text-sm font-semibold text-white hover:bg-signal-dark active:scale-[0.99] disabled:opacity-60"
              >
                {sending ? t.contact.submitting : t.contact.submit}
              </button>
            </form>
          )}
        </div>

        <div
          style={{ animationDelay: "80ms" }}
          className="animate-fade-up rounded-2xl border border-line bg-surface-2 p-5"
        >
          {/* h1 → h3 sakramasligi uchun sarlavha emas, ta'kidlangan matn */}
          <p className="font-display text-sm font-600 text-ink">{t.contact.channelsTitle}</p>
          <ul className="mt-3 space-y-2.5 text-sm text-dusk">
            <li>
              <a href="mailto:support@ishbor-ishkerak.uz" className="transition-colors hover:text-signal">
                support@ishbor-ishkerak.uz
              </a>
            </li>
            <li>
              <a href="https://t.me/ishbor" className="transition-colors hover:text-signal">
                @ishbor (Telegram)
              </a>
            </li>
            <li>+998 71 200 00 00</li>
          </ul>
        </div>
      </div>
    </div>
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
