// ============================================================
// MEDORA — pharmacist chat intake (public storefront API)
// Stores each customer message as a SupportTicket (kind "chat")
// so the admin Support Center sees the real conversation. The
// instant reply on the storefront stays scripted — there is no
// AI/SMS provider wired up in this demo.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { nextId, write } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { name?: string; message?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 60) || "Storefront visitor";
  const message = String(body.message ?? "").trim().slice(0, 1500);
  if (message.length < 2) return NextResponse.json({ error: "Please type a message." }, { status: 400 });

  return write(async (db) => {
    db.support.unshift({
      id: await nextId(db),
      kind: "chat",
      subject: `Chat — ${name}`,
      customerName: name,
      customerEmail: "",
      message,
      priority: "medium",
      status: "new",
      assignee: "",
      replies: [],
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  });
}
