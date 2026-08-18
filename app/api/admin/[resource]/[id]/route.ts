import { NextRequest } from "next/server";
import { audit, clientIp, fail, handleError, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { read, write } from "@/lib/db/store";
import type { DbShape, Order, OrderStatus } from "@/lib/db/types";

type Row = Record<string, unknown> & { id: number };

const RESOURCES = [
  "products", "categories", "brands", "dealers", "orders", "customers",
  "reviews", "inventory", "warehouses", "coupons", "content", "media", "support",
  "subscribers", "users", "notifications", "faqs", "menu",
  "purchaseOrders", "stockAdjustments", "flashSales", "socials", "settings",
] as const;
type Resource = (typeof RESOURCES)[number];

const LABELS: Record<string, string> = {
  products: "Product", categories: "Category", brands: "Brand", dealers: "Dealer",
  orders: "Order", customers: "Customer", reviews: "Review", coupons: "Coupon",
  content: "Content", media: "Media", support: "Support item", subscribers: "Subscriber",
  users: "Admin user", notifications: "Notification", faqs: "FAQ", menu: "Menu link",
  purchaseOrders: "Purchase order", flashSales: "Flash sale", settings: "Settings",
};

function isResource(r: string): r is Resource {
  return (RESOURCES as readonly string[]).includes(r);
}

/** warehouses & purchase orders live under the inventory module's permission. */
const permissionFor = (r: string) => (r === "warehouses" ? "inventory" : r);

function collection(db: DbShape, r: Resource): Row[] {
  return (r === "settings" ? [db.settings as unknown as Row] : (db[r] as unknown as Row[]));
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending", processing: "Processing", packed: "Packed", shipped: "Shipped",
  delivered: "Delivered", cancelled: "Cancelled", returned: "Returned", refunded: "Refunded",
};

export async function GET(request: NextRequest, ctx: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const { resource, id } = await ctx.params;
    if (!isResource(resource)) return fail("Unknown resource.", 404);
    await requireAuth(permissionFor(resource));
    return read((db) => {
      if (resource === "settings") return ok(db.settings);
      const row = collection(db, resource).find((r) => r.id === Number(id));
      if (!row) return fail("Record not found.", 404);
      return ok(row);
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const { resource, id } = await ctx.params;
    if (!isResource(resource)) return fail("Unknown resource.", 404);
    const user = await requireAuth(`${permissionFor(resource)}.edit`);
    const body = await parseBody<Record<string, unknown>>(request);
    const ip = clientIp(request);
    const changes: { field: string; from: unknown; to: unknown }[] = [];
    const numId = Number(id);

    return write((db) => {
      const rows = collection(db, resource);
      const row =
        resource === "settings"
          ? (db.settings as unknown as Row)
          : resource === "inventory"
            ? rows.find((r) => r.productId === numId)
            : rows.find((r) => r.id === numId);
      if (!row) throw new Error("NOT_FOUND");

      for (const [k, v] of Object.entries(body)) {
        if (k === "id" || k === "createdAt" || k === "deletedAt") continue;
        if (JSON.stringify(row[k]) !== JSON.stringify(v)) changes.push({ field: k, from: row[k], to: v });
        row[k] = v;
      }

      // ---- resource-specific side effects ----
      if (resource === "products") {
        if (typeof row.mrp === "number" && typeof row.price === "number") {
          row.discount = Math.round((1 - row.price / row.mrp) * 100);
        }
        const inv = db.inventory.find((i) => i.productId === row.id);
        if (inv && typeof row.stock === "number") {
          inv.stock = row.stock;
          inv.updatedAt = new Date().toISOString();
        }
        for (const b of db.brands) {
          b.products = db.products.filter((p) => p.brandId === b.id && !p.deletedAt).length;
        }
      }

      if (resource === "orders") {
        const before = row.status;
        handleOrderTransition(db, row as unknown as Order, body, user.name, ip);
        const after = row.status;
        if (before !== after) return ok(row); // audited inside the transition
      }

      if (resource === "inventory") {
        // body: { delta: number, reason: string }
        const delta = Number(body.delta ?? 0);
        const reason = String(body.reason ?? "Manual adjustment");
        const oldStock = Number(row.stock ?? 0);
        row.stock = Math.max(0, oldStock + delta);
        row.updatedAt = new Date().toISOString();
        const prod = db.products.find((p) => p.id === numId);
        if (prod) {
          prod.stock = row.stock as number;
          prod.deletedAt = null;
        }
        db.stockAdjustments.unshift({
          id: ++db.seq,
          productId: numId,
          productName: String(row.productName ?? "Product"),
          warehouseId: Number(row.warehouseId ?? 1),
          delta,
          reason,
          by: user.name,
          at: new Date().toISOString(),
        });
        if (delta < 0) {
          db.notifications.unshift({
            id: ++db.seq,
            type: "stock",
            title: "Stock adjusted",
            body: `${row.productName} adjusted by ${delta} units (${reason}).`,
            at: new Date().toISOString(),
            read: false,
            href: "/admin/inventory",
          });
        }
        return ok(row);
      }

      if (resource === "settings") {
        return ok(db.settings);
      }

      audit(db, user.name, "updated", `${LABELS[resource] ?? resource} #${numId}`, changes, ip);
      return ok(row);
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const { resource, id } = await ctx.params;
    if (!isResource(resource)) return fail("Unknown resource.", 404);
    const user = await requireAuth(`${permissionFor(resource)}.delete`);
    const numId = Number(id);
    const ip = clientIp(request);
    return write((db) => {
      const rows = collection(db, resource);
      const idx = rows.findIndex((r) => r.id === numId);
      if (idx === -1) throw new Error("NOT_FOUND");

      if (resource === "products") {
        const row = rows[idx];
        if (row.deletedAt) {
          rows.splice(idx, 1); // permanent delete from trash
          audit(db, user.name, "deleted permanently", `Product #${numId}`, [], ip);
        } else {
          row.deletedAt = new Date().toISOString(); // soft delete
          audit(db, user.name, "deleted", `Product #${numId} — ${row.name}`, [], ip);
        }
        for (const b of db.brands) {
          b.products = db.products.filter((p) => p.brandId === b.id && !p.deletedAt).length;
        }
        return ok({ id: numId, soft: true });
      }

      if (resource === "users" && rows[idx].id === user.id) {
        return fail("You cannot delete your own account.", 400);
      }
      const [removed] = rows.splice(idx, 1);
      audit(db, user.name, "deleted", `${LABELS[resource] ?? resource} #${numId}`, [], ip);
      return ok({ id: numId, removed: Boolean(removed) });
    });
  } catch (e) {
    return handleError(e);
  }
}

// ------------------------------------------------------------
// Order status transitions — timeline, payment, notifications
// ------------------------------------------------------------

function handleOrderTransition(db: DbShape, order: Order, body: Record<string, unknown>, actor: string, ip: string) {
  const next = body.status as OrderStatus | undefined;
  if (!next || next === order.status) return;

  const labels: Record<OrderStatus, string> = {
    pending: "Order placed",
    processing: "Order confirmed",
    packed: "Packed & labelled",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
    refunded: "Refunded",
  };
  order.timeline = order.timeline || [];
  order.timeline.push({
    label: labels[next],
    at: new Date().toISOString(),
    note: body.note ? String(body.note) : undefined,
  });

  if (next === "shipped" || next === "delivered") {
    if (!order.tracking) {
      order.tracking = {
        carrier: String(body.carrier ?? "Delhivery"),
        number: String(body.trackingNumber ?? `BL${Math.floor(1000000000 + Math.random() * 8999999999)}IN`),
        url: "#",
      };
    } else if (body.trackingNumber) {
      order.tracking.number = String(body.trackingNumber);
    }
  }
  if (next === "cancelled") order.paymentStatus = "refunded";
  if (next === "delivered") order.paymentStatus = "paid";

  db.notifications.unshift({
    id: ++db.seq,
    type: "order",
    title: `Order ${order.number} — ${STATUS_LABEL[next]}`,
    body: `Order from ${order.customerName} moved to ${STATUS_LABEL[next]} by ${actor}.`,
    at: new Date().toISOString(),
    read: false,
    href: "/admin/orders",
  });

  audit(db, actor, "updated status", `Order ${order.number} → ${STATUS_LABEL[next]}`, [
    { field: "status", from: order.status, to: next },
  ], ip);
}
