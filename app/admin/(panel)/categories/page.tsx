"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, Confirm, EmptyState, ErrorState, Field, IconBtn, Modal, PageHeader,
  SearchInput, Select, Skeleton, Status, TextArea, TextInput, Toggle, useToast,
} from "@/components/admin/ui";
import { dateShort } from "@/components/admin/format";
import type { Category } from "@/lib/db/types";

const TONE = ["blue", "green", "violet", "orange", "red"];

export default function CategoriesPage() {
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 24 });
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const { data, loading, error, refetch } = useList<Category>("categories", params);
  const mutate = useMutate("categories", { onSuccess: refetch });
  const toast = useToast();

  const roots = useMemo(() => (data?.items ?? []).filter((c) => !c.parentId), [data]);
  const children = useMemo(() => (data?.items ?? []).filter((c) => c.parentId), [data]);
  const rootCount = roots.length;

  const deleteCat = async (c: Category) => {
    const res = await mutate.remove(c.id, "Category deleted");
    if (res.ok) setConfirmDelete(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Categories"
        sub="Organise your catalogue with parent and child categories, banners and SEO."
        actions={<Btn icon="plus" onClick={() => setEditing("new")}>Add category</Btn>}
      />

      <div className="admin-category-summary">
        <div><span className="admin-summary-icon blue"><Icon name="categories" size={16} /></span><span><small>Parent categories</small><b>{rootCount}</b></span></div>
        <div><span className="admin-summary-icon green"><Icon name="layers" size={16} /></span><span><small>Child categories</small><b>{children.length}</b></span></div>
        <div><span className="admin-summary-icon violet"><Icon name="star" size={16} /></span><span><small>Featured</small><b>{(data?.items ?? []).filter((c) => c.featured).length}</b></span></div>
      </div>

      <Card>
        <div className="admin-toolbar" style={{ marginBottom: 20 }}>
          <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search categories…" />
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Btn variant="secondary" icon="refresh" onClick={refetch}>Refresh</Btn>
          </div>
        </div>

        {loading ? (
          <Skeleton rows={6} height={120} />
        ) : error ? (
          <ErrorState message={error} retry={refetch} />
        ) : roots.length === 0 ? (
          <EmptyState icon="categories" title="No categories yet" body="Create your first category to start organising products." action={<Btn icon="plus" onClick={() => setEditing("new")}>Add category</Btn>} />
        ) : (
          <div className="admin-category-grid">
            {roots.map((c, i) => {
              const kids = children.filter((k) => k.parentId === c.id);
              return (
                <div key={c.id} className={`admin-card admin-category-admin-card ${c.status === "inactive" ? "inactive" : ""}`}>
                  <div className="admin-card-menu">
                    <IconBtn icon="edit" label="Edit" onClick={() => setEditing(c)} />
                    <IconBtn icon="trash" label="Delete" tone="danger" onClick={() => setConfirmDelete(c)} />
                  </div>
                  <div className={`admin-category-symbol ${TONE[i % TONE.length]}`}>
                    {c.icon ? <Icon name="categories" size={20} /> : <Icon name="folder" size={20} />}
                  </div>
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 24 }}>
                    {c.featured && <span className="admin-coupon-code violet">★ Featured</span>}
                    {kids.length > 0 && <span className="admin-category-tag">{kids.length} children</span>}
                    <Status value={c.status} />
                  </div>
                  <div className="admin-category-meta">
                    <b>{kids.length ? kids.map((k) => k.name).slice(0, 3).join(", ") + (kids.length > 3 ? "…" : "") : "No subcategories"}</b>
                    <span>Sort #{c.sortOrder} · {dateShort(c.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {editing && (
        <CategoryForm
          category={editing === "new" ? null : editing}
          categories={roots}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); toast(editing === "new" ? "Category created" : "Category updated"); refetch(); }}
        />
      )}

      <Confirm
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && void deleteCat(confirmDelete)}
        title="Delete category?"
        body={confirmDelete ? `"${confirmDelete.name}" will be removed. Subcategories and linked products keep their data.` : undefined}
        loading={mutate.loading}
      />
    </>
  );
}

function CategoryForm({
  category, categories, onClose, onSaved,
}: {
  category: Category | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const mutate = useMutate("categories");
  const toast = useToast();
  const [form, setForm] = useState<Record<string, unknown>>({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    parentId: category?.parentId ?? null,
    image: category?.image ?? "",
    banner: category?.banner ?? "",
    icon: category?.icon ?? "",
    description: category?.description ?? "",
    featured: category?.featured ?? false,
    sortOrder: category?.sortOrder ?? 0,
    status: category?.status ?? "active",
    seoTitle: category?.seoTitle ?? "",
    seoDescription: category?.seoDescription ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!String(form.name).trim()) errs.name = "Name is required";
    if (!String(form.slug).trim()) errs.slug = "Slug is required";
    if (Number(form.parentId) === category?.id) errs.parentId = "A category can't be its own parent";
    setErrors(errs);
    if (Object.keys(errs).length) return toast("Please fix the highlighted fields", "error");
    const payload = { ...form, slug: String(form.slug).toLowerCase().replace(/[^a-z0-9-]+/g, "-") };
    const res = category ? await mutate.update(category.id, payload) : await mutate.create(payload);
    if (res.ok) onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? "Edit category" : "Add category"}
      sub={category ? `Manage "${category.name}"` : "Create a new category or subcategory"}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn icon="check" onClick={submit} loading={mutate.loading}>{category ? "Save changes" : "Create category"}</Btn></>}
    >
      <form onSubmit={submit} className="admin-form-grid">
        <Field label="Name" required error={errors.name}>
          <TextInput value={form.name as string} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Slug" required error={errors.slug} hint="URL-friendly identifier">
          <TextInput value={form.slug as string} onChange={(e) => set("slug", e.target.value)} />
        </Field>
        <Field label="Parent category" hint="Leave empty for a top-level category">
          <Select value={(form.parentId as number) ?? ""} onChange={(e) => set("parentId", e.target.value ? Number(e.target.value) : null)}>
            <option value="">— Top level —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Sort order">
          <TextInput type="number" value={form.sortOrder as number} onChange={(e) => set("sortOrder", Number(e.target.value))} />
        </Field>
        <Field label="Icon (inline SVG path data)" className="full" hint="Optional — overrides the default folder icon">
          <TextInput value={form.icon as string} onChange={(e) => set("icon", e.target.value)} placeholder="M12 3v0l1.8 5.2…" />
        </Field>
        <Field label="Image URL" className="full">
          <TextInput value={form.image as string} onChange={(e) => set("image", e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Banner URL" className="full">
          <TextInput value={form.banner as string} onChange={(e) => set("banner", e.target.value)} placeholder="https://…" />
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
          <span>Featured category</span>
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
