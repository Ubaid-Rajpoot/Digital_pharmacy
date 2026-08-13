"use client";

import { useEffect, useMemo, useState } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, Confirm, Drawer, EmptyState, ErrorState, Field, IconBtn, PageHeader, Pagination,
  SearchInput, Select, Skeleton, Status, Table, Td, Th, TimeAgo, useToast,
} from "@/components/admin/ui";
import { money, dateShort, timeAgo } from "@/components/admin/format";
import type { Dealer, Product } from "@/lib/db/types";

export default function DealersPage() {
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 10 });
  const [detail, setDetail] = useState<Dealer | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ dealer: Dealer; status: string } | null>(null);
  const { data, loading, error, refetch } = useList<Dealer>("dealers", params);
  const mutate = useMutate("dealers", { onSuccess: refetch });
  const toast = useToast();

  const setStatus = async (dealer: Dealer, status: string) => {
    const res = await mutate.update(dealer.id, { status }, `Dealer ${status}`);
    if (res.ok) {
      setConfirmAction(null);
      setDetail((d) => (d && d.id === dealer.id ? { ...d, status: status as Dealer["status"] } : d));
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Partners"
        title="Dealers & vendors"
        sub="Approve applications, review performance and manage commissions for your supply partners."
        actions={<Btn icon="userPlus" onClick={() => toast("New dealer invitations are handled from the storefront.", "info")}>Invite dealer</Btn>}
      />

      <div className="admin-stat-strip">
        <div><span>Total dealers</span><b>{data?.total ?? 0}</b><small>registered partners</small></div>
        <div><span>Approved</span><b>{(data?.items ?? []).filter((d) => d.status === "approved").length}</b><small>active on platform</small></div>
        <div><span>Pending review</span><b>{(data?.items ?? []).filter((d) => d.status === "pending").length}</b><small>need approval</small></div>
        <div><span>Suspended</span><b>{(data?.items ?? []).filter((d) => d.status === "suspended").length}</b><small>under review</small></div>
      </div>

      <Card pad={false} bodyClassName="admin-table-card">
        <div className="admin-toolbar">
          <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search dealers, contacts or cities…" />
          <Select className="admin-select" value={(params.filters?.status as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, status: e.target.value }, page: 1 }))}>
            <option value="">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>

        {loading ? (
          <Skeleton rows={8} />
        ) : error ? (
          <ErrorState message={error} retry={refetch} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon="dealers" title="No dealers found" body="Dealer applications from the storefront appear here." />
        ) : (
          <>
            <Table minWidth={960} head={<><Th>Dealer</Th><Th>Contact</Th><Th>City</Th><Th>Commission</Th><Th>Performance</Th><Th>Status</Th><Th>Joined</Th><Th /></>}>
              {data.items.map((d) => (
                <tr key={d.id} onClick={() => setDetail(d)} style={{ cursor: "pointer" }}>
                  <Td>
                    <div className="admin-table-product">
                      <span className="admin-avatar violet large">{d.company.slice(0, 2).toUpperCase()}</span>
                      <span><b>{d.company}</b><small>{d.taxNumber}</small></span>
                    </div>
                  </Td>
                  <Td><b>{d.contactPerson}</b><span className="admin-payment">{d.email}</span></Td>
                  <Td>{d.city}, {d.country}</Td>
                  <Td><b>{d.commission}%</b></Td>
                  <Td>
                    <b>★ {d.rating.toFixed(1)}</b>
                    <span className="admin-payment">{d.ordersCount} orders · {money(d.revenue)}</span>
                  </Td>
                  <Td><Status value={d.status} /></Td>
                  <Td className="admin-muted-cell"><TimeAgo iso={d.joinedAt} /></Td>
                  <Td>
                    <IconBtn icon="eye" label="View" onClick={(e) => { e.stopPropagation(); setDetail(d); }} />
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(p) => setParams((x) => ({ ...x, page: p }))} />
          </>
        )}
      </Card>

      {detail && (
        <DealerDetail
          dealer={detail}
          onClose={() => setDetail(null)}
          onStatus={(status) => setConfirmAction({ dealer: detail, status })}
        />
      )}

      <Confirm
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && void setStatus(confirmAction.dealer, confirmAction.status)}
        title={confirmAction?.status === "approve" ? "Approve this dealer?" : confirmAction?.status === "suspend" ? "Suspend this dealer?" : "Reject this dealer?"}
        body={confirmAction ? `This will mark ${confirmAction.dealer.company} as ${confirmAction.status} and notify the contact person.` : undefined}
        confirmLabel={confirmAction?.status === "approve" ? "Approve" : confirmAction?.status === "suspend" ? "Suspend" : "Reject"}
        tone={confirmAction?.status === "approve" ? "primary" : "danger"}
        loading={mutate.loading}
      />
    </>
  );
}

// ------------------------------------------------------------

function DealerDetail({
  dealer, onClose, onStatus,
}: {
  dealer: Dealer;
  onClose: () => void;
  onStatus: (status: string) => void;
}) {
  const [tab, setTab] = useState("overview");
  const { data: products } = useList<Product>("products", { pageSize: 50, filters: { dealerId: dealer.id } });
  const { data: ordersData } = useList<{ id: number; number: string; customerName: string; total: number; status: string; createdAt: string; items: { productId: number }[] }>("orders", { pageSize: 100 });
  const dealerProducts = products?.items ?? [];
  const dealerOrderIds = useMemo(() => new Set(dealerProducts.map((p) => p.id)), [dealerProducts]);
  const dealerOrders = (ordersData?.items ?? []).filter((o) => o.items.some((it) => dealerOrderIds.has(it.productId))).slice(0, 8);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "products", label: "Products", count: dealerProducts.length },
    { id: "orders", label: "Orders", count: dealerOrders.length },
    { id: "payments", label: "Payments" },
  ];

  const isPending = dealer.status === "pending";

  return (
    <Drawer
      open
      onClose={onClose}
      title={dealer.company}
      sub={`${dealer.city}, ${dealer.country} · joined ${dateShort(dealer.joinedAt)}`}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Close</Btn>
          {isPending && <Btn icon="check" onClick={() => onStatus("approve")}>Approve</Btn>}
          {!isPending && dealer.status === "approved" && <Btn variant="secondary" onClick={() => onStatus("suspend")}>Suspend</Btn>}
          {dealer.status !== "rejected" && <Btn variant="danger" icon="ban" onClick={() => onStatus("reject")}>{isPending ? "Reject" : "Reject"}</Btn>}
          {dealer.status === "suspended" && <Btn icon="restore" onClick={() => onStatus("approve")}>Re-activate</Btn>}
        </>
      }
    >
      <div className="admin-customer-hero">
        <span className="admin-avatar violet xlarge">{dealer.company.slice(0, 2).toUpperCase()}</span>
        <div>
          <h3>{dealer.company}</h3>
          <small>{dealer.contactPerson} · {dealer.email} · {dealer.phone}</small>
          <Status value={dealer.status} />
        </div>
      </div>

      <div className="admin-content-tabs" style={{ marginBottom: 18 }}>
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            {t.label}
            {t.count !== undefined && <b>{t.count}</b>}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="admin-form-stack">
          <div className="admin-profile-stats">
            <div><b>★ {dealer.rating.toFixed(1)}</b><small>Average rating</small></div>
            <div><b>{dealer.productsCount}</b><small>Products listed</small></div>
            <div><b>{money(dealer.revenue)}</b><small>Lifetime revenue</small></div>
          </div>
          <div className="admin-detail-block" style={{ borderTop: 0, paddingTop: 4 }}>
            <div className="admin-eyebrow">Business details</div>
            <div className="admin-form-grid" style={{ marginTop: 10 }}>
              <Field label="Tax number"><b>{dealer.taxNumber}</b></Field>
              <Field label="Commission"><b>{dealer.commission}%</b></Field>
              <Field label="Phone"><b>{dealer.phone}</b></Field>
              <Field label="Address"><b>{dealer.address}</b></Field>
            </div>
          </div>
          <div className="admin-detail-block">
            <div className="admin-eyebrow">Bank details</div>
            <div className="admin-form-grid" style={{ marginTop: 10 }}>
              <Field label="Bank"><b>{dealer.bankDetails.bank}</b></Field>
              <Field label="Account"><b className="admin-order-id">{dealer.bankDetails.account}</b></Field>
              <Field label="IFSC"><b className="admin-order-id">{dealer.bankDetails.ifsc}</b></Field>
            </div>
          </div>
        </div>
      )}

      {tab === "products" && (
        <>
          {dealerProducts.length === 0 ? (
            <EmptyState icon="products" title="No products linked" body="Products with this dealer as supplier appear here." />
          ) : (
            <div className="admin-form-stack">
              {dealerProducts.slice(0, 10).map((p) => (
                <div key={p.id} className="admin-order-item">
                  <img src={p.image} alt="" />
                  <span><b>{p.name}</b><small>{p.sku} · stock {p.stock}</small></span>
                  <strong>{money(p.price)}</strong>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "orders" && (
        <>
          {dealerOrders.length === 0 ? (
            <EmptyState icon="orders" title="No orders yet" body="Orders containing this dealer's products appear here." />
          ) : (
            <div className="admin-form-stack">
              {dealerOrders.map((o) => (
                <div key={o.id} className="admin-history-row">
                  <Icon name="orders" size={14} />
                  <span><b className="admin-order-id">{o.number}</b><small>{o.customerName}</small></span>
                  <Status value={o.status} />
                  <b style={{ marginLeft: 8 }}>{money(o.total)}</b>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "payments" && (
        <>
          {dealer.payments.length === 0 ? (
            <EmptyState icon="wallet" title="No payments recorded" body="Commission payouts to this dealer will appear here." />
          ) : (
            <div className="admin-form-stack">
              {dealer.payments.map((p, i) => (
                <div key={i} className="admin-history-row">
                  <Icon name="wallet" size={14} />
                  <span><b>{money(p.amount)}</b><small>{dateShort(p.date)} via {p.method}</small></span>
                  <Status value={p.status} />
                </div>
              ))}
            </div>
          )}
          <div className="admin-settings-note" style={{ marginTop: 18 }}>
            <Icon name="info" size={16} />
            <span><b>Payout summary</b><small>Total paid: {money(dealer.payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0))} · pending: {money(dealer.payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0))}</small></span>
          </div>
        </>
      )}
    </Drawer>
  );
}
