"use client";

/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, exportResource, qstring } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, EmptyState, ErrorState, PageHeader, Select, Skeleton, Status, Table, Td, Th, useToast,
} from "@/components/admin/ui";
import { compactMoney, dateShort, money } from "@/components/admin/format";

type ReportId = "revenue" | "sales" | "products" | "dealers" | "brands" | "categories" | "customers" | "inventory" | "taxes";

const REPORT_META: Record<ReportId, { label: string; desc: string; icon: "wallet" | "orders" | "products" | "dealers" | "brands" | "categories" | "customers" | "inventory" | "percent"; resource: string }> = {
  revenue: { label: "Revenue", desc: "Monthly revenue, order volume and average order value.", icon: "wallet", resource: "orders" },
  sales: { label: "Sales", desc: "Detailed sales breakdown including discounts and taxes.", icon: "orders", resource: "orders" },
  products: { label: "Products", desc: "Catalogue performance — units sold and revenue by product.", icon: "products", resource: "products" },
  dealers: { label: "Dealers", desc: "Dealer performance, commissions and payouts.", icon: "dealers", resource: "dealers" },
  brands: { label: "Brands", desc: "Brand catalogue footprint on the platform.", icon: "brands", resource: "brands" },
  categories: { label: "Categories", desc: "Category tree and structure overview.", icon: "categories", resource: "categories" },
  customers: { label: "Customers", desc: "Customer value — tiers, spend and rewards.", icon: "customers", resource: "customers" },
  inventory: { label: "Inventory", desc: "Stock positions, alerts and warehouse coverage.", icon: "inventory", resource: "inventory" },
  taxes: { label: "Taxes", desc: "Tax collected per order for filing.", icon: "percent", resource: "orders" },
};

type Row = Record<string, string | number>;

export default function ReportsPage() {
  const [type, setType] = useState<ReportId>("revenue");
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const meta = REPORT_META[type];

  const build = useCallback(async (t: ReportId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ items: unknown[] }>(`/api/admin/${REPORT_META[t].resource}${qstring({ pageSize: 200, sort: "id", dir: "asc" })}`);
      const items = res.items as Record<string, any>[];
      const out = buildRows(t, items);
      setRows(out);
      setTotal(computeTotal(t, out));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void build(type);
  }, [type, build]);

  const columns = useMemo(() => buildColumns(type), [type]);

  const print = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Medora — ${meta.label} report</title><style>
      body{font-family:Manrope,system-ui,sans-serif;color:#102b4d;padding:32px;max-width:900px;margin:0 auto}
      h1{font-size:22px;margin:0 0 4px}h2{font-size:12px;color:#8193aa;font-weight:600;margin:0 0 18px;text-transform:uppercase;letter-spacing:.08em}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:10px}
      th{background:#eef4fb;text-align:left;padding:9px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#42597b}
      td{padding:8px 10px;border-top:1px solid #e5edf5}
      .sum{margin-top:16px;font-size:14px;font-weight:800}
    </style></head><body>
    <h1>Medora — ${meta.label} report</h1><h2>Generated ${new Date().toLocaleString("en-IN")} · period: ${period}</h2>
    <table><thead><tr>${columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${columns.map((c) => `<td>${r[c] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>
    <div class="sum">Total: ${typeof total === "number" ? (type.includes("revenue") || type === "sales" || type === "taxes" ? money(total) : String(total)) : total}</div>
    <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  const exportCsv = async (format: "csv" | "xlsx") => {
    try {
      await exportResource(meta.resource, format, { pageSize: 200, sort: "id", dir: "asc" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Export failed", "error");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Growth"
        title="Reports"
        sub="Generate, preview and export business reports for your records and filings."
        actions={
          <>
            <Btn variant="secondary" icon="printer" onClick={print}>PDF / Print</Btn>
            <Btn variant="secondary" icon="download" onClick={() => void exportCsv("csv")}>CSV</Btn>
            <Btn variant="secondary" icon="file" onClick={() => void exportCsv("xlsx")}>Excel</Btn>
          </>
        }
      />

      <div className="admin-marketing-grid" style={{ marginBottom: 15 }}>
        <Card kicker="Report type" title="What do you want to see?">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9 }}>
            {(Object.keys(REPORT_META) as ReportId[]).map((id) => (
              <button
                key={id}
                onClick={() => setType(id)}
                className="admin-quick-grid"
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 11px", borderRadius: 11,
                  border: `1.5px solid ${type === id ? "var(--admin-blue)" : "var(--admin-line)"}`,
                  background: type === id ? "var(--admin-blue-soft)" : "#fff", textAlign: "left",
                  color: type === id ? "var(--admin-blue)" : "var(--admin-ink-soft)", fontWeight: 800, fontSize: 11,
                }}
              >
                <Icon name={REPORT_META[id].icon} size={15} />
                {REPORT_META[id].label}
              </button>
            ))}
          </div>
          <p style={{ color: "var(--admin-muted)", fontSize: 11, margin: "14px 0 0", lineHeight: 1.5 }}>{meta.desc}</p>
        </Card>
        <Card kicker="Period" title="Time range">
          <div className="admin-form-stack">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="all">All time</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="12m">Last 12 months</option>
              <option value="fytd">Financial year to date</option>
            </Select>
            <div className="admin-settings-note">
              <Icon name="info" size={16} />
              <span><b>Live data</b><small>Reports are generated from current store data every time you open them.</small></span>
            </div>
            <Btn variant="secondary" icon="refresh" onClick={() => void build(type)}>Regenerate</Btn>
          </div>
        </Card>
      </div>

      <Card kicker="Preview" title={`${meta.label} report`} actions={<span className="admin-count">{rows.length} rows · {money(total)} total</span>} pad={false} bodyClassName="admin-table-card">
        {loading ? (
          <Skeleton rows={8} />
        ) : error ? (
          <ErrorState message={error} retry={() => void build(type)} />
        ) : rows.length === 0 ? (
          <EmptyState icon="reports" title="No data for this report" body="Try a different report type or period." />
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table" style={{ minWidth: 860 }}>
              <thead>
                <tr>{columns.map((c) => <Th key={c}>{c.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase())}</Th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(0, 25).map((r, i) => (
                  <tr key={i}>{columns.map((c) => <Td key={c} align="right" className={typeof r[c] === "number" ? "" : "admin-muted-cell"}><b>{typeof r[c] === "number" ? (c.toLowerCase().includes("revenue") || c.toLowerCase().includes("spend") || c.toLowerCase().includes("tax") || c.toLowerCase().includes("total") || c.toLowerCase().includes("value") ? money(Number(r[c])) : r[c]) : r[c]}</b></Td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

// ------------------------------------------------------------

function buildColumns(t: ReportId): string[] {
  switch (t) {
    case "revenue": return ["Month", "Orders", "Revenue", "AvgOrder"];
    case "sales": return ["Month", "Orders", "Subtotal", "Discount", "Shipping", "Tax", "Total"];
    case "products": return ["SKU", "Name", "Price", "Sold", "Revenue", "Stock", "Status"];
    case "dealers": return ["Company", "City", "Commission", "Orders", "Revenue", "Rating", "Status"];
    case "brands": return ["Name", "Products", "Website", "Featured", "Status"];
    case "categories": return ["Name", "Type", "Featured", "Sort", "Status"];
    case "customers": return ["Name", "Email", "Tier", "Orders", "Spend", "Points", "Status"];
    case "inventory": return ["SKU", "Name", "Stock", "AlertAt", "Status"];
    case "taxes": return ["Order", "Customer", "Month", "Taxable", "Tax", "Status"];
  }
}

function buildRows(t: ReportId, items: Record<string, any>[]): Row[] {
  switch (t) {
    case "revenue": case "sales": {
      const byMonth = new Map<string, Row>();
      for (const o of items) {
        const m = new Date(o.createdAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        const cur = byMonth.get(m) ?? { Month: m, Orders: 0, Revenue: 0, Subtotal: 0, Discount: 0, Shipping: 0, Tax: 0, Total: 0 };
        cur.Orders = (cur.Orders as number) + 1;
        cur.Subtotal = (cur.Subtotal as number) + o.subtotal;
        cur.Discount = (cur.Discount as number) + o.discount;
        cur.Shipping = (cur.Shipping as number) + o.shipping;
        cur.Tax = (cur.Tax as number) + o.tax;
        cur.Total = (cur.Total as number) + o.total;
        cur.Revenue = cur.Total;
        byMonth.set(m, cur);
      }
      return [...byMonth.values()].sort((a, b) => String(a.Month).localeCompare(String(b.Month)));
    }
    case "products": return items.map((p) => ({ SKU: p.sku, Name: p.name.split("·")[0].trim(), Price: p.price, Sold: p.sold, Revenue: p.sold * p.price, Stock: p.stock, Status: p.status }));
    case "dealers": return items.map((d) => ({ Company: d.company, City: d.city, Commission: `${d.commission}%`, Orders: d.ordersCount, Revenue: d.revenue, Rating: d.rating, Status: d.status }));
    case "brands": return items.map((b) => ({ Name: b.name, Products: b.products, Website: b.website.replace(/^https?:\/\//, ""), Featured: b.featured ? "Yes" : "No", Status: b.status }));
    case "categories": return items.map((c) => ({ Name: c.name, Type: c.parentId ? "Child" : "Parent", Featured: c.featured ? "Yes" : "No", Sort: c.sortOrder, Status: c.status }));
    case "customers": return items.map((c) => ({ Name: c.name, Email: c.email, Tier: c.tier, Orders: c.orders, Spend: c.lifetimeSpend, Points: c.rewardPoints, Status: c.status }));
    case "inventory": return items.map((i) => ({ SKU: i.sku, Name: i.productName, Stock: i.stock, AlertAt: i.lowStockAlert, Status: i.stock === 0 ? "out" : i.stock <= i.lowStockAlert ? "low" : "ok" }));
    case "taxes": return items.map((o) => ({ Order: o.number, Customer: o.customerName, Month: new Date(o.createdAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }), Taxable: o.subtotal - o.discount, Tax: o.tax, Status: o.status }));
  }
}

function computeTotal(t: ReportId, rows: Row[]): number {
  switch (t) {
    case "revenue": return rows.reduce((s, r) => s + (r.Revenue as number), 0);
    case "sales": return rows.reduce((s, r) => s + (r.Total as number), 0);
    case "taxes": return rows.reduce((s, r) => s + (r.Tax as number), 0);
    case "products": return rows.reduce((s, r) => s + (r.Revenue as number), 0);
    default: return rows.length;
  }
}
