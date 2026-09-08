import React, { useEffect, useState } from "react";
import { useT, useHref } from "../../lib/i18n/index.js";
import { useAuth } from "../../components/AuthContext.js";
import { useNotifications } from "../../lib/useNotifications.js";
import { usePush } from "../../lib/usePush.js";
import { fetchNotificationPrefs, saveNotificationPrefs } from "../../lib/apiExtra.js";
import type { NotificationChannel, NotificationPref, NotificationType } from "../../lib/types.js";

const TYPES: NotificationType[] = [
  "new_application",
  "application_status_changed",
  "new_vacancy_match",
  "system",
];
const CHANNELS: NotificationChannel[] = ["in_app", "telegram", "push", "email"];

/** Bildirishnomalar ro'yxati + kanal sozlamalari. */
export default function Page() {
  const t = useT();
  const l = useHref();
  const { status, accessToken } = useAuth();
  const { items, unreadCount, markRead, markAllRead, remove } = useNotifications(
    status === "authed" ? accessToken : null,
    { limit: 60 }
  );
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [tab, setTab] = useState<"list" | "settings">("list");

  useEffect(() => {
    if (status === "guest") window.location.assign(l("/login"));
  }, [status, l]);

  const visible = unreadOnly ? items.filter((n) => !n.isRead) : items;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-2 text-sm text-dusk">
        <a href={l("/")} className="hover:text-signal">
          {t.search.breadcrumbHome}
        </a>{" "}
        / {t.notifications.title}
      </div>
      <h1 className="font-display text-2xl font-700 text-ink sm:text-3xl">
        {t.notifications.title}
      </h1>
      <p className="mt-1 text-sm text-dusk">{t.notifications.subtitle}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <TabButton active={tab === "list"} onClick={() => setTab("list")}>
          {t.notifications.title}
          {unreadCount > 0 && (
            <span className="ml-1.5 rounded-full bg-signal px-1.5 py-0.5 text-[10px] font-700 leading-none text-white">
              {unreadCount}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
          {t.notifications.settings}
        </TabButton>

        {tab === "list" && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUnreadOnly((v) => !v)}
              className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-dusk transition-colors hover:text-ink"
            >
              {unreadOnly ? t.notifications.showAll : t.notifications.unreadOnly}
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="rounded-lg bg-signal/10 px-2.5 py-1.5 text-xs font-medium text-signal transition-colors hover:bg-signal/20"
              >
                {t.notifications.markAllRead}
              </button>
            )}
          </div>
        )}
      </div>

      {tab === "list" ? (
        <div className="mt-5">
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-10 text-center">
              <p className="font-display text-base font-600 text-ink">{t.notifications.empty}</p>
              <p className="mt-1.5 text-sm text-dusk">{t.notifications.emptyHint}</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {visible.map((n, i) => (
                <li
                  key={n.id}
                  style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
                  className={`animate-fade-up rounded-xl border p-4 transition-colors ${
                    n.isRead ? "border-line bg-surface" : "border-signal/30 bg-signal/[0.05]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-700 text-ink">{n.title}</span>
                        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-600 text-dusk">
                          {t.notifications.types[n.type]}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-dusk">{n.body}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="text-[11px] text-dusk/80">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                        {n.url && (
                          <a
                            href={l(n.url)}
                            onClick={() => !n.isRead && void markRead(n.id)}
                            className="text-xs font-medium text-signal hover:text-signal-dark"
                          >
                            {t.notifications.viewAll}
                          </a>
                        )}
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => void markRead(n.id)}
                            className="text-xs font-medium text-dusk hover:text-ink"
                          >
                            {t.notifications.markAllRead}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void remove(n.id)}
                          className="text-xs font-medium text-dusk hover:text-ink"
                        >
                          {t.notifications.delete}
                        </button>
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <SettingsPanel />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-signal/10 text-signal" : "text-dusk hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/** Kanal sozlamalari jadvali + brauzer push tugmasi. */
function SettingsPanel() {
  const t = useT();
  const { accessToken } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPref[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const push = usePush(accessToken);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    fetchNotificationPrefs(accessToken).then((list) => {
      if (!cancelled) setPrefs(list);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  function valueOf(type: NotificationType, channel: NotificationChannel) {
    return prefs.find((p) => p.notificationType === type && p.channel === channel);
  }

  function toggle(type: NotificationType, channel: NotificationChannel) {
    setPrefs((prev) =>
      prev.map((p) =>
        p.notificationType === type && p.channel === channel
          ? { ...p, isEnabled: !p.isEnabled }
          : p
      )
    );
    setSaved(false);
  }

  async function save() {
    if (!accessToken) return;
    setSaving(true);
    try {
      await saveNotificationPrefs(
        accessToken,
        prefs.map((p) => ({
          notificationType: p.notificationType,
          channel: p.channel,
          isEnabled: p.isEnabled,
        }))
      );
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const pushLabel = {
    loading: "…",
    unsupported: t.notifications.push.unsupported,
    unconfigured: t.notifications.push.notConfigured,
    blocked: t.notifications.push.blocked,
    off: t.notifications.push.enable,
    on: t.notifications.push.enabled,
  }[push.state];

  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-base font-700 text-ink">
          {t.notifications.settingsTitle}
        </h2>
        <p className="mt-1 text-sm text-dusk">{t.notifications.settingsHint}</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="py-2 pr-3 font-600 text-dusk">&nbsp;</th>
                {CHANNELS.map((channel) => (
                  <th key={channel} className="px-3 py-2 text-center font-600 text-dusk">
                    {t.notifications.channels[channel]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TYPES.map((type) => (
                <tr key={type} className="border-b border-line/60 last:border-0">
                  <td className="py-3 pr-3 text-ink">{t.notifications.types[type]}</td>
                  {CHANNELS.map((channel) => {
                    const pref = valueOf(type, channel);
                    const available = pref?.available ?? false;
                    return (
                      <td key={channel} className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={pref?.isEnabled ?? true}
                          disabled={!available}
                          onChange={() => toggle(type, channel)}
                          title={available ? undefined : t.notifications.channelUnavailable}
                          className="h-4 w-4 accent-[#1565C0] disabled:opacity-40"
                          aria-label={`${t.notifications.types[type]} — ${t.notifications.channels[channel]}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || prefs.length === 0}
            className="rounded-xl bg-signal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-signal-dark disabled:opacity-60"
          >
            {t.notifications.save}
          </button>
          {saved && <span className="text-sm text-growth">{t.notifications.saved}</span>}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-base font-700 text-ink">{t.notifications.push.title}</h2>
        <p className="mt-1 text-sm text-dusk">{t.notifications.push.hint}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {push.state === "on" ? (
            <button
              type="button"
              onClick={() => void push.disable()}
              disabled={push.busy}
              className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-signal hover:text-signal disabled:opacity-60"
            >
              {t.notifications.push.disable}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void push.enable()}
              disabled={push.busy || push.state !== "off"}
              className="rounded-xl bg-signal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-signal-dark disabled:opacity-60"
            >
              {t.notifications.push.enable}
            </button>
          )}
          <span className="text-sm text-dusk">{pushLabel}</span>
        </div>
      </section>
    </div>
  );
}
