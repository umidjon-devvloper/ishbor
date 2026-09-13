import React, { useRef, useState } from "react";
import { useT, useHref } from "../lib/i18n/index.js";
import { useClickOutside } from "../lib/useClickOutside.js";
import { useNotifications } from "../lib/useNotifications.js";
import type { AppNotification } from "../lib/types.js";

/**
 * Header'dagi qo'ng'iroq: o'qilmaganlar soni va oxirgi bildirishnomalar ro'yxati.
 * To'liq ro'yxat `/notifications` sahifasida.
 */
export function NotificationBell({ token }: { token: string | null }) {
  const t = useT();
  const l = useHref();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useClickOutside(boxRef, () => setOpen(false), open);

  const { items, unreadCount, markRead, markAllRead } = useNotifications(token, { limit: 8 });

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t.notifications.title}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-dusk transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M18 8.5a6 6 0 10-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M13.7 19a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-signal px-1 text-[10px] font-bold leading-none text-white ring-2 ring-paper">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[336px] max-w-[calc(100vw-2rem)] origin-top-right animate-pop overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <span className="font-display text-sm font-bold text-ink">{t.notifications.title}</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-medium text-signal transition-colors hover:text-signal-dark"
              >
                {t.notifications.markAllRead}
              </button>
            ) : (
              <span className="text-xs text-dusk">{t.notifications.allRead}</span>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-dusk">{t.notifications.empty}</p>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <NotificationRow
                    notification={n}
                    href={l(n.url ?? "/notifications")}
                    onOpen={() => {
                      if (!n.isRead) void markRead(n.id);
                      setOpen(false);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          <a
            href={l("/notifications")}
            className="block border-t border-line px-4 py-2.5 text-center text-sm font-medium text-signal transition-colors hover:bg-surface-2"
          >
            {t.notifications.viewAll}
          </a>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  href,
  onOpen,
}: {
  notification: AppNotification;
  href: string;
  onOpen: () => void;
}) {
  const t = useT();
  return (
    <a
      href={href}
      onClick={onOpen}
      className={`flex gap-3 px-4 py-3 transition-colors hover:bg-surface-2 ${
        notification.isRead ? "" : "bg-signal/[0.06]"
      }`}
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          notification.isRead ? "bg-transparent" : "bg-signal"
        }`}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{notification.title}</span>
        <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-dusk">
          {notification.body}
        </span>
        <span className="mt-1 block text-[11px] text-dusk/80">
          {t.notifications.types[notification.type]}
        </span>
      </span>
    </a>
  );
}
