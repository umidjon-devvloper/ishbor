import React, { useCallback, useEffect, useState } from "react";
import { useT } from "../lib/i18n/index.js";
import { useAuth } from "./AuthContext.js";
import { fetchTelegramStatus, requestTelegramLink } from "../lib/api.js";
import type { TelegramStatus } from "../lib/types.js";

/** Profil sahifasida: Telegram bog'lash + telefon tasdiqlash kartasi. */
export function TelegramConnect() {
  const t = useT();
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!accessToken) return;
    fetchTelegramStatus(accessToken).then(setStatus);
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function connect() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const link = await requestTelegramLink(accessToken);
      window.open(link, "_blank", "noopener");
      setShowHint(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  const allDone = status?.linked && status?.phoneVerified;

  return (
    <section className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-600 text-ink">
            <TgIcon />
            {t.telegram.title}
          </h2>
          <p className="mt-1 text-sm text-dusk">{t.telegram.subtitle}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge ok={Boolean(status?.linked)} yes={t.telegram.linked} no={t.telegram.notLinked} />
        <Badge
          ok={Boolean(status?.phoneVerified)}
          yes={`${t.telegram.phoneVerified}${status?.phone ? ` · ${status.phone}` : ""}`}
          no={t.telegram.phoneNotVerified}
        />
      </div>

      {!allDone && (
        <div className="mt-4">
          <button
            onClick={connect}
            disabled={busy}
            className="glow-signal inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-2.5 text-sm font-semibold text-white hover:bg-signal-dark active:scale-[0.98] disabled:opacity-60"
          >
            <TgIcon white />
            {busy ? t.telegram.connecting : t.telegram.connect}
          </button>
          {showHint && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-signal-soft px-4 py-3 text-sm text-ink">
              <span className="flex-1">{t.telegram.hint}</span>
              <button
                onClick={refresh}
                className="shrink-0 rounded-lg border border-signal/40 px-3 py-1.5 text-xs font-semibold text-signal transition-colors hover:bg-signal hover:text-white"
              >
                {t.telegram.refresh}
              </button>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-signal">{error}</p>}
        </div>
      )}
    </section>
  );
}

function Badge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-600 ${
        ok ? "bg-growth/10 text-growth" : "bg-surface-2 text-dusk"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-growth" : "bg-line"}`} />
      {ok ? yes : no}
    </span>
  );
}

function TgIcon({ white = false }: { white?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21.5 4.5 2.9 11.7c-.9.35-.86 1.62.06 1.92l4.6 1.5 1.77 5.5c.28.86 1.38 1.05 1.93.34l2.55-3.3 4.7 3.44c.7.5 1.68.13 1.85-.72l3-14.1c.2-.94-.72-1.72-1.86-1.28Z"
        fill={white ? "#fff" : "#1E88E5"}
        opacity={white ? 0.95 : 1}
      />
    </svg>
  );
}
