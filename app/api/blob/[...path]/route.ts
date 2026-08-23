// ============================================================
// MEDORA — private Blob file server
// Files stored in a PRIVATE Vercel Blob store are streamed through
// this route (the SDK fetches them server-side with the token).
// Pathnames carry a timestamp + random suffix, so they are not
// guessable — same exposure model as the public-URL stores.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const pathname = (path ?? []).map(decodeURIComponent).join("/").replace(/^\/+/, "");
  // Only plain blob pathnames — block traversal/encoded tricks.
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(pathname)) {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: "Blob storage not configured." }, { status: 500 });

  // Try private first (this route exists for private stores), then public.
  const result = await get(pathname, { access: "private", token }).catch(() => null);
  const fallback = result ? null : await get(pathname, { access: "public", token }).catch(() => null);
  const blob = result?.statusCode === 200 ? result : fallback?.statusCode === 200 ? fallback : null;

  if (!blob) return NextResponse.json({ error: "File not found." }, { status: 404 });

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType || "application/octet-stream",
      "Content-Disposition": blob.blob.contentDisposition || "inline",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
