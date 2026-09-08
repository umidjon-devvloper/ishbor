import React, { useState } from "react";

/** Ko'rsatish uchun — kasrli (masalan 4.3) yulduzlarni to'ldirib ko'rsatadi. */
export function StarRating({ value, className = "text-base" }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span
      className={`relative inline-block select-none leading-none ${className}`}
      aria-label={`${value.toFixed(1)} / 5`}
      role="img"
    >
      <span className="text-line" aria-hidden>★★★★★</span>
      <span
        className="absolute inset-0 overflow-hidden whitespace-nowrap text-gold"
        style={{ width: `${pct}%` }}
        aria-hidden
      >
        ★★★★★
      </span>
    </span>
  );
}

/** Kiritish uchun — 1..5 yulduz tanlash (hover bilan). */
export function StarInput({
  value,
  onChange,
  className = "text-2xl",
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <span className={`inline-flex leading-none ${className}`} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          type="button"
          key={i}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          aria-label={`${i}`}
          className={`px-0.5 leading-none transition-colors ${
            active >= i ? "text-gold" : "text-line hover:text-gold/60"
          }`}
        >
          <span aria-hidden>★</span>
        </button>
      ))}
    </span>
  );
}
