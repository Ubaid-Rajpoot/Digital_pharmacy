// ============================================================
// MEDORA CONTROL CENTRE — API helpers (server)
// Generic list/search/filter/sort/paginate + error + audit.
// ============================================================

import type { DbShape } from "@/lib/db/types";

export type ListQuery = {
  search?: string;
  filters?: Record<string, unknown>;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export function parseQuery(url: URL): ListQuery {
  const raw = url.searchParams.get("q");
  if (!raw) return { page: 1, pageSize: 10 };
  try {
    const q = JSON.parse(raw);
    return {
      search: q.search || "",
      filters: q.filters || {},
      sort: q.sort || "id",
      dir: q.dir === "asc" ? "asc" : "desc",
      page: Math.max(1, Number(q.page) || 1),
      pageSize: Math.min(100, Math.max(1, Number(q.pageSize) || 10)),
    };
  } catch {
    return { page: 1, pageSize: 10 };
  }
}

export async function parseBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("INVALID_BODY");
  }
}

/** Fields searched by the generic `search` term, per resource. */
const SEARCH_FIELDS: Record<string, string[]> = {
  products: ["name", "sku", "barcode", "tags"],
  categories: ["name", "slug"],
  brands: ["name", "website"],
  dealers: ["company", "contactPerson", "email", "city"],
  orders: ["number", "customerName", "customerEmail", "phone"],
  customers: ["name", "email", "phone"],
  reviews: ["productName", "customerName", "title", "body"],
  inventory: ["productName", "sku"],
  coupons: ["code", "description"],
  content: ["label", "section", "key"],
  media: ["name", "folder"],
  support: ["subject", "customerName", "customerEmail", "message"],
  subscribers: ["email", "name"],
  users: ["name", "email", "role"],
  notifications: ["title", "body"],
  audit: ["user", "action", "target"],
  faqs: ["question", "answer"],
  purchaseOrders: ["number", "supplier"],
  stockAdjustments: ["productName", "reason"],
  flashSales: ["title"],
};

export function applyQuery<T extends Record<string, unknown>>(
  items: T[],
  q: ListQuery,
  resource: string
): { items: T[]; total: number; page: number; pageSize: number; totalPages: number } {
  let out = items;

  if (q.search) {
    const fields = SEARCH_FIELDS[resource] || ["name"];
    const needle = q.search.toLowerCase();
    out = out.filter((it) =>
      fields.some((f) => String((it as Record<string, unknown>)[f] ?? "").toLowerCase().includes(needle))
    );
  }

  const filters = q.filters || {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === "" || value === null || value === undefined) continue;
    if (key === "deleted") {
      const wantDeleted = value === true || value === "true";
      out = out.filter((it) => (wantDeleted ? Boolean(it.deletedAt) : !it.deletedAt));
      continue;
    }
    if (Array.isArray(value)) {
      const arr = value.map(String);
      out = out.filter((it) => arr.includes(String((it as Record<string, unknown>)[key])));
      continue;
    }
    out = out.filter((it) => String((it as Record<string, unknown>)[key]) === String(value));
  }

  if (q.sort) {
    const dir = q.dir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      const av = (a as Record<string, unknown>)[q.sort!];
      const bv = (b as Record<string, unknown>)[q.sort!];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  }

  const total = out.length;
  const page = q.page || 1;
  const pageSize = q.pageSize || 10;
  return {
    items: out.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function ok(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function fail(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function handleError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg === "UNAUTHORIZED") return fail("Please sign in to continue.", 401);
  if (msg === "FORBIDDEN") return fail("You don't have permission for this action.", 403);
  if (msg === "INVALID_BODY") return fail("Invalid request body.", 422);
  if (msg === "NOT_FOUND") return fail("Record not found.", 404);
  console.error("[admin-api]", e);
  return fail("Something went wrong. Please try again.", 500);
}

export function audit(
  db: DbShape,
  user: string,
  action: string,
  target: string,
  changes: { field: string; from: unknown; to: unknown }[],
  ip: string
) {
  db.audit.unshift({
    id: ++db.seq,
    user,
    action,
    target,
    at: new Date().toISOString(),
    ip,
    changes,
  });
  // keep the log bounded
  if (db.audit.length > 500) db.audit.length = 500;
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "127.0.0.1";
}
