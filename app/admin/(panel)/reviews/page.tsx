"use client";

import { useState } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, Confirm, Drawer, EmptyState, ErrorState, IconBtn, Modal, PageHeader,
  Pagination, SearchInput, Select, Skeleton, Status, Table, Td, TextArea, Th, TimeAgo, useToast,
} from "@/components/admin/ui";
import { dateShort } from "@/components/admin/format";
import type { Review } from "@/lib/db/types";

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: "var(--admin-orange)", letterSpacing: 1, fontSize: 12 }}>
      {"★".repeat(n)}
      <span style={{ color: "#dbe4ee" }}>{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 10 });
  const [replying, setReplying] = useState<Review | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);
  const { data, loading, error, refetch } = useList<Review>("reviews", params);
  const mutate = useMutate("reviews", { onSuccess: refetch });
  const toast = useToast();

  const setStatus = async (r: Review, status: string) => {
    await mutate.update(r.id, { status }, `Review ${status}`);
  };

  const spamScore = (r: Review) => r.spamScore;

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Reviews"
        sub="Moderate customer reviews — approve, reject, reply, and keep spam out of your product pages."
        actions={
          <Btn variant="secondary" icon="spark" onClick={() => setParams({ page: 1, pageSize: 10, filters: { reported: true } })}>
            Show reported only
          </Btn>
        }
      />

      <div className="admin-stat-strip">
        <div><span>Total reviews</span><b>{data?.total ?? 0}</b><small>across all products</small></div>
        <div><span>Pending</span><b>{(data?.items ?? []).filter((r) => r.status === "pending").length}</b><small>awaiting approval</small></div>
        <div><span>Reported</span><b>{(data?.items ?? []).filter((r) => r.reported).length}</b><small>flagged by customers</small></div>
        <div><span>High spam risk</span><b>{(data?.items ?? []).filter((r) => r.spamScore > 55).length}</b><small>auto-detected</small></div>
      </div>

      <Card pad={false} bodyClassName="admin-table-card">
        <div className="admin-toolbar">
          <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search reviews or customers…" />
          <Select className="admin-select" value={(params.filters?.status as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, status: e.target.value }, page: 1 }))}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
          <Select className="admin-select" value={(params.filters?.rating as string) ?? ""} onChange={(e) => setParams((p) => ({ ...p, filters: { ...p.filters, rating: e.target.value }, page: 1 }))}>
            <option value="">All ratings</option>
            <option value="5">★★★★★ (5)</option>
            <option value="4">★★★★ (4)</option>
            <option value="3">★★★ (3)</option>
            <option value="2">★★ (2)</option>
            <option value="1">★ (1)</option>
          </Select>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <Btn variant="secondary" icon="check" onClick={() => {
              const pending = data?.items.filter((r) => r.status === "pending").map((r) => r.id) ?? [];
              if (pending.length) void mutate.bulk("update", pending, { status: "approved" }, `Approved ${pending.length} reviews`);
              else toast("Nothing pending on this page", "info");
            }}>Approve page</Btn>
          </div>
        </div>

        {loading ? (
          <Skeleton rows={8} />
        ) : error ? (
          <ErrorState message={error} retry={refetch} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon="reviews" title="No reviews found" body="Try clearing your filters." />
        ) : (
          <>
            <Table minWidth={1000} head={<><Th>Product</Th><Th>Customer</Th><Th>Rating</Th><Th>Review</Th><Th>Moderation</Th><Th>Date</Th><Th /></>}>
              {data.items.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <div className="admin-table-product">
                      <img src={r.productImage} alt="" />
                      <span><b>{r.productName}</b><small>#{r.productId}</small></span>
                    </div>
                  </Td>
                  <Td><b>{r.customerName}</b>{r.verifiedPurchase && <span className="admin-payment">✓ verified purchase</span>}</Td>
                  <Td><Stars n={r.rating} /></Td>
                  <Td>
                    <b style={{ display: "block" }}>{r.title}</b>
                    <span className="admin-muted-cell" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: 260 }}>{r.body}</span>
                    {r.spamScore > 55 && <span className="admin-coupon-code red" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}><Icon name="alert" size={10} /> Spam risk {r.spamScore}%</span>}
                    {r.reported && <span className="admin-coupon-code orange" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, marginLeft: 4 }}><Icon name="alertTriangle" size={10} /> Reported</span>}
                  </Td>
                  <Td>
                    <Status value={r.status} />
                    {r.reply && <span className="admin-payment">has reply</span>}
                  </Td>
                  <Td className="admin-muted-cell"><TimeAgo iso={r.createdAt} /></Td>
                  <Td>
                    <span style={{ display: "inline-flex", gap: 5 }}>
                      {r.status !== "approved" && <IconBtn icon="check" label="Approve" onClick={() => void setStatus(r, "approved")} />}
                      {r.status !== "rejected" && <IconBtn icon="ban" label="Reject" tone="danger" onClick={() => void setStatus(r, "rejected")} />}
                      <IconBtn icon="reply" label="Reply" onClick={() => setReplying(r)} />
                      <IconBtn icon="trash" label="Delete" tone="danger" onClick={() => setConfirmDelete(r)} />
                    </span>
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(p) => setParams((x) => ({ ...x, page: p }))} />
          </>
        )}
      </Card>

      {replying && (
        <ReplyModal review={replying} onClose={() => setReplying(null)} onSent={() => { setReplying(null); refetch(); }} />
      )}

      <Confirm
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && void mutate.remove(confirmDelete.id, "Review deleted").then((r) => r.ok && setConfirmDelete(null))}
        title="Delete review?"
        body="This permanently removes the review from the storefront."
        loading={mutate.loading}
      />
    </>
  );
}

function ReplyModal({ review, onClose, onSent }: { review: Review; onClose: () => void; onSent: () => void }) {
  const mutate = useMutate("reviews");
  const toast = useToast();
  const [body, setBody] = useState(review.reply ?? "");

  const send = async () => {
    if (!body.trim()) return toast("Write a reply first", "error");
    const res = await mutate.update(review.id, { reply: body, status: "approved" }, "Reply published");
    if (res.ok) onSent();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Reply to review"
      sub={`${review.customerName} · ${review.productName}`}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn icon="send" onClick={() => void send()} loading={mutate.loading}>Publish reply</Btn></>}
    >
      <div className="admin-card" style={{ background: "var(--admin-blue-soft)", border: "none", padding: 14, marginBottom: 14 }}>
        <Stars n={review.rating} />
        <b style={{ display: "block", fontSize: 12, margin: "6px 0 3px" }}>{review.title}</b>
        <p style={{ fontSize: 11.5, color: "var(--admin-ink-soft)", margin: 0, lineHeight: 1.5 }}>{review.body}</p>
      </div>
      <div className="admin-form-section">
        <div className="admin-eyebrow">Your reply</div>
        <TextArea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Thank the customer and address their feedback…" />
        <small style={{ color: "var(--admin-muted)" }}>Replies are public and mark the review as approved.</small>
      </div>
    </Modal>
  );
}
