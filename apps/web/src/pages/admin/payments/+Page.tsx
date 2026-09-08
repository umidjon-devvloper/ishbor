import React, { useCallback, useEffect, useState } from "react";
import {
  AdminShell,
  AdminTable,
  AdminFilters,
  AdminSelect,
  Pager,
  RowButton,
} from "../../../components/AdminShell.js";
import { useT } from "../../../lib/i18n/index.js";
import { useAuth } from "../../../components/AuthContext.js";
import { formatNumber } from "../../../lib/format.js";
import { confirmPayment, fetchAdminPayments } from "../../../lib/apiExtra.js";
import type { AdminPayment, Paged } from "../../../lib/types.js";

export default function Page() {
  return (
    <AdminShell>
      <PaymentsTable />
    </AdminShell>
  );
}

function PaymentsTable() {
  const t = useT();
  const { accessToken, status, user } = useAuth();
  const [data, setData] = useState<Paged<AdminPayment> | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    if (status !== "authed" || user?.role !== "admin" || !accessToken) return;
    void fetchAdminPayments(accessToken, { status: paymentStatus, page }).then(setData);
  }, [status, user, accessToken, paymentStatus, page]);

  useEffect(load, [load]);

  async function confirm(row: AdminPayment) {
    if (!accessToken || !row.transactionId) return;
    if (!window.confirm(t.admin.common.confirmAction)) return;
    await confirmPayment(accessToken, row.transactionId).catch(() => undefined);
    load();
  }

  const statusLabels: Record<string, string> = {
    pending: t.pricingExtra.statusPending,
    paid: t.pricingExtra.statusPaid,
    failed: t.pricingExtra.statusFailed,
    refunded: t.pricingExtra.statusRefunded,
  };

  return (
    <div>
      <AdminFilters>
        <AdminSelect
          label={t.admin.payments.status}
          value={paymentStatus}
          onChange={(v) => {
            setPage(1);
            setPaymentStatus(v);
          }}
          options={[
            { value: "", label: t.admin.vacancies.allStatuses },
            { value: "pending", label: statusLabels.pending },
            { value: "paid", label: statusLabels.paid },
            { value: "failed", label: statusLabels.failed },
            { value: "refunded", label: statusLabels.refunded },
          ]}
        />
      </AdminFilters>

      {data && data.items.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-dusk">
          {t.admin.payments.empty}
        </p>
      ) : (
        <AdminTable
          head={
            <>
              <th className="px-4 py-2.5 font-600">{t.admin.payments.company}</th>
              <th className="px-4 py-2.5 font-600">{t.admin.payments.plan}</th>
              <th className="px-4 py-2.5 font-600">{t.admin.payments.amount}</th>
              <th className="px-4 py-2.5 font-600">{t.admin.payments.provider}</th>
              <th className="px-4 py-2.5 font-600">{t.admin.payments.status}</th>
              <th className="px-4 py-2.5 font-600">&nbsp;</th>
            </>
          }
        >
          {(data?.items ?? []).map((row) => (
            <tr key={row.id} className="border-b border-line/60 last:border-0">
              <td className="px-4 py-3">
                <span className="block font-600 text-ink">{row.companyName}</span>
                <span className="block font-mono text-[11px] text-dusk">{row.transactionId}</span>
              </td>
              <td className="px-4 py-3 text-dusk">{row.planName}</td>
              <td className="px-4 py-3 font-mono text-[13px] text-ink">
                {formatNumber(row.amount)}
              </td>
              <td className="px-4 py-3 text-dusk">{row.provider}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-600 ${
                    row.status === "paid" ? "bg-growth/10 text-growth" : "bg-surface-2 text-dusk"
                  }`}
                >
                  {statusLabels[row.status] ?? row.status}
                </span>
                {row.paidAt && (
                  <span className="mt-1 block text-xs text-dusk">
                    {new Date(row.paidAt).toLocaleDateString()}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {row.status === "pending" && row.transactionId && (
                  <RowButton tone="primary" onClick={() => void confirm(row)}>
                    {t.admin.payments.confirm}
                  </RowButton>
                )}
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
