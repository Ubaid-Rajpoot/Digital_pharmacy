"use client";

import { useState, type FormEvent } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, Confirm, EmptyState, ErrorState, Field, IconBtn, Modal, PageHeader,
  Pagination, SearchInput, Select, Skeleton, Status, Table, Td, TextInput, Th, useToast,
} from "@/components/admin/ui";
import { dateShort } from "@/components/admin/format";
import type { Coupon, FlashSale } from "@/lib/db/types";

const TODAY = new Date().toISOString().slice(0, 10);
const IN_30D = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

const TYPE_META: Record<string, { label: string; tone: string }> = {
  percent: { label: "% Off", tone: "blue" },
  fixed: { label: "Flat Rs", tone: "green" },
  bogo: { label: "Buy X Get Y", tone: "violet" },
  freeship: { label: "Free shipping", tone: "orange" },
};

export default function CouponsPage() {
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 10 });
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Coupon | null>(null);
  const { data, loading, error, refetch } = useList<Coupon>("coupons", params);
  const { data: flash } = useList<FlashSale>("flashSales", { pageSize: 10 });
  const mutate = useMutate("coupons", { onSuccess: refetch });
  const toast = useToast();

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Coupons & promotions"
        sub="Discounts, promo codes, buy-one-get-one and free-shipping offers."
        actions={<Btn icon="plus" onClick={() => setEditing("new")}>New coupon</Btn>}
      />

      <div className="admin-marketing-kpis">
        {[
          { label: "Active coupons", value: (data?.items ?? []).filter((c) => c.status === "active").length, icon: "coupons" as const, tone: "green" },
          { label: "Total redemptions", value: (data?.items ?? []).reduce((s, c) => s + c.uses, 0), icon: "check" as const, tone: "blue" },
          { label: "Avg discount", value: "18%", icon: "percent" as const, tone: "violet" },
          { label: "Live flash sales", value: (flash?.items ?? []).filter((f) => f.status === "live").length, icon: "zap" as const, tone: "orange" },
        ].map((k) => (
          <div key={k.label} className={`admin-kpi ${k.tone}`}>
            <div className="admin-kpi-top"><span>{k.label}</span><span className="admin-kpi-icon"><Icon name={k.icon} size={15} /></span></div>
            <strong>{k.value}</strong>
          </div>
        ))}
      </div>

      <Card pad={false} bodyClassName="admin-table-card">
        <div className="admin-toolbar">
          <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search coupon codes…" />
          <Select className="admin-select" value={(params.filters?.status as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, status: e.target.value }, page: 1 }))}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="paused">Paused</option>
          </Select>
        </div>

        {loading ? <Skeleton rows={8} /> : error ? <ErrorState message={error} retry={refetch} /> : !data || data.items.length === 0 ? (
          <EmptyState icon="coupons" title="No coupons yet" body="Create your first promo code to start driving sales." action={<Btn icon="plus" onClick={() => setEditing("new")}>New coupon</Btn>} />
        ) : (
          <>
            <Table minWidth={900} head={<><Th>Code</Th><Th>Type</Th><Th>Value</Th><Th>Min order</Th><Th>Usage</Th><Th>Valid until</Th><Th>Status</Th><Th /></>}>
              {data.items.map((c) => (
                <tr key={c.id}>
                  <Td><span className={`admin-coupon-code ${TYPE_META[c.type].tone}`}>{c.code}</span><span className="admin-payment">{c.description}</span></Td>
                  <Td><span className="admin-category-tag">{TYPE_META[c.type].label}</span></Td>
                  <Td><b>{c.type === "percent" ? `${c.value}%` : c.type === "fixed" ? `Rs ${c.value}` : c.type === "bogo" ? "BOGO" : "Free"}</b>{c.maxDiscount ? <span className="admin-payment">up to Rs {c.maxDiscount}</span> : null}</Td>
                  <Td>{c.minOrder ? `Rs ${c.minOrder}` : "Any"}</Td>
                  <Td><b>{c.uses}</b><span className="admin-payment">of {c.maxUses} · {c.perCustomer}/customer</span></Td>
                  <Td className="admin-muted-cell">{dateShort(c.endsAt)}</Td>
                  <Td><Status value={c.status} /></Td>
                  <Td>
                    <span style={{ display: "inline-flex", gap: 5 }}>
                      <IconBtn icon="edit" label="Edit" onClick={() => setEditing(c)} />
                      <IconBtn icon="trash" label="Delete" tone="danger" onClick={() => setConfirmDelete(c)} />
                    </span>
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(p) => setParams((x) => ({ ...x, page: p }))} />
          </>
        )}
      </Card>

      <div className="admin-marketing-grid" style={{ marginTop: 16 }}>
        <Card kicker="Flash sales" title="Running & scheduled" actions={<Btn variant="secondary" size="sm" icon="zap" onClick={() => toast("Flash sale scheduling is managed here.", "info")}>Schedule sale</Btn>}>
          <div className="admin-campaign-list">
            {(flash?.items ?? []).map((f) => (
              <div className="admin-campaign" key={f.id}>
                <span className={`admin-campaign-icon ${f.status === "live" ? "green" : f.status === "scheduled" ? "blue" : "violet"}`}><Icon name="zap" size={14} /></span>
                <span><b>{f.title}</b><small>{f.productIds.length} products · {f.discount}% off · {dateShort(f.startsAt)} → {dateShort(f.endsAt)}</small></span>
                <Status value={f.status} />
              </div>
            ))}
          </div>
        </Card>
        <Card kicker="Rules" title="Promotion guidelines">
          <div className="admin-form-stack">
            {[
              ["Stacking", "Coupons can be combined with flash sales but not with each other."],
              ["Auto-apply", "Best available coupon is applied automatically at checkout."],
              ["Fraud checks", "One coupon per customer is enforced via email + device fingerprint."],
            ].map(([t, b]) => (
              <div key={t} className="admin-history-row" style={{ color: "var(--admin-ink-soft)" }}>
                <Icon name="info" size={14} />
                <span><b style={{ color: "var(--admin-ink)" }}>{t}</b><small>{b}</small></span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {editing && (
        <CouponForm coupon={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); toast(editing === "new" ? "Coupon created" : "Coupon updated"); refetch(); }} />
      )}

      <Confirm
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && void mutate.remove(confirmDelete.id, "Coupon deleted").then((r) => r.ok && setConfirmDelete(null))}
        title="Delete coupon?"
        body={confirmDelete ? `"${confirmDelete.code}" will stop working immediately.` : undefined}
        loading={mutate.loading}
      />
    </>
  );
}

function CouponForm({ coupon, onClose, onSaved }: { coupon: Coupon | null; onClose: () => void; onSaved: () => void }) {
  const mutate = useMutate("coupons");
  const toast = useToast();
  const [form, setForm] = useState<Record<string, unknown>>({
    code: coupon?.code ?? "",
    type: coupon?.type ?? "percent",
    value: coupon?.value ?? 10,
    minOrder: coupon?.minOrder ?? 0,
    maxDiscount: coupon?.maxDiscount ?? null,
    uses: coupon?.uses ?? 0,
    maxUses: coupon?.maxUses ?? 1000,
    perCustomer: coupon?.perCustomer ?? 1,
    startsAt: coupon?.startsAt?.slice(0, 10) ?? TODAY,
    endsAt: coupon?.endsAt?.slice(0, 10) ?? IN_30D,
    status: coupon?.status ?? "active",
    description: coupon?.description ?? "",
    appliesTo: coupon?.appliesTo ?? "all",
    targetId: coupon?.targetId,
  });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!String(form.code).trim()) return toast("Enter a coupon code", "error");
    const payload = {
      ...form,
      code: String(form.code).toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
      startsAt: new Date(String(form.startsAt)).toISOString(),
      endsAt: new Date(String(form.endsAt)).toISOString(),
    };
    const res = coupon ? await mutate.update(coupon.id, payload) : await mutate.create(payload);
    if (res.ok) onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={coupon ? `Edit ${coupon.code}` : "New coupon"}
      sub="Define the discount, limits and validity period."
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn icon="check" onClick={submit} loading={mutate.loading}>{coupon ? "Save changes" : "Create coupon"}</Btn></>}
    >
      <form onSubmit={submit} className="admin-form-grid">
        <Field label="Coupon code" required>
          <TextInput value={form.code as string} onChange={(e) => set("code", e.target.value)} placeholder="WELCOME15" />
        </Field>
        <Field label="Description">
          <TextInput value={form.description as string} onChange={(e) => set("description", e.target.value)} placeholder="15% off your first order" />
        </Field>
        <Field label="Discount type">
          <Select value={form.type as string} onChange={(e) => set("type", e.target.value)}>
            <option value="percent">Percentage off</option>
            <option value="fixed">Flat amount off</option>
            <option value="bogo">Buy X Get Y</option>
            <option value="freeship">Free shipping</option>
          </Select>
        </Field>
        <Field label={form.type === "percent" ? "Discount (%)" : form.type === "fixed" ? "Discount (Rs)" : "Value"} required>
          <TextInput type="number" min={0} value={form.value as number} onChange={(e) => set("value", Number(e.target.value))} />
        </Field>
        <Field label="Minimum order (Rs)">
          <TextInput type="number" min={0} value={form.minOrder as number} onChange={(e) => set("minOrder", Number(e.target.value))} />
        </Field>
        <Field label="Max discount cap (Rs)">
          <TextInput type="number" min={0} value={(form.maxDiscount as number | null) ?? ""} onChange={(e) => set("maxDiscount", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Total redemptions">
          <TextInput type="number" min={0} value={form.maxUses as number} onChange={(e) => set("maxUses", Number(e.target.value))} />
        </Field>
        <Field label="Per customer">
          <TextInput type="number" min={1} value={form.perCustomer as number} onChange={(e) => set("perCustomer", Number(e.target.value))} />
        </Field>
        <Field label="Starts">
          <TextInput type="date" value={form.startsAt as string} onChange={(e) => set("startsAt", e.target.value)} />
        </Field>
        <Field label="Ends">
          <TextInput type="date" value={form.endsAt as string} onChange={(e) => set("endsAt", e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={form.status as string} onChange={(e) => set("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="paused">Paused</option>
          </Select>
        </Field>
        <Field label="Applies to">
          <Select value={form.appliesTo as string} onChange={(e) => set("appliesTo", e.target.value)}>
            <option value="all">All products</option>
            <option value="category">A category</option>
            <option value="brand">A brand</option>
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
