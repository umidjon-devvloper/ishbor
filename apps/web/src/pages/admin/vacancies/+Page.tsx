import React, { useCallback, useEffect, useState } from "react";
import {
  AdminShell,
  AdminTable,
  AdminFilters,
  AdminSearchInput,
  AdminSelect,
  Pager,
  RowButton,
} from "../../../components/AdminShell.js";
import { useT, useHref } from "../../../lib/i18n/index.js";
import { useAuth } from "../../../components/AuthContext.js";
import { formatNumber } from "../../../lib/format.js";
import { fetchAdminVacancies, moderateVacancy } from "../../../lib/apiExtra.js";
import type { AdminVacancy, Paged } from "../../../lib/types.js";

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
  const { accessToken, status, user } = useAuth();
  const [data, setData] = useState<Paged<AdminVacancy> | null>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [vacancyStatus, setVacancyStatus] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    if (status !== "authed" || user?.role !== "admin" || !accessToken) return;
    void fetchAdminVacancies(accessToken, { text: query, status: vacancyStatus, page }).then(setData);
  }, [status, user, accessToken, query, vacancyStatus, page]);

  useEffect(load, [load]);

  async function moderate(
    row: AdminVacancy,
    input: { status?: "active" | "rejected" | "archived"; isPremium?: boolean }
  ) {
    if (!accessToken) return;
    let reason: string | undefined;
    if (input.status === "rejected") {
      const answer = window.prompt(t.admin.vacancies.rejectReason);
      if (answer === null) return;
      reason = answer;
    }
    await moderateVacancy(accessToken, row.id, { ...input, reason }).catch(() => undefined);
    load();
  }

  const statusLabels: Record<string, string> = {
    draft: "draft",
    moderation: t.admin.overview.onModeration,
    active: t.alerts.active,
    archived: t.admin.vacancies.archive,
    rejected: t.admin.vacancies.reject,
  };

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

      {data && data.items.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-dusk">
          {t.admin.vacancies.empty}
        </p>
      ) : (
        <AdminTable
          minWidth={780}
          head={
            <>
              <th className="px-4 py-2.5 font-semibold">{t.admin.nav.vacancies}</th>
              <th className="px-4 py-2.5 font-semibold">{t.admin.vacancies.status}</th>
              <th className="px-4 py-2.5 font-semibold">{t.admin.vacancies.views}</th>
              <th className="px-4 py-2.5 font-semibold">{t.admin.vacancies.applications}</th>
              <th className="px-4 py-2.5 font-semibold">&nbsp;</th>
            </>
          }
        >
          {(data?.items ?? []).map((row) => (
            <tr key={row.id} className="border-b border-line/60 last:border-0">
              <td className="px-4 py-3">
                <a
                  href={l(`/vacancies/${row.slug}`)}
                  className="block font-semibold text-ink transition-colors hover:text-signal"
                >
                  {row.title}
                </a>
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
                  {row.status !== "active" && (
                    <RowButton tone="primary" onClick={() => void moderate(row, { status: "active" })}>
                      {t.admin.vacancies.approve}
                    </RowButton>
                  )}
                  {row.status !== "rejected" && (
                    <RowButton tone="danger" onClick={() => void moderate(row, { status: "rejected" })}>
                      {t.admin.vacancies.reject}
                    </RowButton>
                  )}
                  {row.status === "active" && (
                    <RowButton onClick={() => void moderate(row, { status: "archived" })}>
                      {t.admin.vacancies.archive}
                    </RowButton>
                  )}
                  <RowButton onClick={() => void moderate(row, { isPremium: !row.isPremium })}>
                    {row.isPremium ? t.admin.vacancies.removePremium : t.admin.vacancies.makePremium}
                  </RowButton>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {data && (
        <Pager page={data.page} pageCount={data.pageCount} total={data.total} onChange={setPage} />
      )}
    </div>
  );
}
