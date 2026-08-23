import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { audit, clientIp, fail, handleError, ok, parseBody } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { DEFAULT_ADMIN_PASSWORD, hashPassword, verifyPassword } from "@/lib/password";
import { nextId, read, write } from "@/lib/db/store";
import type { AdminUser } from "@/lib/db/types";

const attempts = new Map<string, { n: number; reset: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

/** Constant-time string comparison (falls back to false on length mismatch). */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const window = attempts.get(ip);
    if (window && window.n >= MAX_ATTEMPTS && Date.now() < window.reset) {
      return fail("Too many attempts. Try again in 10 minutes.", 429);
    }

    const body = await parseBody<{ email: string; password: string }>(request);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    // ----------------------------------------------------------
    // Bootstrap admin: credentials live in the environment secrets
    // (ADMIN_EMAIL / ADMIN_PASSWORD). The first sign-in with them
    // provisions a Super Admin account in the database — no seeded
    // credentials needed to run production.
    // ----------------------------------------------------------
    const bootstrapEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const bootstrapPassword = process.env.ADMIN_PASSWORD || "";
    const isBootstrapAttempt = Boolean(bootstrapEmail && bootstrapPassword && email === bootstrapEmail);

    let user = await read((db) => db.users.find((u) => u.email.toLowerCase() === email && u.status === "active"));

    if (!user && isBootstrapAttempt && safeEqual(password, bootstrapPassword)) {
      user = await write(async (db) => {
        const now = new Date().toISOString();
        const created: AdminUser = {
          id: await nextId(db),
          name: process.env.ADMIN_NAME?.trim() || "Administrator",
          email,
          role: "Super Admin",
          status: "active",
          avatar: "",
          lastLogin: now,
          twoFactor: false,
          createdAt: now,
          passwordHash: hashPassword(password),
        };
        db.users.unshift(created);
        audit(db, created.name, "provisioned", `Bootstrap admin ${email} (from environment credentials)`, [], ip);
        return created;
      });
    }

    // Accounts with a scrypt hash verify against it; accounts seeded before
    // hashing existed (missing/legacy hash) accept the default password and
    // are upgraded below on first successful login.
    const valid =
      user !== undefined &&
      (user.passwordHash?.startsWith("scrypt:")
        ? verifyPassword(password, user.passwordHash)
        : safeEqual(password, DEFAULT_ADMIN_PASSWORD));
    if (!valid) {
      const cur = attempts.get(ip) ?? { n: 0, reset: Date.now() + WINDOW_MS };
      cur.n += 1;
      attempts.set(ip, cur);
      return fail("Invalid email or password.", 401);
    }

    attempts.delete(ip);
    await createSession(user!.id);
    await write((db) => {
      const u = db.users.find((x) => x.id === user!.id);
      if (u) {
        u.lastLogin = new Date().toISOString();
        // Transparently upgrade pre-hashing accounts on first login.
        if (!u.passwordHash?.startsWith("scrypt:")) u.passwordHash = hashPassword(password);
      }
      audit(db, user!.name, "signed in", "Admin panel", [], ip);
    });
    return ok({
      user: { id: user!.id, name: user!.name, email: user!.email, role: user!.role, avatar: user!.avatar },
    });
  } catch (e) {
    return handleError(e);
  }
}
