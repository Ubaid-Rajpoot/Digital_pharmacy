"use client";

import { useState } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, EmptyState, ErrorState, Field, Modal, PageHeader, Pagination, SearchInput,
  Select, Skeleton, Status, Table, Td, TextArea, Th, TimeAgo, useToast, IconBtn,
} from "@/components/admin/ui";
import { dateShort, money } from "@/components/admin/format";
import type { Warehouse, PurchaseOrder, StockAdjustment } from "@/lib/db/types";

export default function InventoryPage() {
  const [tab, setTab] = useState("stock");
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 10 });
  const [adjust, setAdjust] = useState<{ productId: number; name: string; sku: string; stock: number } | null>(null);
  const { data, loading, error, refetch } = useList<{ id: number; productId: number; productName: string; sku: string; image: string; warehouseId: number; stock: number; lowStockAlert: number; updatedAt: string }>("inventory", params);
  const { data: warehouses } = useList<Warehouse>("warehouses", { pageSize: 20 });
  const { data: pos } = useList<PurchaseOrder>("purchaseOrders", { pageSize: 20 });
  const { data: adjustments } = useList<StockAdjustment>("stockAdjustments", { pageSize: 20 });
  const mutate = useMutate("inventory", { onSuccess: refetch });
  const toast = useToast();

  const low = (data?.items ?? []).filter((i) => i.stock > 0 && i.stock <= i.lowStockAlert).length;
  const out = (data?.items ?? []).filter((i) => i.stock === 0).length;
  const totalStock = (data?.items ?? []).reduce((s, i) => s + i.stock, 0);

  const tabs = [
    { id: "stock", label: "Stock levels", count: data?.total ?? 0 },
    { id: "warehouses", label: "Warehouses", count: warehouses?.total ?? 0 },
    { id: "purchase", label: "Purchase orders", count: pos?.total ?? 0 },
    { id: "adjustments", label: "Adjustments", count: adjustments?.total ?? 0 },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Inventory"
        sub="Track stock across warehouses, review purchase orders and keep alerts under control."
        actions={<Btn icon="download" variant="secondary" onClick={() => toast("Stock export is available in Reports.", "info")}>Export stock</Btn>}
      />

      <div className="admin-inventory-banner">
        <div className="admin-inventory-ring"><strong>{totalStock}</strong><small>UNITS</small></div>
        <div>
          <h3>Stock health</h3>
          <p>{out} products out of stock and {low} at risk of running out. Review alerts and place purchase orders.</p>
        </div>
        <div className="admin-banner-actions">
          <button onClick={() => setTab("stock")}><Icon name="alert" size={13} /> <b>{out + low}</b> alerts</button>
          <button onClick={() => setTab("purchase")}><Icon name="truck" size={13} /> New purchase order</button>
        </div>
      </div>

      <Card pad={false} bodyClassName="admin-table-card">
        <div className="admin-content-tabs" style={{ borderBottom: "1px solid var(--admin-line)", marginBottom: 16 }}>
          {tabs.map((t) => (
            <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
              {t.label}
              {t.count !== undefined && <b>{t.count}</b>}
            </button>
          ))}
        </div>

        {tab === "stock" && (
          <>
            <div className="admin-toolbar">
              <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search products or SKUs…" />
              <Select className="admin-select" value={(params.filters?.stockState as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, stockState: e.target.value }, page: 1 }))}>
                <option value="">All stock states</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
                <option value="in">In stock</option>
              </Select>
            </div>
            {loading ? <Skeleton rows={8} /> : error ? <ErrorState message={error} retry={refetch} /> : !data || data.items.length === 0 ? (
              <EmptyState icon="inventory" title="No stock records" body="Products appear here once they're in the catalogue." />
            ) : (
              <>
                <Table minWidth={900} head={<><Th>Product</Th><Th>Warehouse</Th><Th>In stock</Th><Th>Alert at</Th><Th>Status</Th><Th>Updated</Th><Th /></>}>
                  {data.items.map((i) => (
                    <tr key={i.productId}>
                      <Td>
                        <div className="admin-table-product">
                          <img src={i.image} alt="" />
                          <span><b>{i.productName}</b><small>{i.sku}</small></span>
                        </div>
                      </Td>
                      <Td>{warehouses?.items.find((w) => w.id === i.warehouseId)?.name ?? `WH-${i.warehouseId}`}</Td>
                      <Td><b>{i.stock}</b></Td>
                      <Td className="admin-muted-cell">{i.lowStockAlert}</Td>
                      <Td>
                        {i.stock === 0 ? <span className="admin-stock out"><i /> Out of stock</span> : i.stock <= i.lowStockAlert ? <span className="admin-stock low"><i /> Low</span> : <span className="admin-stock"><i /> Healthy</span>}
                      </Td>
                      <Td className="admin-muted-cell"><TimeAgo iso={i.updatedAt} /></Td>
                      <Td>
                        <IconBtn icon="sliders" label="Adjust stock" onClick={() => setAdjust({ productId: i.productId, name: i.productName, sku: i.sku, stock: i.stock })} />
                      </Td>
                    </tr>
                  ))}
                </Table>
                <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(p) => setParams((x) => ({ ...x, page: p }))} />
              </>
            )}
          </>
        )}

        {tab === "warehouses" && (
          <>
            {!warehouses ? <Skeleton rows={4} /> : (
              <div className="admin-stat-strip" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
                {warehouses.items.map((w) => (
                  <div key={w.id}>
                    <span>{w.name} · {w.city}</span>
                    <b>{Math.round((w.used / w.capacity) * 100)}%</b>
                    <small>used · {w.used.toLocaleString("en-IN")} / {w.capacity.toLocaleString("en-IN")} units</small>
                    <div className="admin-progress" style={{ marginTop: 10 }}>
                      <i style={{ width: `${Math.round((w.used / w.capacity) * 100)}%`, background: w.status === "maintenance" ? "var(--admin-orange)" : "var(--admin-blue)" }} />
                    </div>
                    <div style={{ marginTop: 8 }}><Status value={w.status} /></div>
                  </div>
                ))}
              </div>
            )}
            <div className="admin-settings-note" style={{ marginTop: 16 }}>
              <Icon name="server" size={16} />
              <span><b>Capacity planning</b><small>Warehouses at more than 90% capacity trigger an alert to the inventory manager.</small></span>
            </div>
          </>
        )}

        {tab === "purchase" && (
          <>
            {!pos ? <Skeleton rows={6} /> : pos.items.length === 0 ? <EmptyState icon="truck" title="No purchase orders" /> : (
              <Table minWidth={760} head={<><Th>PO number</Th><Th>Supplier</Th><Th>Items</Th><Th>Value</Th><Th>Status</Th><Th>Expected</Th></>}>
                {pos.items.map((p) => (
                  <tr key={p.id}>
                    <Td><b className="admin-order-id">{p.number}</b></Td>
                    <Td><b>{p.supplier}</b></Td>
                    <Td>{p.items} SKUs</Td>
                    <Td><b>{money(p.total)}</b></Td>
                    <Td><Status value={p.status} /></Td>
                    <Td className="admin-muted-cell">{dateShort(p.expected)}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </>
        )}

        {tab === "adjustments" && (
          <>
            {!adjustments ? <Skeleton rows={6} /> : adjustments.items.length === 0 ? <EmptyState icon="sliders" title="No adjustments yet" /> : (
              <Table minWidth={860} head={<><Th>Product</Th><Th>Change</Th><Th>Reason</Th><Th>By</Th><Th>When</Th></>}>
                {adjustments.items.map((a) => (
                  <tr key={a.id}>
                    <Td><b>{a.productName}</b><span className="admin-payment">WH-{a.warehouseId}</span></Td>
                    <Td><b style={{ color: a.delta >= 0 ? "var(--admin-green)" : "var(--admin-red)" }}>{a.delta >= 0 ? "+" : ""}{a.delta}</b></Td>
                    <Td>{a.reason}</Td>
                    <Td>{a.by}</Td>
                    <Td className="admin-muted-cell"><TimeAgo iso={a.at} /></Td>
                  </tr>
                ))}
              </Table>
            )}
          </>
        )}
      </Card>

      {adjust && (
        <AdjustModal
          item={adjust}
          onClose={() => setAdjust(null)}
          onDone={(msg) => { setAdjust(null); toast(msg); refetch(); }}
        />
      )}
    </>
  );
}

function AdjustModal({
  item, onClose, onDone,
}: {
  item: { productId: number; name: string; sku: string; stock: number };
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const mutate = useMutate("inventory");
  const toast = useToast();
  const [delta, setDelta] = useState<number | "">("");
  const [reason, setReason] = useState("Manual adjustment");

  const apply = async () => {
    const d = Number(delta);
    if (!d || Number.isNaN(d)) return toast("Enter a quantity to add or remove (negative to reduce)", "error");
    const res = await mutate.update(item.productId, { delta: d, reason }, `Stock adjusted by ${d > 0 ? "+" : ""}${d}`);
    if (res.ok) onDone(`Inventory updated — ${item.name} now has ${Math.max(0, item.stock + d)} units`);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Adjust stock"
      sub={`${item.name} · ${item.sku} · currently ${item.stock} units`}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn icon="check" onClick={() => void apply()} loading={mutate.loading}>Apply adjustment</Btn></>}
    >
      <div className="admin-form-grid">
        <Field label="Quantity change" required hint="Use a negative number to reduce stock">
          <input type="number" value={delta} onChange={(e) => setDelta(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. +50 or −10" />
        </Field>
        <Field label="Reason">
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option>Manual adjustment</option>
            <option>Stock take correction</option>
            <option>Damaged goods</option>
            <option>Return from customer</option>
            <option>Purchase received</option>
            <option>Sample stock</option>
          </Select>
        </Field>
        <Field label="Note (optional)" className="full">
          <TextArea rows={2} placeholder="Add context for the audit log…" />
        </Field>
      </div>
    </Modal>
  );
}
