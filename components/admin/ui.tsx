"use client";

// ============================================================
// MEDORA CONTROL CENTRE — UI primitives
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "./icons";
import { initials, statusMeta, TONES, timeAgo } from "./format";

// ------------------------------------------------------------
// Toasts
// ------------------------------------------------------------

type ToastItem = { id: number; msg: string; tone: "success" | "error" | "info" };
const ToastCtx = createContext<(msg: string, tone?: ToastItem["tone"]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const toast = useCallback((msg: string, tone: ToastItem["tone"] = "success") => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="admin-toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`admin-toast ${t.tone === "error" ? "err" : t.tone === "info" ? "info" : ""}`}>
            <span className="admin-toast-icon">
              <Icon name={t.tone === "error" ? "alert" : t.tone === "info" ? "info" : "check"} size={14} sw={2.4} />
            </span>
            <span>{t.msg}</span>
            <button className="admin-toast-close" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
              <Icon name="x" size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

// ------------------------------------------------------------
// Buttons
// ------------------------------------------------------------

export function Btn({
  children,
  variant = "primary",
  icon,
  size,
  loading,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  icon?: IconName;
  size?: "sm" | "md";
  loading?: boolean;
}) {
  return (
    <button
      className={`admin-btn ${variant === "secondary" ? "secondary" : variant === "quiet" ? "quiet" : variant === "danger" ? "danger" : ""} ${size === "sm" ? "sm" : ""} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <span className="btn-spin" /> : icon ? <Icon name={icon} size={15} /> : null}
      {children}
    </button>
  );
}

export function IconBtn({
  icon,
  label,
  onClick,
  disabled,
  tone,
}: {
  icon: IconName;
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      className={`admin-icon-btn ${tone === "danger" ? "danger" : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} size={15} />
    </button>
  );
}

// ------------------------------------------------------------
// Cards & KPI
// ------------------------------------------------------------

export function Card({
  children,
  title,
  kicker,
  sub,
  actions,
  className = "",
  bodyClassName = "",
  pad = true,
  style,
}: {
  children: ReactNode;
  title?: string;
  kicker?: string;
  sub?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  pad?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div className={`admin-card ${className}`} style={style}>
      {(title || actions) && (
        <div className="admin-card-head">
          <div>
            {kicker && <div className="admin-card-kicker">{kicker}</div>}
            {title && <h3>{title}</h3>}
            {sub && <p>{sub}</p>}
          </div>
          {actions && <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>{actions}</div>}
        </div>
      )}
      <div className={bodyClassName} style={pad ? undefined : { padding: 0 }}>
        {children}
      </div>
    </div>
  );
}

export function Kpi({
  label,
  value,
  icon,
  tone = "blue",
  foot,
  delta,
  progress,
  progressLabel,
}: {
  label: string;
  value: ReactNode;
  icon: IconName;
  tone?: (typeof TONES)[number];
  foot?: ReactNode;
  delta?: number;
  progress?: number;
  progressLabel?: string;
}) {
  return (
    <div className={`admin-kpi ${tone === "muted" ? "blue" : tone}`}>
      <div className="admin-kpi-top">
        <span>{label}</span>
        <span className="admin-kpi-icon">
          <Icon name={icon} size={15} />
        </span>
      </div>
      <strong>{value}</strong>
      {delta !== undefined && (
        <div className="admin-kpi-foot">
          <b style={{ color: delta >= 0 ? "var(--admin-green)" : "var(--admin-red)" }}>
            <Icon name={delta >= 0 ? "trendUp" : "trendDown"} size={12} /> {Math.abs(delta)}%
          </b>
          <span>vs last period</span>
        </div>
      )}
      {progress !== undefined && (
        <>
          <div className="admin-progress">
            <i style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
          <div className="admin-kpi-foot" style={{ marginTop: 7 }}>
            <b style={{ color: "var(--admin-ink)" }}>{progressLabel}</b>
          </div>
        </>
      )}
      {foot && <div className="admin-kpi-foot">{foot}</div>}
    </div>
  );
}

// ------------------------------------------------------------
// Status & badges
// ------------------------------------------------------------

export function Status({ value, label }: { value: string; label?: string }) {
  const meta = statusMeta(value);
  return (
    <span className={`admin-status ${meta.tone}`}>
      <i /> {label ?? meta.label}
    </span>
  );
}

export function StockBadge({ stock, alert }: { stock: number; alert: number }) {
  if (stock === 0) return <span className="admin-stock out"><i /> Out of stock</span>;
  if (stock <= alert) return <span className="admin-stock low"><i /> Low · {stock}</span>;
  return <span className="admin-stock"><i /> {stock} in stock</span>;
}

export function Avatar({
  name,
  src,
  size = "md",
  tone,
}: {
  name: string;
  src?: string;
  size?: "sm" | "md" | "large" | "xlarge";
  tone?: string;
}) {
  if (src) return <img src={src} alt={name} className={`admin-avatar ${size}`} style={{ objectFit: "cover" }} />;
  return <span className={`admin-avatar ${tone ?? "blue"} ${size}`}>{initials(name)}</span>;
}

// ------------------------------------------------------------
// Fields
// ------------------------------------------------------------

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className = "",
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`admin-field ${className}`}>
      {label && (
        <span>
          {label} {required && <em style={{ color: "var(--admin-red)", fontStyle: "normal" }}>*</em>}
        </span>
      )}
      {children}
      {error ? (
        <small style={{ color: "var(--admin-red)", fontWeight: 700 }}>{error}</small>
      ) : hint ? (
        <small>{hint}</small>
      ) : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} />;
}

export function Select({ children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest}>{children}</select>;
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`admin-toggle !p-[2px] !rounded-full ${on ? "on" : ""}`}
      onClick={() => onChange(!on)}
    >
      <span />
    </button>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 15, height: 15, accentColor: "var(--admin-blue)", cursor: "pointer" }}
      />
      {label && <span style={{ fontSize: 11.5, fontWeight: 700 }}>{label}</span>}
    </label>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}) {
  return (
    <div className="admin-search-field" style={style}>
      <Icon name="search" size={14} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && (
        <button onClick={() => onChange("")} style={{ color: "var(--admin-muted)" }}>
          <Icon name="x" size={13} />
        </button>
      )}
    </div>
  );
}

export function FilterBtn({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      className="admin-filter-btn"
      onClick={onClick}
      style={active ? { borderColor: "var(--admin-blue)", color: "var(--admin-blue)", background: "var(--admin-blue-soft)" } : undefined}
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------
// Tabs
// ------------------------------------------------------------

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="admin-content-tabs" style={{ flexWrap: "wrap" }}>
      {tabs.map((t) => (
        <button key={t.id} className={active === t.id ? "active" : ""} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined && <b>{t.count}</b>}
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// Dropdown
// ------------------------------------------------------------

export function Dropdown({
  trigger,
  children,
  align = "right",
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className="admin-menu-pop"
          style={{ right: align === "right" ? 0 : undefined, left: align === "left" ? 0 : undefined }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon?: IconName;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      className={`admin-menu-item ${danger ? "danger" : ""}`}
      onClick={() => {
        onClick?.();
      }}
    >
      {icon && <Icon name={icon} size={14} />}
      {label}
    </button>
  );
}

// ------------------------------------------------------------
// Modal, Drawer, Confirm
// ------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  wide,
  bare,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  sub?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  bare?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="admin-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal" style={wide ? { width: "min(960px, 100%)" } : undefined}>
        {!bare && (
          <div className="admin-modal-head">
            <div>
              {title && <h2>{title}</h2>}
              {sub && <p>{sub}</p>}
            </div>
            <IconBtn icon="x" label="Close" onClick={onClose} />
          </div>
        )}
        {bare && (
          <div style={{ position: "absolute", top: 14, right: 14, zIndex: 5 }}>
            <IconBtn icon="x" label="Close" onClick={onClose} />
          </div>
        )}
        <div className="admin-modal-body">{children}</div>
        {footer && <div className="admin-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  sub?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="admin-drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-drawer">
        <div className="admin-drawer-head">
          <div>
            {title && <h2>{title}</h2>}
            {sub && <p>{sub}</p>}
          </div>
          <IconBtn icon="x" label="Close" onClick={onClose} />
        </div>
        <div className="admin-drawer-body">{children}</div>
        {footer && <div className="admin-drawer-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  body = "This action cannot be undone.",
  confirmLabel = "Delete",
  tone = "danger",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  body?: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} bare>
      <div style={{ textAlign: "center", padding: "10px 6px" }}>
        <div
          style={{
            width: 54, height: 54, borderRadius: 16, margin: "0 auto 16px", display: "grid", placeItems: "center",
            background: tone === "danger" ? "var(--admin-red-soft)" : "var(--admin-blue-soft)",
            color: tone === "danger" ? "var(--admin-red)" : "var(--admin-blue)",
          }}
        >
          <Icon name={tone === "danger" ? "alertTriangle" : "info"} size={26} />
        </div>
        <h3 style={{ fontFamily: "var(--ff-d)", fontSize: 21, margin: "0 0 6px" }}>{title}</h3>
        <p style={{ color: "var(--admin-muted)", fontSize: 12, margin: "0 auto", maxWidth: 320 }}>{body}</p>
      </div>
      <div className="admin-modal-foot" style={{ justifyContent: "center", paddingTop: 20 }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Btn>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------
// Table primitives
// ------------------------------------------------------------

export function Table({
  head,
  children,
  minWidth = 760,
  empty,
  onRowClick,
}: {
  head: ReactNode;
  children: ReactNode;
  minWidth?: number;
  empty?: ReactNode;
  onRowClick?: () => void;
}) {
  return (
    <div className="admin-table-scroll">
      <table className="admin-table" style={{ minWidth }}>
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody onClick={onRowClick}>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Th({ children, align }: { children?: ReactNode; align?: "right" | "left" }) {
  return <th style={align === "right" ? { textAlign: "right" } : undefined}>{children}</th>;
}

export function SortableTh({
  children,
  align,
  sortKey,
  sort,
  onSort,
}: {
  children?: ReactNode;
  align?: "right" | "left";
  sortKey: string;
  sort?: { key: string; dir: "asc" | "desc" } | null;
  onSort: (key: string) => void;
}) {
  const active = sort?.key === sortKey;
  return (
    <th
      className={`admin-th-sortable ${active ? "active" : ""}`}
      onClick={() => onSort(sortKey)}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      style={align === "right" ? { textAlign: "right" } : undefined}
    >
      <span className="admin-th-inner">
        {children}
        <span className="admin-th-arrows">
          <i className={active && sort.dir === "asc" ? "up on" : "up"}>▲</i>
          <i className={active && sort.dir === "desc" ? "down on" : "down"}>▼</i>
        </span>
      </span>
    </th>
  );
}

export function Td({ children, align, className = "" }: { children?: ReactNode; align?: "right" | "left"; className?: string }) {
  return <td className={className} style={align === "right" ? { textAlign: "right" } : undefined}>{children}</td>;
}

// ------------------------------------------------------------
// Pagination
// ------------------------------------------------------------

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );
  const withGaps: (number | "...")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) withGaps.push("...");
    withGaps.push(p);
    prev = p;
  }
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="admin-pagination">
      <span className="admin-pagination-meta">
        Showing <b>{from}–{to}</b> of <b>{total}</b>
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <IconBtn icon="chevronLeft" label="Previous page" onClick={() => onChange(page - 1)} disabled={page <= 1} />
        {withGaps.map((p, i) =>
          p === "..." ? (
            <span key={`g${i}`} style={{ color: "var(--admin-muted)", fontSize: 11, padding: "0 2px" }}>…</span>
          ) : (
            <button
              key={p}
              className={`admin-page-btn ${p === page ? "active" : ""}`}
              onClick={() => onChange(p as number)}
            >
              {p}
            </button>
          )
        )}
        <IconBtn icon="chevronRight" label="Next page" onClick={() => onChange(page + 1)} disabled={page >= totalPages} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// States: loading / empty / error
// ------------------------------------------------------------

export function Skeleton({ rows = 6, height = 52 }: { rows?: number; height?: number }) {
  return (
    <div className="admin-skeleton-list">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="admin-skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export function EmptyState({
  icon = "box",
  title = "Nothing here yet",
  body,
  action,
}: {
  icon?: IconName;
  title?: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-empty">
      <div className="admin-empty-icon">
        <Icon name={icon} size={22} />
      </div>
      <h3>{title}</h3>
      <p>{body ?? "Try adjusting your search or filters."}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, retry }: { message?: string; retry?: () => void }) {
  return (
    <div className="admin-empty">
      <div className="admin-empty-icon" style={{ background: "var(--admin-red-soft)", color: "var(--admin-red)" }}>
        <Icon name="alert" size={22} />
      </div>
      <h3>Something went wrong</h3>
      <p>{message ?? "We couldn't load this data. Please try again."}</p>
      {retry && <Btn variant="secondary" icon="refresh" onClick={retry}>Try again</Btn>}
    </div>
  );
}

// ------------------------------------------------------------
// Page header
// ------------------------------------------------------------

export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="admin-section-header">
      <div>
        {eyebrow && <div className="admin-eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="admin-header-actions">{actions}</div>}
    </div>
  );
}

export function StatStrip({ items }: { items: { label: string; value: ReactNode; delta?: string }[] }) {
  return (
    <div className="admin-stat-strip">
      {items.map((it, i) => (
        <div key={i}>
          <span>{it.label}</span>
          <b>{it.value}</b>
          {it.delta && <small>{it.delta}</small>}
        </div>
      ))}
    </div>
  );
}

export function TimeAgo({ iso }: { iso: string | null | undefined }) {
  return <>{timeAgo(iso)}</>;
}
