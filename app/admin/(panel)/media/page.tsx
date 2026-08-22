"use client";

import { useMemo, useState } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, Confirm, Drawer, EmptyState, ErrorState, IconBtn, Modal, PageHeader,
  SearchInput, Skeleton, TimeAgo, useToast,
} from "@/components/admin/ui";
import type { MediaFile } from "@/lib/db/types";

export default function MediaPage() {
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 24 });
  const [folder, setFolder] = useState("");
  const [detail, setDetail] = useState<MediaFile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MediaFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const { data, loading, error, refetch } = useList<MediaFile>("media", { ...params, filters: folder ? { folder } : {} });
  const mutate = useMutate("media", { onSuccess: refetch });
  const toast = useToast();

  const folders = useMemo(() => {
    const all = new Set<string>();
    (data?.items ?? []).forEach((m) => all.add(m.folder));
    return [...all];
  }, [data]);

  const totalSize = useMemo(() => {
    const used = (data?.items ?? []).reduce((s, m) => s + (Number(m.size.replace(/[^0-9]/g, "")) || 0), 0);
    return used > 1000000 ? `${(used / 1000000).toFixed(1)} MB` : used > 1000 ? `${(used / 1000).toFixed(1)} MB` : `${used} KB`;
  }, [data]);

  const onUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    for (const f of Array.from(files).slice(0, 5)) {
      const fd = new FormData();
      fd.append("file", f);
      let url = "";
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Upload failed");
        url = body.url as string;
      } catch (err) {
        toast(err instanceof Error ? err.message : "Upload failed", "error");
        break;
      }
      const res = await mutate.create({
        name: f.name,
        url,
        folder: folder || "Uncategorized",
        type: f.type.startsWith("video") ? "video" : f.type.startsWith("image") ? "image" : "document",
        size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      }, "");
      if (!res.ok) break;
    }
    setUploading(false);
    toast("Files uploaded to the library");
    refetch();
  };

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Media library"
        sub="Images, videos and documents used across your storefront — organised, searchable and optimised."
        actions={
          <label className="admin-btn" style={{ display: "inline-flex", cursor: "pointer" }}>
            <Icon name="upload" size={15} />
            {uploading ? "Uploading…" : "Upload files"}
            <input type="file" multiple hidden onChange={(e) => void onUpload(e.target.files)} />
          </label>
        }
      />

      <div className="admin-media-layout">
        <Card className="admin-media-folders">
          <div className="admin-card-head"><h3 style={{ fontSize: 13 }}>Folders</h3></div>
          <button className={folder === "" ? "active" : ""} onClick={() => setFolder("")}>
            <Icon name="folder" size={14} /> All files <b>{data?.total ?? 0}</b>
          </button>
          {folders.map((f) => (
            <button key={f} className={folder === f ? "active" : ""} onClick={() => setFolder(f)}>
              <Icon name="folder" size={14} /> {f} <b>{(data?.items ?? []).filter((m) => m.folder === f).length}</b>
            </button>
          ))}
          <div className="admin-storage">
            <div><span>Storage used</span><b>{totalSize}<small> / 5 GB</small></b></div>
            <i><b style={{ width: `${Math.min(92, Math.max(4, folders.length * 12))}%` }} /></i>
            <small>Images are auto-optimised to WebP on upload</small>
          </div>
        </Card>

        <Card pad={false} bodyClassName="admin-media-content" style={{ padding: 0 }}>
          <div className="admin-toolbar" style={{ padding: "16px 18px 0" }}>
            <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search files…" />
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <IconBtn icon="grid" label="Grid view" />
              <IconBtn icon="filter" label="Filters" onClick={() => toast("Filter by type and date is available in the full library.", "info")} />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 18 }}><Skeleton rows={6} height={150} /></div>
          ) : error ? (
            <ErrorState message={error} retry={refetch} />
          ) : !data || data.items.length === 0 ? (
            <EmptyState icon="media" title="No files in this folder" body="Upload images, videos or documents to get started." />
          ) : (
            <div style={{ padding: 18 }}>
              <div className="admin-media-grid">
                {data.items.map((m) => (
                  <div className="admin-media-item" key={m.id}>
                    <div className="admin-media-image">
                      {m.type === "image" ? (
                        <img src={m.url} alt={m.name} loading="lazy" />
                      ) : m.type === "video" ? (
                        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "#101f30", color: "#fff" }}>
                          <Icon name="video" size={28} />
                        </div>
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "#eef4fb", color: "var(--admin-blue)" }}>
                          <Icon name="file" size={28} />
                        </div>
                      )}
                      <button className="admin-media-check" onClick={() => setDetail(m)} aria-label="View"><Icon name="eye" size={13} /></button>
                      <button className="admin-media-more" onClick={() => setConfirmDelete(m)} aria-label="Delete"><Icon name="trash" size={13} /></button>
                    </div>
                    <div>
                      <b>{m.name}</b>
                      <span>{m.size} · {m.type}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="admin-media-drop" onClick={() => document.getElementById("media-drop-input")?.click()}>
                <span className="admin-upload-icon"><Icon name="upload" size={16} /></span>
                <span><b>Drop files here to upload</b><small>or click to browse — JPG, PNG, WebP, MP4, PDF</small></span>
                <Icon name="arrowRight" size={14} />
              </div>
              <input id="media-drop-input" type="file" multiple hidden onChange={(e) => void onUpload(e.target.files)} />
            </div>
          )}
        </Card>
      </div>

      {detail && <MediaDetail file={detail} onClose={() => setDetail(null)} />}

      <Confirm
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && void mutate.remove(confirmDelete.id, "File deleted").then((r) => r.ok && setConfirmDelete(null))}
        title="Delete file?"
        body={confirmDelete ? `${confirmDelete.name} will be removed from the library and any pages using it.` : undefined}
        loading={mutate.loading}
      />
    </>
  );
}

function MediaDetail({ file, onClose }: { file: MediaFile; onClose: () => void }) {
  const toast = useToast();
  return (
    <Drawer
      open
      onClose={onClose}
      title={file.name}
      sub={<>{file.folder} · uploaded <TimeAgo iso={file.createdAt} /></>}
      footer={<><Btn variant="secondary" onClick={onClose}>Close</Btn><Btn icon="copy" onClick={() => void navigator.clipboard.writeText(file.url).then(() => toast("URL copied to clipboard"))}>Copy URL</Btn></>}
    >
      <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 18, background: "#f1f6fb" }}>
        {file.type === "image" ? (
          <img src={file.url} alt={file.name} style={{ width: "100%", maxHeight: 320, objectFit: "cover" }} />
        ) : (
          <div style={{ height: 220, display: "grid", placeItems: "center", color: "var(--admin-muted)" }}>
            <Icon name={file.type === "video" ? "video" : "file"} size={40} />
          </div>
        )}
      </div>
      <div className="admin-form-grid">
        <div><small style={{ color: "var(--admin-muted)", fontSize: 9.5, fontWeight: 700, display: "block" }}>Size</small><b>{file.size}</b></div>
        <div><small style={{ color: "var(--admin-muted)", fontSize: 9.5, fontWeight: 700, display: "block" }}>Type</small><b>{file.type}</b></div>
        <div><small style={{ color: "var(--admin-muted)", fontSize: 9.5, fontWeight: 700, display: "block" }}>Dimensions</small><b>{file.width ?? "—"} × {file.height ?? "—"}</b></div>
        <div><small style={{ color: "var(--admin-muted)", fontSize: 9.5, fontWeight: 700, display: "block" }}>Folder</small><b>{file.folder}</b></div>
      </div>
      <div className="admin-detail-block">
        <div className="admin-eyebrow" style={{ marginBottom: 8 }}>File URL</div>
        <code style={{ fontSize: 10.5, wordBreak: "break-all", color: "var(--admin-blue)", background: "var(--admin-blue-soft)", padding: "10px 12px", borderRadius: 10, display: "block" }}>{file.url}</code>
      </div>
      <div className="admin-settings-note">
        <Icon name="zap" size={16} />
        <span><b>Auto-optimised</b><small>This image is served as WebP/AVIF with responsive sizes.</small></span>
      </div>
    </Drawer>
  );
}
