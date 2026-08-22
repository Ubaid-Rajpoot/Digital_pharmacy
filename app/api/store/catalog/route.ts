// ============================================================
// MEDORA — public storefront catalog
// Serves the live catalogue (products + categories) straight
// from MongoDB, so the storefront reflects admin edits.
// ============================================================

import { NextResponse } from "next/server";
import { read } from "@/lib/db/store";
import { buildStorefrontCatalog } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await read((db) => buildStorefrontCatalog(db));
    return NextResponse.json(catalog, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (e) {
    console.error("[store-catalog]", e);
    return NextResponse.json({ error: "Failed to load catalogue." }, { status: 500 });
  }
}
