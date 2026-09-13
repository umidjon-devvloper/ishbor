import React, { useCallback, useEffect, useState } from "react";
import {
  AdminShell,
  AdminTable,
  AdminFilters,
  AdminSearchInput,
  Pager,
  RowButton,
} from "../../../components/AdminShell.js";
import { useT, useHref } from "../../../lib/i18n/index.js";
import { useAuth } from "../../../components/AuthContext.js";
import { fetchAdminCompanies, verifyCompany } from "../../../lib/apiExtra.js";
import type { AdminCompany, Paged } from "../../../lib/types.js";

export default function Page() {
  return (
    <AdminShell>
      <CompaniesTable />
    </AdminShell>
  );
}

function CompaniesTable() {
  const t = useT();
  const l = useHref();
  const { accessToken, status, user } = useAuth();
  const [data, setData] = useState<Paged<AdminCompany> | null>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    if (status !== "authed" || user?.role !== "admin" || !accessToken) return;
    void fetchAdminCompanies(accessToken, { text: query, page }).then(setData);
  }, [status, user, accessToken, query, page]);

  useEffect(load, [load]);

  async function toggleVerify(row: AdminCompany) {
    if (!accessToken) return;
    await verifyCompany(accessToken, row.id, !row.isVerified).catch(() => undefined);
    load();
  }

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
          placeholder={t.admin.companies.searchPlaceholder}
        />
      </AdminFilters>

      {data && data.items.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-dusk">
          {t.admin.companies.empty}
        </p>
      ) : (
        <AdminTable
          head={
            <>
              <th className="px-4 py-2.5 font-semibold">{t.admin.nav.companies}</th>
              <th className="px-4 py-2.5 font-semibold">{t.admin.companies.owner}</th>
              <th className="px-4 py-2.5 font-semibold">{t.admin.companies.plan}</th>
              <th className="px-4 py-2.5 font-semibold">{t.admin.companies.vacancies}</th>
              <th className="px-4 py-2.5 font-semibold">&nbsp;</th>
            </>
          }
        >
          {(data?.items ?? []).map((row) => (
            <tr key={row.id} className="border-b border-line/60 last:border-0">
              <td className="px-4 py-3">
                <a
                  href={l(`/companies/${row.slug}`)}
                  className="block font-semibold text-ink transition-colors hover:text-signal"
                >
                  {row.name}
                </a>
                {row.isVerified && (
                  <span className="mt-1 inline-block rounded-md bg-growth/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-growth">
                    {t.admin.companies.verified}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-dusk">{row.ownerEmail}</td>
              <td className="px-4 py-3 text-dusk">
                {row.planName ?? "—"}
                {row.subscriptionExpiresAt && (
                  <span className="block text-xs">
                    {new Date(row.subscriptionExpiresAt).toLocaleDateString()}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-[13px] text-dusk">
                {row.vacancyCount} · {row.reviewCount} {t.admin.companies.reviews}
              </td>
              <td className="px-4 py-3 text-right">
                <RowButton tone={row.isVerified ? "neutral" : "primary"} onClick={() => void toggleVerify(row)}>
                  {row.isVerified ? t.admin.companies.unverify : t.admin.companies.verify}
                </RowButton>
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
