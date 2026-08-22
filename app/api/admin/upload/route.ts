// ============================================================
// MEDORA — local file upload
// Saves uploaded files into public/uploads/ so they are served
// at /uploads/<file>. Swap for S3/Cloudinary later if needed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAuth } from "@/lib/auth";
import { handleError } from "@/lib/api";

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
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });

    // Unique, safe filename: timestamp + sanitized original name
    const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);

    return NextResponse.json({
      url: `/uploads/${filename}`,
      name: file.name,
      size: file.size,
    });
  } catch (e) {
    return handleError(e);
  }
}
