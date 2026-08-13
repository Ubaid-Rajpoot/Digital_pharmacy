import { NextRequest } from "next/server";
import { audit, clientIp, fail, handleError, ok, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { write } from "@/lib/db/store";
import type { DbShape } from "@/lib/db/types";

const RESOURCES = [
  "products", "categories", "brands", "dealers", "orders", "customers",
  "reviews", "inventory", "coupons", "content", "media", "support",
  "subscribers", "users", "notifications", "faqs", "menu",
  "purchaseOrders", "flashSales", "socials",
] as const;

const LABELS: Record<string, string> = {
  products: "Products", categories: "Categories", brands: "Brands", dealers: "Dealers",
  orders: "Orders", customers: "Customers", reviews: "Reviews", coupons: "Coupons",
  content: "Content", media: "Media", support: "Support items", subscribers: "Subscribers",
  users: "Admin users", notifications: "Notifications", faqs: "FAQs", menu: "Menu links",
  purchaseOrders: "Purchase orders", flashSales: "Flash sales",
};

export async function POST(request: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await ctx.params;
    if (!(RESOURCES as readonly string[]).includes(resource)) return fail("Unknown resource.", 404);
    const user = await requireAuth(`${resource}.delete`);
    const body = await parseBody<{ action: string; ids: number[]; payload?: Record<string, unknown> }>(request);
    const { action, ids } = body;
    const ip = clientIp(request);
    if (!Array.isArray(ids) || ids.length === 0) return fail("Select at least one record.", 400);

    return write((db) => {
      const rows = db[resource as keyof DbShape] as unknown as (Record<string, unknown> & { id: number })[];
      let count = 0;

      if (action === "delete") {
        for (const id of ids) {
          const row = rows.find((r) => r.id === id);
          if (!row) continue;
          if (resource === "products") {
            if (row.deletedAt) {
              const idx = rows.indexOf(row);
              if (idx > -1) rows.splice(idx, 1); // permanently remove from trash
            } else {
              row.deletedAt = new Date().toISOString(); // soft delete
            }
            count++;
          } else {
            const idx = rows.indexOf(row);
            if (idx > -1) rows.splice(idx, 1);
            count++;
          }
        }
      } else if (action === "restore") {
        for (const id of ids) {
          const row = rows.find((r) => r.id === id);
          if (row && resource === "products") {
            row.deletedAt = null;
            if (row.status === "archived") row.status = "active";
            count++;
          }
        }
      } else if (action === "update") {
        for (const id of ids) {
          const row = rows.find((r) => r.id === id);
          if (!row) continue;
          for (const [k, v] of Object.entries(body.payload ?? {})) {
            if (k === "id") continue;
            row[k] = v;
          }
          count++;
        }
        if (resource === "products" && typeof body.payload?.stock === "number") {
          for (const inv of db.inventory) {
            if (ids.includes(inv.productId)) {
              inv.stock = body.payload!.stock as number;
              inv.updatedAt = new Date().toISOString();
            }
          }
        }
      } else {
        return fail(`Unknown bulk action: ${action}`, 400);
      }

      // recalc brand counters
      if (resource === "brands" || resource === "products") {
        for (const b of db.brands) {
          b.products = db.products.filter((p) => p.brandId === b.id && !p.deletedAt).length;
        }
      }

      audit(db, user.name, `bulk ${action}`, `${LABELS[resource] ?? resource} (${count} selected)`, [], ip);
      return ok({ count });
    });
  } catch (e) {
    return handleError(e);
  }
}
