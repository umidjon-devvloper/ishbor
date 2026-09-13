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
import { useT } from "../../../lib/i18n/index.js";
import { useAuth } from "../../../components/AuthContext.js";
import { fetchAdminUsers, setUserBlocked, setUserRole } from "../../../lib/apiExtra.js";
import type { AdminUser, Paged } from "../../../lib/types.js";

export default function Page() {
  return (
    <AdminShell>
      <UsersTable />
    </AdminShell>
  );
}

function UsersTable() {
  const t = useT();
  const { accessToken, status, user } = useAuth();
  const [data, setData] = useState<Paged<AdminUser> | null>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    if (status !== "authed" || user?.role !== "admin" || !accessToken) return;
    void fetchAdminUsers(accessToken, { text: query, role, page }).then(setData);
  }, [status, user, accessToken, query, role, page]);

  useEffect(load, [load]);

  async function toggleBlock(row: AdminUser) {
    if (!accessToken) return;
    if (!row.isBlocked && !window.confirm(t.admin.common.confirmAction)) return;
    await setUserBlocked(accessToken, row.id, !row.isBlocked).catch(() => undefined);
    load();
  }

  async function changeRole(row: AdminUser, next: "job_seeker" | "employer" | "admin") {
    if (!accessToken) return;
    if (!window.confirm(t.admin.common.confirmAction)) return;
    await setUserRole(accessToken, row.id, next).catch(() => undefined);
    load();
  }

  const roleLabel: Record<string, string> = {
    job_seeker: t.admin.overview.seekers,
    employer: t.admin.overview.employers,
    admin: t.navExtra.admin,
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
          placeholder={t.admin.users.searchPlaceholder}
        />
        <AdminSelect
          label={t.admin.users.role}
          value={role}
          onChange={(v) => {
            setPage(1);
            setRole(v);
          }}
          options={[
            { value: "", label: t.admin.users.allRoles },
            { value: "job_seeker", label: roleLabel.job_seeker },
            { value: "employer", label: roleLabel.employer },
            { value: "admin", label: roleLabel.admin },
          ]}
        />
      </AdminFilters>

      {data && data.items.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-dusk">
          {t.admin.users.empty}
        </p>
      ) : (
        <AdminTable
          head={
            <>
              <th className="px-4 py-2.5 font-semibold">Email</th>
              <th className="px-4 py-2.5 font-semibold">{t.admin.users.role}</th>
              <th className="px-4 py-2.5 font-semibold">{t.admin.users.applications}</th>
              <th className="px-4 py-2.5 font-semibold">{t.admin.users.registered}</th>
              <th className="px-4 py-2.5 font-semibold">&nbsp;</th>
            </>
          }
        >
          {(data?.items ?? []).map((row) => (
            <tr key={row.id} className="border-b border-line/60 last:border-0">
              <td className="px-4 py-3">
                <span className="block font-semibold text-ink">{row.name ?? row.email}</span>
                <span className="block text-xs text-dusk">{row.email}</span>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {row.isBlocked && (
                    <Tag tone="warn">{t.admin.users.blocked}</Tag>
                  )}
                  {row.isPhoneVerified && <Tag>{t.admin.users.phoneVerified}</Tag>}
                  {row.telegramLinked && <Tag>{t.admin.users.telegram}</Tag>}
                  {row.companyName && <Tag>{row.companyName}</Tag>}
                </span>
              </td>
              <td className="px-4 py-3 text-dusk">{roleLabel[row.role] ?? row.role}</td>
              <td className="px-4 py-3 font-mono text-[13px] text-dusk">{row.applicationCount}</td>
              <td className="px-4 py-3 text-dusk">
                {new Date(row.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-1.5">
                  <RowButton onClick={() => void toggleBlock(row)} tone={row.isBlocked ? "primary" : "danger"}>
                    {row.isBlocked ? t.admin.users.unblock : t.admin.users.block}
                  </RowButton>
                  {row.role !== "admin" && (
                    <RowButton onClick={() => void changeRole(row, "admin")}>
                      {t.admin.users.makeAdmin}
                    </RowButton>
                  )}
                  {row.role !== "employer" && (
                    <RowButton onClick={() => void changeRole(row, "employer")}>
                      {t.admin.users.makeEmployer}
                    </RowButton>
                  )}
                  {row.role !== "job_seeker" && (
                    <RowButton onClick={() => void changeRole(row, "job_seeker")}>
                      {t.admin.users.makeSeeker}
                    </RowButton>
                  )}
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

function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warn" }) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
        tone === "warn" ? "bg-gold/20 text-gold-deep" : "bg-surface-2 text-dusk"
      }`}
    >
      {children}
    </span>
  );
}
