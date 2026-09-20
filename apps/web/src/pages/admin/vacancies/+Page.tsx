import React, { useState } from "react";
import {
  AdminActionsHeader,
  AdminShell,
  AdminTable,
  AdminFilters,
  AdminSearchInput,
  AdminSelect,
  Pager,
  RowButton,
} from "../../../components/AdminShell.js";
import { AdminError, AdminNotice } from "../../../components/admin/AdminStates.js";
import { useT, useHref, useLocale } from "../../../lib/i18n/index.js";
import { useAuth } from "../../../components/AuthContext.js";
import { formatNumber } from "../../../lib/format.js";
import { fetchAdminVacancies, moderateVacancy } from "../../../lib/apiExtra.js";
import { useAdminResource } from "../../../lib/admin/useAdminResource.js";
import { errorText, useNotice } from "../../../lib/admin/useNotice.js";
import type { AdminVacancy } from "../../../lib/types.js";

export default function Page() {
  return (
    <AdminShell>
      <VacanciesTable />
    </AdminShell>
  );
}

function VacanciesTable() {
  const t = useT();
  const l = useHref();
  const { locale } = useLocale();
  const { accessToken, status, user } = useAuth();
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [vacancyStatus, setVacancyStatus] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { notice, show } = useNotice();

  const token = status === "authed" && user?.role === "admin" ? accessToken : null;
  // Xato bo'sh jadval bo'lib ko'rinmaydi, eski javob yangi filtr ustiga yozilmaydi (audit ISSUE-021)
  const { state, pending, reload } = useAdminResource(
    token ? (signal) => fetchAdminVacancies(token, { text: query, status: vacancyStatus, page }, signal) : null,
    JSON.stringify({ query, vacancyStatus, page })
  );

  async function moderate(
    row: AdminVacancy,
    input: { status?: "active" | "rejected" | "archived"; isPremium?: boolean }
  ) {
    if (!token || busyId) return;
    let reason: string | undefined;
    if (input.status === "rejected") {
      const answer = window.prompt(t.admin.vacancies.rejectReason);
      if (answer === null) return;
      reason = answer;
    } else if (!window.confirm(`${t.admin.common.confirmAction}\n\n${row.title}`)) {
      // E'lonni yopish, chop etish va "premium" belgisi — e'lon nomi bilan tasdiqlanadi (audit R3, admin-staff-12)
      return;
    }
    setBusyId(row.id);
    try {
      await moderateVacancy(token, row.id, { ...input, reason });
      show("success", t.admin.common.done);
      reload();
    } catch (err) {
      show("error", errorText(err, t.admin.common.failed, locale));
    } finally {
      setBusyId(null);
    }
  }

  const statusLabels: Record<string, string> = {
    draft: "draft",
    moderation: t.admin.overview.onModeration,
    active: t.alerts.active,
    archived: t.admin.vacancies.archive,
    rejected: t.admin.vacancies.reject,
  };

  const data = state.kind === "ready" ? state.data : null;

  return (
    <div>
      <AdminFilters>
        <AdminSearchInput
          value={text}
          onChange={setText}
          onSubmit={() => {
            setPage(1);
            setQuery(text.trim());
          }}
          placeholder={t.admin.vacancies.searchPlaceholder}
        />
        <AdminSelect
          label={t.admin.vacancies.status}
          value={vacancyStatus}
          onChange={(v) => {
            setPage(1);
            setVacancyStatus(v);
          }}
          options={[
            { value: "", label: t.admin.vacancies.allStatuses },
            { value: "active", label: statusLabels.active },
            { value: "moderation", label: statusLabels.moderation },
            { value: "archived", label: statusLabels.archived },
            { value: "rejected", label: statusLabels.rejected },
          ]}
        />
      </AdminFilters>

      {notice && (
        <div className="mb-3">
          <AdminNotice notice={notice} />
        </div>
      )}

      {state.kind === "error" ? (
        <AdminError
          title={t.admin.common.loadErrorTitle}
          text={t.admin.common.loadErrorText}
          retry={t.admin.common.retry}
          onRetry={reload}
        />
      ) : state.kind === "loading" ? (
        <div className="h-48 animate-pulse rounded-xl border border-line bg-surface-2" aria-busy="true" />
      ) : data && data.items.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-dusk">
          {t.admin.vacancies.empty}
        </p>
      ) : (
        <div className={pending ? "opacity-60 transition-opacity" : undefined} aria-busy={pending || undefined}>
          <AdminTable
            minWidth={780}
            head={
              <>
                <th className="px-4 py-2.5 font-semibold">{t.admin.nav.vacancies}</th>
                <th className="px-4 py-2.5 font-semibold">{t.admin.vacancies.status}</th>
                <th className="px-4 py-2.5 font-semibold">{t.admin.vacancies.views}</th>
                <th className="px-4 py-2.5 font-semibold">{t.admin.vacancies.applications}</th>
                <AdminActionsHeader label={t.contentAdmin.articles.columns.actions} />
              </>
            }
          >
            {(data?.items ?? []).map((row) => (
              <tr key={row.id} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3">
                  {/* Ochiq sahifa faqat faol e'londa bor — boshqasiga havola 404 berardi (audit ISSUE-094) */}
                  {row.status === "active" ? (
                    <a
                      href={l(`/vacancies/${row.slug}`)}
                      className="block font-semibold text-ink transition-colors hover:text-signal"
                    >
                      {row.title}
                    </a>
                  ) : (
                    <span className="block font-semibold text-ink">{row.title}</span>
                  )}
                  <span className="block text-xs text-dusk">
                    {row.companyName}
                    {row.regionName ? ` · ${row.regionName}` : ""}
                    {row.salaryMin ? ` · ${formatNumber(row.salaryMin)}` : ""}
                  </span>
                  {row.isPremium && (
                    <span className="mt-1 inline-block rounded-md bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gold-deep">
                      {t.vacancyCard.premium}
                    </span>
                  )}
                  {row.rejectionReason && (
                    <span className="mt-1 block text-xs text-dusk">↳ {row.rejectionReason}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-dusk">{statusLabels[row.status] ?? row.status}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-dusk">{row.viewsCount}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-dusk">{row.applicationCount}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {/* Qoralamani moderator chop eta olmaydi (audit R3, D-070): server 409 beradi, tugma ham ko'rsatilmaydi */}
                    {row.status !== "active" && row.status !== "draft" && (
                      <RowButton tone="primary" disabled={busyId !== null} onClick={() => void moderate(row, { status: "active" })}>
                        {t.admin.vacancies.approve}
                      </RowButton>
                    )}
                    {row.status !== "rejected" && (
                      <RowButton tone="danger" disabled={busyId !== null} onClick={() => void moderate(row, { status: "rejected" })}>
                        {t.admin.vacancies.reject}
                      </RowButton>
                    )}
                    {row.status === "active" && (
                      <RowButton disabled={busyId !== null} onClick={() => void moderate(row, { status: "archived" })}>
                        {t.admin.vacancies.archive}
                      </RowButton>
                    )}
                    <RowButton disabled={busyId !== null} onClick={() => void moderate(row, { isPremium: !row.isPremium })}>
                      {row.isPremium ? t.admin.vacancies.removePremium : t.admin.vacancies.makePremium}
                    </RowButton>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        </div>
      )}

      {data && <Pager page={data.page} pageCount={data.pageCount} total={data.total} onChange={setPage} />}
    </div>
  );
}
