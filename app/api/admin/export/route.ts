import { NextRequest } from "next/server";
import { applyQuery, fail, handleError, parseQuery, productsSortValue } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { read } from "@/lib/db/store";

const RESOURCES = [
  "products", "categories", "brands", "dealers", "orders", "customers",
  "reviews", "inventory", "coupons", "subscribers", "users",
] as const;

const DEFAULT_COLUMNS: Record<string, string[]> = {
  products: ["id", "name", "sku", "barcode", "brandId", "categoryId", "stock", "price", "mrp", "costPrice", "tax", "status", "featured", "sold", "rating"],
  categories: ["id", "name", "slug", "parentId", "featured", "sortOrder", "status"],
  brands: ["id", "name", "website", "featured", "status", "products"],
  dealers: ["id", "company", "contactPerson", "email", "phone", "city", "commission", "status", "rating"],
  orders: ["id", "number", "customerName", "customerEmail", "total", "status", "paymentStatus", "paymentMethod", "createdAt"],
  customers: ["id", "name", "email", "phone", "tier", "orders", "lifetimeSpend", "rewardPoints", "status"],
  reviews: ["id", "productName", "customerName", "rating", "status", "reported", "spamScore", "createdAt"],
  inventory: ["productId", "productName", "sku", "warehouseId", "stock", "lowStockAlert"],
  coupons: ["id", "code", "type", "value", "minOrder", "uses", "maxUses", "status"],
  subscribers: ["id", "email", "name", "source", "status", "joinedAt", "campaigns"],
  users: ["id", "name", "email", "role", "status", "twoFactor", "lastLogin"],
};

function toRow(item: Record<string, unknown>, cols: string[]): string[] {
  return cols.map((c) => {
    const v = item[c];
    if (v === null || v === undefined) return "";
    if (typeof v === "object") return JSON.stringify(v).replace(/"/g, '""');
    return String(v);
  });
}

export async function GET(request: NextRequest) {
  try {
    const resource = request.nextUrl.searchParams.get("resource") ?? "products";
    const format = request.nextUrl.searchParams.get("format") ?? "csv";
    if (!(RESOURCES as readonly string[]).includes(resource)) return fail("Unknown resource.", 404);
    await requireAuth(`${resource}.export`);

    const q = parseQuery(request.nextUrl);
    const data = await read((db) => {
      let rows = db[resource as keyof typeof db] as unknown as Record<string, unknown>[];
      if (resource === "products") rows = rows.filter((r) => !r.deletedAt);
      return applyQuery(rows, q, resource, (key, row) =>
        resource === "products" ? productsSortValue(db, key, row) : (row[key] as string | number | null | undefined)
      ).items;
    });

    const cols = DEFAULT_COLUMNS[resource];
    const header = cols.join(",");
    const lines = data.map((row) => toRow(row, cols).join(","));
    const csv = [header, ...lines].join("\r\n");
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === "xlsx") {
      // Excel-openable HTML table (no binary libs needed)
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1"><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>${data
        .map((row) => `<tr>${toRow(row, cols).map((c) => `<td>${String(c).replace(/</g, "&lt;")}</td>`).join("")}</tr>`)
        .join("")}</table></body></html>`;
      return new Response(html, {
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": `attachment; filename="medora-${resource}-${stamp}.xls"`,
        },
      });
    }

    return new Response("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="medora-${resource}-${stamp}.csv"`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
