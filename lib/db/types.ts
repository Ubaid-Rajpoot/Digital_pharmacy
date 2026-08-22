// ============================================================
// MEDORA CONTROL CENTRE — entity types
// Shared by the API route handlers and the admin UI.
// ============================================================

export type ID = number;

export type ProductStatus = "active" | "draft" | "archived";
export type DealerStatus = "pending" | "approved" | "rejected" | "suspended";
export type OrderStatus =
  | "pending"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type UserStatus = "active" | "banned";

export interface Product {
  id: ID;
  name: string;
  sku: string;
  barcode: string;
  brandId: ID;
  categoryId: ID;
  subcategoryId?: ID;
  dealerId?: ID;
  description: string;
  specifications: { label: string; value: string }[];
  image: string;
  gallery: string[];
  videos: string[];
  stock: number;
  lowStockAlert: number;
  costPrice: number;
  price: number;
  mrp: number;
  discount: number; // computed %
  tax: number; // %
  weight: string;
  dimensions: string;
  tags: string[];
  status: ProductStatus;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  /** Prescription-only medicine — requires an Rx to be sold. */
  rx: boolean;
  seoTitle: string;
  seoDescription: string;
  metaKeywords: string;
  rating: number;
  reviews: number;
  sold: number;
  deletedAt: string | null;
  createdAt: string;
}

export interface Category {
  id: ID;
  name: string;
  slug: string;
  parentId: ID | null;
  image: string;
  icon: string;
  banner: string;
  description: string;
  featured: boolean;
  sortOrder: number;
  status: "active" | "inactive";
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
}

export interface Brand {
  id: ID;
  name: string;
  logo: string;
  banner: string;
  description: string;
  website: string;
  status: "active" | "inactive";
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  products: number;
  createdAt: string;
}

export interface Dealer {
  id: ID;
  company: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  taxNumber: string;
  bankDetails: { bank: string; account: string; ifsc: string };
  commission: number; // %
  status: DealerStatus;
  rating: number;
  productsCount: number;
  ordersCount: number;
  revenue: number;
  payments: { date: string; amount: number; method: string; status: string }[];
  joinedAt: string;
}

export interface OrderItem {
  productId: ID;
  name: string;
  image: string;
  qty: number;
  price: number;
}

export interface Order {
  id: ID;
  number: string;
  customerId: ID;
  customerName: string;
  customerEmail: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  address: { line1: string; line2: string; city: string; state: string; pincode: string; country: string };
  tracking: { carrier: string; number: string; url: string } | null;
  couponCode: string | null;
  notes: string | null;
  /** Prescription attached by the customer at checkout (Rx-only orders). */
  prescription?: { url: string; name: string; at: string } | null;
  timeline: { label: string; at: string; note?: string }[];
  refund?: { amount: number; reason: string; at: string } | null;
  createdAt: string;
}

export interface Customer {
  id: ID;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: UserStatus;
  joinedAt: string;
  lifetimeSpend: number;
  orders: number;
  rewardPoints: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  addresses: { label: string; line1: string; city: string; state: string; pincode: string; default?: boolean }[];
  wishlist: { productId: ID; name: string; image: string; price: number }[];
  passwordHash: string;
}

export interface Review {
  id: ID;
  productId: ID;
  productName: string;
  productImage: string;
  customerId: ID;
  customerName: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  reply: string | null;
  reported: boolean;
  reportReason: string | null;
  spamScore: number; // 0-100
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface Warehouse {
  id: ID;
  name: string;
  city: string;
  manager: string;
  capacity: number;
  used: number;
  status: "active" | "maintenance";
}

export interface PurchaseOrder {
  id: ID;
  number: string;
  warehouseId: ID;
  supplier: string;
  items: number;
  total: number;
  status: "draft" | "ordered" | "received" | "cancelled";
  expected: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: ID;
  productId: ID;
  productName: string;
  warehouseId: ID;
  delta: number;
  reason: string;
  by: string;
  at: string;
}

export interface InventoryRecord {
  productId: ID;
  productName: string;
  sku: string;
  image: string;
  warehouseId: ID;
  stock: number;
  lowStockAlert: number;
  updatedAt: string;
}

export type CouponType = "percent" | "fixed" | "bogo" | "freeship";
export interface Coupon {
  id: ID;
  code: string;
  type: CouponType;
  value: number; // % or flat amount
  minOrder: number;
  maxDiscount: number | null;
  uses: number;
  maxUses: number;
  perCustomer: number;
  startsAt: string;
  endsAt: string;
  status: "active" | "scheduled" | "expired" | "paused";
  description: string;
  appliesTo: "all" | "category" | "brand";
  targetId?: ID;
  createdAt: string;
}

export interface FlashSale {
  id: ID;
  title: string;
  productIds: ID[];
  discount: number;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "live" | "ended";
}

export interface ContentItem {
  id: number;
  key: string;
  section: string;
  label: string;
  value: string; // JSON-encoded per item shape
}

export interface Faq {
  id: ID;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface MenuLink {
  id: ID;
  label: string;
  href: string;
  order: number;
}

export interface MediaFile {
  id: ID;
  name: string;
  url: string;
  folder: string;
  type: "image" | "video" | "document";
  size: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface SupportTicket {
  id: ID;
  kind: "message" | "ticket" | "chat";
  subject: string;
  customerName: string;
  customerEmail: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "new" | "open" | "pending" | "resolved" | "closed";
  assignee: string;
  replies: { by: string; at: string; body: string }[];
  createdAt: string;
}

export interface Subscriber {
  id: ID;
  email: string;
  name: string | null;
  source: string;
  status: "subscribed" | "unsubscribed" | "bounced";
  joinedAt: string;
  campaigns: number;
}

export interface AdminUser {
  id: ID;
  name: string;
  email: string;
  role: string;
  status: "active" | "disabled";
  avatar: string;
  lastLogin: string | null;
  twoFactor: boolean;
  createdAt: string;
  /** scrypt hash (lib/password.ts). Never sent to the client. */
  passwordHash: string;
}

export interface RoleDef {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  users: number;
}

export interface Notification {
  id: ID;
  type: "order" | "stock" | "dealer" | "refund" | "review" | "message" | "system";
  title: string;
  body: string;
  at: string;
  read: boolean;
  href: string;
}

export interface AuditEntry {
  id: ID;
  user: string;
  action: string;
  target: string;
  at: string;
  ip: string;
  changes: { field: string; from: unknown; to: unknown }[];
}

export interface Settings {
  store: {
    name: string;
    tagline: string;
    email: string;
    phone: string;
    address: string;
    currency: string;
    timezone: string;
    logo: string;
    favicon: string;
    /** Monthly revenue goal (Rs) shown on the dashboard revenue chart. */
    revenueTarget: number;
  };
  email: { from: string; replyTo: string; smtp: { host: string; port: number; user: string; secure: boolean } };
  payments: { methods: { id: string; label: string; enabled: boolean }[] };
  shipping: { methods: { id: string; label: string; cost: number; freeAbove: number; enabled: boolean }[] };
  taxes: { enabled: boolean; rate: number; included: boolean; label: string };
  languages: { code: string; label: string; default: boolean }[];
  theme: { accent: string; radius: number; font: string; darkMode: boolean };
  seo: { titleSuffix: string; description: string; keywords: string; googleVerification: string };
  security: { twoFactorRequired: boolean; passwordMinLength: number; sessionTimeout: number; rateLimit: number; passwordExpiryDays: number };
  backup: { autoBackup: boolean; frequency: string; retention: number; lastBackup: string };
}

export interface DbShape {
  seq: number;
  products: Product[];
  categories: Category[];
  brands: Brand[];
  dealers: Dealer[];
  orders: Order[];
  customers: Customer[];
  reviews: Review[];
  warehouses: Warehouse[];
  purchaseOrders: PurchaseOrder[];
  stockAdjustments: StockAdjustment[];
  inventory: InventoryRecord[];
  coupons: Coupon[];
  flashSales: FlashSale[];
  content: ContentItem[];
  faqs: Faq[];
  menu: MenuLink[];
  socials: { id: ID; label: string; url: string; order: number }[];
  media: MediaFile[];
  support: SupportTicket[];
  subscribers: Subscriber[];
  users: AdminUser[];
  roles: RoleDef[];
  notifications: Notification[];
  audit: AuditEntry[];
  settings: Settings;
}
