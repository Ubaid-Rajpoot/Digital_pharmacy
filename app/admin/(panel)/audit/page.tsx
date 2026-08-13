"use client";

import { useState } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, EmptyState, ErrorState, PageHeader, Pagination, SearchInput, Select, Skeleton, Table, Td, Th, TimeAgo, useToast,
} from "@/components/admin/ui";
import { dateTime } from "@/components/admin/format";

const ACTION_TONE: Record<string, string> = {
  created: "green", updated: "blue", deleted: "red", "bulk delete": "red",
  "updated status": "violet", approved: "green", replied: "blue", adjusted: "orange",
  "signed in": "green", "signed out": "muted", restore: "blue",
};

export default function AuditPage() {
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 15 });
  const { data, loading, error, refetch } = useList<{ id: number; user: string; action: string; target: string; at: string; ip: string; changes: { field: string; from: unknown; to: unknown }[] }>("audit", params);
  const mutate = useMutate("audit");
  const toast = useToast();

  const exportCsv = () => {
    const rows = data?.items ?? [];
    if (!rows.length) return toast("No audit rows to export", "info");
    const csv = ["user,action,target,at,ip,changes"].concat(rows.map((r) => `"${r.user}","${r.action}","${r.target.replace(/"/g, '""')}","${r.at}","${r.ip}","${JSON.stringify(r.changes).replace(/"/g, '""')}"`)).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `medora-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Audit logs"
        sub="Every action taken in the Control Centre — who did what, when and from where."
        actions={<Btn variant="secondary" icon="download" onClick={exportCsv}>Export audit</Btn>}
      />

      <Card kicker="Immutable trail" title="Admin activity" pad={false} bodyClassName="admin-table-card">
        <div className="admin-toolbar">
          <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search users, actions or targets…" />
          <Select className="admin-select" value={(params.filters?.action as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, action: e.target.value }, page: 1 }))}>
            <option value="">All actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="updated status">Status changes</option>
            <option value="approved">Approved</option>
            <option value="bulk delete">Bulk actions</option>
            <option value="signed in">Sign-ins</option>
          </Select>
        </div>

        {loading ? <Skeleton rows={10} /> : error ? <ErrorState message={error} retry={refetch} /> : !data || data.items.length === 0 ? (
          <EmptyState icon="audit" title="No audit entries" body="Actions you take across the admin will appear here." />
        ) : (
          <>
            <Table minWidth={920} head={<><Th>User</Th><Th>Action</Th><Th>Target</Th><Th>Changes</Th><Th>IP</Th><Th>When</Th></>}>
              {data.items.map((a, i) => (
                <tr key={a.id ?? i}>
                  <Td><b>{a.user}</b></Td>
                  <Td><span className={`admin-status ${ACTION_TONE[a.action] ?? "blue"}`}><i /> {a.action}</span></Td>
                  <Td><b>{a.target}</b></Td>
                  <Td>
                    {a.changes.length === 0 ? <span className="admin-muted-cell">—</span> : (
                      <span className="admin-muted-cell" style={{ display: "inline-flex", gap: 4, flexWrap: "wrap", maxWidth: 260 }}>
                        {a.changes.slice(0, 2).map((c, i) => (
                          <span key={i} className="admin-coupon-code" style={{ fontSize: 8.5 }}>
                            {c.field}: {String(c.from ?? "—")} → {String(c.to ?? "—")}
                          </span>
                        ))}
                        {a.changes.length > 2 && <span className="admin-coupon-code">+{a.changes.length - 2} more</span>}
                      </span>
                    )}
                  </Td>
                  <Td className="admin-order-id">{a.ip}</Td>
                  <Td className="admin-muted-cell">{dateTime(a.at)}</Td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(p) => setParams((x) => ({ ...x, page: p }))} />
          </>
        )}
      </Card>
    </>
  );
}
