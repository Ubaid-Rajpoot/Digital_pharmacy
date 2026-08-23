Switch uploads from local disk (public/uploads/) to Vercel Blob storage using the BLOB_STORE_ID / BLOB_READ_WRITE_TOKEN the user added to .env.local (and Vercel).

STEPS:
1. Install `@vercel/blob` (npm).
2. New shared helper `lib/blob.ts` — `putInBlob(file, folder)`:
   - Uses `BLOB_READ_WRITE_TOKEN` (required) and `BLOB_STORE_ID` (when present) from env
   - Uploads with `put("folder/<timestamp>-<sanitized-name>", file, { access: "public", addRandomSuffix: true })` so filenames collide-proof
   - Throws a clear error when the token is missing (uploads disabled)
   - Returns `{ url, pathname }` where url is the permanent public blob URL
3. Update `app/api/admin/upload/route.ts` (admin media uploads): keep existing validation (allowed extensions, 15 MB, requireAuth) — replace fs/mkdir/writeFile with `putInBlob(file, "uploads")`, return the blob URL.
4. Update `app/api/store/prescription/route.ts` (customer Rx uploads): keep validation (JPG/PNG/WEBP/PDF, 10 MB, patient name) — replace disk write with `putInBlob(file, "prescriptions")`; the media-library record and the order's attached-prescription URL keep working unchanged, now pointing at the blob URL.
5. Update `.env.example` (document both BLOB vars) and README (replace the "uploads are local-disk/ephemeral" note with Vercel Blob; add the two env vars to the deployment table).
6. Verify: restart dev server (new dependency + env), upload a real test file to /api/store/prescription via curl, confirm the response URL is on *.public.blob.vercel-storage.com and serves the file; run tsc + production build.
7. Commit and push to main (triggers the CI workflow — note: CI still needs the 3 Vercel secrets the user is setting up; unrelated to this change).