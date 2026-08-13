"use client";

import Link from "next/link";
import { useAuth, useStats } from "@/components/admin/api";
import { BarChart, DonutChart, LineChart, MiniBars } from "@/components/admin/charts";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, EmptyState, ErrorState, Kpi, PageHeader, Skeleton, StatStrip, Status, TimeAgo,
} from "@/components/admin/ui";
import { compactMoney, compactNum, money } from "@/components/admin/format";

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--admin-orange)",
  processing: "var(--admin-blue)",
  packed: "var(--admin-violet)",
  shipped: "var(--admin-blue)",
  delivered: "var(--admin-green)",
  cancelled: "var(--admin-red)",
  returned: "var(--admin-orange)",
  refunded: "var(--admin-red)",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, refetch } = useStats();

  if (loading) return <DashboardSkeleton />;
  if (!data) return <ErrorState message="We couldn't load your dashboard analytics." retry={refetch} />;

  const k = data.kpis;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const statusDonut = Object.entries(data.charts.ordersByStatus)
    .filter(([, v]) => v > 0)
    .map(([s, v]) => ({ label: s, value: v, color: STATUS_COLORS[s] ?? "var(--admin-muted)" }));

  return (
    <>
      <div className="admin-welcome-row">
        <div>
          <div className="admin-eyebrow">Good to see you{user ? `, ${user.name.split(" ")[0]}` : ""} — {today}</div>
          <h1>
            Store <em>pulse</em> at a glance
          </h1>
          <p>Live snapshot of sales, inventory and customer activity across Medora.</p>
        </div>
        <div className="admin-welcome-actions">
          <Link href="/admin/reports"><Btn variant="secondary" icon="reports">Reports</Btn></Link>
          <Link href="/admin/products?new=1"><Btn icon="plus">Add product</Btn></Link>
        </div>
      </div>

      <div className="admin-kpi-grid">
        <Kpi label="Total revenue" value={compactMoney(k.revenue)} icon="wallet" tone="blue" delta={18.4} foot={<>Lifetime · {data.charts.salesByMonth.length} months tracked</>} />
        <Kpi label="Orders today" value={k.ordersToday} icon="orders" tone="green" delta={12.1} foot={<>of {k.pendingOrders} pending overall</>} />
        <Kpi label="Pending orders" value={k.pendingOrders} icon="clock" tone="orange" progress={Math.min(100, (k.pendingOrders / Math.max(1, data.charts.ordersByDay.slice(-1)[0]?.orders ?? 1)) * 100)} progressLabel="Need attention today" />
        <Kpi label="Avg order value" value={money(k.avgOrder)} icon="trendUp" tone="violet" delta={4.6} foot={<>across {k.deliveredOrders} delivered orders</>} />
      </div>

      <div className="admin-overview-grid">
        <Card className="admin-chart-card" kicker="Revenue analytics" title="Revenue vs target" actions={<span className="admin-chart-legend" style={{ margin: 0 }}><span><i className="blue-dot" /> Actual</span><span><i className="green-dot" /> Target</span><b className="muted">{compactMoney(data.charts.revenue.reduce((s, m) => s + m.actual, 0))} total</b></span>}>
          <div className="admin-chart-wrap">
            <div className="admin-chart-y" />
            <LineChart
              points={data.charts.revenue.map((m) => ({ label: m.label, value: m.actual, secondary: m.target }))}
              showSecondary
              formatValue={(n) => (n >= 100000 ? compactMoney(n) : String(n))}
            />
            <div className="admin-chart-x" />
          </div>
        </Card>

        <Card className="admin-chart-card" kicker="Sales analytics" title="Sales by month" actions={<span className="admin-chart-legend" style={{ margin: 0 }}><b className="muted">{data.charts.salesByMonth.reduce((s, m) => s + m.orders, 0)} orders · 12 mo</b></span>}>
          <div className="admin-chart-wrap">
            <div className="admin-chart-y" />
            <BarChart points={data.charts.salesByMonth.map((m) => ({ label: m.label, value: m.revenue }))} formatValue={(n) => (n >= 100000 ? compactMoney(n) : String(n))} />
            <div className="admin-chart-x" />
          </div>
        </Card>

        <Card className="admin-chart-card" kicker="Order volume" title="Orders by day · last 14 days" actions={<span className="admin-chart-legend" style={{ margin: 0 }}><b className="muted">{data.charts.ordersByDay.reduce((s, d) => s + d.orders, 0)} orders</b></span>}>
          <div className="admin-chart-wrap">
            <div className="admin-chart-y" />
            <BarChart points={data.charts.ordersByDay.map((d) => ({ label: d.label, value: d.orders }))} color="var(--admin-green)" formatValue={(n) => String(n)} />
            <div className="admin-chart-x" />
          </div>
        </Card>

        <Card className="admin-health-card" kicker="Store health" title="Fulfilment & quality">
          <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
            <DonutChart
              data={statusDonut.length ? statusDonut : [{ label: "No orders", value: 1, color: "#eef3f8" }]}
              size={150}
              centerValue={String(data.charts.ordersByDay.slice(-1)[0]?.orders ?? 0)}
              centerLabel="today"
            />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="admin-health-score">
                <strong>{(k.deliveredOrders / Math.max(1, k.deliveredOrders + k.cancelledOrders) * 100).toFixed(0)}%</strong>
                <span>delivery success rate</span>
              </div>
              <p className="admin-health-copy">Order status distribution, {k.totalCustomers} customers served and {k.totalBrands} brands on the platform.</p>
              <div className="admin-health-list">
                <div><span><i className="green-dot" /> Delivered</span><b>{k.deliveredOrders}</b></div>
                <div><span><i className="orange-dot" /> Pending / processing</span><b>{k.pendingOrders}</b></div>
                <div><span><i className="red-dot" /> Cancelled + refunds</span><b>{k.cancelledOrders + k.refundRequests}</b></div>
                <div><span><i className="violet-dot" /> Reviews awaiting approval</span><b>{k.reviewsPending}</b></div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="admin-span-2" kicker="Best sellers" title="Top selling products" actions={<Link href="/admin/products" className="admin-text-link">All products <Icon name="arrowRight" size={12} /></Link>}>
          <div className="admin-top-products">
            {data.charts.topProducts.map((p, i) => {
              const max = data.charts.topProducts[0]?.revenue ?? 1;
              return (
                <div className="admin-top-product" key={p.id}>
                  <span className="admin-rank">#{i + 1}</span>
                  <div className="admin-product-mini">
                    <img src={p.image} alt="" />
                    <div>
                      <b>{p.name}</b>
                      <small>{p.sku} · {compactNum(p.sold)} sold</small>
                    </div>
                  </div>
                  <div className="admin-product-bar">
                    <i style={{ width: `${(p.revenue / max) * 100}%` }} />
                  </div>
                  <strong>{compactMoney(p.revenue)}</strong>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="admin-span-2" kicker="Category performance" title="Top categories" actions={<Link href="/admin/categories" className="admin-text-link">Manage categories <Icon name="arrowRight" size={12} /></Link>}>
          <div className="admin-category-perf">
            {data.charts.topCategories.map((c, i) => {
              const max = data.charts.topCategories[0]?.revenue ?? 1;
              return (
                <div className="admin-category-row" key={c.id}>
                  <i className={`admin-category-dot ${["blue", "green", "violet", "orange", "red"][i % 5]}`} />
                  <b>{c.name}</b>
                  <div className="admin-category-track">
                    <i style={{ width: `${(c.revenue / max) * 100}%` }} />
                  </div>
                  <strong>{compactMoney(c.revenue)}</strong>
                  <small>{c.orders} orders</small>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="admin-span-2" kicker="Customer growth" title="Customers over the last 12 months" actions={<span className="admin-chart-legend" style={{ margin: 0 }}><span><i className="blue-dot" /> New / month</span><span><i className="green-dot" /> Cumulative</span></span>}>
          <div className="admin-chart-wrap">
            <div className="admin-chart-y" />
            <LineChart
              points={data.charts.customerGrowth.map((m) => ({ label: m.label, value: m.total, secondary: m.newCustomers }))}
              showSecondary
              color="var(--admin-violet)"
              secondaryColor="var(--admin-green)"
              formatValue={(n) => (n >= 1000 ? compactNum(n) : String(n))}
            />
            <div className="admin-chart-x" />
          </div>
        </Card>

        <Card className="admin-span-2 admin-orders-card" kicker="Recent activity" title="Latest orders" actions={<Link href="/admin/orders" className="admin-text-link">View all orders <Icon name="arrowRight" size={12} /></Link>} pad={false}>
          <div className="admin-table-scroll" style={{ padding: "0 20px" }}>
            <table className="admin-table" style={{ minWidth: 620 }}>
              <thead>
                <tr>
                  <th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Total</th><th>When</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td><b className="admin-order-id">{o.number}</b></td>
                    <td><b>{o.customerName}</b></td>
                    <td><Status value={o.status} /></td>
                    <td><span className="admin-muted-cell">{o.paymentMethod}</span></td>
                    <td><b>{money(o.total)}</b></td>
                    <td className="admin-muted-cell"><TimeAgo iso={o.createdAt} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card kicker="Inventory" title="Low stock alerts" actions={<Link href="/admin/inventory" className="admin-text-link">Inventory <Icon name="arrowRight" size={12} /></Link>}>
          {data.alerts.stockAlerts.length === 0 ? (
            <EmptyState icon="checkCircle" title="Stock levels healthy" body="No products below their low-stock threshold." />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {data.alerts.stockAlerts.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={p.image} alt="" width={36} height={36} style={{ borderRadius: 9, objectFit: "cover", background: "#eef4fb" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 11, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</b>
                    <small style={{ color: "var(--admin-muted)", fontSize: 9.5 }}>{p.sku}</small>
                  </div>
                  <span className={`admin-stock ${p.stock === 0 ? "out" : "low"}`}><i /> {p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card kicker="Attention" title="Needs your action">
          <div style={{ display: "grid", gap: 10 }}>
            {[
              { label: "Orders pending", value: k.pendingOrders, href: "/admin/orders", icon: "orders" as const, tone: "orange" },
              { label: "Refund requests", value: k.refundRequests, href: "/admin/orders", icon: "wallet" as const, tone: "red" },
              { label: "Reviews to approve", value: k.reviewsPending, href: "/admin/reviews", icon: "reviews" as const, tone: "violet" },
              { label: "Dealer applications", value: data.alerts.dealerPending, href: "/admin/dealers", icon: "dealers" as const, tone: "blue" },
              { label: "Open support items", value: data.alerts.supportOpen, href: "/admin/support", icon: "support" as const, tone: "green" },
              { label: "Unread notifications", value: data.alerts.unreadNotifications, href: "/admin/notifications", icon: "bell" as const, tone: "blue" },
            ].map((it) => (
              <Link key={it.label} href={it.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 11, border: "1px solid var(--admin-line)", transition: ".2s" }} className="admin-needs-action">
                <span className={`admin-quick-icon ${it.tone}`}><Icon name={it.icon} size={15} /></span>
                <span style={{ flex: 1, fontSize: 11.5, fontWeight: 800 }}>{it.label}</span>
                <b style={{ fontFamily: "var(--ff-d)", fontSize: 17 }}>{it.value}</b>
                <span style={{ color: "var(--admin-muted)", display: "inline-flex" }}><Icon name="chevronRight" size={14} /></span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="admin-stat-strip" style={{ marginTop: 15 }}>
        <div><span>Active products</span><b>{k.activeProducts}</b><small>of {k.totalProducts} total</small></div>
        <div><span>Out of stock</span><b>{k.outOfStock}</b><small>needs restocking</small></div>
        <div><span>Customers</span><b>{k.totalCustomers}</b><small>+{k.newUsers30} this month</small></div>
        <div><span>Newsletter subs</span><b>{k.subscribers}</b><small>across all sources</small></div>
      </div>

      <div className="admin-quick-grid">
        {[
          { label: "Add product", sub: "Create a new catalogue entry", icon: "plus" as const, href: "/admin/products?new=1" },
          { label: "New order", sub: "Manually place an order", icon: "orders" as const, href: "/admin/orders?new=1" },
          { label: "Add category", sub: "Organise the catalogue", icon: "categories" as const, href: "/admin/categories?new=1" },
          { label: "Compose campaign", sub: "Send a newsletter", icon: "newsletter" as const, href: "/admin/newsletter?compose=1" },
          { label: "Create coupon", sub: "Launch a promotion", icon: "coupons" as const, href: "/admin/coupons?new=1" },
          { label: "Upload media", sub: "Add files to the library", icon: "media" as const, href: "/admin/media?upload=1" },
        ].map((q) => (
          <Link key={q.label} href={q.href}>
            <span className="admin-quick-icon blue"><Icon name={q.icon} size={16} /></span>
            <span>
              <b>{q.label}</b>
              <small>{q.sub}</small>
            </span>
            <Icon name="arrowRight" size={14} />
          </Link>
        ))}
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="admin-welcome-row">
        <div>
          <div className="admin-eyebrow">Loading workspace…</div>
          <h1>Store <em>pulse</em></h1>
          <p>Fetching your live dashboard data.</p>
        </div>
      </div>
      <div className="admin-kpi-grid">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="admin-skeleton" style={{ height: 130, borderRadius: 15 }} />)}
      </div>
      <div className="admin-overview-grid">
        <div className="admin-skeleton admin-span-2" style={{ height: 356, borderRadius: 17 }} />
        <div className="admin-skeleton admin-span-2" style={{ height: 356, borderRadius: 17 }} />
      </div>
      <Skeleton rows={4} />
    </>
  );
}
