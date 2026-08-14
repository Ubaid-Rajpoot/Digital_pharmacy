import { NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { read } from "@/lib/db/store";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET(_request: NextRequest) {
  try {
    await requireAuth("dashboard");
    return read((db) => {
      const now = new Date();

      // ---------- KPIs ----------
      const revenueStatuses = ["delivered", "shipped", "processing", "packed", "pending"];
      const revenueOrders = db.orders.filter((o) => revenueStatuses.includes(o.status));
      const revenue = revenueOrders.reduce((s, o) => s + o.total, 0);
      const ordersToday = db.orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d.toDateString() === now.toDateString();
      }).length;
      const pendingOrders = db.orders.filter((o) => o.status === "pending").length;
      const deliveredOrders = db.orders.filter((o) => o.status === "delivered").length;
      const cancelledOrders = db.orders.filter((o) => o.status === "cancelled").length;
      const refundRequests = db.orders.filter((o) => o.status === "returned" || (o.refund && o.status !== "refunded")).length;
      const totalProducts = db.products.length;
      const activeProducts = db.products.filter((p) => p.status === "active" && !p.deletedAt).length;
      const outOfStock = db.products.filter((p) => p.stock === 0 && !p.deletedAt).length;
      const lowStock = db.products.filter((p) => p.stock > 0 && p.stock <= p.lowStockAlert && !p.deletedAt).length;
      const totalCategories = db.categories.filter((c) => !c.parentId).length;
      const totalBrands = db.brands.length;
      const totalDealers = db.dealers.length;
      const totalCustomers = db.customers.length;
      const newUsers30 = db.customers.filter((c) => now.getTime() - +new Date(c.joinedAt) < 30 * 86400000).length;
      const reviewsPending = db.reviews.filter((r) => r.status === "pending").length;
      const supportOpen = db.support.filter((s) => ["new", "open", "pending"].includes(s.status)).length;
      const subscribers = db.subscribers.filter((s) => s.status === "subscribed").length;
      const avgOrder = revenueOrders.length ? Math.round(revenue / revenueOrders.length) : 0;

      // ---------- charts ----------
      const last12: { label: string; revenue: number; orders: number; target: number; customers: number; cumulative: number }[] = [];
      let cumulativeCustomers = 0;
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthOrders = db.orders.filter((o) => {
          const od = new Date(o.createdAt);
          return od >= d && od < next;
        });
        const monthRevenue = monthOrders
          .filter((o) => revenueStatuses.includes(o.status))
          .reduce((s, o) => s + o.total, 0);
        const monthCustomers = db.customers.filter((c) => {
          const cd = new Date(c.joinedAt);
          return cd >= d && cd < next;
        }).length;
        cumulativeCustomers += monthCustomers;
        last12.push({
          label: MONTHS[d.getMonth()],
          revenue: monthRevenue,
          orders: monthOrders.length,
          target: Math.round(monthRevenue * 1.18),
          customers: monthCustomers,
          cumulative: cumulativeCustomers,
        });
      }

      const last14: { label: string; orders: number; revenue: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayOrders = db.orders.filter((o) => {
          const od = new Date(o.createdAt);
          return od.toDateString() === d.toDateString();
        });
        last14.push({
          label: DAYS[d.getDay()],
          orders: dayOrders.length,
          revenue: dayOrders.filter((o) => revenueStatuses.includes(o.status)).reduce((s, o) => s + o.total, 0),
        });
      }

      const topProducts = [...db.products]
        .filter((p) => !p.deletedAt)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5)
        .map((p) => ({
          id: p.id, name: p.name.split("·")[0].trim(), image: p.image,
          sold: p.sold, revenue: p.sold * p.price, stock: p.stock, sku: p.sku,
        }));

      const catRevenue = new Map<number, { name: string; revenue: number; orders: number }>();
      for (const o of revenueOrders) {
        for (const it of o.items) {
          const p = db.products.find((x) => x.id === it.productId);
          if (!p) continue;
          const cat = db.categories.find((c) => c.id === p.categoryId);
          const key = p.categoryId;
          const cur = catRevenue.get(key) ?? { name: cat?.name ?? "Other", revenue: 0, orders: 0 };
          cur.revenue += it.price * it.qty;
          cur.orders += 1;
          catRevenue.set(key, cur);
        }
      }
      const topCategories = [...catRevenue.entries()]
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([id, v]) => ({ id, ...v }));

      const ordersByStatus = Object.fromEntries(
        ["pending", "processing", "packed", "shipped", "delivered", "cancelled", "returned", "refunded"].map((s) => [
          s,
          db.orders.filter((o) => o.status === s).length,
        ])
      );

      const stockAlerts = db.products
        .filter((p) => p.stock <= p.lowStockAlert && !p.deletedAt)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 6)
        .map((p) => ({ id: p.id, name: p.name, sku: p.sku, image: p.image, stock: p.stock, lowStockAlert: p.lowStockAlert }));

      const recentOrders = db.orders
        .slice()
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 6)
        .map((o) => ({
          id: o.id, number: o.number, customerName: o.customerName, total: o.total,
          status: o.status, paymentMethod: o.paymentMethod, createdAt: o.createdAt,
        }));

      const warehouseUtil = db.warehouses.map((w) => ({
        id: w.id, name: w.name, city: w.city, used: w.used, capacity: w.capacity,
        pct: Math.round((w.used / w.capacity) * 100), status: w.status,
      }));

      return ok({
        kpis: {
          revenue, ordersToday, pendingOrders, deliveredOrders, cancelledOrders, refundRequests,
          totalProducts, activeProducts, outOfStock, lowStock, totalCategories, totalBrands,
          totalDealers, totalCustomers, newUsers30, reviewsPending, supportOpen, subscribers, avgOrder,
        },
        charts: {
          salesByMonth: last12.map((m) => ({ label: m.label, revenue: m.revenue, orders: m.orders })),
          revenue: last12.map((m) => ({ label: m.label, actual: m.revenue, target: m.target })),
          ordersByDay: last14.map((d) => ({ label: d.label, orders: d.orders, revenue: d.revenue })),
          topProducts,
          topCategories,
          customerGrowth: last12.map((m) => ({ label: m.label, newCustomers: m.customers, total: m.cumulative })),
          ordersByStatus,
          warehouseUtil,
        },
        alerts: {
          stockAlerts,
          reviewsPending,
          refundRequests,
          supportOpen,
          dealerPending: db.dealers.filter((d) => d.status === "pending").length,
          unreadNotifications: db.notifications.filter((n) => !n.read).length,
        },
        recentOrders,
      });
    });
  } catch (e) {
    return handleError(e);
  }
}
