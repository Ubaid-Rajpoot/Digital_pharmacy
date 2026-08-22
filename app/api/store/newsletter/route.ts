// ============================================================
// MEDORA — newsletter subscribe (public storefront API)
// Deduplicates by email and feeds the admin Newsletter module.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { nextId, write } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { email?: string; name?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim().slice(0, 60) || null;
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  return write(async (db) => {
    const existing = db.subscribers.find((s) => s.email.toLowerCase() === email);
    if (existing) {
      if (existing.status !== "subscribed") {
        existing.status = "subscribed";
        return NextResponse.json({ ok: true, reactivated: true });
      }
      return NextResponse.json({ ok: true, already: true });
    }
    db.subscribers.unshift({
      id: await nextId(db),
      email,
      name,
      source: "storefront",
      status: "subscribed",
      joinedAt: new Date().toISOString(),
      campaigns: 0,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  });
}
