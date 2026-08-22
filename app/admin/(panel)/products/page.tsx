"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  exportResource, useList, useMutate, qstring, type ListParams,
} from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, Checkbox, Confirm, Drawer, Dropdown, EmptyState, ErrorState, Field,
  FilterBtn, ImageUpload, MenuItem, Modal, PageHeader, Pagination, SearchInput, Select, Skeleton,
  SortableTh, Status, StockBadge, Table, Td, Th, TextArea, TextInput, Toggle, useToast, IconBtn,
} from "@/components/admin/ui";
import { compactNum, dateShort, money } from "@/components/admin/format";
import type { Product } from "@/lib/db/types";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];
const STOCK_OPTIONS = [
  { value: "", label: "All stock" },
  { value: "in", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 10 });
  const [trash, setTrash] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(
    searchParams.get("new") ? ("new" as const) : null
  );
  const [preview, setPreview] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ ids: number[]; trash: boolean } | null>(null);
  const [importing, setImporting] = useState(false);

  const { data, loading, error, refetch, updateLocal, toastError } = useList<Product>(
    "products",
    { ...params, filters: { ...(params.filters ?? {}), deleted: trash } }
  );
  const mutate = useMutate("products", { onSuccess: refetch });
  const toast = useToast();

  const { data: catsData } = useList<{ id: number; name: string; parentId: number | null }>("categories", { pageSize: 100 });
  const { data: brandsData } = useList<{ id: number; name: string }>("brands", { pageSize: 100 });
  const { data: dealersData } = useList<{ id: number; company: string }>("dealers", { pageSize: 100 });

  const cats = catsData?.items ?? [];
  const brands = brandsData?.items ?? [];
  const dealers = dealersData?.items ?? [];

  useEffect(() => setSelected([]), [params, trash]);

  const catName = (id: number) => {
    const c = cats.find((x) => x.id === id);
    if (!c) return "—";
    if (c.parentId) {
      const p = cats.find((x) => x.id === c.parentId);
      return p ? `${p.name} / ${c.name}` : c.name;
    }
    return c.name;
  };

  const allChecked = data?.items.length ? data.items.every((p) => selected.includes(p.id)) : false;

  const toggleAll = () => {
    if (!data) return;
    setSelected(allChecked ? [] : data.items.map((p) => p.id));
  };

  const doDelete = async (ids: number[], soft: boolean) => {
    // `soft` here means the items are in the trash view → permanent delete.
    // bulk `delete` soft-deletes live products and permanently removes trashed ones.
    const res = await mutate.bulk("delete", ids, undefined, "");
    if (res.ok) {
      toast(ids.length > 1 ? `${ids.length} products removed` : "Product removed");
      setConfirmDelete(null);
      refetch();
    } else setConfirmDelete(null);
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      toastError(new Error("The CSV needs a header row and at least one product."));
      setImporting(false);
      return;
    }
    const head = lines[0].split(",").map((h) => h.trim());
    const idx = (k: string) => head.indexOf(k);
    let okCount = 0;
    for (const line of lines.slice(1)) {
      const parts = line.split(",");
      const get = (k: string) => (idx(k) >= 0 ? parts[idx(k)]?.trim() ?? "" : "");
      const name = get("name");
      const price = Number(get("price"));
      if (!name || !price) continue;
      const res = await mutate.create({
        name,
        sku: get("sku") || `IMP-${Date.now()}-${okCount}`,
        price,
        mrp: Number(get("mrp")) || price,
        stock: Number(get("stock")) || 0,
        brandId: Number(get("brandId")) || 1,
        categoryId: Number(get("categoryId")) || 1,
        status: (get("status") || "draft") as Product["status"],
        description: get("description"),
        tags: get("tags") ? get("tags").split(";") : [],
      }, "");
      if (res.ok) okCount++;
    }
    setImporting(false);
    toast(`Imported ${okCount} products`);
    refetch();
  };

  const sort = params.sort ? { key: params.sort, dir: params.dir ?? ("asc" as const) } : null;

  const toggleSort = (key: string) =>
    setParams((p) => ({
      ...p,
      sort: key,
      dir: p.sort === key ? (p.dir === "asc" ? "desc" : "asc") : "asc",
      page: 1,
    }));

  const changePage = (page: number) => setParams((p) => ({ ...p, page }));

  const headerRight = useMemo(
    () => (
      <>
        {!trash && (
          <>
            <Dropdown
              trigger={<Btn variant="secondary" icon="download">Export</Btn>}
            >
              <MenuItem icon="download" label="Export as CSV" onClick={() => exportResource("products", "csv", { ...params, filters: { ...params.filters, deleted: false } }).catch(toastError)} />
              <MenuItem icon="file" label="Export as Excel" onClick={() => exportResource("products", "xlsx", { ...params, filters: { ...params.filters, deleted: false } }).catch(toastError)} />
            </Dropdown>
            <label className="admin-btn secondary" style={{ display: "inline-flex", cursor: "pointer" }}>
              <Icon name="upload" size={15} />
              {importing ? "Importing…" : "Import"}
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleImport(f);
                  e.target.value = "";
                }}
              />
            </label>
          </>
        )}
        <Btn icon="plus" onClick={() => setEditing("new")}>Add product</Btn>
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trash, params, importing]
  );

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        sub={`${data?.total ?? 0} products in your catalogue${trash ? " (trash)" : ""} — manage listings, pricing, stock and SEO.`}
        actions={headerRight}
      />

      <Card pad={false} bodyClassName="admin-table-card">
        <div className="admin-toolbar">
          <SearchInput
            value={params.search ?? ""}
            onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))}
            placeholder="Search by name, SKU or barcode…"
          />
          <Select
            className="admin-select"
            value={(params.filters?.status as string) ?? ""}
            onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, status: e.target.value }, page: 1 }))}
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Select
            className="admin-select"
            value={(params.filters?.stockState as string) ?? ""}
            onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, stockState: e.target.value }, page: 1 }))}
          >
            {STOCK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Select
            className="admin-select"
            value={(params.filters?.categoryId as string) ?? ""}
            onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, categoryId: e.target.value }, page: 1 }))}
          >
            <option value="">All categories</option>
            {cats.filter((c) => !c.parentId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <FilterBtn active={trash} onClick={() => setTrash((v) => !v)}>
            <Icon name="trash" size={13} /> Trash
          </FilterBtn>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {selected.length > 0 && (
              <>
                <span className="admin-count">{selected.length} selected</span>
                <Dropdown trigger={<Btn variant="secondary" icon="sliders">Bulk actions</Btn>}>
                  <MenuItem icon="trash" label={trash ? "Permanently delete" : "Move to trash"} danger onClick={() => setConfirmDelete({ ids: selected, trash })} />
                  {!trash && (
                    <>
                      <MenuItem icon="check" label="Set status → Active" onClick={() => void mutate.bulk("update", selected, { status: "active" })} />
                      <MenuItem icon="edit" label="Set status → Draft" onClick={() => void mutate.bulk("update", selected, { status: "draft" })} />
                      <MenuItem icon="star" label="Mark featured" onClick={() => void mutate.bulk("update", selected, { featured: true })} />
                      <MenuItem icon="spark" label="Mark best seller" onClick={() => void mutate.bulk("update", selected, { bestSeller: true })} />
                    </>
                  )}
                  {trash && <MenuItem icon="restore" label="Restore selected" onClick={() => void mutate.bulk("restore", selected)} />}
                </Dropdown>
              </>
            )}
            <FilterBtn onClick={() => { setParams({ page: 1, pageSize: 10 }); setTrash(false); }}><Icon name="refresh" size={13} /> Reset</FilterBtn>
          </div>
        </div>

        {loading ? (
          <Skeleton rows={8} />
        ) : error ? (
          <ErrorState message={error} retry={refetch} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={trash ? "trash" : "products"}
            title={trash ? "Trash is empty" : "No products found"}
            body={trash ? "Deleted products land here for 30 days." : "Try a different search, or add your first product."}
            action={!trash ? <Btn icon="plus" onClick={() => setEditing("new")}>Add product</Btn> : undefined}
          />
        ) : (
          <>
            <Table
              minWidth={1120}
              head={
                <>
                  <Th>Sr#</Th>
                  <Th><Checkbox checked={allChecked} onChange={toggleAll} /></Th>
                  <SortableTh sortKey="name" sort={sort} onSort={toggleSort}>Product</SortableTh>
                  <SortableTh sortKey="categoryName" sort={sort} onSort={toggleSort}>Category</SortableTh>
                  <SortableTh sortKey="brandName" sort={sort} onSort={toggleSort}>Brand</SortableTh>
                  <SortableTh sortKey="price" sort={sort} onSort={toggleSort}>Price</SortableTh>
                  <SortableTh sortKey="stock" sort={sort} onSort={toggleSort}>Stock</SortableTh>
                  <SortableTh sortKey="status" sort={sort} onSort={toggleSort}>Status</SortableTh>
                  <SortableTh sortKey="flags" sort={sort} onSort={toggleSort}>Flags</SortableTh>
                  <Th />
                </>
              }
            >
              {data.items.map((p, index) => (
                <tr key={p.id}>
                  <Td><span className="admin-muted-cell">{(data.page - 1) * data.pageSize + index + 1}</span></Td>
                  <Td><Checkbox checked={selected.includes(p.id)} onChange={(v) => setSelected((s) => (v ? [...s, p.id] : s.filter((x) => x !== p.id)))} /></Td>
                  <Td>
                    <div className="admin-table-product">
                      <img src={p.image} alt="" />
                      <span>
                        <b>{p.name}</b>
                        <small>{p.sku} · {p.barcode}</small>
                      </span>
                    </div>
                  </Td>
                  <Td><span className="admin-category-tag dark:!bg-[#1a293c] dark:!text-(--admin-muted)">{catName(p.categoryId)}</span></Td>
                  <Td><b>{brands.find((b) => b.id === p.brandId)?.name ?? "—"}</b></Td>
                  <Td>
                    <b>{money(p.price)}</b>
                    <span className="admin-payment">{p.discount ? `${p.discount}% off` : `cost ${money(p.costPrice)}`}</span>
                  </Td>
                  <Td><StockBadge stock={p.stock} alert={p.lowStockAlert} /></Td>
                  <Td><Status value={p.status} /></Td>
                  <Td>
                    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                      {p.rx && <span className="admin-coupon-code red" title="Prescription required"><Icon name="shieldCheck" size={11} /></span>}
                      {p.featured && <span className="admin-coupon-code violet" title="Featured"><Icon name="starFill" size={11} /></span>}
                      {p.bestSeller && <span className="admin-coupon-code green" title="Best seller"><Icon name="spark" size={11} /></span>}
                      {p.newArrival && <span className="admin-coupon-code blue" title="New arrival"><Icon name="plus" size={11} /></span>}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ display: "inline-flex", gap: 5 }}>
                      {trash ? (
                        <>
                          <IconBtn icon="restore" label="Restore" onClick={() => void mutate.bulk("restore", [p.id])} />
                          <IconBtn icon="trash" label="Delete forever" tone="danger" onClick={() => setConfirmDelete({ ids: [p.id], trash: true })} />
                        </>
                      ) : (
                        <>
                          <IconBtn icon="eye" label="Preview" onClick={() => setPreview(p)} />
                          <IconBtn icon="edit" label="Edit" onClick={() => setEditing(p)} />
                          <IconBtn icon="copy" label="Duplicate" onClick={() => void duplicate(p, mutate, refetch, toast)} />
                          <IconBtn icon="trash" label="Delete" tone="danger" onClick={() => setConfirmDelete({ ids: [p.id], trash: false })} />
                        </>
                      )}
                    </span>
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={changePage} />
          </>
        )}
      </Card>

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={cats}
          brands={brands}
          dealers={dealers}
          onClose={() => setEditing(null)}
          onSaved={(p) => {
            setEditing(null);
            toast(editing === "new" ? "Product created" : "Product updated");
            refetch();
            updateLocal((rows) => (editing === "new" ? [p, ...rows] : rows.map((r) => (r.id === p.id ? p : r))));
          }}
        />
      )}

      {preview && (
        <ProductPreview product={preview} onClose={() => setPreview(null)} onEdit={() => { setEditing(preview); setPreview(null); }} />
      )}

      <Confirm
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && void doDelete(confirmDelete.ids, !confirmDelete.trash)}
        title={confirmDelete?.trash ? "Delete permanently?" : "Move to trash?"}
        body={confirmDelete?.ids.length === 1 ? "This product will be removed." : `${confirmDelete?.ids.length} products will be removed.`}
        confirmLabel={confirmDelete?.trash ? "Delete forever" : "Move to trash"}
        loading={mutate.loading}
      />
    </>
  );
}

async function duplicate(p: Product, mutate: ReturnType<typeof useMutate>, refetch: () => void, toast: (m: string) => void) {
  const res = await mutate.create(
    {
      ...p,
      id: undefined,
      sku: `${p.sku}-COPY`,
      name: `${p.name} (Copy)`,
      status: "draft",
      sold: 0,
      stock: 0,
    } as unknown as Record<string, unknown>,
    ""
  );
  if (res.ok) {
    toast("Product duplicated as draft");
    refetch();
  }
}

// ------------------------------------------------------------
// Preview modal
// ------------------------------------------------------------

function ProductPreview({ product, onClose, onEdit }: { product: Product; onClose: () => void; onEdit: () => void }) {
  return (
    <Modal open onClose={onClose} title={product.name} sub={`${product.sku} · ${product.barcode}`} wide
      footer={<><Btn variant="secondary" onClick={onClose}>Close</Btn><Btn icon="edit" onClick={onEdit}>Edit product</Btn></>}>
      <div className="admin-form-grid">
        <div>
          <img src={product.image} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 16 }} />
        </div>
        <div className="admin-form-stack">
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Status value={product.status} />
            <StockBadge stock={product.stock} alert={product.lowStockAlert} />
            {product.rx && <span className="admin-coupon-code red">℞ Prescription required</span>}
            {product.featured && <span className="admin-coupon-code violet">Featured</span>}
            {product.bestSeller && <span className="admin-coupon-code green">Best seller</span>}
          </div>
          <div>
            <div className="admin-eyebrow">Pricing</div>
            <div className="admin-health-score" style={{ margin: "6px 0 0" }}>
              <strong>{money(product.price)}</strong>
              <span>MRP {money(product.mrp)} · {product.discount}% off · tax {product.tax}%</span>
            </div>
          </div>
          <p style={{ color: "var(--admin-ink-soft)", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{product.description}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["Sold", compactNum(product.sold)], ["Rating", `★ ${product.rating}`], ["Reviews", product.reviews],
              ["Weight", product.weight], ["Dimensions", product.dimensions], ["Created", dateShort(product.createdAt)],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "#f8fafc", borderRadius: 10, padding: "9px 11px" }}>
                <small style={{ color: "var(--admin-muted)", fontSize: 9, fontWeight: 700, display: "block" }}>{k}</small>
                <b style={{ fontSize: 11.5 }}>{v}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
      {product.gallery.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="admin-eyebrow" style={{ marginBottom: 8 }}>Gallery</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {product.gallery.map((g, i) => <img key={i} src={g} alt="" width={84} height={84} style={{ borderRadius: 10, objectFit: "cover" }} />)}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------
// Product form drawer
// ------------------------------------------------------------

function ProductForm({
  product, categories, brands, dealers, onClose, onSaved,
}: {
  product: Product | null;
  categories: { id: number; name: string; parentId: number | null }[];
  brands: { id: number; name: string }[];
  dealers: { id: number; company: string }[];
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const mutate = useMutate("products");
  const toast = useToast();
  const [form, setForm] = useState<Record<string, unknown>>({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    brandId: product?.brandId ?? brands[0]?.id ?? 1,
    categoryId: product?.categoryId ?? categories.find((c) => !c.parentId)?.id ?? 1,
    subcategoryId: product?.subcategoryId,
    dealerId: product?.dealerId,
    description: product?.description ?? "",
    specifications: product?.specifications ?? [],
    image: product?.image ?? "",
    gallery: product?.gallery ?? [],
    videos: product?.videos ?? [],
    stock: product?.stock ?? 0,
    lowStockAlert: product?.lowStockAlert ?? 10,
    costPrice: product?.costPrice ?? 0,
    price: product?.price ?? 0,
    mrp: product?.mrp ?? 0,
    tax: product?.tax ?? 5,
    weight: product?.weight ?? "",
    dimensions: product?.dimensions ?? "",
    tags: product?.tags ?? [],
    status: product?.status ?? "active",
    featured: product?.featured ?? false,
    bestSeller: product?.bestSeller ?? false,
    newArrival: product?.newArrival ?? false,
    rx: product?.rx ?? false,
    rating: product?.rating ?? 0,
    reviews: product?.reviews ?? 0,
    sold: product?.sold ?? 0,
    composition: (product?.specifications ?? []).find((s) => s.label === "Salt / composition")?.value ?? "",
    seoTitle: product?.seoTitle ?? "",
    seoDescription: product?.seoDescription ?? "",
    metaKeywords: product?.metaKeywords ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState((form.tags as string[]).join(", "));

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const rootCats = categories.filter((c) => !c.parentId);
  const subCats = categories.filter((c) => c.parentId === form.categoryId);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!String(form.name).trim()) e.name = "Product name is required";
    if (!String(form.sku).trim()) e.sku = "SKU is required";
    if (!Number(form.price)) e.price = "Enter a valid selling price";
    if (Number(form.mrp) && Number(form.price) > Number(form.mrp)) e.mrp = "MRP must be ≥ selling price";
    if (!form.categoryId) e.categoryId = "Choose a category";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      toast("Please fix the highlighted fields", "error");
      return;
    }
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    // Salt / composition lives inside the specifications list — keep any other
    // specs (pack size, manufacturer, storage…) untouched.
    const { composition, ...rest } = form;
    const specs = [...((form.specifications as { label: string; value: string }[]) ?? [])].filter(
      (s) => s.label !== "Salt / composition"
    );
    if (String(composition).trim()) {
      specs.push({ label: "Salt / composition", value: String(composition).trim() });
    }
    const payload: Record<string, unknown> = { ...rest, tags, specifications: specs };
    const res = product
      ? await mutate.update(product.id, payload)
      : await mutate.create(payload);
    if (res.ok) onSaved(res.data as Product);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={product ? "Edit product" : "Add product"}
      sub={product ? `${product.sku} · ${product.name}` : "Create a new catalogue listing"}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={submit} loading={mutate.loading} icon="check">{product ? "Save changes" : "Create product"}</Btn>
        </>
      }
    >
      <form onSubmit={submit} className="admin-form-stack" style={{ display: "grid", gap: 20 }}>
        <div className="admin-form-section">
          <h3>Basic information</h3>
          <div className="admin-form-grid">
            <Field label="Product name" required error={errors.name} className="full">
              <TextInput value={form.name as string} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Paracetamol 500mg · 15 tablets" />
            </Field>
            <Field label="SKU (product code)" hint="Your internal code to identify this product, e.g. MED-1041" required error={errors.sku}>
              <TextInput value={form.sku as string} onChange={(e) => set("sku", e.target.value)} placeholder="MED-1041" />
            </Field>
            <Field label="Barcode (scan code)" hint="The number printed under the barcode on the packaging">
              <TextInput value={form.barcode as string} onChange={(e) => set("barcode", e.target.value)} placeholder="8901234567890" />
            </Field>
            <Field label="Brand" hint="Company that makes this product">
              <Select value={form.brandId as number} onChange={(e) => set("brandId", Number(e.target.value))}>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </Field>
            <Field label="Category" hint="Main department this product belongs to" required error={errors.categoryId}>
              <Select value={form.categoryId as number} onChange={(e) => { set("categoryId", Number(e.target.value)); set("subcategoryId", undefined); }}>
                {rootCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Subcategory">
              <Select value={(form.subcategoryId as number) ?? ""} onChange={(e) => set("subcategoryId", e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">None</option>
                {subCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Dealer / supplier" hint="Optional — who supplies this product to you">
              <Select value={(form.dealerId as number) ?? ""} onChange={(e) => set("dealerId", e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">No dealer</option>
                {dealers.map((d) => <option key={d.id} value={d.id}>{d.company}</option>)}
              </Select>
            </Field>
            <Field label="Status" hint="Draft = hidden from the store, Active = visible, Archived = removed">
              <Select value={form.status as string} onChange={(e) => set("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </Select>
            </Field>
          </div>
        </div>

        <div className="admin-form-section">
          <h3>What customers see</h3>
          <p className="-mt-1.5 mb-1 text-[11px] text-(--admin-muted)">
            Everything shown on the product page for this item.
          </p>
          <div className="admin-form-grid">
            <Field label="Salt / composition" hint="The medicine composition shown with a ℞ on the product page, e.g. Paracetamol 500mg · 15 tablets" className="full">
              <TextInput value={form.composition as string} onChange={(e) => set("composition", e.target.value)} placeholder="Paracetamol 500mg · 15 tablets" />
            </Field>
            <Field label="Rating (out of 5)" hint="Average customer rating shown as ★ 4.8">
              <TextInput type="number" min={0} max={5} step={0.1} value={form.rating as number} onChange={(e) => set("rating", Number(e.target.value))} />
            </Field>
            <Field label="Reviews count" hint="Total number of customer reviews">
              <TextInput type="number" min={0} value={form.reviews as number} onChange={(e) => set("reviews", Number(e.target.value))} />
            </Field>
            <Field label="Units sold" hint="How many units have been sold so far">
              <TextInput type="number" min={0} value={form.sold as number} onChange={(e) => set("sold", Number(e.target.value))} />
            </Field>
            <Field label="Description" hint="Short description customers read on the product page" className="full">
              <TextArea rows={4} value={form.description as string} onChange={(e) => set("description", e.target.value)} placeholder="Fast-acting relief from fever, headache and body ache…" />
            </Field>
            <div className="admin-choice col-span-full mb-0.5">
              <span>Prescription required (Rx)</span>
              <Toggle
                on={form.rx as boolean}
                onChange={(v) => set("rx", v)}
                label="Prescription required"
              />
              <small className="basis-full mt-2 text-[10px] text-(--admin-muted)">
                On = customers see a “Prescription required” badge and must upload an Rx before buying.
              </small>
            </div>
          </div>
        </div>

        <div className="admin-form-section">
          <h3>Pricing & inventory</h3>
          <div className="admin-form-grid">
            <Field label="Cost price (Rs)" hint="What you pay to buy this product — not shown to customers">
              <TextInput type="number" min={0} value={form.costPrice as number} onChange={(e) => set("costPrice", Number(e.target.value))} />
            </Field>
            <Field label="Selling price (Rs)" hint="The final price customers pay" required error={errors.price}>
              <TextInput type="number" min={0} value={form.price as number} onChange={(e) => set("price", Number(e.target.value))} />
            </Field>
            <Field label="MRP (original price) (Rs)" hint="Price printed on the pack — shown with a strikethrough on the site">
              <TextInput type="number" min={0} value={form.mrp as number} onChange={(e) => set("mrp", Number(e.target.value))} />
            </Field>
            <Field label="Tax % (GST)">
              <TextInput type="number" min={0} max={28} value={form.tax as number} onChange={(e) => set("tax", Number(e.target.value))} />
            </Field>
            <Field label="Stock quantity" hint="0 = shows as Out of stock on the site">
              <TextInput type="number" min={0} value={form.stock as number} onChange={(e) => set("stock", Number(e.target.value))} />
            </Field>
            <Field label="Low stock alert" hint="Get a warning when stock falls below this number">
              <TextInput type="number" min={0} value={form.lowStockAlert as number} onChange={(e) => set("lowStockAlert", Number(e.target.value))} />
            </Field>
            <Field label="Weight" hint="Parcel weight for shipping, e.g. 0.05 kg">
              <TextInput value={form.weight as string} onChange={(e) => set("weight", e.target.value)} placeholder="0.05 kg" />
            </Field>
            <Field label="Dimensions" hint="Pack dimensions for shipping">
              <TextInput value={form.dimensions as string} onChange={(e) => set("dimensions", e.target.value)} placeholder="10 × 5 × 3 cm" />
            </Field>
          </div>
        </div>

        <div className="admin-form-section">
          <h3>Photos & videos</h3>
          <div className="admin-form-grid">
            <Field label="Main photo URL" hint="The photo shown on the product card and product page" className="full">
              <div style={{ display: "flex", gap: 8 }}>
                <TextInput value={form.image as string} onChange={(e) => set("image", e.target.value)} placeholder="https://… or /uploads/…" />
                <ImageUpload onUploaded={(url) => set("image", url)} />
              </div>
            </Field>
            <Field label="More photos (comma separated)" hint="Extra photos shown in the product gallery" className="full">
              <TextInput value={(form.gallery as string[]).join(", ")} onChange={(e) => set("gallery", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="https://…, https://…" />
            </Field>
            <Field label="Videos (comma separated)" className="full">
              <TextInput value={(form.videos as string[]).join(", ")} onChange={(e) => set("videos", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="https://…" />
            </Field>
          </div>
        </div>

        <div className="admin-form-section">
          <h3>Badges & tags</h3>
          <p className="-mt-1.5 mb-1 text-[11px] text-(--admin-muted)">
            Badges highlight the product on the store; tags help customers find it in search.
          </p>
          <div className="admin-choice" style={{ marginBottom: 12 }}>
            <span>Featured — shown in the spotlight section</span>
            <Toggle on={form.featured as boolean} onChange={(v) => set("featured", v)} />
          </div>
          <div className="admin-choice" style={{ marginBottom: 12 }}>
            <span>Best seller — “bestseller” badge</span>
            <Toggle on={form.bestSeller as boolean} onChange={(v) => set("bestSeller", v)} />
          </div>
          <div className="admin-choice" style={{ marginBottom: 12 }}>
            <span>New arrival — “new” badge</span>
            <Toggle on={form.newArrival as boolean} onChange={(v) => set("newArrival", v)} />
          </div>
          <Field label="Tags (comma separated)" hint="Search keywords, e.g. bestseller, otc, fever">
            <TextInput value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="bestseller, otc, fever" />
          </Field>
        </div>

        <div className="admin-form-section">
          <h3>Search engine (Google) settings</h3>
          <p className="-mt-1.5 mb-1 text-[11px] text-(--admin-muted)">
            Optional — helps people find this product on Google.
          </p>
          <div className="admin-form-grid">
            <Field label="Page title" hint="The title shown in the browser tab and Google results" className="full">
              <TextInput value={form.seoTitle as string} onChange={(e) => set("seoTitle", e.target.value)} placeholder={`Buy ${(form.name as string) || "product"} Online at Best Price`} />
            </Field>
            <Field label="Page description" hint="The short summary shown under the title in Google results" className="full">
              <TextArea rows={2} value={form.seoDescription as string} onChange={(e) => set("seoDescription", e.target.value)} />
            </Field>
            <Field label="Search keywords" hint="Words customers might type to find this product" className="full">
              <TextInput value={form.metaKeywords as string} onChange={(e) => set("metaKeywords", e.target.value)} placeholder="paracetamol, fever tablets, buy online" />
            </Field>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
