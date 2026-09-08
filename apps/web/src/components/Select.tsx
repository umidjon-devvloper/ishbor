import React, { useRef, useState } from "react";
import { useClickOutside } from "../lib/useClickOutside.js";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Premium custom dropdown — native <select> o'rniga (mavzuga moslashuvchi,
 * brend uslubidagi). `name` berilsa, forma uchun yashirin input ham chiqaradi.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder,
  name,
  variant = "default",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  name?: string;
  variant?: "default" | "bare";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  useClickOutside(ref, () => setOpen(false), open);

  const buttonBase =
    variant === "bare"
      ? `h-12 rounded-xl border border-transparent bg-transparent ${open ? "bg-surface-2" : "hover:bg-surface-2"}`
      : `h-11 rounded-xl border bg-surface-2 ${open ? "border-signal" : "border-line hover:border-signal/50"}`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 px-3.5 text-sm transition-colors focus:outline-none ${buttonBase}`}
      >
        <span className={`truncate ${selected ? "text-ink" : "text-dusk"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 text-dusk transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <ul
            role="listbox"
            className="absolute left-0 z-50 mt-1.5 max-h-64 w-full min-w-full overflow-auto rounded-xl border border-line bg-surface py-1 shadow-pop"
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm transition-colors ${
                      active ? "bg-signal-soft font-medium text-signal" : "text-ink hover:bg-surface-2"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {active && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
                        <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
