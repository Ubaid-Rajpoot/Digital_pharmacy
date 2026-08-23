// ============================================================
// MEDORA — admin media upload
// Validates the file, stores it in Vercel Blob (public URL) so it
// works identically in dev and on serverless deploys.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleError } from "@/lib/api";
import { putInBlob } from "@/lib/blob";

const ALLOWED_EXT = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif",
  ".mp4", ".webm",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
]);

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

export async function POST(request: NextRequest) {
  try {
    await requireAuth("media.create");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.name) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File is too large (max 15 MB)." }, { status: 400 });
    }
    const name = file.name.toLowerCase();
    if (![...ALLOWED_EXT].some((ext) => name.endsWith(ext))) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    const { url } = await putInBlob(file, "uploads");
    return NextResponse.json({ url, name: file.name, size: file.size });
  } catch (e) {
    return handleError(e);
  }
}
