"use client";

// ============================================================
// MEDORA CONTROL CENTRE — application shell
// Sidebar + topbar + providers for the whole /admin workspace.
// ============================================================

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth, api, qstring } from "./api";
import { initials } from "./format";
import { Icon, type IconName } from "./icons";
import { Dropdown, MenuItem, TimeAgo } from "./ui";
import { ToastProvider, useToast } from "./ui";

// ------------------------------------------------------------
// Navigation config
// ------------------------------------------------------------

type NavColor = "blue" | "green" | "violet" | "orange" | "red";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  module: string;
  color: NavColor;
  badge?: "pendingOrders" | "lowStock" | "dealerPending" | "reviewsPending" | "supportOpen" | "unread";
  /** Disabled modules are hidden from the sidebar until they go live. */
  disabled?: boolean;
};

const NAV: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", module: "dashboard", color: "blue" }] },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: "products", module: "products", color: "violet" },
      { href: "/admin/categories", label: "Categories", icon: "categories", module: "categories", color: "orange" },
      { href: "/admin/brands", label: "Brands", icon: "brands", module: "brands", color: "red" },
      { href: "/admin/inventory", label: "Inventory", icon: "inventory", module: "inventory", color: "green", badge: "lowStock" },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "orders", module: "orders", color: "blue", badge: "pendingOrders" },
      { href: "/admin/coupons", label: "Coupons & Promos", icon: "coupons", module: "coupons", color: "orange", disabled: true },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/customers", label: "Customers", icon: "customers", module: "customers", color: "green", disabled: true },
      { href: "/admin/reviews", label: "Reviews", icon: "reviews", module: "reviews", color: "violet", badge: "reviewsPending", disabled: true },
      { href: "/admin/dealers", label: "Dealers", icon: "dealers", module: "dealers", color: "blue", badge: "dealerPending", disabled: true },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/content", label: "Content Manager", icon: "content", module: "content", color: "violet", disabled: true },
      { href: "/admin/media", label: "Media Library", icon: "media", module: "media", color: "orange", disabled: true },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/admin/newsletter", label: "Newsletter", icon: "newsletter", module: "newsletter", color: "red", disabled: true },
      { href: "/admin/reports", label: "Reports", icon: "reports", module: "reports", color: "green", disabled: true },
    ],
  },
  {
    label: "Service",
    items: [{ href: "/admin/support", label: "Support Center", icon: "support", module: "support", color: "green", badge: "supportOpen", disabled: true }],
  },
  {
    label: "System",
    items: [
      { href: "/admin/users", label: "Users & Roles", icon: "users", module: "users", color: "violet", disabled: true },
      { href: "/admin/settings", label: "Settings", icon: "settings", module: "settings", color: "blue", disabled: true },
      { href: "/admin/notifications", label: "Notifications", icon: "notifications", module: "notifications", color: "orange", badge: "unread", disabled: true },
      { href: "/admin/audit", label: "Audit Logs", icon: "audit", module: "audit", color: "violet", disabled: true },
      { href: "/admin/security", label: "Security", icon: "security", module: "security", color: "red", disabled: true },
    ],
  },
];

const PATH_LABELS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/brands": "Brands",
  "/admin/inventory": "Inventory",
  "/admin/orders": "Orders",
  "/admin/coupons": "Coupons & Promotions",
  "/admin/customers": "Customers",
  "/admin/reviews": "Reviews",
  "/admin/dealers": "Dealers",
  "/admin/content": "Content Manager",
  "/admin/media": "Media Library",
  "/admin/newsletter": "Newsletter",
  "/admin/reports": "Reports",
  "/admin/support": "Support Center",
  "/admin/users": "Users & Roles",
  "/admin/settings": "Settings",
  "/admin/notifications": "Notifications",
  "/admin/audit": "Audit Logs",
  "/admin/security": "Security",
};

// ------------------------------------------------------------
// Global search
// ------------------------------------------------------------

type SearchHit = { label: string; sub: string; href: string; icon: IconName };

function GlobalSearch() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setHits([]);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setHits([]);
    const timer = window.setTimeout(() => {
      const query = qstring({ search: term, pageSize: 4 });
      Promise.all([
        api<{ items: { id: number; name: string; sku: string }[] }>(`/api/admin/products${query}`),
        api<{ items: { id: number; number: string; customerName: string }[] }>(`/api/admin/orders${query}`),
        api<{ items: { id: number; name: string; email: string }[] }>(`/api/admin/customers${query}`),
      ])
        .then(([p, o, c]) => {
          if (!alive) return;
          const out: SearchHit[] = [
            ...p.items.map((x) => ({ label: x.name, sub: `SKU ${x.sku}`, href: "/admin/products", icon: "products" as IconName })),
            ...o.items.map((x) => ({ label: x.number, sub: x.customerName, href: "/admin/orders", icon: "orders" as IconName })),
            ...c.items.map((x) => ({ label: x.name, sub: x.email, href: "/admin/customers", icon: "customers" as IconName })),
          ];
          setHits(out);
        })
        .catch(() => alive && toast("Search failed", "error"))
        .finally(() => alive && setLoading(false));
    }, 180);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [q, toast]);

  return (
    <div ref={ref} className="admin-global-search" onFocus={() => setOpen(true)}>
      <Icon name="search" size={15} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, orders, customers…" />
      {open && q.trim() && (
        <div className="admin-global-results" role="listbox" aria-label="Search results">
          {loading && <p aria-live="polite">Searching…</p>}
          {!loading && hits.length === 0 && <p aria-live="polite">No results for “{q.trim()}”</p>}
          {hits.map((h, i) => (
            <button type="button" key={`${h.href}-${h.label}-${i}`} onClick={() => { setOpen(false); window.location.href = h.href; }}>
              <span className="admin-search-result-icon">
                <Icon name={h.icon} size={14} />
              </span>
              <span className="admin-search-result-copy">
                <b>{h.label}</b>
                <small>{h.sub}</small>
              </span>
              <Icon name="arrowRight" size={12} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Notification bell
// ------------------------------------------------------------

const NOTIF_ICON: Record<string, IconName> = {
  order: "orders", stock: "inventory", dealer: "dealers", refund: "wallet",
  review: "reviews", message: "support", system: "settings",
};

function NotificationBell() {
  const { notifications, counts, refreshSummary } = useAuth();
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

  const markAll = async () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    try {
      await api("/api/admin/notifications/bulk", { method: "POST", body: JSON.stringify({ action: "update", ids, payload: { read: true } }) });
      refreshSummary();
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="admin-notification-btn" onClick={() => setOpen((v) => !v)} aria-label="Notifications">
        <Icon name="bell" size={16} />
        {(counts?.unread ?? 0) > 0 && <i />}
      </button>
      {open && (
        <div className="admin-menu-pop notif" style={{ right: 0, width: 330 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 13px", borderBottom: "1px solid var(--admin-line)" }}>
            <b style={{ fontSize: 12 }}>Notifications</b>
            <button onClick={markAll} style={{ color: "var(--admin-blue)", fontSize: 10, fontWeight: 800 }}>
              Mark all read
            </button>
          </div>
          <div style={{ maxHeight: 340, overflow: "auto" }}>
            {notifications.length === 0 && <p style={{ padding: 18, color: "var(--admin-muted)", fontSize: 11 }}>{`You're all caught up.`}</p>}
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => setOpen(false)}
                style={{ display: "flex", gap: 10, padding: "11px 13px", borderBottom: "1px solid #f0f3f6", opacity: n.read ? 0.55 : 1 }}
              >
                <span className="admin-quick-icon blue" style={{ width: 30, height: 30, flex: "none" }}>
                  <Icon name={NOTIF_ICON[n.type] ?? "bell"} size={14} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 11, display: "block" }}>{n.title}</b>
                  <small style={{ color: "var(--admin-muted)", fontSize: 9.5, display: "block", marginTop: 3, lineHeight: 1.4 }}>{n.body}</small>
                  <small style={{ color: "var(--admin-muted)", fontSize: 9 }}><TimeAgo iso={n.at} /></small>
                </span>
                {!n.read && <i style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--admin-orange)", flex: "none", marginTop: 4 }} />}
              </Link>
            ))}
          </div>
          <Link href="/admin/notifications" onClick={() => setOpen(false)} style={{ display: "block", textAlign: "center", padding: 10, color: "var(--admin-blue)", fontSize: 10.5, fontWeight: 800 }}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Date range picker
// ------------------------------------------------------------

const DATE_PRESETS = [
  { id: "today", label: "Today", helper: "Current day" },
  { id: "yesterday", label: "Yesterday", helper: "Previous day" },
  { id: "last7", label: "Last 7 days", helper: "Rolling week" },
  { id: "last30", label: "Last 30 days", helper: "Rolling month" },
  { id: "thisMonth", label: "This month", helper: "Since the 1st" },
  { id: "allTime", label: "All time", helper: "Complete history" },
] as const;

type DatePreset = (typeof DATE_PRESETS)[number]["id"] | "custom";
type CustomRange = { start: string; end: string };

function formatDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function DateRangePicker() {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<DatePreset>("today");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedLabel = preset === "custom" && customRange
    ? `${formatDateInput(customRange.start)} – ${formatDateInput(customRange.end)}`
    : preset === "today"
      ? new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })
      : DATE_PRESETS.find((item) => item.id === preset)?.label ?? "Choose dates";

  const choosePreset = (next: DatePreset) => {
    setPreset(next);
    setError("");
    if (next !== "custom") {
      setCustomRange(null);
      setOpen(false);
    }
  };

  const applyCustomRange = () => {
    if (!start || !end) {
      setError("Select both dates first.");
      return;
    }
    if (start > end) {
      setError("The end date must be after the start date.");
      return;
    }
    setCustomRange({ start, end });
    setPreset("custom");
    setError("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="admin-date-picker">
      <button
        type="button"
        className="admin-date-btn"
        title="Choose date range"
        aria-label={`Date range: ${selectedLabel}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="calendar" size={14} />
        <span className="admin-date-label">{selectedLabel}</span>
        <Icon name="chevronDown" size={12} />
      </button>
      {open && (
        <div className="admin-date-popover" role="dialog" aria-label="Choose date range">
          <div className="admin-date-popover-head">
            <b>Date range</b>
            <small>Choose a reporting period</small>
          </div>
          <div className="admin-date-options">
            {DATE_PRESETS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={preset === item.id ? "active" : ""}
                aria-pressed={preset === item.id}
                onClick={() => choosePreset(item.id)}
              >
                <span>
                  <b>{item.label}</b>
                  <small>{item.helper}</small>
                </span>
                {preset === item.id && <Icon name="check" size={14} />}
              </button>
            ))}
          </div>
          <div className={`admin-date-custom ${preset === "custom" ? "active" : ""}`}>
            <b>Custom range</b>
            <div className="admin-date-inputs">
              <label>
                <span>From</span>
                <input type="date" value={start} onChange={(e) => { setStart(e.target.value); setError(""); }} />
              </label>
              <label>
                <span>To</span>
                <input type="date" value={end} onChange={(e) => { setEnd(e.target.value); setError(""); }} />
              </label>
            </div>
            {error && <small className="admin-date-error">{error}</small>}
            <button type="button" className="admin-date-apply" onClick={applyCustomRange}>Apply dates</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Profile menu
// ------------------------------------------------------------

function ProfileMenu() {
  const { user, logout } = useAuth();
  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="admin-profile"
          aria-label={`Open profile menu for ${user?.name ?? "Admin"}`}
        >
          <span className="admin-avatar" aria-hidden="true">{initials(user?.name ?? "Admin")}</span>
          <span className="admin-profile-copy">
            <b>{user?.name ?? "Admin"}</b>
            <small>{user?.role ?? "Administrator"}</small>
          </span>
          <Icon name="chevronDown" size={13} />
        </button>
      }
    >
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--admin-line)" }}>
        <b style={{ fontSize: 12, display: "block" }}>{user?.name}</b>
        <small style={{ color: "var(--admin-muted)", fontSize: 10 }}>{user?.email}</small>
        <span className="admin-status green" style={{ marginTop: 8 }}><i /> {user?.role}</span>
      </div>
      <MenuItem icon="home" label="View storefront" onClick={() => (window.location.href = "/")} />
      <MenuItem icon="settings" label="Account settings" onClick={() => (window.location.href = "/admin/settings")} />
      <MenuItem icon="security" label="Security" onClick={() => (window.location.href = "/admin/security")} />
      <MenuItem icon="logout" label="Sign out" danger onClick={() => void logout()} />
    </Dropdown>
  );
}

// ------------------------------------------------------------
// Sidebar
// ------------------------------------------------------------

function Sidebar({ path, collapsed, open, onNavigate }: { path: string; collapsed: boolean; open?: boolean; onNavigate?: () => void }) {
  const { counts, canModule } = useAuth();
  return (
    <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""} ${open ? "open" : ""}`}>
      <div className="admin-brand">
        <span className="admin-brand-mark">✚</span>
        <span>
          <b>Medora</b>
          <small>CONTROL CENTRE</small>
        </span>
        <button className="admin-sidebar-close" onClick={onNavigate} aria-label="Close menu">
          <Icon name="x" size={16} />
        </button>
      </div>

      <Link href="/" className="admin-workspace-switch" title="Switch to storefront">
        <span className="admin-workspace-mark">
          <Icon name="home" size={14} />
        </span>
        <span>
          <small>Workspace</small>
          <b>Medora Storefront</b>
        </span>
        <Icon name="external" size={13} />
      </Link>

      <nav className="admin-nav" aria-label="Admin">
        {NAV.map((group) => {
          const items = group.items.filter((it) => canModule(it.module));
          if (!items.length) return null;
          return (
            <div className="admin-nav-group" key={group.label}>
              <div className="admin-nav-label">{collapsed ? "•••" : group.label}</div>
              {items.map((it) => {
                const active = path === it.href || (it.href !== "/admin" && path.startsWith(it.href));
                const badge = (it.badge ? counts?.[it.badge] : 0) ?? 0;
                if (it.disabled) {
                  return (
                    <span
                      key={it.href}
                      className={`admin-nav-item disabled c-${it.color}`}
                      title={collapsed ? `${it.label} — coming soon` : undefined}
                      aria-disabled="true"
                    >
                      <Icon name={it.icon} size={17} />
                      {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>}
                      {!collapsed && <em className="nav-soon">Soon</em>}
                    </span>
                  );
                }
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`admin-nav-item c-${it.color} ${active ? "active" : ""}`}
                    title={collapsed ? it.label : undefined}
                    onClick={onNavigate}
                  >
                    <Icon name={it.icon} size={17} />
                    {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>}
                    {!collapsed && badge > 0 && <em className={it.badge === "unread" ? "blue-badge" : ""}>{badge}</em>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="admin-sidebar-bottom">
        <Link href="/" className="admin-storefront-link">
          <Icon name="home" size={13} />
          {!collapsed && <span>View storefront</span>}
          {!collapsed && <Icon name="arrowRight" size={12} />}
        </Link>
        <div className="admin-support-card">
          <span>
            <Icon name="chat" size={14} />
          </span>
          <div>
            <b>Need help?</b>
            <small>Care team · 24×7</small>
          </div>
          <i />
        </div>
        <button className="admin-sidebar-help">
          <Icon name="help" size={15} />
          {!collapsed && <span>Help & documentation</span>}
        </button>
      </div>
    </aside>
  );
}

// ------------------------------------------------------------
// Shell
// ------------------------------------------------------------

function ShellInner({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("medora-admin-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(stored ? stored === "dark" : prefersDark);
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    localStorage.setItem("medora-admin-theme", dark ? "dark" : "light");
    document.body.style.background = dark ? "#0b1522" : "";
  }, [dark, themeReady]);

  const crumbs = useMemo(() => {
    const parts = path.split("/").filter(Boolean);
    const labels = ["Admin"];
    if (parts.length >= 2) labels.push(PATH_LABELS["/" + parts.slice(0, 2).join("/")] ?? PATH_LABELS[path] ?? "…");
    return labels;
  }, [path]);

  return (
    <div className={`admin-shell ${dark ? "dark" : ""} ${collapsed ? "collapsed" : ""}`}>
      <div className={`admin-sidebar-scrim ${mobileOpen ? "show" : ""}`} onClick={() => setMobileOpen(false)} />
      <Sidebar
        path={path}
        collapsed={collapsed}
        open={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={18} />
          </button>
          <button
            className="admin-collapse-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={15} />
          </button>
          <div className="admin-breadcrumb">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {i > 0 && <Icon name="chevronRight" size={12} />}
                <b>{c}</b>
              </span>
            ))}
          </div>
          <div className="admin-topbar-actions">
            <GlobalSearch />
            <DateRangePicker />
            <button className="admin-theme-toggle" onClick={() => setDark((v) => !v)} aria-label="Toggle theme" title="Toggle theme">
              <Icon name={dark ? "sun" : "moon"} size={15} />
            </button>
            <NotificationBell />
            <ProfileMenu />
          </div>
        </header>
        <main className="admin-workspace">{children}</main>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <ShellInner>{children}</ShellInner>
      </AuthProvider>
    </ToastProvider>
  );
}
