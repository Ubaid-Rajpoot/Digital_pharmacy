"use client";

import { useState } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, Confirm, Drawer, EmptyState, ErrorState, Field, IconBtn, Modal, PageHeader,
  Pagination, SearchInput, Select, Skeleton, Status, Table, Td, TextArea, TextInput, Th, TimeAgo, useToast,
} from "@/components/admin/ui";
import { dateTime } from "@/components/admin/format";
import type { SupportTicket } from "@/lib/db/types";

const KIND_ICON: Record<string, { icon: "chat" | "mail" | "support"; label: string }> = {
  message: { icon: "mail", label: "Contact message" },
  ticket: { icon: "support", label: "Ticket" },
  chat: { icon: "chat", label: "Live chat" },
};

export default function SupportPage() {
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 10 });
  const [detail, setDetail] = useState<SupportTicket | null>(null);
  const [confirmClose, setConfirmClose] = useState<SupportTicket | null>(null);
  const { data, loading, error, refetch } = useList<SupportTicket>("support", params);
  const mutate = useMutate("support", { onSuccess: refetch });
  const toast = useToast();

  return (
    <>
      <PageHeader
        eyebrow="Service"
        title="Support center"
        sub="Contact messages, support tickets and live-chat requests from your customers."
        actions={<Btn variant="secondary" icon="refresh" onClick={refetch}>Refresh inbox</Btn>}
      />

      <div className="admin-stat-strip">
        <div><span>Open items</span><b>{(data?.items ?? []).filter((s) => ["new", "open", "pending"].includes(s.status)).length}</b><small>needs response</small></div>
        <div><span>Unassigned</span><b>{(data?.items ?? []).filter((s) => s.assignee === "Unassigned").length}</b><small>claim them now</small></div>
        <div><span>Urgent / high</span><b>{(data?.items ?? []).filter((s) => ["high", "urgent"].includes(s.priority)).length}</b><small>escalated</small></div>
        <div><span>Resolved</span><b>{(data?.items ?? []).filter((s) => ["resolved", "closed"].includes(s.status)).length}</b><small>this page</small></div>
      </div>

      <Card pad={false} bodyClassName="admin-table-card">
        <div className="admin-toolbar">
          <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search messages, tickets, customers…" />
          <Select className="admin-select" value={(params.filters?.status as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, status: e.target.value }, page: 1 }))}>
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
          <Select className="admin-select" value={(params.filters?.priority as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, priority: e.target.value }, page: 1 }))}>
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
          <Select className="admin-select" value={(params.filters?.kind as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, kind: e.target.value }, page: 1 }))}>
            <option value="">All channels</option>
            <option value="message">Contact messages</option>
            <option value="ticket">Tickets</option>
            <option value="chat">Live chat</option>
          </Select>
        </div>

        {loading ? <Skeleton rows={8} /> : error ? <ErrorState message={error} retry={refetch} /> : !data || data.items.length === 0 ? (
          <EmptyState icon="support" title="Inbox zero 🎉" body="No support items match your filters." />
        ) : (
          <>
            <Table minWidth={940} head={<><Th>Item</Th><Th>Customer</Th><Th>Priority</Th><Th>Assignee</Th><Th>Status</Th><Th>Received</Th><Th /></>}>
              {data.items.map((s) => (
                <tr key={s.id} onClick={() => setDetail(s)}>
                  <Td>
                    <div className="admin-table-product">
                      <span className="admin-content-thumb"><Icon name={KIND_ICON[s.kind]?.icon ?? "support"} size={15} /></span>
                      <span><b>{s.subject}</b><small>{KIND_ICON[s.kind]?.label ?? s.kind} · {s.message.slice(0, 48)}…</small></span>
                    </div>
                  </Td>
                  <Td><b>{s.customerName}</b><span className="admin-payment">{s.customerEmail}</span></Td>
                  <Td><Status value={s.priority} /></Td>
                  <Td>{s.assignee}</Td>
                  <Td><Status value={s.status} /></Td>
                  <Td className="admin-muted-cell"><TimeAgo iso={s.createdAt} /></Td>
                  <Td>
                    <span style={{ display: "inline-flex", gap: 5 }}>
                      <IconBtn icon="reply" label="Reply / open" onClick={(e) => { e.stopPropagation(); setDetail(s); }} />
                      {s.status !== "closed" && <IconBtn icon="check" label="Mark resolved" onClick={(e) => { e.stopPropagation(); setConfirmClose(s); }} />}
                    </span>
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(p) => setParams((x) => ({ ...x, page: p }))} />
          </>
        )}
      </Card>

      {detail && <TicketDrawer ticket={detail} onClose={() => setDetail(null)} onChanged={refetch} onResolve={() => setConfirmClose(detail)} />}

      <Confirm
        open={confirmClose !== null}
        onClose={() => setConfirmClose(null)}
        onConfirm={() => confirmClose && void mutate.update(confirmClose.id, { status: "resolved" }, "Ticket resolved").then((r) => r.ok && setConfirmClose(null))}
        title="Mark as resolved?"
        confirmLabel="Resolve"
        tone="primary"
        loading={mutate.loading}
      />
    </>
  );
}

function TicketDrawer({ ticket, onClose, onChanged, onResolve }: { ticket: SupportTicket; onClose: () => void; onChanged: () => void; onResolve: () => void }) {
  const mutate = useMutate("support", { onSuccess: onChanged });
  const toast = useToast();
  const [reply, setReply] = useState("");
  const [assignee, setAssignee] = useState(ticket.assignee === "Unassigned" ? "Sneha K." : ticket.assignee);

  const send = async () => {
    if (!reply.trim()) return toast("Write a reply first", "error");
    const replies = [...ticket.replies, { by: assignee, at: new Date().toISOString(), body: reply }];
    const res = await mutate.update(ticket.id, { replies, status: "open", assignee }, "Reply sent to customer");
    if (res.ok) setReply("");
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={ticket.subject}
      sub={<>{KIND_ICON[ticket.kind]?.label ?? ticket.kind} · {ticket.customerName}</>}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Close</Btn>
          <Btn variant="secondary" icon="check" onClick={onResolve}>Resolve</Btn>
          <Btn icon="send" onClick={() => void send()} loading={mutate.loading}>Send reply</Btn>
        </>
      }
    >
      <div className="admin-order-status-line" style={{ flexWrap: "wrap" }}>
        <Status value={ticket.priority} />
        <Status value={ticket.status} />
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Icon name="clock" size={13} /> {dateTime(ticket.createdAt)}</span>
      </div>

      <div className="admin-form-grid" style={{ marginBottom: 18 }}>
        <Field label="Customer"><b>{ticket.customerName}</b></Field>
        <Field label="Email"><b>{ticket.customerEmail}</b></Field>
        <Field label="Assignee" className="full">
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option>Sneha K.</option>
            <option>Amit B.</option>
            <option>Priya N.</option>
            <option>Dr. Patil</option>
          </Select>
        </Field>
      </div>

      <div className="admin-chat-summary" style={{ borderTop: 0, paddingTop: 0 }}>
        <span className="admin-quick-icon blue"><Icon name="mail" size={15} /></span>
        <span><b>Original message</b><small>{dateTime(ticket.createdAt)}</small></span>
      </div>
      <p style={{ fontSize: 12, color: "var(--admin-ink-soft)", lineHeight: 1.6, background: "var(--admin-blue-soft)", borderRadius: 12, padding: 13, margin: "0 0 18px" }}>{ticket.message}</p>

      <div className="admin-eyebrow" style={{ marginBottom: 12 }}>Conversation ({ticket.replies.length + 1})</div>
      <div className="admin-form-stack" style={{ marginBottom: 16 }}>
        {ticket.replies.map((r, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <b style={{ fontSize: 11 }}>{r.by}</b>
              <small style={{ color: "var(--admin-muted)", fontSize: 9.5 }}>{dateTime(r.at)}</small>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--admin-ink-soft)", background: "#f7fafd", borderRadius: 11, padding: "10px 12px", margin: 0, lineHeight: 1.55 }}>{r.body}</p>
          </div>
        ))}
      </div>

      <Field label="Write a reply">
        <TextArea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to the customer…" />
      </Field>
    </Drawer>
  );
}
