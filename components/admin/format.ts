// ============================================================
// Admin formatting helpers
// ============================================================

export const money = (n: number) => "Rs " + Math.round(n).toLocaleString("en-IN");

export const compactMoney = (n: number) => {
  if (n >= 10000000) return "Rs " + (n / 10000000).toFixed(1) + " Cr";
  if (n >= 100000) return "Rs " + (n / 100000).toFixed(1) + " L";
  if (n >= 1000) return "Rs " + (n / 1000).toFixed(1) + "k";
  return money(n);
};

export const compactNum = (n: number) => {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
};

export const timeAgo = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const diff = Date.now() - +new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
};

export const dateShort = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const dateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
};

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");

// ------------------------------------------------------------
// status → tone + label
// ------------------------------------------------------------

export const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "orange" },
  processing: { label: "Processing", tone: "blue" },
  packed: { label: "Packed", tone: "violet" },
  shipped: { label: "Shipped", tone: "blue" },
  delivered: { label: "Delivered", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
  returned: { label: "Returned", tone: "orange" },
  refunded: { label: "Refunded", tone: "red" },
};

export const PRODUCT_STATUS: Record<string, { label: string; tone: string }> = {
  active: { label: "Active", tone: "green" },
  draft: { label: "Draft", tone: "orange" },
  archived: { label: "Archived", tone: "muted" },
};

export const DEALER_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "orange" },
  approved: { label: "Approved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  suspended: { label: "Suspended", tone: "red" },
};

export const REVIEW_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "orange" },
  approved: { label: "Approved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
};

export const PAYMENT_STATUS: Record<string, { label: string; tone: string }> = {
  paid: { label: "Paid", tone: "green" },
  pending: { label: "Pending", tone: "orange" },
  failed: { label: "Failed", tone: "red" },
  refunded: { label: "Refunded", tone: "red" },
};

export const COUPON_STATUS: Record<string, { label: string; tone: string }> = {
  active: { label: "Active", tone: "green" },
  scheduled: { label: "Scheduled", tone: "blue" },
  expired: { label: "Expired", tone: "muted" },
  paused: { label: "Paused", tone: "orange" },
};

export const GENERIC_STATUS: Record<string, { label: string; tone: string }> = {
  active: { label: "Active", tone: "green" },
  inactive: { label: "Inactive", tone: "muted" },
  disabled: { label: "Disabled", tone: "muted" },
  enabled: { label: "Enabled", tone: "green" },
  new: { label: "New", tone: "blue" },
  open: { label: "Open", tone: "blue" },
  pending: { label: "Pending", tone: "orange" },
  resolved: { label: "Resolved", tone: "green" },
  closed: { label: "Closed", tone: "muted" },
  subscribed: { label: "Subscribed", tone: "green" },
  unsubscribed: { label: "Unsubscribed", tone: "muted" },
  bounced: { label: "Bounced", tone: "red" },
  banned: { label: "Banned", tone: "red" },
  draft: { label: "Draft", tone: "orange" },
  ordered: { label: "Ordered", tone: "blue" },
  received: { label: "Received", tone: "green" },
  maintenance: { label: "Maintenance", tone: "orange" },
  live: { label: "Live", tone: "green" },
  ended: { label: "Ended", tone: "muted" },
  scheduled: { label: "Scheduled", tone: "blue" },
  low: { label: "Low", tone: "orange" },
  medium: { label: "Medium", tone: "blue" },
  high: { label: "High", tone: "orange" },
  urgent: { label: "Urgent", tone: "red" },
};

export const statusMeta = (value: string) =>
  ORDER_STATUS[value] ||
  PRODUCT_STATUS[value] ||
  DEALER_STATUS[value] ||
  REVIEW_STATUS[value] ||
  PAYMENT_STATUS[value] ||
  COUPON_STATUS[value] ||
  GENERIC_STATUS[value] || { label: value, tone: "muted" };

export const TONES = [
  "blue", "green", "violet", "orange", "red", "muted",
] as const;
