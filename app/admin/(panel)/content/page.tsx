"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useList, useMutate } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, Confirm, EmptyState, ErrorState, Field, IconBtn, Modal, PageHeader,
  Skeleton, TextArea, TextInput, Toggle, useToast,
} from "@/components/admin/ui";
import type { ContentItem, Faq, MenuLink } from "@/lib/db/types";

const GROUPS = ["Homepage", "Promotions", "Pages", "Footer", "Social"];

export default function ContentPage() {
  const [tab, setTab] = useState("Homepage");
  const { data, loading, error, refetch } = useList<ContentItem>("content", { pageSize: 100 });
  const { data: faqs, loading: faqLoading, refetch: refetchFaqs } = useList<Faq>("faqs", { pageSize: 50 });
  const { data: menu, refetch: refetchMenu } = useList<MenuLink>("menu", { pageSize: 50 });
  const toast = useToast();

  const items = (data?.items ?? []).filter((c) => c.section === tab || (tab === "Social" && c.section === "Social"));

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Content manager"
        sub="Edit every page of your storefront without touching code — everything saves straight to the CMS."
      />

      <div className="admin-content-card admin-card">
        <div className="admin-content-tabs">
          {GROUPS.map((g) => (
            <button key={g} className={tab === g ? "active" : ""} onClick={() => setTab(g)}>
              {g}
              <b>{g === "Homepage" ? (data?.items ?? []).filter((c) => c.section === "Homepage").length : g === "Pages" ? 2 : g === "Social" ? 1 : 0}</b>
            </button>
          ))}
        </div>

        {tab === "Homepage" || tab === "Promotions" || tab === "Pages" || tab === "Footer" || tab === "Social" ? (
          <div className="admin-form-stack" style={{ padding: 22 }}>
            {loading ? (
              <Skeleton rows={6} />
            ) : error ? (
              <ErrorState message={error} retry={refetch} />
            ) : (
              items.map((item) => <ContentEditor key={item.id} item={item} onSaved={refetch} />)
            )}
          </div>
        ) : null}
      </div>

      <div className="admin-marketing-grid" style={{ marginTop: 16 }}>
        <FaqManager faqs={faqs?.items ?? []} loading={!!faqLoading} refetch={refetchFaqs} />
        <MenuManager menu={(menu?.items ?? []).slice().sort((a, b) => a.order - b.order)} refetch={refetchMenu} />
      </div>
    </>
  );
}

// ------------------------------------------------------------
// Generic content item editor
// ------------------------------------------------------------

function ContentEditor({ item, onSaved }: { item: ContentItem; onSaved: () => void }) {
  const mutate = useMutate("content");
  const toast = useToast();
  const parsed = useMemo(() => {
    try {
      return JSON.parse(item.value);
    } catch {
      return null;
    }
  }, [item.value]);

  const [draft, setDraft] = useState<string>(item.value);
  const [saving, setSaving] = useState(false);

  const isSimple = parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.values(parsed).every((v) => ["string", "number", "boolean"].includes(typeof v));

  const save = async (value: unknown) => {
    setSaving(true);
    const res = await mutate.update(item.id, { value: JSON.stringify(value) }, `"${item.label}" saved`);
    setSaving(false);
    if (res.ok) {
      setDraft(JSON.stringify(value));
      onSaved();
      toast(`${item.label} published to the storefront`);
    }
  };

  if (isSimple) {
    const obj = parsed as Record<string, unknown>;
    return (
      <div className="admin-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
          <span className="admin-content-thumb"><Icon name="content" size={14} /></span>
          <div>
            <b style={{ fontSize: 12 }}>{item.label}</b>
            <small style={{ color: "var(--admin-muted)", display: "block", fontSize: 9.5 }}>{item.key} · {item.section}</small>
          </div>
          <span className="admin-save-state" style={{ marginLeft: "auto" }}><i /> Live on site</span>
        </div>
        <div className="admin-form-grid">
          {Object.entries(obj).map(([k, v]) =>
            typeof v === "boolean" ? (
              <div className="admin-choice" key={k}>
                <span style={{ textTransform: "capitalize" }}>{k.replace(/([a-z])([A-Z])/g, "$1 $2")}</span>
                <Toggle on={v} onChange={(nv) => void save({ ...obj, [k]: nv })} />
              </div>
            ) : (
              <Field key={k} label={k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase())} className={typeof v === "string" && String(v).length > 60 ? "full" : ""}>
                <TextInput
                  value={String(v)}
                  onChange={(e) => setDraft(JSON.stringify({ ...obj, [k]: e.target.value }))}
                  onBlur={() => {
                    try {
                      void save(JSON.parse(draft));
                    } catch {
                      /* keep last good state */
                    }
                  }}
                />
              </Field>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
        <span className="admin-content-thumb"><Icon name="content" size={14} /></span>
        <div>
          <b style={{ fontSize: 12 }}>{item.label}</b>
          <small style={{ color: "var(--admin-muted)", display: "block", fontSize: 9.5 }}>{item.key} · JSON content</small>
        </div>
      </div>
      <Field label="Content (JSON)">
        <TextArea rows={6} value={draft} onChange={(e) => setDraft(e.target.value)} />
      </Field>
      <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
        <Btn size="sm" loading={saving} onClick={() => {
          try {
            void save(JSON.parse(draft));
          } catch {
            toast("Invalid JSON — fix the syntax before saving", "error");
          }
        }}>Save content</Btn>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// FAQs
// ------------------------------------------------------------

function FaqManager({ faqs, loading, refetch }: { faqs: Faq[]; loading: boolean; refetch: () => void }) {
  const mutate = useMutate("faqs", { onSuccess: refetch });
  const toast = useToast();
  const [editing, setEditing] = useState<Faq | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Faq | null>(null);

  return (
    <Card kicker="Support" title="FAQs" actions={<Btn size="sm" icon="plus" onClick={() => setEditing("new")}>Add FAQ</Btn>}>
      {loading ? <Skeleton rows={4} /> : faqs.length === 0 ? <EmptyState icon="help" title="No FAQs yet" /> : (
        <div className="admin-coupon-list">
          {faqs.map((f) => (
            <div className="admin-coupon" key={f.id}>
              <span className="admin-campaign-icon blue"><Icon name="help" size={14} /></span>
              <span><b>{f.question}</b><small>{f.category} · {f.answer.slice(0, 60)}…</small></span>
              <IconBtn icon="edit" label="Edit" onClick={() => setEditing(f)} />
              <IconBtn icon="trash" label="Delete" tone="danger" onClick={() => setConfirmDelete(f)} />
            </div>
          ))}
        </div>
      )}

      {editing && (
        <FaqForm faq={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); toast(editing === "new" ? "FAQ added" : "FAQ updated"); refetch(); }} />
      )}
      <Confirm
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && void mutate.remove(confirmDelete.id, "FAQ deleted").then((r) => r.ok && setConfirmDelete(null))}
        title="Delete FAQ?"
        loading={mutate.loading}
      />
    </Card>
  );
}

function FaqForm({ faq, onClose, onSaved }: { faq: Faq | null; onClose: () => void; onSaved: () => void }) {
  const mutate = useMutate("faqs");
  const toast = useToast();
  const [q, setQ] = useState(faq?.question ?? "");
  const [a, setA] = useState(faq?.answer ?? "");
  const [cat, setCat] = useState(faq?.category ?? "Orders");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim() || !a.trim()) return toast("Fill in both question and answer", "error");
    const res = faq ? await mutate.update(faq.id, { question: q, answer: a, category: cat }) : await mutate.create({ question: q, answer: a, category: cat, order: 99 });
    if (res.ok) onSaved();
  };

  return (
    <Modal open onClose={onClose} title={faq ? "Edit FAQ" : "Add FAQ"} footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn icon="check" onClick={submit} loading={mutate.loading}>Save</Btn></>}>
      <form onSubmit={submit} className="admin-form-stack">
        <Field label="Question" required><TextInput value={q} onChange={(e) => setQ(e.target.value)} /></Field>
        <Field label="Answer" required><TextArea rows={4} value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label="Category"><TextInput value={cat} onChange={(e) => setCat(e.target.value)} /></Field>
      </form>
    </Modal>
  );
}

// ------------------------------------------------------------
// Navigation menu builder
// ------------------------------------------------------------

function MenuManager({ menu, refetch }: { menu: MenuLink[]; refetch: () => void }) {
  const mutate = useMutate("menu", { onSuccess: refetch });
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState<MenuLink | null>(null);

  const move = async (link: MenuLink, dir: -1 | 1) => {
    const idx = menu.findIndex((m) => m.id === link.id);
    const swap = menu[idx + dir];
    if (!swap) return;
    const p1 = await mutate.run("PATCH", `/api/admin/menu/${link.id}`, { order: swap.order });
    const p2 = p1.ok ? await mutate.run("PATCH", `/api/admin/menu/${swap.id}`, { order: link.order }) : null;
    if (p2?.ok) {
      toast("Menu reordered");
      refetch();
    }
  };

  return (
    <Card kicker="Site" title="Navigation menu" actions={<Btn size="sm" icon="plus" onClick={() => toast("Add menu links from the storefront builder.", "info")}>Add link</Btn>}>
      <div className="admin-menu-editor">
        {menu.map((m, i) => (
          <div className="admin-menu-row" key={m.id}>
            <span className="admin-grip-icon"><Icon name="menu" size={13} /></span>
            <span className="admin-menu-number">{String(i + 1).padStart(2, "0")}</span>
            <span className="admin-menu-label"><b>{m.label}</b><small>{m.href}</small></span>
            <div className="admin-row-arrows">
              <button disabled={i === 0} onClick={() => void move(m, -1)} aria-label="Move up"><Icon name="chevronUp" size={13} /></button>
              <button disabled={i === menu.length - 1} onClick={() => void move(m, 1)} aria-label="Move down"><Icon name="chevronDown" size={13} /></button>
            </div>
            <IconBtn icon="trash" label="Remove" tone="danger" onClick={() => setConfirmDelete(m)} />
          </div>
        ))}
      </div>
      <Confirm
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && void mutate.remove(confirmDelete.id, "Menu link removed").then((r) => r.ok && setConfirmDelete(null))}
        title="Remove menu link?"
        loading={mutate.loading}
      />
    </Card>
  );
}
