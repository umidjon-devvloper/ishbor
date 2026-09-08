import React from "react";
import { useT, useHref } from "../lib/i18n/index.js";

/** Telefon tasdiqlanmagani sababli amal bloklanganda ko'rsatiladigan eslatma. */
export function PhoneGateNotice({ className = "" }: { className?: string }) {
  const t = useT();
  const l = useHref();
  return (
    <div className={`animate-slide-down rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm ${className}`}>
      <p className="font-600 text-ink">⚠️ {t.telegram.gateTitle}</p>
      <p className="mt-1 leading-relaxed text-dusk">{t.telegram.gateMessage}</p>
      <a
        href={l("/profile")}
        className="mt-2 inline-block font-600 text-signal transition-colors hover:text-signal-dark"
      >
        {t.telegram.gateAction} →
      </a>
    </div>
  );
}

/** ApiError kodini tekshirish yordamchisi. */
export function isPhoneGateError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "PHONE_NOT_VERIFIED";
}
