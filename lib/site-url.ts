// ============================================================
// MEDORA — canonical site URL helper
// NEXT_PUBLIC_SITE_URL must be an absolute URL, but values like
// "my-app.vercel.app" (no scheme) used to crash `new URL()` at
// build time. Normalize once here; every consumer stays safe.
// ============================================================

function normalizeSiteUrl(raw: string | undefined, fallback = "http://localhost:3000") {
  if (!raw || !raw.trim()) return fallback;
  const value = raw.trim().replace(/^\/+/, "");
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme).toString().replace(/\/+$/, "");
  } catch {
    return fallback;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
