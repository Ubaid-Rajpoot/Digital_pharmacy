"use client";

// ============================================================
// MEDORA CONTROL CENTRE — application shell
// Sidebar + topbar + providers for the whole /admin workspace.
// ============================================================

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth, api } from "./api";
import { Icon, type IconName } from "./icons";
import { Dropdown, MenuItem, TimeAgo } from "./ui";
import { ToastProvider, useToast } from "./ui";

// ------------------------------------------------------------
// Navigation config
// ------------------------------------------------------------

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  module: string;
  badge?: "pendingOrders" | "lowStock" | "dealerPending" | "reviewsPending" | "supportOpen" | "unread";
};

const NAV: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", module: "dashboard" }] },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: "products", module: "products" },
      { href: "/admin/categories", label: "Categories", icon: "categories", module: "categories" },
      { href: "/admin/brands", label: "Brands", icon: "brands", module: "brands" },
      { href: "/admin/inventory", label: "Inventory", icon: "inventory", module: "inventory", badge: "lowStock" },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "orders", module: "orders", badge: "pendingOrders" },
      { href: "/admin/coupons", label: "Coupons & Promos", icon: "coupons", module: "coupons" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/customers", label: "Customers", icon: "customers", module: "customers" },
      { href: "/admin/reviews", label: "Reviews", icon: "reviews", module: "reviews", badge: "reviewsPending" },
      { href: "/admin/dealers", label: "Dealers", icon: "dealers", module: "dealers", badge: "dealerPending" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/content", label: "Content Manager", icon: "content", module: "content" },
      { href: "/admin/media", label: "Media Library", icon: "media", module: "media" },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/admin/newsletter", label: "Newsletter", icon: "newsletter", module: "newsletter" },
      { href: "/admin/reports", label: "Reports", icon: "reports", module: "reports" },
    ],
  },
  {
    label: "Service",
    items: [{ href: "/admin/support", label: "Support Center", icon: "support", module: "support", badge: "supportOpen" }],
  },
  {
    label: "System",
    items: [
      { href: "/admin/users", label: "Users & Roles", icon: "users", module: "users" },
      { href: "/admin/settings", label: "Settings", icon: "settings", module: "settings" },
      { href: "/admin/notifications", label: "Notifications", icon: "notifications", module: "notifications", badge: "unread" },
      { href: "/admin/audit", label: "Audit Logs", icon: "audit", module: "audit" },
      { href: "/admin/security", label: "Security", icon: "security", module: "security" },
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
  const toast = useToast();

  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    let alive = true;
    setLoading(true);
    const qs = encodeURIComponent(JSON.stringify({ search: q, pageSize: 4 }));
    Promise.all([
      api<{ items: { id: number; name: string; sku: string }[] }>(`/api/admin/products?${qs}`),
      api<{ items: { id: number; number: string; customerName: string }[] }>(`/api/admin/orders?${qs}`),
      api<{ items: { id: number; name: string; email: string }[] }>(`/api/admin/customers?${qs}`),
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
    return () => {
      alive = false;
    };
  }, [q, toast]);

  return (
    <div className="admin-global-search" onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}>
      <Icon name="search" size={15} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, orders, customers…" />
      {open && q.trim() && (
        <div className="admin-global-results">
          {loading && <p>Searching…</p>}
          {!loading && hits.length === 0 && <p>No results for “{q}”</p>}
          {hits.map((h, i) => (
            <button key={i} onClick={() => (window.location.href = h.href)}>
              <span>
                <Icon name={h.icon} size={14} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.label}</span>
                <small style={{ color: "var(--admin-muted)", fontSize: 9, fontWeight: 600 }}>{h.sub}</small>
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
// Profile menu
// ------------------------------------------------------------

function ProfileMenu() {
  const { user, logout } = useAuth();
  return (
    <Dropdown
      trigger={
        <button className="admin-profile">
          <span className="admin-avatar">{user?.name}</span>
          <span>
            <b>{user?.name}</b>
            <small>{user?.role}</small>
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
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`admin-nav-item ${active ? "active" : ""}`}
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
            <button className="admin-date-btn" title="Today">
              <Icon name="calendar" size={14} />
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}
              <Icon name="chevronDown" size={12} />
            </button>
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
