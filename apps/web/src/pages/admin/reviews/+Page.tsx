import React, { useCallback, useEffect, useState } from "react";
import {
  AdminShell,
  AdminTable,
  AdminFilters,
  AdminSelect,
  Pager,
  RowButton,
} from "../../../components/AdminShell.js";
import { useT, useHref } from "../../../lib/i18n/index.js";
import { useAuth } from "../../../components/AuthContext.js";
import { deleteAdminReview, fetchAdminReviews, setReviewStatus } from "../../../lib/apiExtra.js";
import type { AdminReview, Paged } from "../../../lib/types.js";

export default function Page() {
  return (
    <AdminShell>
      <ReviewsTable />
    </AdminShell>
  );
}

function ReviewsTable() {
  const t = useT();
  const l = useHref();
  const { accessToken, status, user } = useAuth();
  const [data, setData] = useState<Paged<AdminReview> | null>(null);
  const [reviewStatus, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    if (status !== "authed" || user?.role !== "admin" || !accessToken) return;
    void fetchAdminReviews(accessToken, { status: reviewStatus, page }).then(setData);
  }, [status, user, accessToken, reviewStatus, page]);

  useEffect(load, [load]);

  async function apply(row: AdminReview, next: "approved" | "rejected") {
    if (!accessToken) return;
    await setReviewStatus(accessToken, row.id, next).catch(() => undefined);
    load();
  }

  async function drop(row: AdminReview) {
    if (!accessToken) return;
    if (!window.confirm(t.admin.common.confirmAction)) return;
    await deleteAdminReview(accessToken, row.id).catch(() => undefined);
    load();
  }

  const statusLabels: Record<string, string> = {
    pending: t.admin.overview.onModeration,
    approved: t.admin.reviews.approve,
    rejected: t.admin.reviews.reject,
  };

  return (
    <div>
      <AdminFilters>
        <AdminSelect
          label={t.admin.reviews.status}
          value={reviewStatus}
          onChange={(v) => {
            setPage(1);
            setStatusFilter(v);
          }}
          options={[
            { value: "", label: t.admin.vacancies.allStatuses },
            { value: "pending", label: statusLabels.pending },
            { value: "approved", label: statusLabels.approved },
            { value: "rejected", label: statusLabels.rejected },
          ]}
        />
      </AdminFilters>

      {data && data.items.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-dusk">
          {t.admin.reviews.empty}
        </p>
      ) : (
        <AdminTable
          head={
            <>
              <th className="px-4 py-2.5 font-semibold">{t.admin.reviews.company}</th>
              <th className="px-4 py-2.5 font-semibold">{t.admin.reviews.author}</th>
              <th className="px-4 py-2.5 font-semibold">{t.admin.reviews.status}</th>
              <th className="px-4 py-2.5 font-semibold">&nbsp;</th>
            </>
          }
        >
          {(data?.items ?? []).map((row) => (
            <tr key={row.id} className="border-b border-line/60 last:border-0">
              <td className="px-4 py-3">
                <a
                  href={l(`/companies/${row.companySlug}`)}
                  className="block font-semibold text-ink transition-colors hover:text-signal"
                >
                  {row.companyName}
                </a>
                <span className="mt-0.5 block font-mono text-xs text-gold-deep">
                  {"★".repeat(row.rating)}
                  {"☆".repeat(5 - row.rating)}
                </span>
                {row.comment && (
                  <span className="mt-1 block max-w-md text-xs leading-relaxed text-dusk">
                    {row.comment}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-dusk">
                {row.authorName}
                <span className="block text-xs">
                  {new Date(row.createdAt).toLocaleDateString()}
                </span>
              </td>
              <td className="px-4 py-3 text-dusk">{statusLabels[row.status] ?? row.status}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-1.5">
                  {row.status !== "approved" && (
                    <RowButton tone="primary" onClick={() => void apply(row, "approved")}>
                      {t.admin.reviews.approve}
                    </RowButton>
                  )}
                  {row.status !== "rejected" && (
                    <RowButton onClick={() => void apply(row, "rejected")}>
                      {t.admin.reviews.reject}
                    </RowButton>
                  )}
                  <RowButton tone="danger" onClick={() => void drop(row)}>
                    {t.admin.reviews.delete}
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
