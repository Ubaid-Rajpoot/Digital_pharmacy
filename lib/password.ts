// ============================================================
// Password hashing — scrypt via node:crypto (no dependencies).
// Hash format: scrypt:<salt-hex>:<key-hex>
// ============================================================

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "demo1234";

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

export function isHashed(password: string | undefined | null): boolean {
  return Boolean(password && password.startsWith("scrypt:"));
}

export function verifyPassword(password: string, stored: string | undefined | null): boolean {
  if (!stored) return false;
  if (!isHashed(stored)) {
    // Legacy plain value (e.g. "demo-only-hash" in early seeds) — constant-time
    // compare so we never leak timing information.
    const a = Buffer.from(password);
    const b = Buffer.from(stored);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  const [, saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  try {
    const expected = Buffer.from(keyHex, "hex");
    const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
