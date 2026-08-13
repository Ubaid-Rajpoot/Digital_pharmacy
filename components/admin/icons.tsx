// ============================================================
// MEDORA CONTROL CENTRE — icon set
// Stroke-based SVG icons (24×24, currentColor) in the same
// visual language as the storefront icons.
// ============================================================

import type { ReactNode } from "react";

export type IconName =
  | "dashboard" | "products" | "categories" | "brands" | "inventory" | "orders"
  | "coupons" | "customers" | "reviews" | "dealers" | "content" | "media"
  | "newsletter" | "reports" | "support" | "users" | "settings" | "notifications"
  | "audit" | "security" | "search" | "bell" | "sun" | "moon" | "chevronDown"
  | "chevronRight" | "chevronLeft" | "chevronUp" | "menu" | "x" | "plus" | "dots"
  | "edit" | "trash" | "eye" | "download" | "upload" | "copy" | "restore" | "filter"
  | "check" | "checkCircle" | "alert" | "alertTriangle" | "info" | "clock" | "calendar"
  | "box" | "truck" | "star" | "heart" | "printer" | "refresh" | "logout" | "external"
  | "grid" | "trendUp" | "trendDown" | "tag" | "folder" | "file" | "video" | "mail"
  | "send" | "chat" | "phone" | "pin" | "wallet" | "lock" | "globe" | "lang" | "palette"
  | "card" | "zap" | "percent" | "key" | "shieldCheck" | "userCheck" | "ban" | "link"
  | "server" | "database" | "minimize" | "maximize" | "sort" | "image" | "help" | "starFill"
  | "chart" | "spark" | "user" | "userPlus" | "home" | "arrowRight" | "arrowLeft" | "reply"
  | "paperclip" | "rss" | "layers" | "sliders" | "shield" | "eyeOff" | "clockHistory";

const P: Record<IconName, ReactNode> = {
  dashboard: (<><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>),
  products: (<><path d="m12 3 8 3v6c0 4.4-3.4 7.6-8 9-4.6-1.4-8-4.6-8-9V6l8-3Z" /><path d="M12 8v5M9.5 10.5h5" /></>),
  categories: (<><path d="M3.5 6.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11Z" /><path d="M3.5 11h17" /></>),
  brands: (<><path d="M12 3 16 8l6-1-1 6 5 5-5 5-5-5-6 1 1-6-5-5 5-5 1 6 5-5Z" /><circle cx="12" cy="12" r="1.6" /></>),
  inventory: (<><path d="M3.5 8.5 12 4l8.5 4.5v7L12 20l-8.5-4.5v-7Z" /><path d="M3.5 8.5 12 13l8.5-4.5M12 13v7" /></>),
  orders: (<><path d="M6 7h12l1.2 12.2a1.5 1.5 0 0 1-1.5 1.8H6.3a1.5 1.5 0 0 1-1.5-1.8L6 7Z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" /></>),
  coupons: (<><path d="M3.5 9V6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5V9a2.5 2.5 0 0 0 0 6v2.5A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5V15a2.5 2.5 0 0 0 0-6Z" /><path d="M9.5 8.5v7M14 9l-1.5 6" /></>),
  customers: (<><circle cx="9" cy="8.5" r="3.4" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.6a3.4 3.4 0 0 1 0 5.8M17.5 19a5.5 5.5 0 0 0-3.2-5" /></>),
  reviews: (<><path d="m12 3 2.7 5.6 6.3.8-4.6 4.3 1.2 6.1L12 16.9 6.4 19.8l1.2-6.1L3 9.4l6.3-.8L12 3Z" /></>),
  dealers: (<><path d="M4 9.5 12 4l8 5.5V20H4V9.5Z" /><path d="M8 20v-6h8v6M4 9.5h16" /></>),
  content: (<><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M9 4.5v15" /></>),
  media: (<><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="m4 18 5-5 3.5 3.5L17 12l3.5 3.5" /></>),
  newsletter: (<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /><path d="m11 12.5-3-2.5" /></>),
  reports: (<><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></>),
  support: (<><path d="M4 13a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4" height="6" rx="2" /><rect x="17" y="13" width="4" height="6" rx="2" /><path d="M20 19a3 3 0 0 1-3 2h-4" /></>),
  users: (<><path d="M12 3 4.5 6v5c0 5 3.2 8.4 7.5 10 4.3-1.6 7.5-5 7.5-10V6L12 3Z" /><circle cx="12" cy="10" r="2.2" /><path d="M9.8 15a3 3 0 0 1 4.4 0" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" /></>),
  notifications: (<><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10.5 19a1.8 1.8 0 0 0 3 0" /></>),
  audit: (<><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M9 4v16M4 9h5M4 15h5" /></>),
  security: (<><path d="M12 3 5 5.5V11c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V5.5L12 3Z" /><path d="m9 11.5 2.2 2.2L15.5 9.5" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  bell: (<><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10.5 19a1.8 1.8 0 0 0 3 0" /></>),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></>),
  moon: (<><path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z" /></>),
  chevronDown: (<><path d="m6 9 6 6 6-6" /></>),
  chevronRight: (<><path d="m9 6 6 6-6 6" /></>),
  chevronLeft: (<><path d="m15 6-6 6 6 6" /></>),
  chevronUp: (<><path d="m6 15 6-6 6 6" /></>),
  menu: (<><path d="M4 7h16M4 12h16M4 17h10" /></>),
  x: (<><path d="M6 6l12 12M18 6 6 18" /></>),
  plus: (<><path d="M12 5v14M5 12h14" /></>),
  dots: (<><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></>),
  edit: (<><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m13.5 6.5 3 3" /></>),
  trash: (<><path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13" /><path d="M10 11v5M14 11v5" /></>),
  eye: (<><circle cx="12" cy="12" r="3.2" /><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /></>),
  eyeOff: (<><path d="M4 4l16 16" /><path d="M10.5 6.3A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-3 3.6M6.4 8A16.4 16.4 0 0 0 2.5 12S6 18 12 18c.9 0 1.8-.14 2.6-.4" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>),
  download: (<><path d="M12 4v11m0 0 4-4m-4 4-4-4" /><path d="M4 17v2a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-2" /></>),
  upload: (<><path d="M12 16V5m0 0 4 4m-4-4-4 4" /><path d="M4 17v2a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-2" /></>),
  copy: (<><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-10A1.5 1.5 0 0 0 3 5.5v10A1.5 1.5 0 0 0 4.5 17H8" /></>),
  restore: (<><path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.6" /><path d="M4 4v4.6h4.6" /></>),
  filter: (<><path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" /></>),
  check: (<><path d="m5 13 4 4L19 7" /></>),
  checkCircle: (<><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.6 2.6L16 9.5" /></>),
  alert: (<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5h.01" /></>),
  alertTriangle: (<><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4M12 17h.01" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5h.01" /></>),
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2.5" /></>),
  clockHistory: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4l3 2M8.5 12h-4" /></>),
  calendar: (<><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M8 3.5v4M16 3.5v4M4 10h16" /></>),
  box: (<><path d="m12 3 8 3v6c0 4.4-3.4 7.6-8 9-4.6-1.4-8-4.6-8-9V6l8-3Z" /></>),
  truck: (<><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>),
  star: (<><path d="m12 3 2.7 5.6 6.3.8-4.6 4.3 1.2 6.1L12 16.9 6.4 19.8l1.2-6.1L3 9.4l6.3-.8L12 3Z" /></>),
  starFill: (<><path fill="currentColor" stroke="none" d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4l-5.8 3 1.1-6.4L2.6 9.4l6.5-.9L12 2.6Z" /></>),
  heart: (<><path d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.5-6C8.4 5 10 6.4 12 8.4 14 6.4 15.6 5 17.5 5c2.9 0 4.7 3.3 3.5 6-2 4.4-9 9-9 9Z" /></>),
  printer: (<><path d="M7 8V4h10v4" /><rect x="4" y="8" width="16" height="7" rx="2" /><path d="M7 15h10v5H7z" /></>),
  refresh: (<><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.6" /><path d="M20 4v4.6h-4.6M20 12a8 8 0 0 1-13.7 5.6L4 15.4" /><path d="M4 20v-4.6h4.6" /></>),
  logout: (<><path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" /><path d="M10 8l-4 4 4 4M6 12h10" /></>),
  external: (<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H11" /></>),
  grid: (<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>),
  trendUp: (<><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>),
  trendDown: (<><path d="m3 7 6 6 4-4 8 8" /><path d="M15 17h6v-6" /></>),
  tag: (<><path d="M4 4h7l9 9-7 7-9-9V4Z" /><circle cx="8.5" cy="8.5" r="1.3" /></>),
  folder: (<><path d="M3.5 6.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11Z" /></>),
  file: (<><path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M14 3.5V8h4.5" /></>),
  video: (<><rect x="3" y="6" width="13" height="12" rx="2.5" /><path d="m16 10.5 5-2.5v8l-5-2.5" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></>),
  send: (<><path d="m3 11 18-8-8 18-2.5-7.5L3 11Z" /></>),
  chat: (<><path d="M21 12a8 8 0 1 0-3.1 6.3L21 20l-.8-3.2A8 8 0 0 0 21 12Z" /></>),
  phone: (<><path d="M5 4h4l1.5 4L8 10a12 12 0 0 0 6 6l2-2.5 4 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></>),
  pin: (<><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></>),
  wallet: (<><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M16 14.5h2" /></>),
  lock: (<><rect x="5" y="10.5" width="14" height="9.5" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>),
  globe: (<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5s1.3-6.2 3.8-8.5Z" /></>),
  lang: (<><path d="M4 5h9M8.5 3.5v1.5M6.5 3.5C7.2 6 8.6 8.4 11 10M4.5 9.5c1.3 1 3 1.6 5 1.9" /><path d="M13.5 12c-.6 2.7-2 5.4-4.5 7.5M15.5 3.5 20 20l-3-.9M16.6 8.5 18.6 15" /></>),
  palette: (<><path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-7.7-9-7.7Z" /><circle cx="7.5" cy="10" r="1.1" fill="currentColor" stroke="none" /><circle cx="11" cy="7" r="1.1" fill="currentColor" stroke="none" /><circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" /></>),
  card: (<><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h4" /></>),
  zap: (<><path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" /></>),
  percent: (<><path d="M19 5 5 19" /><circle cx="7" cy="7" r="2.2" /><circle cx="17" cy="17" r="2.2" /></>),
  key: (<><circle cx="8" cy="15" r="4" /><path d="m11 12 8.5-8.5M16.5 6.5 19 9M14 9l2 2" /></>),
  shieldCheck: (<><path d="M12 3 5 5.5V11c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V5.5L12 3Z" /><path d="m9 11.5 2.2 2.2L15.5 9.5" /></>),
  userCheck: (<><circle cx="9" cy="8.5" r="3.4" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="m15 12 2 2 4-4" /></>),
  ban: (<><circle cx="12" cy="12" r="9" /><path d="m5.5 5.5 13 13" /></>),
  link: (<><path d="M9.5 14.5 14.5 9.5" /><path d="M11 6.5 12.8 4.7a4 4 0 0 1 5.7 5.7L16.7 12.2M13 17.5l-1.8 1.8a4 4 0 0 1-5.7-5.7L7.3 11.8" /></>),
  server: (<><rect x="3.5" y="4" width="17" height="6.5" rx="2" /><rect x="3.5" y="13.5" width="17" height="6.5" rx="2" /><path d="M7 7.2h.01M7 16.8h.01M11 7.2h6M11 16.8h6" /></>),
  database: (<><ellipse cx="12" cy="5.5" rx="8" ry="2.8" /><path d="M4 5.5v13c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-13" /><path d="M4 12c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8" /></>),
  minimize: (<><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></>),
  maximize: (<><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" /></>),
  sort: (<><path d="M8 6v12m0 0-3-3m3 3 3-3M16 18V6m0 0-3 3m3-3 3 3" /></>),
  image: (<><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="m4 18 5-5 3.5 3.5L17 12l3.5 3.5" /></>),
  help: (<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.2a2.6 2.6 0 1 1 3.4 2.5c-.9.35-1.4 1-1.4 1.9v.4M12 17.2h.01" /></>),
  chart: (<><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></>),
  spark: (<><path d="M12 3v0l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="M18.5 15.5 19 17l1.5.5L19 18l-.5 1.5L18 18l-1.5-.5L18 17l.5-1.5Z" /></>),
  user: (<><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>),
  userPlus: (<><circle cx="10" cy="8" r="3.4" /><path d="M4.5 19a5.5 5.5 0 0 1 11 0" /><path d="M18 8v6M15 11h6" /></>),
  home: (<><path d="M4 20v-8l8-6 8 6v8h-5v-5h-6v5H4Z" /></>),
  arrowRight: (<><path d="M5 12h14m-6-6 6 6-6 6" /></>),
  arrowLeft: (<><path d="M19 12H5m6 6-6-6 6-6" /></>),
  reply: (<><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 6 6v4" /></>),
  paperclip: (<><path d="m21 11.5-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.8 3.8 0 1 1 5.4 5.4l-8.6 8.6a2 2 0 0 1-2.8-2.8l8.1-8.1" /></>),
  rss: (<><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" /><circle cx="5.5" cy="18.5" r="1.5" fill="currentColor" stroke="none" /></>),
  layers: (<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>),
  sliders: (<><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h13M21 18h-1M18 4v4M8 10v4M17 16v4" /></>),
  shield: (<><path d="M12 3 4.5 6v5c0 5 3.2 8.4 7.5 10 4.3-1.6 7.5-5 7.5-10V6L12 3Z" /></>),
};

export function Icon({ name, size = 18, sw = 1.9, className }: { name: IconName; size?: number; sw?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  );
}
