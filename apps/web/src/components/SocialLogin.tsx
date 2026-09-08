import React, { useEffect, useRef, useState } from "react";
import { loginWithGoogle, startTelegramLogin, pollTelegramLogin, ApiError } from "../lib/api.js";
import { useAuth } from "./AuthContext.js";
import { useT } from "../lib/i18n/index.js";

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

/**
 * Ijtimoiy kirish bloki: Telegram (bot deep-link + polling) va Google (GIS).
 * - Telegram: faqat oldin profilda Telegram bog'lagan foydalanuvchi kira oladi.
 * - Google: login sahifasida hisob topilmasa NEED_SIGNUP xatosi keladi;
 *   signup sahifasida `role` berilgani uchun hisob darrov yaratiladi.
 */
export function SocialLogin({
  role,
  onDone,
  showTelegram = true,
}: {
  role?: "job_seeker" | "employer";
  onDone: () => void;
  showTelegram?: boolean;
}) {
  const t = useT();
  const { login } = useAuth();
  const [tgState, setTgState] = useState<"idle" | "waiting" | "not_linked" | "expired">("idle");
  const [error, setError] = useState<string | null>(null);
  const googleRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number | null>(null);

  // Google GIS skriptini faqat shu sahifada, async yuklaymiz (performance'ga zarar yo'q)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleRef.current) return;

    const renderButton = () => {
      if (!window.google || !googleRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setError(null);
          try {
            const { accessToken } = await loginWithGoogle(credential, role);
            await login(accessToken);
            onDone();
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
          }
        },
      });
      window.google.accounts.id.renderButton(googleRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    };

    if (window.google) {
      renderButton();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = renderButton;
    document.head.appendChild(script);
  }, [role]);

  // Komponent yopilsa pollingni to'xtatamiz
  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  async function handleTelegram() {
    setError(null);
    setTgState("waiting");
    try {
      const { token, link } = await startTelegramLogin();
      window.open(link, "_blank", "noopener");
      // Har 2.5 soniyada natijani so'raymiz (token 5 daqiqa yashaydi)
      pollRef.current = window.setInterval(async () => {
        try {
          const res = await pollTelegramLogin(token);
          if (res.status === "pending") return;
          if (pollRef.current) window.clearInterval(pollRef.current);
          if (res.status === "ok") {
            await login(res.accessToken);
            onDone();
          } else {
            setTgState(res.status === "not_linked" ? "not_linked" : "expired");
          }
        } catch {
          /* tarmoq uzilishi — keyingi urinishda davom etadi */
        }
      }, 2500);
    } catch (err) {
      setTgState("idle");
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    }
  }

  const hasAny = showTelegram || Boolean(GOOGLE_CLIENT_ID);
  if (!hasAny) return null;

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-dusk">{t.login.orDivider}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="mt-4 space-y-2.5">
        {showTelegram && (
          <button
            type="button"
            onClick={handleTelegram}
            disabled={tgState === "waiting"}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface py-2.5 text-sm font-semibold text-ink transition-all hover:border-[#2AABEE]/60 hover:text-[#1e8bc3] active:scale-[0.99] disabled:opacity-70"
          >
            <TelegramIcon />
            {tgState === "waiting" ? t.login.tgWaiting : t.login.withTelegram}
          </button>
        )}
        {tgState === "not_linked" && (
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-dusk">{t.login.tgNotLinked}</p>
        )}
        {tgState === "expired" && (
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-dusk">{t.login.tgExpired}</p>
        )}

        {GOOGLE_CLIENT_ID && <div ref={googleRef} className="flex justify-center" />}
      </div>

      {error && <p className="mt-3 text-sm text-signal">{error}</p>}
    </div>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#2AABEE" />
      <path
        d="M5.4 11.9l11.2-4.4c.5-.2 1 .1.8.9l-1.9 9c-.14.63-.55.78-1.1.48l-3-2.2-1.45 1.4c-.16.16-.3.3-.6.3l.2-3.06 5.6-5.05c.24-.2-.06-.33-.37-.12l-6.9 4.35-2.98-.93c-.65-.2-.66-.65.14-.97z"
        fill="#fff"
      />
    </svg>
  );
}
