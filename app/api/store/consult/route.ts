// ============================================================
// MEDORA — doctor consultation booking (public storefront API)
// Consultation requests land in the admin Support Center as
// tickets so the care team can confirm the slot.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { nextId, write } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { name?: string; phone?: string; specialty?: string; slot?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 60);
  const phone = String(body.phone ?? "").trim();
  const specialty = String(body.specialty ?? "General").trim().slice(0, 60);
  const slot = String(body.slot ?? "flexible").trim().slice(0, 60);
  if (name.length < 3) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });

  return write(async (db) => {
    db.support.unshift({
      id: await nextId(db),
      kind: "ticket",
      subject: `Consultation — ${specialty} (${slot})`,
      customerName: name,
      customerEmail: "",
      message: `${name} requested a ${specialty.toLowerCase()} consultation. Preferred slot: ${slot}. Phone: ${phone}.`,
      priority: "medium",
      status: "new",
      assignee: "",
      replies: [],
      createdAt: new Date().toISOString(),
    });
    db.notifications.unshift({
      id: await nextId(db),
      type: "message",
      title: "New consultation request",
      body: `${name} booked a ${specialty.toLowerCase()} consultation (${slot}).`,
      at: new Date().toISOString(),
      read: false,
      href: "/admin/support",
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  });
}
