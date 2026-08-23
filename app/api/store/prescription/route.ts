// ============================================================
// MEDORA — prescription upload (public storefront API)
// Customers attach an Rx at checkout; the file is stored in
// Vercel Blob (permanent public URL) and registered in the
// media library so pharmacists can review it from the admin
// panel. Works identically in dev and on serverless deploys.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { nextId, write } from "@/lib/db/store";
import { putInBlob } from "@/lib/blob";

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
    const name = file.name.toLowerCase();
    const isPdf = name.endsWith(".pdf");
    if (![...ALLOWED_EXT].some((ext) => name.endsWith(ext))) {
      return NextResponse.json({ error: "Please upload a JPG, PNG, WEBP or PDF file." }, { status: 400 });
    }

    const { url } = await putInBlob(file, "prescriptions");

    // Register in the media library (folder "prescriptions") so the admin
    // sees every uploaded Rx alongside order records.
    await write(async (db) => {
      db.media.unshift({
        id: await nextId(db),
        name: patient ? `Rx — ${patient} (${file.name})` : file.name,
        url,
        folder: "prescriptions",
        type: isPdf ? "document" : "image",
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        createdAt: new Date().toISOString(),
      });
      return null;
    });

    return NextResponse.json({ url, name: file.name }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error && e.message.includes("BLOB_READ_WRITE_TOKEN")
      ? "Upload storage is not configured — please contact support."
      : "Upload failed — please try again.";
    console.error("[store-prescription]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
