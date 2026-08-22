// ============================================================
// MEDORA — prescription upload (public storefront API)
// Customers attach an Rx at checkout; the file is stored under
// public/uploads/prescriptions/ and registered in the media
// library so pharmacists can review it from the admin panel.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nextId, write } from "@/lib/db/store";

export const dynamic = "force-dynamic";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".pdf"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const patient = String(form.get("patient") ?? "").trim().slice(0, 60);
    if (!(file instanceof File) || !file.name) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "That file is too large — prescriptions can be up to 10 MB." }, { status: 400 });
    }
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: "Please upload a JPG, PNG, WEBP or PDF file." }, { status: 400 });
    }

    const dir = path.join(process.cwd(), "public", "uploads", "prescriptions");
    await mkdir(dir, { recursive: true });
    const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    const url = `/uploads/prescriptions/${filename}`;

    // Register in the media library (folder "prescriptions") so the admin
    // sees every uploaded Rx alongside order records.
    await write(async (db) => {
      db.media.unshift({
        id: await nextId(db),
        name: patient ? `Rx — ${patient} (${file.name})` : file.name,
        url,
        folder: "prescriptions",
        type: ext === ".pdf" ? "document" : "image",
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        createdAt: new Date().toISOString(),
      });
      return null;
    });

    return NextResponse.json({ url, name: file.name }, { status: 201 });
  } catch (e) {
    console.error("[store-prescription]", e);
    return NextResponse.json({ error: "Upload failed — please try again." }, { status: 500 });
  }
}
