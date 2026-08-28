// ============================================================
// MEDORA CONTROL CENTRE — auth & RBAC (server)
// HMAC-signed session cookies + role-based permissions.
// Swap the token store for real JWT/DB sessions in production.
// ============================================================

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { read } from "@/lib/db/store";
import type { AdminUser } from "@/lib/db/types";

const COOKIE = "medora_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const secret = () => process.env.AUTH_SECRET || "medora-dev-secret-change-me";

// Passwords are stored per-user as scrypt hashes (lib/password.ts). This is
// only the fallback for accounts created before hashing existed — override it
// by setting ADMIN_PASSWORD (used when seeding) in the environment.
export const DEMO_PASSWORD = "demo1234";

interface SessionPayload {
  uid: number;
  exp: number;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: SessionPayload): string {
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: number) {
  const payload: SessionPayload = { uid: userId, exp: Date.now() + SESSION_TTL_MS };
  const value = sign(payload);
  const jar = await cookies();
  jar.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await read((db) => db.users.find((u) => u.id === payload.uid && u.status === "active") ?? null);
  if (!user) {
    // Valid session pointing at a missing or disabled account — usually
    // means the users collection was rolled back or the account removed.
    console.warn("[auth] session valid but user missing", { uid: payload.uid });
  }
  return user;
}

/** Throws a Response (403/401) when unauthenticated / not permitted. */
export async function requireAuth(permission?: string): Promise<AdminUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (permission && !(await can(user.role, permission))) throw new Error("FORBIDDEN");
  return user;
}

// ------------------------------------------------------------
// RBAC — fine-grained permission checks
// ------------------------------------------------------------

export async function can(role: string, action: string): Promise<boolean> {
  const perms = await read(
    (db) => db.roles.find((r) => r.name === role)?.permissions ?? []
  );
  if (perms.includes("*")) return true;
  if (perms.includes(action)) return true;
  // a bare module grant (e.g. "products") covers its sub-actions
  if (perms.includes(action.split(".")[0])) return true;
  return false;
}

export async function rolePermissions(role: string): Promise<string[]> {
  return read((db) => db.roles.find((r) => r.name === role)?.permissions ?? []);
}

/** Modules the current role can administer (for the sidebar + UI gating). */
export async function grantedModules(user: AdminUser): Promise<string[]> {
  const perms = await rolePermissions(user.role);
  if (perms.includes("*")) return [...ALL_MODULES];
  const granted = new Set<string>();
  for (const p of perms) {
    if (p.includes(".")) granted.add(p.split(".")[0]);
    else granted.add(p);
  }
  const out: string[] = [];
  for (const m of ALL_MODULES) if (granted.has(m)) out.push(m);
  return out;
}

export const ALL_MODULES = [
  "dashboard", "products", "categories", "brands", "inventory", "orders",
  "customers", "reviews", "dealers", "coupons", "content", "media",
  "support", "newsletter", "reports", "users", "settings", "notifications",
  "audit", "security",
] as const;
