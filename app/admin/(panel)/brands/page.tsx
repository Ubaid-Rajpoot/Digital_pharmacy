"use client";

import { useState, type FormEvent } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, Confirm, EmptyState, ErrorState, Field, IconBtn, Modal, PageHeader,
  SearchInput, Select, Skeleton, Status, TextArea, TextInput, Toggle, useToast,
} from "@/components/admin/ui";
import { dateShort } from "@/components/admin/format";
import type { Brand } from "@/lib/db/types";

export default function BrandsPage() {
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 24 });
  const [editing, setEditing] = useState<Brand | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Brand | null>(null);
  const { data, loading, error, refetch } = useList<Brand>("brands", params);
  const mutate = useMutate("brands", { onSuccess: refetch });
  const toast = useToast();

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Brands"
        sub="Manage the brands you stock — logos, banners, featured placements and SEO."
        actions={<Btn icon="plus" onClick={() => setEditing("new")}>Add brand</Btn>}
      />

      <div className="admin-category-summary">
        <div><span className="admin-summary-icon blue"><Icon name="brands" size={16} /></span><span><small>Total brands</small><b>{data?.total ?? 0}</b></span></div>
        <div><span className="admin-summary-icon green"><Icon name="check" size={16} /></span><span><small>Active</small><b>{(data?.items ?? []).filter((b) => b.status === "active").length}</b></span></div>
        <div><span className="admin-summary-icon violet"><Icon name="star" size={16} /></span><span><small>Featured</small><b>{(data?.items ?? []).filter((b) => b.featured).length}</b></span></div>
      </div>

      <Card>
        <div className="admin-toolbar" style={{ marginBottom: 20 }}>
          <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search brands…" />
        </div>

        {loading ? (
          <Skeleton rows={6} height={120} />
        ) : error ? (
          <ErrorState message={error} retry={refetch} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon="brands" title="No brands found" body="Add your first brand to showcase on product pages." action={<Btn icon="plus" onClick={() => setEditing("new")}>Add brand</Btn>} />
        ) : (
          <div className="admin-category-grid">
            {data.items.map((b) => (
              <div key={b.id} className={`admin-card admin-category-admin-card ${b.status === "inactive" ? "inactive" : ""}`}>
                <div className="admin-card-menu">
                  <IconBtn icon="edit" label="Edit" onClick={() => setEditing(b)} />
                  <IconBtn icon="trash" label="Delete" tone="danger" onClick={() => setConfirmDelete(b)} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <img src={b.logo} alt="" width={52} height={52} style={{ borderRadius: 14, objectFit: "cover", background: "#f1f6fb" }} />
                  <div>
                    <h3 style={{ fontSize: 15, margin: 0 }}>{b.name}</h3>
                    <small style={{ color: "var(--admin-muted)", fontSize: 10 }}>{b.products} products · since {dateShort(b.createdAt)}</small>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: "var(--admin-muted)", lineHeight: 1.5, minHeight: 34 }}>{b.description}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "4px 0 14px" }}>
                  {b.featured && <span className="admin-coupon-code violet">★ Featured</span>}
                  <Status value={b.status} />
                </div>
                <div className="admin-category-meta" style={{ marginTop: 0 }}>
                  <b style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="globe" size={12} /> {b.website.replace(/^https?:\/\//, "")}</b>
                  <span>{b.seoTitle}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editing && (
        <BrandForm
          brand={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); toast(editing === "new" ? "Brand created" : "Brand updated"); refetch(); }}
        />
      )}

      <Confirm
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          void mutate.remove(confirmDelete.id, "Brand deleted").then((r) => r.ok && setConfirmDelete(null));
        }}
        title="Delete brand?"
        body={confirmDelete ? `"${confirmDelete.name}" and its ${confirmDelete.products} products listing will lose this brand link.` : undefined}
        loading={mutate.loading}
      />
    </>
  );
}

function BrandForm({ brand, onClose, onSaved }: { brand: Brand | null; onClose: () => void; onSaved: () => void }) {
  const mutate = useMutate("brands");
  const toast = useToast();
  const [form, setForm] = useState<Record<string, unknown>>({
    name: brand?.name ?? "",
    logo: brand?.logo ?? "",
    banner: brand?.banner ?? "",
    website: brand?.website ?? "",
    description: brand?.description ?? "",
    featured: brand?.featured ?? false,
    status: brand?.status ?? "active",
    seoTitle: brand?.seoTitle ?? "",
    seoDescription: brand?.seoDescription ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!String(form.name).trim()) errs.name = "Name is required";
    setErrors(errs);
    if (Object.keys(errs).length) return toast("Please fix the highlighted fields", "error");
    const res = brand ? await mutate.update(brand.id, form) : await mutate.create(form);
    if (res.ok) onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={brand ? "Edit brand" : "Add brand"}
      sub="Brands are shown on product cards and the brand directory."
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn icon="check" onClick={submit} loading={mutate.loading}>{brand ? "Save changes" : "Create brand"}</Btn></>}
    >
      <form onSubmit={submit} className="admin-form-grid">
        <Field label="Brand name" required error={errors.name}>
          <TextInput value={form.name as string} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Website">
          <TextInput value={form.website as string} onChange={(e) => set("website", e.target.value)} placeholder="https://www.example.com" />
        </Field>
        <Field label="Logo URL" className="full">
          <TextInput value={form.logo as string} onChange={(e) => set("logo", e.target.value)} />
        </Field>
        <Field label="Banner URL" className="full">
          <TextInput value={form.banner as string} onChange={(e) => set("banner", e.target.value)} />
        </Field>
        <Field label="Description" className="full">
          <TextArea rows={3} value={form.description as string} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={form.status as string} onChange={(e) => set("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </Field>
        <div className="admin-choice">
          <span>Featured brand</span>
          <Toggle on={form.featured as boolean} onChange={(v) => set("featured", v)} />
        </div>
        <Field label="SEO title" className="full">
          <TextInput value={form.seoTitle as string} onChange={(e) => set("seoTitle", e.target.value)} />
        </Field>
        <Field label="SEO description" className="full">
          <TextArea rows={2} value={form.seoDescription as string} onChange={(e) => set("seoDescription", e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
