import React, { useEffect, useState } from "react";
import { AdminShell } from "../../components/AdminShell.js";
import { useT } from "../../lib/i18n/index.js";
import { useAuth } from "../../components/AuthContext.js";
import { formatNumber } from "../../lib/format.js";
import {
  fetchAdminOverview,
  reindexSearch,
  runAlertsNow,
  sendBroadcast,
} from "../../lib/apiExtra.js";
import type { AdminOverview } from "../../lib/types.js";

/** Admin bosh sahifasi: ko'rsatkichlar, 14 kunlik dinamika, xizmat amallari. */
export default function Page() {
  return (
    <AdminShell>
      <Overview />
    </AdminShell>
  );
}

function Overview() {
  const t = useT();
  const { accessToken, status, user } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== "authed" || user?.role !== "admin" || !accessToken) return;
    let cancelled = false;
    fetchAdminOverview(accessToken).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [status, user, accessToken]);

  async function run(action: "reindex" | "alerts") {
    if (!accessToken) return;
    setBusy(true);
    setMessage(null);
    try {
      if (action === "reindex") {
        const r = await reindexSearch(accessToken);
        setMessage(t.admin.overview.reindexDone(r.indexed));
      } else {
        const r = await runAlertsNow(accessToken);
        setMessage(t.admin.overview.alertsDone(r.checked));
      }
    } catch {
      setMessage(t.admin.common.failed);
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    );
  }

  const maxDay = Math.max(1, ...data.chart.map((d) => Math.max(d.users, d.applications)));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label={t.admin.overview.users}
          value={formatNumber(data.users.total)}
          details={[
            `${data.users.seekers} ${t.admin.overview.seekers}`,
            `${data.users.employers} ${t.admin.overview.employers}`,
            ...(data.users.blocked > 0 ? [`${data.users.blocked} ${t.admin.overview.blocked}`] : []),
          ]}
        />
        <MetricCard
          label={t.admin.overview.newThisWeek}
          value={formatNumber(data.users.newThisWeek)}
        />
        <MetricCard
          label={t.admin.overview.companies}
          value={formatNumber(data.companies.total)}
          details={[`${data.companies.verified} ${t.admin.overview.verified}`]}
        />
        <MetricCard
          label={t.admin.overview.activeVacancies}
          value={formatNumber(data.vacancies.active)}
          details={
            data.vacancies.moderation > 0
              ? [`${data.vacancies.moderation} ${t.admin.overview.onModeration}`]
              : []
          }
        />
        <MetricCard
          label={t.admin.overview.applications}
          value={formatNumber(data.applications.total)}
          details={[`${data.applications.today} ${t.admin.overview.today}`]}
        />
        <MetricCard
          label={t.admin.overview.revenue}
          value={`${formatNumber(data.payments.revenue)} ${t.fmt.currency}`}
          details={[`${data.payments.paid} ${t.pricingExtra.statusPaid.toLowerCase()}`]}
          accent
        />
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-bold text-ink">
            {t.admin.overview.chartTitle}
          </h2>
          <div className="flex items-center gap-4 text-xs text-dusk">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-signal" /> {t.admin.overview.chartUsers}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-growth" />{" "}
              {t.admin.overview.chartApplications}
            </span>
          </div>
        </div>

        <div className="mt-5 flex h-40 items-end gap-1.5">
          {data.chart.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full items-end justify-center gap-0.5">
                <span
                  className="w-1/2 rounded-t bg-signal/80"
                  style={{ height: `${(day.users / maxDay) * 100}%` }}
                  title={`${t.admin.overview.chartUsers}: ${day.users}`}
                />
                <span
                  className="w-1/2 rounded-t bg-growth/80"
                  style={{ height: `${(day.applications / maxDay) * 100}%` }}
                  title={`${t.admin.overview.chartApplications}: ${day.applications}`}
                />
              </div>
              <span className="text-[10px] text-dusk">{day.date.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-base font-bold text-ink">{t.admin.overview.actions}</h2>
        <p className="mt-1 text-sm text-dusk">
          {t.admin.overview.searchEngine}: <span className="font-mono">{data.search.engine}</span>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("reindex")}
            className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-signal hover:text-signal disabled:opacity-60"
          >
            {t.admin.overview.reindex}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("alerts")}
            className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-signal hover:text-signal disabled:opacity-60"
          >
            {t.admin.overview.runAlerts}
          </button>
          {message && <span className="text-sm text-growth">{message}</span>}
        </div>
      </section>

      <BroadcastForm />
    </div>
  );
}

function MetricCard({
  label,
  value,
  details = [],
  accent = false,
}: {
  label: string;
  value: string;
  details?: string[];
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? "border-signal/40 bg-signal/[0.05]" : "border-line bg-surface"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-dusk">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-bold text-ink">{value}</p>
      {details.length > 0 && (
        <p className="mt-1.5 text-xs text-dusk">{details.join(" · ")}</p>
      )}
    </div>
  );
}

function BroadcastForm() {
  const t = useT();
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [role, setRole] = useState<"all" | "job_seeker" | "employer">("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || title.trim().length < 3 || body.trim().length < 3) return;
    if (!window.confirm(t.admin.common.confirmAction)) return;

    setSending(true);
    setResult(null);
    try {
      const r = await sendBroadcast(accessToken, { title: title.trim(), body: body.trim(), role });
      setResult(t.admin.overview.broadcastSent(r.sent));
      setTitle("");
      setBody("");
    } catch {
      setResult(t.admin.common.failed);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-base font-bold text-ink">{t.admin.overview.broadcast}</h2>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-dusk" htmlFor="bc-title">
            {t.admin.overview.broadcastTitle}
          </label>
          <input
            id="bc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
            className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-signal focus:bg-surface focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-dusk" htmlFor="bc-body">
            {t.admin.overview.broadcastBody}
          </label>
          <textarea
            id="bc-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={1000}
            className="mt-1 w-full resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-signal focus:bg-surface focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-dusk" htmlFor="bc-role">
              {t.admin.overview.broadcastAudience}
            </label>
            <select
              id="bc-role"
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="mt-1 block rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-signal focus:outline-none"
            >
              <option value="all">{t.admin.overview.audienceAll}</option>
              <option value="job_seeker">{t.admin.overview.audienceSeekers}</option>
              <option value="employer">{t.admin.overview.audienceEmployers}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={sending || title.trim().length < 3 || body.trim().length < 3}
            className="rounded-xl bg-signal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-signal-dark disabled:opacity-60"
          >
            {t.admin.overview.send}
          </button>
          {result && <span className="text-sm text-growth">{result}</span>}
        </div>
      </form>
    </section>
  );
}
