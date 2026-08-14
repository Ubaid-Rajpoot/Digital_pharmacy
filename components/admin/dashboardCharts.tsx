"use client";

// ============================================================
// MEDORA CONTROL CENTRE — dashboard charts (Recharts)
// Professional Recharts visualisations with interactive
// series toggles (Actual / Target etc.) and a master
// on/off switch per chart.
// ============================================================

import { useState } from "react";
import Link from "next/link";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Icon } from "./icons";
import { Card, Toggle } from "./ui";
import { compactMoney, compactNum } from "./format";

// ------------------------------------------------------------
// Theme tokens (CSS variables keep dark mode in sync)
// ------------------------------------------------------------

const GRID = "var(--admin-line)";
const MUTED = "var(--admin-muted)";
const BLUE = "var(--admin-chart-blue, var(--admin-blue))";
const GREEN = "var(--admin-chart-green, var(--admin-green))";
const VIOLET = "var(--admin-chart-violet, var(--admin-violet))";
const ORANGE = "var(--admin-chart-orange, var(--admin-orange))";
const RED = "var(--admin-chart-red, var(--admin-red))";

const axisTick = (over: Record<string, unknown> = {}) => ({
  fill: MUTED,
  fontSize: 10,
  fontWeight: 600,
  ...over,
});

const chartMargin = { top: 6, right: 6, left: 0, bottom: 0 } as const;

// ------------------------------------------------------------
// Shared building blocks
// ------------------------------------------------------------

type TipPayload<T = Record<string, unknown>> = {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
  fill?: string;
  payload?: T;
};

function ChartTip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
  format?: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="admin-rt-tip">
      <b>{label}</b>
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name}>
          <i style={{ background: p.color ?? p.fill ?? BLUE }} />
          <span>{p.name}</span>
          <strong>{format ? format(p.value ?? 0) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function ChartOff({ label }: { label: string }) {
  return (
    <div className="admin-chart-off">
      <span className="admin-chart-off-ic">
        <Icon name="chart" size={20} />
      </span>
      <b>{label}</b>
      <p>This chart is switched off. Turn it back on anytime.</p>
    </div>
  );
}

function ChartSwitch({ on, onChange, title }: { on: boolean; onChange: (v: boolean) => void; title: string }) {
  return (
    <span className="admin-chart-switch">
      <span>Chart</span>
      <Toggle on={on} onChange={onChange} label={title} />
    </span>
  );
}

function SeriesToggle({
  items,
}: {
  items: { key: string; label: string; color: string; on: boolean; toggle: () => void }[];
}) {
  return (
    <span className="admin-series-toggle">
      {items.map((it) => (
        <button key={it.key} type="button" className={it.on ? "on" : "off"} aria-pressed={it.on} onClick={it.toggle}>
          <i className="dot" style={{ background: it.color }} />
          {it.label}
        </button>
      ))}
    </span>
  );
}

// ------------------------------------------------------------
// 1. Revenue vs target — Actual / Target toggle buttons + switch
// ------------------------------------------------------------

export function RevenueChartCard({ data }: { data: { label: string; actual: number; target: number }[] }) {
  const [on, setOn] = useState(true);
  const [actual, setActual] = useState(true);
  const [target, setTarget] = useState(true);
  const total = data.reduce((s, m) => s + m.actual, 0);
  const noSeries = !actual && !target;

  return (
    <Card
      className="admin-chart-card"
      kicker="Revenue analytics"
      title="Revenue vs target"
      actions={
        <>
          <b className="admin-chart-total">{compactMoney(total)} total</b>
          <SeriesToggle
            items={[
              { key: "actual", label: "Actual", color: BLUE, on: actual, toggle: () => setActual((v) => !v) },
              { key: "target", label: "Target", color: GREEN, on: target, toggle: () => setTarget((v) => !v) },
            ]}
          />
          <ChartSwitch on={on} onChange={setOn} title="Toggle revenue chart" />
        </>
      }
    >
      {!on ? (
        <ChartOff label="Revenue vs target" />
      ) : noSeries ? (
        <div className="admin-chart-off compact">
          <b>No series selected</b>
          <p>Turn on Actual or Target to view the comparison.</p>
        </div>
      ) : (
        <div className="admin-recharts-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={chartMargin}>
              <defs>
                <linearGradient id="revActualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.26} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 6" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick()} dy={6} minTickGap={10} />
              <YAxis
                width={46}
                tickLine={false}
                axisLine={false}
                tick={axisTick({ fontSize: 9.5 })}
                tickFormatter={(v: number) => compactMoney(v)}
              />
              <Tooltip
                content={<ChartTip format={(n) => compactMoney(n)} />}
                cursor={{ stroke: "var(--admin-line-strong)", strokeDasharray: "3 3" }}
              />
              {actual && (
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke={BLUE}
                  strokeWidth={2.4}
                  fill="url(#revActualGrad)"
                  dot={{ r: 2.6, fill: "#fff", stroke: BLUE, strokeWidth: 2 }}
                  activeDot={{ r: 4.5, fill: "#fff", stroke: BLUE, strokeWidth: 2.5 }}
                />
              )}
              {target && (
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke={GREEN}
                  strokeWidth={2}
                  strokeDasharray="7 5"
                  dot={false}
                  activeDot={{ r: 4.5, fill: "#fff", stroke: GREEN, strokeWidth: 2.5 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// 2. Sales by month — professional bars + switch
// ------------------------------------------------------------

function SalesTip({ active, payload, label }: { active?: boolean; payload?: TipPayload<{ orders: number }>[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const first = payload[0];
  const orders = typeof first.payload?.orders === "number" ? first.payload.orders : 0;
  return (
    <div className="admin-rt-tip">
      <b>{label}</b>
      <div>
        <i style={{ background: BLUE }} />
        <span>Revenue</span>
        <strong>{compactMoney(first.value ?? 0)}</strong>
      </div>
      <div>
        <i style={{ background: GREEN }} />
        <span>Orders</span>
        <strong>{orders}</strong>
      </div>
    </div>
  );
}

export function SalesChartCard({ data }: { data: { label: string; revenue: number; orders: number }[] }) {
  const [on, setOn] = useState(true);
  const totalOrders = data.reduce((s, m) => s + m.orders, 0);

  return (
    <Card
      className="admin-chart-card"
      kicker="Sales analytics"
      title="Sales by month"
      actions={
        <>
          <b className="admin-chart-total">
            {totalOrders} orders · {data.length} mo
          </b>
          <ChartSwitch on={on} onChange={setOn} title="Toggle sales chart" />
        </>
      }
    >
      {!on ? (
        <ChartOff label="Sales by month" />
      ) : (
        <div className="admin-recharts-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={chartMargin}>
              <defs>
                <linearGradient id="salesBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={1} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0.45} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 6" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick()} dy={6} minTickGap={10} />
              <YAxis
                width={46}
                tickLine={false}
                axisLine={false}
                tick={axisTick({ fontSize: 9.5 })}
                tickFormatter={(v: number) => compactMoney(v)}
              />
              <Tooltip content={<SalesTip />} cursor={{ fill: BLUE, fillOpacity: 0.07 }} />
              <Bar dataKey="revenue" name="Revenue" fill="url(#salesBarGrad)" radius={[7, 7, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// 3. Order volume — orders by day (consistency)
// ------------------------------------------------------------

export function OrdersByDayChartCard({ data }: { data: { label: string; orders: number }[] }) {
  const [on, setOn] = useState(true);
  const total = data.reduce((s, d) => s + d.orders, 0);

  return (
    <Card
      className="admin-chart-card"
      kicker="Order volume"
      title="Orders by day · last 14 days"
      actions={
        <>
          <b className="admin-chart-total">{total} orders</b>
          <ChartSwitch on={on} onChange={setOn} title="Toggle order volume chart" />
        </>
      }
    >
      {!on ? (
        <ChartOff label="Order volume" />
      ) : (
        <div className="admin-recharts-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={chartMargin}>
              <defs>
                <linearGradient id="ordersBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GREEN} stopOpacity={1} />
                  <stop offset="100%" stopColor={GREEN} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 6" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick()} dy={6} minTickGap={10} />
              <YAxis
                width={30}
                tickLine={false}
                axisLine={false}
                tick={axisTick({ fontSize: 9.5 })}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTip format={(n) => String(n)} />} cursor={{ fill: GREEN, fillOpacity: 0.08 }} />
              <Bar dataKey="orders" name="Orders" fill="url(#ordersBarGrad)" radius={[7, 7, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// 4. Customer growth — cumulative area + new/month line
// ------------------------------------------------------------

export function CustomerGrowthChartCard({ data }: { data: { label: string; newCustomers: number; total: number }[] }) {
  const [on, setOn] = useState(true);
  const [cumulative, setCumulative] = useState(true);
  const [monthly, setMonthly] = useState(true);
  const noSeries = !cumulative && !monthly;

  return (
    <Card
      className="admin-span-2"
      kicker="Customer growth"
      title="Customers over the last 12 months"
      actions={
        <>
          <SeriesToggle
            items={[
              { key: "total", label: "Cumulative", color: VIOLET, on: cumulative, toggle: () => setCumulative((v) => !v) },
              { key: "new", label: "New / month", color: GREEN, on: monthly, toggle: () => setMonthly((v) => !v) },
            ]}
          />
          <ChartSwitch on={on} onChange={setOn} title="Toggle customer growth chart" />
        </>
      }
    >
      {!on ? (
        <ChartOff label="Customer growth" />
      ) : noSeries ? (
        <div className="admin-chart-off compact">
          <b>No series selected</b>
          <p>Turn on Cumulative or New / month to view growth.</p>
        </div>
      ) : (
        <div className="admin-recharts-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={chartMargin}>
              <defs>
                <linearGradient id="growthTotalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VIOLET} stopOpacity={0.24} />
                  <stop offset="100%" stopColor={VIOLET} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 6" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick()} dy={6} minTickGap={10} />
              <YAxis
                width={40}
                tickLine={false}
                axisLine={false}
                tick={axisTick({ fontSize: 9.5 })}
                tickFormatter={(v: number) => compactNum(v)}
                allowDecimals={false}
              />
              <Tooltip
                content={<ChartTip format={(n) => compactNum(n)} />}
                cursor={{ stroke: "var(--admin-line-strong)", strokeDasharray: "3 3" }}
              />
              {cumulative && (
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Cumulative"
                  stroke={VIOLET}
                  strokeWidth={2.4}
                  fill="url(#growthTotalGrad)"
                  dot={false}
                  activeDot={{ r: 4.5, fill: "#fff", stroke: VIOLET, strokeWidth: 2.5 }}
                />
              )}
              {monthly && (
                <Line
                  type="monotone"
                  dataKey="newCustomers"
                  name="New / month"
                  stroke={GREEN}
                  strokeWidth={2}
                  strokeDasharray="7 5"
                  dot={false}
                  activeDot={{ r: 4.5, fill: "#fff", stroke: GREEN, strokeWidth: 2.5 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// 5. Store health — Recharts donut + operational summary
// ------------------------------------------------------------

type HealthPoint = { label: string; value: number; color: string };

function HealthDonut({ data, centerValue }: { data: HealthPoint[]; centerValue: string }) {
  return (
    <div className="admin-health-donut-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="64%"
            outerRadius="88%"
            paddingAngle={3}
            stroke="none"
            isAnimationActive
          >
            {data.map((entry, index) => <Cell key={`${entry.label}-${index}`} fill={entry.color} />)}
          </Pie>
          <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fill="var(--admin-ink)" fontSize="22" fontWeight="800">
            {centerValue}
          </text>
          <text x="50%" y="61%" textAnchor="middle" dominantBaseline="middle" fill={MUTED} fontSize="10" fontWeight="700">
            today
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StoreHealthChartCard({
  data,
  todayOrders,
  deliveredOrders,
  pendingOrders,
  cancelledOrders,
  refundRequests,
  reviewsPending,
  totalCustomers,
  totalBrands,
}: {
  data: HealthPoint[];
  todayOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  refundRequests: number;
  reviewsPending: number;
  totalCustomers: number;
  totalBrands: number;
}) {
  const [on, setOn] = useState(true);
  const healthData = data.length ? data : [{ label: "No orders", value: 1, color: "var(--admin-line-strong)" }];
  const successRate = (deliveredOrders / Math.max(1, deliveredOrders + cancelledOrders) * 100).toFixed(0);

  return (
    <Card
      className="admin-health-card"
      kicker="Store health"
      title="Fulfilment & quality"
      actions={<ChartSwitch on={on} onChange={setOn} title="Toggle store health chart" />}
    >
      <div className="admin-health-layout">
        <div className="admin-health-donut-slot">
          {on ? (
            <HealthDonut data={healthData} centerValue={String(todayOrders)} />
          ) : (
            <div className="admin-health-donut-off">
              <Icon name="chart" size={22} />
              <span>Chart off</span>
            </div>
          )}
        </div>
        <div className="admin-health-details">
          <div className="admin-health-score">
            <strong>{successRate}%</strong>
            <span>delivery success rate</span>
          </div>
          <p className="admin-health-copy">Order status distribution, {totalCustomers} customers served and {totalBrands} brands on the platform.</p>
          <div className="admin-health-list">
            <div><span><i className="green-dot" /> Delivered</span><b>{deliveredOrders}</b></div>
            <div><span><i className="orange-dot" /> Pending / processing</span><b>{pendingOrders}</b></div>
            <div><span><i className="red-dot" /> Cancelled + refunds</span><b>{cancelledOrders + refundRequests}</b></div>
            <div><span><i className="violet-dot" /> Reviews awaiting approval</span><b>{reviewsPending}</b></div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// 6. Top selling products — ranked horizontal revenue bars
// ------------------------------------------------------------

type ProductPoint = {
  id: number;
  name: string;
  image: string;
  sold: number;
  revenue: number;
  stock: number;
  sku: string;
};

type HorizontalTickProps = {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
};

function HorizontalTick({ x = 0, y = 0, payload }: HorizontalTickProps) {
  const raw = String(payload?.value ?? "");
  const label = raw.length > 25 ? `${raw.slice(0, 25)}…` : raw;
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill={MUTED} fontSize={10} fontWeight={600}>
      {label}
    </text>
  );
}

type ProductTipPayload = TipPayload<ProductPoint>;

function ProductTip({ active, payload, label }: { active?: boolean; payload?: ProductTipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const product = payload[0].payload;
  return (
    <div className="admin-rt-tip">
      <b>{label}</b>
      <div><i style={{ background: BLUE }} /><span>Revenue</span><strong>{compactMoney(product?.revenue ?? 0)}</strong></div>
      <div><i style={{ background: GREEN }} /><span>Sold</span><strong>{compactNum(product?.sold ?? 0)}</strong></div>
      <small>{product?.sku ?? ""}</small>
    </div>
  );
}

export function TopProductsChartCard({ data }: { data: ProductPoint[] }) {
  const [on, setOn] = useState(true);

  return (
    <Card
      className="admin-span-2"
      kicker="Best sellers"
      title="Top selling products"
      actions={
        <>
          <LinkLike href="/admin/products">All products</LinkLike>
          <ChartSwitch on={on} onChange={setOn} title="Toggle top products chart" />
        </>
      }
    >
      {!on ? (
        <ChartOff label="Top selling products" />
      ) : (
        <div className="admin-horizontal-recharts-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ top: 4, right: 18, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="topProductsBarGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} stroke={GRID} strokeDasharray="3 6" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={axisTick({ fontSize: 9.5 })}
                tickFormatter={(v: number) => compactMoney(v)}
              />
              <YAxis type="category" dataKey="name" width={172} tickLine={false} axisLine={false} tick={<HorizontalTick />} />
              <Tooltip content={<ProductTip />} cursor={{ fill: BLUE, fillOpacity: 0.07 }} />
              <Bar dataKey="revenue" name="Revenue" fill="url(#topProductsBarGrad)" radius={[0, 7, 7, 0]} maxBarSize={23} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// 7. Category performance — horizontal revenue bars
// ------------------------------------------------------------

type CategoryPoint = { id: number; name: string; revenue: number; orders: number };
type CategoryTipPayload = TipPayload<CategoryPoint>;

function CategoryTip({ active, payload, label }: { active?: boolean; payload?: CategoryTipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const category = payload[0].payload;
  return (
    <div className="admin-rt-tip">
      <b>{label}</b>
      <div><i style={{ background: GREEN }} /><span>Revenue</span><strong>{compactMoney(category?.revenue ?? 0)}</strong></div>
      <div><i style={{ background: VIOLET }} /><span>Orders</span><strong>{category?.orders ?? 0}</strong></div>
    </div>
  );
}

const CATEGORY_COLORS = [BLUE, GREEN, VIOLET, ORANGE, RED];

export function TopCategoriesChartCard({ data }: { data: CategoryPoint[] }) {
  const [on, setOn] = useState(true);

  return (
    <Card
      className="admin-span-2"
      kicker="Category performance"
      title="Top categories"
      actions={
        <>
          <LinkLike href="/admin/categories">Manage categories</LinkLike>
          <ChartSwitch on={on} onChange={setOn} title="Toggle category performance chart" />
        </>
      }
    >
      {!on ? (
        <ChartOff label="Top categories" />
      ) : (
        <div className="admin-horizontal-recharts-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ top: 4, right: 18, left: 4, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={GRID} strokeDasharray="3 6" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={axisTick({ fontSize: 9.5 })}
                tickFormatter={(v: number) => compactMoney(v)}
              />
              <YAxis type="category" dataKey="name" width={122} tickLine={false} axisLine={false} tick={<HorizontalTick />} />
              <Tooltip content={<CategoryTip />} cursor={{ fill: GREEN, fillOpacity: 0.07 }} />
              <Bar dataKey="revenue" name="Revenue" radius={[0, 7, 7, 0]} maxBarSize={23}>
                {data.map((entry, index) => <Cell key={`${entry.id}-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function LinkLike({ href, children }: { href: string; children: string }) {
  return <Link href={href} className="admin-text-link">{children} <Icon name="arrowRight" size={12} /></Link>;
}
