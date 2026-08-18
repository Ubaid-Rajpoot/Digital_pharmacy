"use client";

import { useEffect, useState } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, Confirm, Drawer, EmptyState, ErrorState, Field, IconBtn, PageHeader,
  Pagination, SearchInput, Select, Skeleton, Status, Table, Td, Th, TimeAgo, useToast,
} from "@/components/admin/ui";
import { dateShort, money, timeAgo } from "@/components/admin/format";
import type { Customer, Order } from "@/lib/db/types";

const TIER_TONE: Record<string, string> = { Bronze: "muted", Silver: "blue", Gold: "orange", Platinum: "violet" };

export default function CustomersPage() {
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 10 });
  const [detail, setDetail] = useState<Customer | null>(null);
  const [confirmBan, setConfirmBan] = useState<Customer | null>(null);
  const [pointsGift, setPointsGift] = useState<{ customer: Customer; amount: number } | null>(null);
  const { data, loading, error, refetch } = useList<Customer>("customers", params);
  const mutate = useMutate("customers", { onSuccess: refetch });
  const toast = useToast();

  const toggleBan = async (c: Customer) => {
    const target = c.status === "banned" ? "active" : "banned";
    const res = await mutate.update(c.id, { status: target }, target === "banned" ? "Customer banned" : "Customer re-activated");
    if (res.ok) {
      setConfirmBan(null);
      setDetail((d) => (d && d.id === c.id ? { ...d, status: target as Customer["status"] } : d));
    }
  };

  const giftPoints = async () => {
    if (!pointsGift) return;
    const res = await mutate.update(pointsGift.customer.id, { rewardPoints: pointsGift.customer.rewardPoints + pointsGift.amount }, `Added ${pointsGift.amount} reward points`);
    if (res.ok) {
      setPointsGift(null);
      refetch();
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Customers"
        sub="Profiles, purchase history and account management for everyone who shops with you."
        actions={<Btn icon="download" variant="secondary" onClick={() => { toast("Export from the Reports module.", "info"); }}>Export</Btn>}
      />

      <div className="admin-stat-strip">
        <div><span>Total customers</span><b>{data?.total ?? 0}</b><small>registered accounts</small></div>
        <div><span>Active</span><b>{(data?.items ?? []).filter((c) => c.status === "active").length}</b><small>in good standing</small></div>
        <div><span>Banned</span><b>{(data?.items ?? []).filter((c) => c.status === "banned").length}</b><small>restricted accounts</small></div>
        <div><span>Platinum tier</span><b>{(data?.items ?? []).filter((c) => c.tier === "Platinum").length}</b><small>top spenders</small></div>
      </div>

      <Card pad={false} bodyClassName="admin-table-card">
        <div className="admin-toolbar">
          <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search customers…" />
          <Select className="admin-select" value={(params.filters?.tier as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, tier: e.target.value }, page: 1 }))}>
            <option value="">All tiers</option>
            <option value="Bronze">Bronze</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Platinum">Platinum</option>
          </Select>
          <Select className="admin-select" value={(params.filters?.status as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, status: e.target.value }, page: 1 }))}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </Select>
        </div>

        {loading ? (
          <Skeleton rows={8} />
        ) : error ? (
          <ErrorState message={error} retry={refetch} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon="customers" title="No customers found" body="Try a different search." />
        ) : (
          <>
            <Table minWidth={960} head={<><Th>Customer</Th><Th>Tier</Th><Th>Orders</Th><Th>Lifetime spend</Th><Th>Reward points</Th><Th>Status</Th><Th>Joined</Th><Th /></>}>
              {data.items.map((c) => (
                <tr key={c.id} onClick={() => setDetail(c)}>
                  <Td>
                    <div className="admin-table-product">
                      <img src={c.avatar} alt="" style={{ borderRadius: "50%" }} />
                      <span><b>{c.name}</b><small>{c.email}</small></span>
                    </div>
                  </Td>
                  <Td><Status value={c.tier} /></Td>
                  <Td>{c.orders}</Td>
                  <Td><b>{money(c.lifetimeSpend)}</b></Td>
                  <Td><b className="admin-order-id">{c.rewardPoints}</b></Td>
                  <Td><Status value={c.status} /></Td>
                  <Td className="admin-muted-cell"><TimeAgo iso={c.joinedAt} /></Td>
                  <Td><IconBtn icon="eye" label="View profile" onClick={(e) => { e.stopPropagation(); setDetail(c); }} /></Td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(p) => setParams((x) => ({ ...x, page: p }))} />
          </>
        )}
      </Card>

      {detail && (
        <CustomerProfile
          customer={detail}
          onClose={() => setDetail(null)}
          onBan={() => setConfirmBan(detail)}
          onPoints={() => setPointsGift({ customer: detail, amount: 100 })}
        />
      )}

      <Confirm
        open={confirmBan !== null}
        onClose={() => setConfirmBan(null)}
        onConfirm={() => confirmBan && void toggleBan(confirmBan)}
        title={confirmBan?.status === "banned" ? "Re-activate customer?" : "Ban this customer?"}
        body={confirmBan ? `${confirmBan.name} will be ${confirmBan.status === "banned" ? "restored to active status" : "blocked from placing orders and signing in"}.` : undefined}
        confirmLabel={confirmBan?.status === "banned" ? "Re-activate" : "Ban account"}
        tone={confirmBan?.status === "banned" ? "primary" : "danger"}
        loading={mutate.loading}
      />

      <Confirm
        open={pointsGift !== null}
        onClose={() => setPointsGift(null)}
        onConfirm={() => void giftPoints()}
        title="Add reward points"
        body={pointsGift ? `Add ${pointsGift.amount} reward points to ${pointsGift.customer.name}'s account?` : undefined}
        confirmLabel={`Add ${pointsGift?.amount ?? 0} points`}
        tone="primary"
        loading={mutate.loading}
      />
    </>
  );
}

// ------------------------------------------------------------

function CustomerProfile({ customer, onClose, onBan, onPoints }: { customer: Customer; onClose: () => void; onBan: () => void; onPoints: () => void }) {
  const [tab, setTab] = useState("history");
  const { data: orders } = useList<Order>("orders", { pageSize: 50, filters: { customerId: customer.id } });

  const tabs = [
    { id: "history", label: "Purchase history", count: orders?.items.length ?? 0 },
    { id: "wishlist", label: "Wishlist", count: customer.wishlist.length },
    { id: "addresses", label: "Addresses", count: customer.addresses.length },
  ];

  return (
    <Drawer
      open
      onClose={onClose}
      title={customer.name}
      sub={`${customer.email} · ${customer.phone} · joined ${dateShort(customer.joinedAt)}`}
      footer={
        <>
          <Btn variant="secondary" onClick={onPoints} icon="spark">Gift points</Btn>
          <Btn variant="secondary" icon="key" onClick={() => { window.location.href = "/admin/settings"; }}>Reset password</Btn>
          <Btn variant={customer.status === "banned" ? "primary" : "danger"} icon={customer.status === "banned" ? "userCheck" : "ban"} onClick={onBan}>
            {customer.status === "banned" ? "Re-activate" : "Ban account"}
          </Btn>
        </>
      }
    >
      <div className="admin-customer-hero">
        <img src={customer.avatar} alt="" width={56} height={56} style={{ borderRadius: 17, objectFit: "cover" }} />
        <div>
          <h3>{customer.name}</h3>
          <small>{customer.email}</small>
          <Status value={customer.tier} />
        </div>
      </div>

      <div className="admin-profile-stats">
        <div><b>{customer.orders}</b><small>Orders placed</small></div>
        <div><b>{money(customer.lifetimeSpend)}</b><small>Lifetime spend</small></div>
        <div><b>{customer.rewardPoints}</b><small>Reward points</small></div>
      </div>

      <div className="admin-content-tabs" style={{ margin: "18px 0" }}>
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            {t.label}
            {t.count !== undefined && <b>{t.count}</b>}
          </button>
        ))}
      </div>

      {tab === "history" && (
        <>
          {!orders || orders.items.length === 0 ? (
            <EmptyState icon="orders" title="No orders yet" body="This customer hasn't placed any orders." />
          ) : (
            <div className="admin-booking-list">
              {orders.items.slice(0, 8).map((o) => (
                <div className="admin-booking" key={o.id} style={{ gridTemplateColumns: "70px 1fr auto" }}>
                  <b>{o.number}</b>
                  <span><strong>{o.items.length} item(s)</strong><small>{timeAgo(o.createdAt)}</small></span>
                  <span style={{ textAlign: "right" }}>
                    <strong>{money(o.total)}</strong>
                    <small style={{ display: "block", marginTop: 4 }}><Status value={o.status} /></small>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "wishlist" && (
        <>
          {customer.wishlist.length === 0 ? (
            <EmptyState icon="heart" title="Empty wishlist" body="Products saved by this customer appear here." />
          ) : (
            <div className="admin-form-stack">
              {customer.wishlist.map((w) => (
                <div key={w.productId} className="admin-order-item">
                  <img src={w.image} alt="" className="dark:!mix-blend-normal" />
                  <span><b>{w.name}</b><small>In wishlist</small></span>
                  <strong>{money(w.price)}</strong>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "addresses" && (
        <div className="admin-form-stack">
          {customer.addresses.map((a, i) => (
            <div key={i} className="admin-card" style={{ padding: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <b style={{ fontSize: 11.5 }}>{a.label}</b>
                {a.default && <span className="admin-coupon-code green">Default</span>}
              </div>
              <div className="admin-address" style={{ margin: 0 }}>
                <Icon name="pin" size={14} />
                <span><b>{a.line1}</b><small>{a.city}, {a.state} {a.pincode}</small></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
