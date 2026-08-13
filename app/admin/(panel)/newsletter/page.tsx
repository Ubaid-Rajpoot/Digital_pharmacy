"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { exportResource, useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, EmptyState, ErrorState, Field, Modal, PageHeader, Pagination, SearchInput,
  Select, Skeleton, Status, Table, Td, TextArea, TextInput, Th, TimeAgo, useToast,
} from "@/components/admin/ui";
import { dateShort } from "@/components/admin/format";
import type { Subscriber } from "@/lib/db/types";

export default function NewsletterPage() {
  const searchParams = useSearchParams();
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 10 });
  const [compose, setCompose] = useState(searchParams.get("compose") === "1");
  const { data, loading, error, refetch } = useList<Subscriber>("subscribers", params);
  const mutate = useMutate("subscribers", { onSuccess: refetch });
  const toast = useToast();

  const subscribed = useMemo(() => (data?.items ?? []).filter((s) => s.status === "subscribed"), [data]);
  const emails = subscribed.map((s) => s.email);

  const exportCsv = () => {
    if (!emails.length) return toast("No active subscribers to export", "info");
    const blob = new Blob(["email,name,source,joined\n" + subscribed.map((s) => `${s.email},${s.name ?? ""},${s.source},${dateShort(s.joinedAt)}`).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medora-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        eyebrow="Growth"
        title="Newsletter"
        sub="Grow your list, export email addresses and send campaigns — all in one place."
        actions={
          <>
            <Btn variant="secondary" icon="download" onClick={exportCsv}>Export emails</Btn>
            <Btn icon="send" onClick={() => setCompose(true)}>Compose campaign</Btn>
          </>
        }
      />

      <div className="admin-stat-strip">
        <div><span>Subscribers</span><b>{data?.total ?? 0}</b><small>all time</small></div>
        <div><span>Active</span><b>{subscribed.length}</b><small>opted-in emails</small></div>
        <div><span>Unsubscribed</span><b>{(data?.items ?? []).filter((s) => s.status === "unsubscribed").length}</b><small>churn this list</small></div>
        <div><span>Campaigns sent</span><b>{(data?.items ?? []).reduce((s, x) => s + x.campaigns, 0)}</b><small>across all subscribers</small></div>
      </div>

      <Card pad={false} bodyClassName="admin-table-card">
        <div className="admin-toolbar">
          <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search emails or names…" />
          <Select className="admin-select" value={(params.filters?.status as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, status: e.target.value }, page: 1 }))}>
            <option value="">All statuses</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
          </Select>
          <div style={{ marginLeft: "auto" }}>
            <Btn variant="secondary" size="sm" icon="download" onClick={() => void exportResource("subscribers", "csv", params).catch(() => toast("Export failed", "error"))}>Full CSV</Btn>
          </div>
        </div>

        {loading ? <Skeleton rows={8} /> : error ? <ErrorState message={error} retry={refetch} /> : !data || data.items.length === 0 ? (
          <EmptyState icon="newsletter" title="No subscribers yet" body="Subscribers from the homepage form and checkout appear here." />
        ) : (
          <>
            <Table minWidth={860} head={<><Th>Email</Th><Th>Source</Th><Th>Status</Th><Th>Campaigns</Th><Th>Joined</Th><Th /></>}>
              {data.items.map((s) => (
                <tr key={s.id}>
                  <Td>
                    <div className="admin-table-product">
                      <span className="admin-avatar green">{s.email.slice(0, 2).toUpperCase()}</span>
                      <span><b>{s.email}</b><small>{s.name ?? "—"}</small></span>
                    </div>
                  </Td>
                  <Td><span className="admin-category-tag">{s.source}</span></Td>
                  <Td><Status value={s.status} /></Td>
                  <Td>{s.campaigns} emails</Td>
                  <Td className="admin-muted-cell"><TimeAgo iso={s.joinedAt} /></Td>
                  <Td>
                    <span style={{ display: "inline-flex", gap: 5 }}>
                      <Btn size="sm" variant={s.status === "subscribed" ? "secondary" : "primary"} onClick={() => void mutate.update(s.id, { status: s.status === "subscribed" ? "unsubscribed" : "subscribed" }, s.status === "subscribed" ? "Unsubscribed" : "Resubscribed")}>
                        {s.status === "subscribed" ? "Unsubscribe" : "Resubscribe"}
                      </Btn>
                    </span>
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(p) => setParams((x) => ({ ...x, page: p }))} />
          </>
        )}
      </Card>

      {compose && <CampaignModal recipients={emails.length} onClose={() => setCompose(false)} />}
    </>
  );
}

function CampaignModal({ recipients, onClose }: { recipients: number; onClose: () => void }) {
  const toast = useToast();
  const [subject, setSubject] = useState("");
  const [preview, setPreview] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return toast("Add a subject and body first", "error");
    setSending(true);
    await new Promise((r) => setTimeout(r, 1400)); // simulated send queue
    setSending(false);
    setSent(true);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={sent ? "Campaign queued 🎉" : "Compose newsletter"}
      sub={sent ? undefined : `Will be delivered to ${recipients} active subscribers`}
      wide
      footer={
        sent ? (
          <Btn onClick={onClose}>Done</Btn>
        ) : (
          <>
            <Btn variant="secondary" onClick={onClose}>Save draft</Btn>
            <Btn icon="send" onClick={send} loading={sending}>Send campaign</Btn>
          </>
        )
      }
    >
      {sent ? (
        <div className="admin-empty">
          <div className="admin-empty-icon" style={{ background: "var(--admin-green-soft)", color: "var(--admin-green)" }}><Icon name="checkCircle" size={22} /></div>
          <h3>Campaign queued</h3>
          <p>{`"${subject}" is in the send queue for ${recipients} subscribers. You'll get a report when it finishes.`}</p>
        </div>
      ) : (
        <form onSubmit={send} className="admin-form-stack">
          <div className="admin-form-grid">
            <Field label="Subject line" className="full">
              <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="New arrivals in vitamins — up to 30% off" />
            </Field>
            <Field label="Preview text" className="full" hint="Shown next to the subject in most inboxes">
              <TextInput value={preview} onChange={(e) => setPreview(e.target.value)} placeholder="Immunity bundles from India's best brands…" />
            </Field>
            <Field label="Audience">
              <Select defaultValue="all">
                <option value="all">All active subscribers ({recipients})</option>
                <option value="vitamins">Vitamins & immunity segment</option>
                <option value="diabetes">Diabetes care segment</option>
                <option value="vip">Platinum customers</option>
              </Select>
            </Field>
            <Field label="Schedule">
              <Select defaultValue="now">
                <option value="now">Send now</option>
                <option value="later">Schedule for later</option>
              </Select>
            </Field>
          </div>
          <Field label="Email body">
            <TextArea rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your campaign… supports text, links and our drag-and-drop blocks in the full editor." />
          </Field>
        </form>
      )}
    </Modal>
  );
}
