// ============================================================
// MEDORA CONTROL CENTRE — deployment health check
// GET /api/health reports whether the required environment
// variables are present (booleans only, never values) and
// whether MongoDB is reachable from this serverless function.
// Use it to diagnose production setup problems, e.g. after a
// fresh Vercel deploy: https://<your-site>/api/health
// ============================================================

import { pingDb } from "@/lib/db/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const env = {
    mongodbUri: Boolean(process.env.MONGODB_URI),
    mongodbDb: process.env.MONGODB_DB || "medora (default)",
    adminEmail: Boolean(process.env.ADMIN_EMAIL),
    adminPassword: Boolean(process.env.ADMIN_PASSWORD),
    authSecret: Boolean(process.env.AUTH_SECRET),
    seedDemoData: process.env.SEED_DEMO_DATA === "false" ? "disabled" : "enabled (default)",
  };
  const started = Date.now();
  try {
    await pingDb();
    return Response.json({
      ok: true,
      database: "connected",
      pingMs: Date.now() - started,
      env,
    });
  } catch (e) {
    return Response.json(
      {
        ok: false,
        database: "unreachable",
        error: e instanceof Error ? e.message : String(e),
        pingMs: Date.now() - started,
        env,
      },
      { status: 500 }
    );
  }
}
