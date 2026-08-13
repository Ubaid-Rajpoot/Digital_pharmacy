"use client";

import { useState } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon, type IconName } from "@/components/admin/icons";
import {
  Btn, Card, EmptyState, ErrorState, PageHeader, Pagination, Select, Skeleton, Table, Td, Th, TimeAgo, useToast,
} from "@/components/admin/ui";

const TYPE_META: Record<string, { icon: IconName; tone: string }> = {
  order: { icon: "orders", tone: "blue" },
  stock: { icon: "inventory", tone: "orange" },
  dealer: { icon: "dealers", tone: "violet" },
  refund: { icon: "wallet", tone: "red" },
  review: { icon: "reviews", tone: "green" },
  message: { icon: "support", tone: "blue" },
  system: { icon: "settings", tone: "muted" },
};

export default function NotificationsPage() {
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 12 });
  const { data, loading, error, refetch } = useList<{ id: number; type: string; title: string; body: string; at: string; read: boolean; href: string }>("notifications", params);
  const mutate = useMutate("notifications", { onSuccess: refetch });
  const toast = useToast();

  const unread = (data?.items ?? []).filter((n) => !n.read).length;

  const markAll = async () => {
    const ids = (data?.items ?? []).filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return toast("Nothing unread", "info");
    await mutate.bulk("update", ids, { read: true }, "Marked as read");
  };

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Notifications"
        sub="A live feed of everything that needs your attention across the store."
        actions={<Btn variant="secondary" icon="check" onClick={() => void markAll()}>Mark all read</Btn>}
      />

      <div className="admin-stat-strip">
        <div><span>Total</span><b>{data?.total ?? 0}</b><small>in this view</small></div>
        <div><span>Unread</span><b>{unread}</b><small>need attention</small></div>
        <div><span>Orders</span><b>{(data?.items ?? []).filter((n) => n.type === "order").length}</b><small>sales events</small></div>
        <div><span>System</span><b>{(data?.items ?? []).filter((n) => n.type === "system").length}</b><small>platform alerts</small></div>
      </div>

      <Card pad={false} bodyClassName="admin-table-card">
        <div className="admin-toolbar">
          <Select className="admin-select" value={(params.filters?.type as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, type: e.target.value }, page: 1 }))}>
            <option value="">All types</option>
            <option value="order">Orders</option>
            <option value="stock">Inventory</option>
            <option value="dealer">Dealers</option>
            <option value="refund">Refunds</option>
            <option value="review">Reviews</option>
            <option value="message">Messages</option>
            <option value="system">System</option>
          </Select>
          <Select className="admin-select" value={(params.filters?.read as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, read: e.target.value }, page: 1 }))}>
            <option value="">Read & unread</option>
            <option value="false">Unread only</option>
            <option value="true">Read only</option>
          </Select>
          <Btn variant="secondary" size="sm" icon="settings" onClick={() => toast("Notification preferences are stored per user in Settings.", "info")}>Preferences</Btn>
        </div>

        {loading ? <Skeleton rows={8} /> : error ? <ErrorState message={error} retry={refetch} /> : !data || data.items.length === 0 ? (
          <EmptyState icon="notifications" title="All caught up" body="New events from orders, inventory and customers will land here." />
        ) : (
          <>
            <Table minWidth={760} head={<><Th>Event</Th><Th>Details</Th><Th>When</Th><Th>State</Th><Th /></>}>
              {data.items.map((n, i) => {
                const meta = TYPE_META[n.type] ?? TYPE_META.system;
                return (
                  <tr key={n.id ?? i} style={{ opacity: n.read ? 0.6 : 1 }}>
                    <Td>
                      <span className={`admin-quick-icon ${meta.tone}`}><Icon name={meta.icon} size={15} /></span>
                    </Td>
                    <Td><b>{n.title}</b><span className="admin-payment">{n.body}</span></Td>
                    <Td className="admin-muted-cell"><TimeAgo iso={n.at} /></Td>
                    <Td>{n.read ? <span className="admin-status">Read</span> : <span className="admin-status blue"><i /> New</span>}</Td>
                    <Td>
                      {!n.read && (
                        <Btn size="sm" variant="quiet" onClick={() => void mutate.update(n.id, { read: true }, "")}>Mark read</Btn>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(p) => setParams((x) => ({ ...x, page: p }))} />
          </>
        )}
      </Card>
    </>
  );
}
