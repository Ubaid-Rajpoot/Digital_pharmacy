// ============================================================
// MEDORA — Vercel Blob storage
// All uploads (admin media, customer prescriptions) go to the
// Vercel Blob store configured via BLOB_READ_WRITE_TOKEN
// (store-scoped; BLOB_STORE_ID is read by the SDK when needed).
//
// Newer Vercel Blob stores are PRIVATE by default — on those,
// files are stored privately and served through /api/blob/*
// (which streams them server-side with the token).
// ============================================================

import { put } from "@vercel/blob";

export type BlobFolder = "uploads" | "prescriptions";

export type StoredBlob = {
  /** Usable in <img src>/links — CDN url for public stores, /api/blob/* for private ones. */
  url: string;
  pathname: string;
  privateStore: boolean;
};

/**
 * Upload a file to Vercel Blob and return a URL every consumer can use.
 * Pathnames are prefixed with a folder and made collision-proof with a
 * timestamp prefix plus the SDK's random suffix.
 */
export async function putInBlob(file: File, folder: BlobFolder): Promise<StoredBlob> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Blob storage is not configured: BLOB_READ_WRITE_TOKEN is missing.");
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "file";
  const pathname = `${folder}/${Date.now()}-${safeBase}`;

  try {
    const blob = await put(pathname, file, { access: "public", addRandomSuffix: true, token });
    return { url: blob.url, pathname: blob.pathname, privateStore: false };
  } catch (e) {
    // Private stores reject public access — store privately instead and
    // serve through our own streaming route.
    if (!/private (access|store)/i.test(String((e as Error)?.message))) throw e;
    const blob = await put(pathname, file, { access: "private", addRandomSuffix: true, token });
    return { url: `/api/blob/${blob.pathname}`, pathname: blob.pathname, privateStore: true };
  }
}
