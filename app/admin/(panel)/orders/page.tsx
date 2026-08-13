"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon, type IconName } from "@/components/admin/icons";
import {
  Btn, Card, Confirm, Drawer, EmptyState, ErrorState, Field, IconBtn, PageHeader,
  Pagination, SearchInput, Select, Skeleton, Status, Table, Td, TextArea, TextInput, Th, TimeAgo, useToast,
} from "@/components/admin/ui";
import { dateShort, dateTime, money, timeAgo } from "@/components/admin/format";
import type { Order, OrderStatus } from "@/lib/db/types";

const ALL_STATUSES: OrderStatus[] = ["pending", "processing", "packed", "shipped", "delivered", "cancelled", "returned", "refunded"];
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["processing", "cancelled"],
  processing: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned", "refunded"],
  returned: ["refunded"],
  cancelled: [],
  refunded: [],
};

const TIMELINE_ICONS: IconName[] = ["orders", "checkCircle", "box", "truck", "home"];

export default function OrdersPage() {
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 10 });
  const [detail, setDetail] = useState<Order | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Order | null>(null);
  const { data, loading, error, refetch } = useList<Order>("orders", params);
  const mutate = useMutate("orders", { onSuccess: refetch });
  const toast = useToast();

  useEffect(() => {
    // refresh detail when the list updates (e.g. after a status change)
    setDetail((d) => d && data ? (data.items.find((o) => o.id === d.id) ?? d) : d);
  }, [data]);

  const metrics = useMemo(() => {
    const all = data?.items ?? [];
    const count = (s: OrderStatus) => all.filter((o) => o.status === s).length;
    return {
      pending: count("pending"), processing: count("processing"), shipped: count("shipped"),
      delivered: count("delivered"), cancelled: count("cancelled"), returned: count("returned"),
      total: data?.total ?? 0,
    };
  }, [data]);

  const statusFilter = params.filters?.status;
  const toggleStatus = (s: string) => {
    const cur: string[] = Array.isArray(statusFilter) ? (statusFilter as string[]) : statusFilter ? [statusFilter as string] : [];
    const next = cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s];
    setParams((p) => ({ ...p, filters: { ...p.filters, status: next.length ? next : undefined }, page: 1 }));
  };

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        sub={`${metrics.total} orders total — track fulfilment from placement to doorstep.`}
        actions={<Btn variant="secondary" icon="printer" onClick={() => toast("Open an order and use its invoice button to print.", "info")}>Print invoice</Btn>}
      />

      <div className="admin-order-metrics">
        {[
          { label: "Pending", value: metrics.pending, icon: "clock" as const, tone: "orange" },
          { label: "Processing", value: metrics.processing, icon: "refresh" as const, tone: "blue" },
          { label: "Shipped", value: metrics.shipped, icon: "truck" as const, tone: "blue" },
          { label: "Delivered", value: metrics.delivered, icon: "checkCircle" as const, tone: "green" },
        ].map((m) => (
          <div key={m.label}>
            <span className="admin-metric-label"><i className={`${m.tone}-dot`} /> {m.label}</span>
            <b>{m.value}</b>
            <small>{m.label === "Delivered" ? `${metrics.delivered + metrics.cancelled} completed` : "needs attention"}</small>
          </div>
        ))}
      </div>

      <Card pad={false} bodyClassName="admin-table-card">
        <div className="admin-toolbar">
          <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search order number, customer or email…" />
          <Select className="admin-select" value={(params.filters?.paymentStatus as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, paymentStatus: e.target.value }, page: 1 }))}>
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </Select>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {ALL_STATUSES.map((s) => {
              const active = Array.isArray(statusFilter) ? statusFilter.includes(s) : statusFilter === s;
              return (
                <button key={s} className={`admin-filter-btn ${active ? "active" : ""}`} onClick={() => toggleStatus(s)}
                  style={active ? { borderColor: "var(--admin-blue)", color: "var(--admin-blue)", background: "var(--admin-blue-soft)" } : undefined}>
                  <span className="admin-status" style={{ padding: "2px 6px" }}><i /> {s}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <Skeleton rows={8} />
        ) : error ? (
          <ErrorState message={error} retry={refetch} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon="orders" title="No orders match" body="Try clearing filters or searching for a different order." />
        ) : (
          <>
            <Table minWidth={1000} head={<><Th>Order</Th><Th>Customer</Th><Th>Items</Th><Th>Payment</Th><Th>Total</Th><Th>Status</Th><Th>Placed</Th><Th /></>}>
              {data.items.map((o) => (
                <tr key={o.id} onClick={() => setDetail(o)}>
                  <Td><b className="admin-order-id">{o.number}</b><span className="admin-payment">{o.id}</span></Td>
                  <Td><b>{o.customerName}</b><span className="admin-payment">{o.customerEmail}</span></Td>
                  <Td>{o.items.reduce((s, it) => s + it.qty, 0)} items</Td>
                  <Td><b>{o.paymentMethod}</b><span className="admin-payment">{o.paymentStatus}</span></Td>
                  <Td><b>{money(o.total)}</b></Td>
                  <Td><Status value={o.status} /></Td>
                  <Td className="admin-muted-cell"><TimeAgo iso={o.createdAt} /></Td>
                  <Td>
                    <span style={{ display: "inline-flex", gap: 5 }}>
                      <IconBtn icon="eye" label="View order" onClick={(e) => { e.stopPropagation(); setDetail(o); }} />
                      {(o.status === "pending" || o.status === "processing" || o.status === "packed") && (
                        <IconBtn icon="ban" label="Cancel order" tone="danger" onClick={(e) => { e.stopPropagation(); setConfirmCancel(o); }} />
                      )}
                    </span>
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(p) => setParams((x) => ({ ...x, page: p }))} />
          </>
        )}
      </Card>

      {detail && (
        <OrderDetail order={detail} onClose={() => setDetail(null)} onChanged={refetch} onCancel={() => setConfirmCancel(detail)} />
      )}

      <Confirm
        open={confirmCancel !== null}
        onClose={() => setConfirmCancel(null)}
        onConfirm={async () => {
          if (!confirmCancel) return;
          const res = await mutate.update(confirmCancel.id, { status: "cancelled", note: "Cancelled by admin" }, "Order cancelled — refund initiated");
          if (res.ok) setConfirmCancel(null);
        }}
        title="Cancel this order?"
        body={confirmCancel ? `${confirmCancel.number} for ${money(confirmCancel.total)} will be cancelled and the customer refunded.` : undefined}
        loading={mutate.loading}
      />
    </>
  );
}

// ------------------------------------------------------------

function OrderDetail({
  order, onClose, onChanged, onCancel,
}: {
  order: Order;
  onClose: () => void;
  onChanged: () => void;
  onCancel: () => void;
}) {
  const mutate = useMutate("orders", { onSuccess: onChanged });
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState(order.tracking?.number ?? "");
  const [carrier, setCarrier] = useState(order.tracking?.carrier ?? "Delhivery");

  const next = NEXT_STATUS[order.status] ?? [];
  const stepIdx = ["pending", "processing", "packed", "shipped", "delivered"].indexOf(order.status);
  const timeline = order.timeline ?? [];

  const applyStatus = async () => {
    if (!status) return;
    const payload: Record<string, unknown> = { status, note: note || undefined };
    if (status === "shipped" || status === "delivered") {
      payload.trackingNumber = tracking || undefined;
      payload.carrier = carrier;
    }
    const res = await mutate.update(order.id, payload, `Order marked as ${status}`);
    if (res.ok) {
      setStatus("");
      setNote("");
    }
  };

  const print = () => printInvoice(order);

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Order ${order.number}`}
      sub={`Placed ${dateTime(order.createdAt)} · ${timeAgo(order.createdAt)}`}
      footer={
        <>
          <Btn variant="secondary" icon="printer" onClick={print}>Invoice</Btn>
          <Btn variant="secondary" onClick={onClose}>Close</Btn>
          {(order.status === "pending" || order.status === "processing" || order.status === "packed") && (
            <Btn variant="danger" icon="ban" onClick={onCancel}>Cancel order</Btn>
          )}
        </>
      }
    >
      <div className="admin-order-status-line">
        <span>Current status</span>
        <Status value={order.status} />
      </div>

      {next.length > 0 && (
        <div className="admin-inline-editor" style={{ marginTop: 0, marginBottom: 22 }}>
          <Field label="Move to">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">— Select status —</option>
              {next.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Tracking number" hint="Required for shipped / delivered">
            <TextInput value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="BL123456789IN" />
          </Field>
          <Field label="Note (optional)">
            <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Visible on the timeline" />
          </Field>
          <Btn icon="check" onClick={() => void applyStatus()} loading={mutate.loading}>Update</Btn>
        </div>
      )}

      <div className="admin-timeline">
        {timeline.length === 0 && (
          <div className="admin-empty"><p>No timeline entries yet.</p></div>
        )}
        {timeline.map((t, i) => {
          const last = i === timeline.length - 1;
          return (
            <div key={i} className={last ? "current" : "done"}>
              <i><Icon name={TIMELINE_ICONS[i % TIMELINE_ICONS.length]} size={12} /></i>
              <span>
                <b>{t.label}</b>
                <small>{dateTime(t.at)}{t.note ? ` · ${t.note}` : ""}</small>
              </span>
            </div>
          );
        })}
      </div>

      {stepIdx >= 0 && (
        <div className="admin-order-status-line" style={{ marginTop: 0 }}>
          <span>Fulfilment progress</span>
          <b style={{ fontSize: 10 }}>step {stepIdx + 1}/5</b>
        </div>
      )}

      <div className="admin-detail-block">
        <div className="admin-eyebrow">Items ({order.items.reduce((s, it) => s + it.qty, 0)})</div>
        {order.items.map((it, i) => (
          <div className="admin-order-item" key={i}>
            <img src={it.image} alt="" />
            <span><b>{it.name}</b><small>Qty {it.qty}</small></span>
            <strong>{money(it.price * it.qty)}</strong>
          </div>
        ))}
        <div className="admin-detail-total">
          <span>Subtotal {money(order.subtotal)}{order.discount > 0 && <> · discount −{money(order.discount)}</>} · shipping {order.shipping === 0 ? "Free" : money(order.shipping)} · tax {money(order.tax)}</span>
          <b>{money(order.total)}</b>
        </div>
        {order.couponCode && <div className="admin-payment" style={{ marginTop: 8 }}>Coupon applied: <b className="admin-order-id">{order.couponCode}</b></div>}
      </div>

      <div className="admin-detail-block">
        <div className="admin-eyebrow">Customer</div>
        <div className="admin-detail-person">
          <span className="admin-avatar blue">{order.customerName}</span>
          <div><b>{order.customerName}</b><small>{order.customerEmail} · {order.phone}</small></div>
        </div>
      </div>

      <div className="admin-detail-block">
        <div className="admin-eyebrow">Shipping address</div>
        <div className="admin-address">
          <Icon name="pin" size={15} />
          <span>
            <b>{order.address.line1} {order.address.line2}</b>
            <small>{order.address.city}, {order.address.state} {order.address.pincode} · {order.address.country}</small>
          </span>
        </div>
        {order.tracking && (
          <div className="admin-address" style={{ marginTop: 12 }}>
            <Icon name="truck" size={15} />
            <span>
              <b>{order.tracking.carrier} — {order.tracking.number}</b>
              <small>Tracking number on record</small>
            </span>
          </div>
        )}
      </div>

      <div className="admin-detail-block">
        <div className="admin-eyebrow">Payment</div>
        <div className="admin-form-grid" style={{ marginTop: 10 }}>
          <Field label="Method"><b>{order.paymentMethod}</b></Field>
          <Field label="Status"><Status value={order.paymentStatus} /></Field>
        </div>
        {order.refund && (
          <div className="admin-settings-note" style={{ marginTop: 14 }}>
            <Icon name="wallet" size={16} />
            <span><b>Refund of {money(order.refund.amount)}</b><small>{order.refund.reason} · {dateShort(order.refund.at)}</small></span>
          </div>
        )}
        {order.notes && <div className="admin-payment" style={{ marginTop: 12 }}>Note: {order.notes}</div>}
      </div>
    </Drawer>
  );
}

// ------------------------------------------------------------
// Printable invoice
// ------------------------------------------------------------

function printInvoice(order: Order) {
  const w = window.open("", "_blank", "width=820,height=1000");
  if (!w) return;
  const items = order.items
    .map(
      (it) => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5edf5">${it.name}<div style="color:#8296ab;font-size:11px">Qty ${it.qty}</div></td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5edf5;text-align:right">${money(it.price)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5edf5;text-align:right">${money(it.price * it.qty)}</td>
      </tr>`
    )
    .join("");
  w.document.write(`<!doctype html><html><head><title>Invoice ${order.number}</title></head>
<body style="font-family:Manrope,system-ui,sans-serif;color:#102b4d;max-width:680px;margin:40px auto;padding:0 24px">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #135fc9;padding-bottom:22px">
    <div>
      <div style="font-size:26px;font-weight:700;font-family:Georgia,serif">Medora <span style="color:#135fc9">✚</span></div>
      <div style="color:#8296ab;font-size:12px;margin-top:4px">Your Health Deserves The Best Care</div>
    </div>
    <div style="text-align:right;font-size:12px;color:#42597b">
      <div style="font-size:18px;font-weight:800;color:#102b4d">INVOICE</div>
      <div>${order.number}</div>
      <div>${dateShort(order.createdAt)}</div>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;gap:20px;margin:26px 0">
    <div style="font-size:12px">
      <b style="display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.08em;font-size:10px;color:#8296ab">Billed to</b>
      ${order.customerName}<br>${order.customerEmail}<br>${order.phone}
    </div>
    <div style="font-size:12px;text-align:right">
      <b style="display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.08em;font-size:10px;color:#8296ab">Ship to</b>
      ${order.address.line1} ${order.address.line2}<br>${order.address.city}, ${order.address.state} ${order.address.pincode}<br>${order.address.country}
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="background:#eef4fb;color:#42597b;text-align:left">
      <th style="padding:10px 12px">Item</th><th style="padding:10px 12px;text-align:right">Unit price</th><th style="padding:10px 12px;text-align:right">Amount</th>
    </tr></thead>
    <tbody>${items}</tbody>
  </table>
  <div style="margin-top:22px;margin-left:auto;width:280px;font-size:13px;color:#42597b">
    <div style="display:flex;justify-content:space-between;padding:4px 0">Subtotal <b style="color:#102b4d">${money(order.subtotal)}</b></div>
    ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0">Discount <b style="color:#102b4d">−${money(order.discount)}</b></div>` : ""}
    <div style="display:flex;justify-content:space-between;padding:4px 0">Shipping <b style="color:#102b4d">${order.shipping === 0 ? "Free" : money(order.shipping)}</b></div>
    <div style="display:flex;justify-content:space-between;padding:4px 0">Tax <b style="color:#102b4d">${money(order.tax)}</b></div>
    <div style="display:flex;justify-content:space-between;padding:12px 0 4px;border-top:2px solid #102b4d;font-size:16px;font-weight:800;color:#102b4d">Total <span>${money(order.total)}</span></div>
    <div style="text-align:right;margin-top:6px;font-size:11px;color:#8296ab">Paid via ${order.paymentMethod} · ${order.paymentStatus}</div>
  </div>
  <div style="margin-top:40px;padding-top:16px;border-top:1px dashed #d3e1f0;font-size:11px;color:#8296ab;text-align:center">
    Thank you for trusting Medora. This is a computer-generated invoice and requires no signature.<br>
    Medora Health · 4th Floor, Sunrise Tower, Andheri East, Mumbai 400069 · care@medora.health
  </div>
  <script>window.onload = function(){ window.print(); }</script>
</body></html>`);
  w.document.close();
}
