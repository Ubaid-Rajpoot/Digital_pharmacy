import { NextRequest } from "next/server";
import { audit, clientIp, fail, handleError, ok, parseBody } from "@/lib/api";
import { createSession, DEMO_PASSWORD } from "@/lib/auth";
import { read, write } from "@/lib/db/store";

const attempts = new Map<string, { n: number; reset: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

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

    const user = await read((db) =>
      db.users.find((u) => u.email.toLowerCase() === email && u.status === "active")
    );

    const valid = user !== undefined && password === DEMO_PASSWORD;
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
      if (u) u.lastLogin = new Date().toISOString();
      audit(db, user!.name, "signed in", "Admin panel", [], ip);
    });
    return ok({
      user: { id: user!.id, name: user!.name, email: user!.email, role: user!.role, avatar: user!.avatar },
    });
  } catch (e) {
    return handleError(e);
  }
}
