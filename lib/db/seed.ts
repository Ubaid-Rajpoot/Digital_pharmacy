// ============================================================
// MEDORA CONTROL CENTRE — seed data
// Deterministic (seeded PRNG) so every dev machine gets the
// same realistic dataset. Replace with your real DB later.
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AdminUser, Brand, DbShape, Dealer, Product, Order, OrderStatus, Customer, Review } from "./types";

/** Deterministic PRNG (mulberry32) */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260814);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const rint = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const rfloat = (min: number, max: number, dp = 1) => {
  const v = min + rand() * (max - min);
  return Math.round(v * 10 ** dp) / 10 ** dp;
};
const chance = (p: number) => rand() < p;

export const pic = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const monthsAgo = (months: number, day = 1, hour = 10) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(Math.min(day, 28));
  d.setHours(hour, rint(0, 59), rint(0, 59), 0);
  return d.toISOString();
};
const daysAgo = (days: number, hour?: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  if (hour !== undefined) d.setHours(hour, rint(0, 59), 0, 0);
  else d.setHours(rint(8, 21), rint(0, 59), 0, 0);
  return d.toISOString();
};
const hoursAgo = (h: number) => {
  const d = new Date();
  d.setHours(d.getHours() - h, rint(0, 59), 0, 0);
  return d.toISOString();
};

// ---------- brands ----------
const brandNames = ["Cipla", "Sun Pharma", "Dr. Reddy's", "HealthVit", "Accu-Chek", "Omron", "Himalaya", "Dettol", "USV", "La Shield", "Minimalist", "Seacod", "Benadryl", "Johnson's", "Revital", "Limcee"];
export const seedBrands = brandNames.map((name, i) => ({
  id: i + 1,
  name,
  logo: pic(`brand-${name.toLowerCase().replace(/[^a-z]/g, "")}`, 120, 120),
  banner: pic(`brand-banner-${i}`, 800, 220),
  description: `${name} is a trusted name in healthcare with a heritage of quality, safety and innovation.`,
  website: `https://www.${name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
  status: chance(0.9) ? "active" : "inactive",
  featured: chance(0.5),
  seoTitle: `Buy ${name} Products Online`,
  seoDescription: `Shop genuine ${name} products at Medora with verified sourcing and fast delivery.`,
  products: 0,
  createdAt: monthsAgo(rint(6, 34)),
})) as Brand[];

// ---------- categories ----------
const catDefs: { name: string; icon: string; children: string[] }[] = [
  { name: "Prescription", icon: "M12 4v16M4 12h16", children: ["Antibiotics", "Pain Relief", "Cardiac", "Diabetes"] },
  { name: "Vitamins", icon: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z", children: ["Multivitamins", "Vitamin D", "Vitamin C", "Minerals"] },
  { name: "Diabetes Care", icon: "M12 3a2 2 0 0 1 2 2v8.5a4 4 0 1 1-4 0V5a2 2 0 0 1 2-2Z", children: ["Test Strips", "Meters", "Sugar-free Foods"] },
  { name: "Heart Care", icon: "M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.5-6C8.4 5 10 6.4 12 8.4 14 6.4 15.6 5 17.5 5c2.9 0 4.7 3.3 3.5 6-2 4.4-9 9-9 9Z", children: ["BP Monitors", "Cardiac Meds", "Omega-3"] },
  { name: "Skin Care", icon: "M12 3a4 4 0 0 1 4 4c0 1-.3 1.9-.8 2.6 2 .6 3.8 2.3 3.8 5.4a5.5 5.5 0 0 1-11 0c0-3.1 1.8-4.8 3.8-5.4A4.8 4.8 0 0 1 8 7a4 4 0 0 1 4-4Z", children: ["Sunscreen", "Serums", "Moisturizers", "Acne Care"] },
  { name: "Baby Care", icon: "M12 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-6 9a6 6 0 0 1 12 0v7H6v-7Z", children: ["Diapers", "Skincare", "Feeding"] },
  { name: "Devices", icon: "M12 3a2 2 0 0 1 2 2v8.5a4 4 0 1 1-4 0V5a2 2 0 0 1 2-2Z", children: ["Thermometers", "BP Monitors", "Nebulizers"] },
  { name: "Personal Care", icon: "M5 4h4l1.5 4L8 10a12 12 0 0 0 6 6l2-2.5 4 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z", children: ["Oral Care", "First Aid", "Hygiene"] },
];
export const seedCategories = (() => {
  const cats: any[] = [];
  catDefs.forEach((c, i) => {
    const id = i + 1;
    cats.push({
      id,
      name: c.name,
      slug: c.name.toLowerCase().replace(/[^a-z]+/g, "-"),
      parentId: null,
      image: pic(`cat-${c.name.toLowerCase().replace(/[^a-z]/g, "")}`, 400, 300),
      icon: c.icon,
      banner: pic(`cat-banner-${i}`, 1200, 320),
      description: `${c.name} products, verified and delivered with care.`,
      featured: chance(0.6),
      sortOrder: i,
      status: "active",
      seoTitle: `${c.name} Online`,
      seoDescription: `Shop ${c.name} online at Medora — genuine products, best prices, fast delivery.`,
      createdAt: monthsAgo(rint(8, 30)),
    });
    c.children.forEach((child, j) => {
      cats.push({
        id: 100 + i * 10 + j + 1,
        name: child,
        slug: child.toLowerCase().replace(/[^a-z]+/g, "-"),
        parentId: id,
        image: pic(`subcat-${i}-${j}`, 300, 220),
        icon: "",
        banner: "",
        description: `${child} — curated for you.`,
        featured: chance(0.3),
        sortOrder: j,
        status: chance(0.92) ? "active" : "inactive",
        seoTitle: `${child} Online`,
        seoDescription: `Buy ${child} products online at Medora.`,
        createdAt: monthsAgo(rint(4, 24)),
      });
    });
  });
  return cats;
})();

// ---------- product names ----------
const prodSeeds = [
  ["Paracetamol 500mg · Fever & Pain Relief", "Cipla", "Prescription", "Pain Relief", 32, 40],
  ["Vitamin D3 60,000 IU Weekly Capsules", "HealthVit", "Vitamins", "Vitamin D", 149, 199],
  ["Multivitamin Gold · 23 Essential Nutrients", "Revital", "Vitamins", "Multivitamins", 345, 425],
  ["Omega-3 Fish Oil · Triple Strength 1000mg", "Seacod", "Heart Care", "Omega-3", 599, 799],
  ["Blood Glucose Test Strips (50 count)", "Accu-Chek", "Diabetes Care", "Test Strips", 950, 1150],
  ["Metformin SR 500mg Prolonged Release", "USV", "Diabetes Care", "Diabetes", 28, 34],
  ["Baby Diaper Rash Cream · Pediatrician Tested", "Himalaya", "Baby Care", "Skincare", 135, 165],
  ["SPF 50+ Sunscreen · Matte Finish", "La Shield", "Skin Care", "Sunscreen", 425, 525],
  ["Vitamin C + Zinc Effervescent · Orange", "Limcee", "Vitamins", "Vitamin C", 180, 220],
  ["Digital Infrared Thermometer · 1s Read", "Omron", "Devices", "Thermometers", 899, 1099],
  ["Cough Relief Syrup · Honey & Tulsi", "Benadryl", "Prescription", "Pain Relief", 118, 132],
  ["Antiseptic Liquid · First Aid Protection", "Dettol", "Personal Care", "First Aid", 129, 149],
  ["Amlodipine 5mg · Blood Pressure Care", "Cipla", "Heart Care", "Cardiac Meds", 30, 42],
  ["Baby Gentle Hair-to-Toe Wash · No Tears", "Johnson's", "Baby Care", "Skincare", 249, 299],
  ["Niacinamide 10% Serum · Clarity & Calm", "Minimalist", "Skin Care", "Serums", 499, 599],
  ["Automatic BP Monitor · IntelliSense Cuff", "Omron", "Devices", "BP Monitors", 1899, 2450],
  ["Amoxicillin 500mg Capsules", "Cipla", "Prescription", "Antibiotics", 85, 110],
  ["Atorvastatin 10mg · Cholesterol Care", "Sun Pharma", "Heart Care", "Cardiac Meds", 42, 55],
  ["Cetirizine 10mg · Allergy Relief", "Dr. Reddy's", "Prescription", "Pain Relief", 18, 25],
  ["Metformin 500mg · 20 tablets", "USV", "Diabetes Care", "Diabetes", 25, 32],
  ["Glucometer Starter Kit · 10 Strips Free", "Accu-Chek", "Diabetes Care", "Meters", 1299, 1650],
  ["Vitamin B-Complex + C · Daily Energy", "Revital", "Vitamins", "Multivitamins", 210, 260],
  ["Zinc + Vitamin C Tablets · Immunity", "Limcee", "Vitamins", "Minerals", 140, 175],
  ["Salicylic Acid 2% Face Wash", "Minimalist", "Skin Care", "Acne Care", 349, 420],
  ["Ceramide Moisturizer · Barrier Repair", "La Shield", "Skin Care", "Moisturizers", 575, 690],
  ["Baby Diapers Ultra Dry · Size M (48s)", "Himalaya", "Baby Care", "Diapers", 549, 650],
  ["Infrared Ear Thermometer · Baby Safe", "Omron", "Devices", "Thermometers", 1399, 1750],
  ["Saline Nasal Spray · Congestion Relief", "Himalaya", "Personal Care", "Hygiene", 165, 200],
  ["Fluconazole 150mg · 1 Capsule", "Sun Pharma", "Prescription", "Antibiotics", 38, 48],
  ["Pantoprazole 40mg · Acid Control", "Dr. Reddy's", "Prescription", "Pain Relief", 55, 70],
  ["Multivitamin Gummies · Kids Formula", "HealthVit", "Vitamins", "Multivitamins", 390, 480],
  ["Omega-3 + DHA · Kids Brain Health", "Seacod", "Heart Care", "Omega-3", 720, 890],
  ["Cefixime 200mg · Antibiotic Tablets", "Cipla", "Prescription", "Antibiotics", 92, 120],
  ["Glimepiride 1mg · Sugar Control", "USV", "Diabetes Care", "Diabetes", 45, 58],
  ["Telmisartan 40mg · BP Care", "Sun Pharma", "Heart Care", "Cardiac Meds", 60, 78],
  ["Vitamin E + C Night Repair Cream", "La Shield", "Skin Care", "Moisturizers", 640, 780],
  ["Aloe Vera Gel · Soothing & Hydrating", "Himalaya", "Skin Care", "Acne Care", 220, 265],
  ["Disposable Face Masks (50 pack)", "Dettol", "Personal Care", "Hygiene", 299, 360],
  ["Digital Weighing Scale · Body Composition", "Omron", "Devices", "BP Monitors", 2199, 2800],
  ["Azithromycin 500mg · 3 Tablets", "Cipla", "Prescription", "Antibiotics", 78, 99],
];

const descs = [
  "Fast-acting relief trusted by millions. Every batch is verified by our licensed pharmacists before dispatch.",
  "Clinically tested formula with gentle, long-lasting action. Dispensed against valid prescription only where required.",
  "Premium quality at an honest price. Cold-chain and temperature-controlled logistics protect every order.",
  "Dermatologist / physician approved. Fragrance-free, paraben-free and safe for daily use.",
  "Lab-accurate results in seconds. Includes manufacturer warranty and Medora 3-year device cover.",
];

export const seedProducts: Product[] = prodSeeds.map((p, i) => {
  const [name, brandName, catName, subName, price, mrp] = p as [string, string, string, string, number, number];
  const brandId = brandNames.indexOf(brandName) + 1;
  const categoryId = catDefs.findIndex((c) => c.name === catName) + 1;
  const subcategory = seedCategories.find((c) => c.parentId === categoryId && c.name === subName);
  const stock = chance(0.12) ? 0 : chance(0.18) ? rint(2, 9) : rint(20, 480);
  const discount = Math.round((1 - price / mrp) * 100);
  const sold = rint(120, 5400);
  const id = i + 1;
  const seed = `prod-${id}-${name.toLowerCase().replace(/[^a-z]+/g, "-").slice(0, 24)}`;
  return {
    id,
    name,
    sku: `MED-${String(1000 + id)}${["A", "B", "C"][i % 3]}`,
    barcode: `890${String(1000000 + id * 7919)}${String(id % 10)}`,
    brandId,
    categoryId,
    subcategoryId: subcategory?.id,
    dealerId: id % 3 === 0 ? (id % 6) + 1 : chance(0.35) ? rint(1, 6) : undefined,
    description: `${descs[i % descs.length]} ${name.split("·")[0].trim()} — genuine, sealed and expiry-checked at dispatch.`,
    specifications: [
      { label: "Pack size", value: name.split("·").pop()?.trim() ?? "1 unit" },
      { label: "Manufacturer", value: brandName },
      { label: "Form", value: chance(0.5) ? "Tablet / Capsule" : "Topical / Device" },
      { label: "Storage", value: "Below 25°C, away from moisture" },
      { label: "Shelf life", value: `${rint(18, 36)} months` },
    ],
    image: pic(seed, 400, 400),
    gallery: [pic(`${seed}-2`, 400, 400), pic(`${seed}-3`, 400, 400), pic(`${seed}-4`, 400, 400)],
    videos: [],
    stock,
    lowStockAlert: 10,
    costPrice: Math.round(price * 0.62),
    price,
    mrp,
    discount,
    tax: 5,
    weight: `${rfloat(0.04, 0.85, 2)} kg`,
    dimensions: `${rint(5, 18)} × ${rint(4, 12)} × ${rint(2, 8)} cm`,
    tags: [brandName, catName, chance(0.5) ? "bestseller" : "essential", chance(0.3) ? "rx" : "otc"],
    status: chance(0.1) ? "draft" : "active",
    featured: chance(0.35),
    bestSeller: sold > 2500,
    newArrival: i > 32,
    seoTitle: `Buy ${name} Online at Best Price`,
    seoDescription: `${name} — genuine product, verified pharmacy, doorstep delivery. Order now at Medora.`,
    metaKeywords: `${name}, ${brandName}, buy online, medora`,
    rating: rfloat(3.8, 4.9, 1),
    reviews: rint(40, 3200),
    sold,
    deletedAt: null,
    createdAt: monthsAgo(rint(1, 22)),
  };
});

// ---------- customers ----------
const firstNames = ["Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Sneha", "Arjun", "Ishita", "Kabir", "Meera", "Dev", "Kavya", "Rahul", "Nisha", "Aditya", "Pooja", "Sameer", "Tara", "Varun", "Zara", "Manish", "Riya", "Harsh", "Divya"];
const lastNames = ["Sharma", "Patel", "Gupta", "Iyer", "Khan", "Reddy", "Mehta", "Joshi", "Nair", "Singh", "Verma", "Das", "Bose", "Chopra", "Malhotra", "Rao"];
export const seedCustomers: Customer[] = Array.from({ length: 24 }, (_, i) => {
  const name = `${pick(firstNames)} ${pick(lastNames)}`;
  const id = i + 1;
  const orders = rint(1, 14);
  const spend = orders * rint(400, 2600);
  const joined = monthsAgo(rint(1, 20), rint(1, 28));
  return {
    id,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}${id}@example.com`,
    phone: `+91 9${rint(10000000, 99999999)}`,
    avatar: pic(`cust-${id}-${name.toLowerCase().replace(/[^a-z]+/g, "")}`, 120, 120),
    status: (chance(0.94) ? "active" : "banned") as Customer["status"],
    joinedAt: joined,
    lifetimeSpend: spend,
    orders,
    rewardPoints: rint(0, 2400),
    tier: spend > 15000 ? "Platinum" : spend > 8000 ? "Gold" : spend > 3000 ? "Silver" : "Bronze",
    addresses: [
      { label: "Home", line1: `${rint(1, 999)} Green Avenue, Block ${String.fromCharCode(65 + (i % 26))}`, city: pick(["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Chennai"]), state: pick(["Maharashtra", "Delhi", "Karnataka", "Telangana"]), pincode: `${rint(110000, 682000)}`, default: true },
      { label: "Work", line1: `Level ${rint(2, 14)}, Tower ${i % 4 + 1}, Business Park`, city: "Mumbai", state: "Maharashtra", pincode: "400070" },
    ],
    wishlist: Array.from({ length: rint(0, 4) }, () => {
      const p = pick(seedProducts);
      return { productId: p.id, name: p.name, image: p.image, price: p.price };
    }),
    passwordHash: "demo-only-hash",
  };
});

// ---------- orders ----------
const statusWeights: [OrderStatus, number][] = [
  ["delivered", 46], ["shipped", 12], ["processing", 10], ["pending", 9], ["packed", 7], ["cancelled", 9], ["returned", 4], ["refunded", 3],
];
const weightedStatus = () => {
  const total = statusWeights.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [s, w] of statusWeights) {
    r -= w;
    if (r <= 0) return s;
  }
  return "delivered";
};

function statusSteps(status: OrderStatus): { label: string; note?: string }[] {
  const base = [
    { label: "Order placed", note: "Payment captured" },
    { label: "Order confirmed", note: "Verified by pharmacy" },
    { label: "Packed & labelled" },
    { label: "Shipped", note: "Courier dispatched" },
    { label: "Delivered", note: "Signed by recipient" },
  ];
  if (status === "cancelled") return [...base.slice(0, 2), { label: "Cancelled", note: "Refund initiated" }];
  if (status === "returned") return [...base.slice(0, 4), { label: "Return requested" }, { label: "Returned", note: "Pickup completed" }];
  if (status === "refunded") return [...base.slice(0, 4), { label: "Return requested" }, { label: "Returned" }, { label: "Refunded", note: "Amount credited" }];
  const idx = ["pending", "processing", "packed", "shipped", "delivered"].indexOf(status);
  return base.slice(0, idx + 1);
}

export const seedOrders: Order[] = Array.from({ length: 96 }, (_, i) => {
  const id = i + 1;
  const cust = pick(seedCustomers);
  const nItems = rint(1, 4);
  const chosen = Array.from({ length: nItems }, () => pick(seedProducts));
  const items = chosen.map((p) => ({ productId: p.id, name: p.name, image: p.image, qty: rint(1, 3), price: p.price }));
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const discount = chance(0.4) ? Math.round(subtotal * rfloat(0.05, 0.2, 2)) : 0;
  const shipping = subtotal - discount > 499 ? 0 : 49;
  const tax = Math.round(((subtotal - discount) * 0.05));
  const total = subtotal - discount + shipping + tax;
  const status = weightedStatus();
  const created = i < 8 ? hoursAgo(i * 3 + 2) : i < 30 ? daysAgo(rint(1, 13)) : monthsAgo(rint(1, 11), rint(1, 28));
  const timeline = statusSteps(status).map((s, j) => ({
    label: s.label,
    at: j === 0 ? created : new Date(new Date(created).getTime() + j * 3600_000 * rint(5, 30)).toISOString(),
    note: s.note,
  }));
  const paymentMethod = pick(["UPI", "Card", "Net Banking", "Cash on Delivery", "Wallet"]);
  const isRefunded = status === "refunded" || status === "cancelled";
  return {
    id,
    number: `MD-${String(24000 + id * 7)}`,
    customerId: cust.id,
    customerName: cust.name,
    customerEmail: cust.email,
    phone: cust.phone,
    items,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    status,
    paymentMethod,
    paymentStatus: (status === "cancelled" || status === "refunded" ? "refunded" : chance(0.8) ? "paid" : "pending") as Order["paymentStatus"],
    address: { ...cust.addresses[0], line1: cust.addresses[0].line1, line2: "", city: cust.addresses[0].city, state: cust.addresses[0].state, pincode: cust.addresses[0].pincode, country: "India" },
    tracking:
      status === "shipped" || status === "delivered" || status === "returned" || status === "refunded"
        ? { carrier: pick(["Delhivery", "BlueDart", "Ekart", "XpressBees"]), number: `BL${rint(1000000000, 9999999999)}IN`, url: "#" }
        : null,
    couponCode: discount > 0 ? pick(["WELCOME15", "SAVE10", "HEALTH20", "FIRST50"]) : null,
    notes: chance(0.25) ? "Leave with security guard if I'm not home." : null,
    timeline,
    refund: isRefunded ? { amount: total, reason: status === "cancelled" ? "Order cancelled by customer" : "Damaged item on arrival", at: new Date(new Date(created).getTime() + 48 * 3600_000).toISOString() } : null,
    createdAt: created,
  };
}).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

// ---------- reviews ----------
const reviewTexts = [
  ["Genuine product, fast delivery", "Ordered for my mother's medication. Came sealed, genuine and on time. The pharmacist even called to confirm the dosage."],
  ["Great quality, as described", "Exactly what the doctor recommended. Batch number verified on the manufacturer site. Will order again."],
  ["Very good experience", "Packaging was excellent with proper cold-chain indication. Delivery was a day early."],
  ["Trustworthy pharmacy", "Been buying from Medora for months. Prices are better than local stores and always authentic."],
  ["Average experience", "Product is fine but delivery was a bit delayed. Support was responsive though."],
];
export const seedReviews: Review[] = Array.from({ length: 42 }, (_, i) => {
  const p = pick(seedProducts);
  const c = pick(seedCustomers);
  const [title, body] = pick(reviewTexts);
  const spam = rand();
  return {
    id: i + 1,
    productId: p.id,
    productName: p.name,
    productImage: p.image,
    customerId: c.id,
    customerName: c.name,
    rating: rint(3, 5),
    title: i % 4 === 0 ? "Highly recommended!" : title,
    body,
    status: (chance(0.55) ? "approved" : chance(0.6) ? "pending" : "rejected") as Review["status"],
    reply: null,
    reported: chance(0.08),
    reportReason: chance(0.08) ? pick(["Spam / fake review", "Inappropriate content", "Suspicious link"]) : null,
    spamScore: Math.round(spam < 0.15 ? rint(55, 96) : rint(2, 38)),
    verifiedPurchase: chance(0.75),
    createdAt: i < 6 ? daysAgo(rint(0, 3)) : monthsAgo(rint(0, 10), rint(1, 28)),
  };
});

// ---------- dealers ----------
const dealerNames: [string, string][] = [
  ["MediPlus Distributors", "Rahul Mehta"], ["Shree Pharma Agencies", "Anil Verma"], ["HealthLine Traders", "Sunita Rao"],
  ["CareLink Supplies", "Imran Sheikh"], ["Wellness Wholesale", "Kavita Nair"], ["TrustMed Agencies", "Prakash Iyer"],
];
export const seedDealers = dealerNames.map(([company, person], i) => ({
  id: i + 1,
  company,
  contactPerson: person,
  phone: `+91 98${rint(10000000, 99999999)}`,
  email: `${company.toLowerCase().replace(/[^a-z]+/g, "")}@example.com`,
  address: `${rint(10, 500)}, Market Road, Phase ${i + 1}`,
  city: pick(["Mumbai", "Delhi", "Bengaluru", "Ahmedabad", "Lucknow", "Jaipur"]),
  country: "India",
  taxNumber: `GSTIN 27A${String.fromCharCode(65 + i)}${String(rint(100000, 999999))}`,
  bankDetails: { bank: pick(["HDFC Bank", "ICICI Bank", "State Bank of India"]), account: `502${String(rint(1000000000, 9999999999))}`, ifsc: `${pick(["HDFC000", "ICIC000", "SBIN000"])}${rint(1000, 9999)}` },
  commission: rint(5, 15),
  status: (i === 2 ? "pending" : chance(0.8) ? "approved" : "suspended") as Dealer["status"],
  rating: rfloat(3.4, 4.9, 1),
  productsCount: rint(4, 28),
  ordersCount: rint(8, 140),
  revenue: rint(80000, 900000),
  payments: Array.from({ length: rint(2, 6) }, (_, j) => ({
    date: monthsAgo(j + 1, rint(1, 26)),
    amount: rint(20000, 150000),
    method: pick(["NEFT", "UPI", "Cheque"]),
    status: chance(0.85) ? "paid" : "pending",
  })),
  joinedAt: monthsAgo(rint(1, 16)),
}));

// ---------- warehouses / inventory ----------
const warehouses = [
  { id: 1, name: "Medora Central — Mumbai", city: "Mumbai", manager: "Sanjay Kulkarni", capacity: 50000, used: 31200, status: "active" as const },
  { id: 2, name: "Medora North — Delhi", city: "Delhi", manager: "Amit Bansal", capacity: 40000, used: 17800, status: "active" as const },
  { id: 3, name: "Medora South — Bengaluru", city: "Bengaluru", manager: "Deepa Nagesh", capacity: 30000, used: 28400, status: "active" as const },
  { id: 4, name: "Cold Chain Hub — Pune", city: "Pune", manager: "Rohit Deshmukh", capacity: 8000, used: 3200, status: "maintenance" as const },
];
export const seedWarehouses = warehouses;

export const seedPurchaseOrders = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  number: `PO-${String(2100 + i * 13)}`,
  warehouseId: rint(1, 4),
  supplier: pick(["Sun Pharma", "Cipla Ltd", "Dr. Reddy's", "Mankind", "Zydus"]),
  items: rint(4, 14),
  total: rint(50000, 480000),
  status: pick(["ordered", "received", "received", "draft"] as const),
  expected: daysAgo(rint(-12, 12)),
  createdAt: daysAgo(rint(3, 40)),
}));

export const seedStockAdjustments = Array.from({ length: 10 }, (_, i) => {
  const p = pick(seedProducts);
  return {
    id: i + 1,
    productId: p.id,
    productName: p.name,
    warehouseId: rint(1, 4),
    delta: chance(0.6) ? rint(10, 120) : -rint(2, 25),
    reason: pick(["Purchase received", "Stock take correction", "Damaged goods", "Return from customer", "Sample stock"]),
    by: pick(["Sanjay Kulkarni", "Amit Bansal", "Deepa Nagesh", "Meera Iyer"]),
    at: daysAgo(rint(0, 30)),
  };
});

export const seedInventory = seedProducts.map((p, i) => ({
  productId: p.id,
  productName: p.name,
  sku: p.sku,
  image: p.image,
  warehouseId: (i % 4) + 1,
  stock: p.stock,
  lowStockAlert: p.lowStockAlert,
  updatedAt: daysAgo(rint(0, 12)),
}));

// ---------- coupons ----------
export const seedCoupons: any[] = [
  { code: "WELCOME15", type: "percent", value: 15, minOrder: 299, maxDiscount: 300, uses: 842, maxUses: 5000, perCustomer: 1, status: "active", description: "15% off your first order", appliesTo: "all" },
  { code: "SAVE10", type: "percent", value: 10, minOrder: 0, maxDiscount: 200, uses: 2310, maxUses: 10000, perCustomer: 3, status: "active", description: "Flat 10% off everything", appliesTo: "all" },
  { code: "HEALTH20", type: "percent", value: 20, minOrder: 999, maxDiscount: 500, uses: 128, maxUses: 2000, perCustomer: 2, status: "active", description: "20% off vitamins & supplements", appliesTo: "category", targetId: 2 },
  { code: "FIRST50", type: "fixed", value: 50, minOrder: 399, maxDiscount: null, uses: 512, maxUses: 3000, perCustomer: 1, status: "active", description: "Rs 50 off on orders above Rs 399", appliesTo: "all" },
  { code: "DIABETIC25", type: "percent", value: 25, minOrder: 799, maxDiscount: 400, uses: 96, maxUses: 1500, perCustomer: 2, status: "active", description: "25% off diabetes care range", appliesTo: "category", targetId: 3 },
  { code: "BOGO-KIDS", type: "bogo", value: 0, minOrder: 0, maxDiscount: null, uses: 74, maxUses: 1000, perCustomer: 2, status: "active", description: "Buy 1 Get 1 free on kids' vitamins", appliesTo: "category", targetId: 2 },
  { code: "FREESHIP", type: "freeship", value: 0, minOrder: 199, maxDiscount: null, uses: 1580, maxUses: 9999, perCustomer: 5, status: "active", description: "Free shipping on orders above Rs 199", appliesTo: "all" },
  { code: "FESTIVE30", type: "percent", value: 30, minOrder: 1499, maxDiscount: 750, uses: 0, maxUses: 5000, perCustomer: 1, status: "scheduled", description: "Festive season mega discount", appliesTo: "all" },
].map((c, i) => ({
  id: i + 1,
  startsAt: monthsAgo(1, 1),
  endsAt: monthsAgo(-1, 28),
  createdAt: monthsAgo(2),
  ...c,
}));

export const seedFlashSales = [
  { id: 1, title: "Weekend Wellness Flash Sale", productIds: [2, 3, 9, 15, 22], discount: 30, startsAt: daysAgo(-1), endsAt: daysAgo(-2), status: "live" as const },
  { id: 2, title: "Diabetes Care Mega Deal", productIds: [5, 6, 20, 21], discount: 25, startsAt: daysAgo(-6), endsAt: daysAgo(-4), status: "ended" as const },
  { id: 3, title: "Back to School Immunity", productIds: [31, 32, 8], discount: 20, startsAt: daysAgo(3), endsAt: daysAgo(7), status: "scheduled" as const },
];

// ---------- content ----------
export const seedContent: any[] = [
  { key: "hero", section: "Homepage", label: "Hero Banner", value: JSON.stringify({ heading: "Your Health Deserves The Best Care", sub: "Genuine medicines, verified batches and doorstep delivery — with care you can rely on.", cta: "Shop Medicines", image: pic("hero-medora", 900, 620), badge: "Trusted by 2M+ families" }) },
  { key: "banner-1", section: "Promotions", label: "Promo Banner — Vitamins", value: JSON.stringify({ title: "Up to 30% off Vitamins", sub: "Immunity bundles from India's best brands", cta: "Shop now", image: pic("promo-vit", 700, 300), color: "mint" }) },
  { key: "banner-2", section: "Promotions", label: "Promo Banner — Devices", value: JSON.stringify({ title: "Health devices at factory prices", sub: "BP monitors, thermometers & more", cta: "Explore", image: pic("promo-devices", 700, 300), color: "blue" }) },
  { key: "section-care", section: "Homepage", label: "Care & Wellness Section", value: JSON.stringify({ title: "Care beyond the counter", sub: "From doctors to doorstep — we take care of everything.", cta: "Learn more" }) },
  { key: "section-wellness", section: "Homepage", label: "Wellness Journal Section", value: JSON.stringify({ title: "Wellness, decoded", sub: "Articles from our pharmacists and doctors.", cta: "Read the journal" }) },
  { key: "about", section: "Pages", label: "About Page", value: JSON.stringify({ title: "About Medora", body: "Medora started with a simple mission — make genuine medicines reach every home...", stats: { pharmacies: 120, cities: 850, families: "2M+" } }) },
  { key: "contact", section: "Pages", label: "Contact Information", value: JSON.stringify({ email: "care@medora.health", phone: "+91 1800 419 0990", address: "4th Floor, Sunrise Tower, Andheri East, Mumbai 400069", hours: "Mon–Sat, 9:00–21:00 IST" }) },
  { key: "footer", section: "Footer", label: "Footer Content", value: JSON.stringify({ tagline: "Care, delivered.", disclaimer: "Medora is a licensed pharmacy. Medicines are dispensed only against valid prescriptions where required by law." }) },
  { key: "socials", section: "Social", label: "Social Media Links", value: JSON.stringify([{ label: "Instagram", url: "https://instagram.com/medora" }, { label: "Facebook", url: "https://facebook.com/medora" }, { label: "YouTube", url: "https://youtube.com/@medora" }, { label: "X", url: "https://x.com/medora" }]) },
  { key: "announcement", section: "Homepage", label: "Announcement Bar", value: JSON.stringify({ text: "Free delivery on orders above Rs 499", enabled: true }) },
];

export const seedFaqs = [
  { id: 1, question: "Is Medora a licensed pharmacy?", answer: "Yes, we are a fully licensed online pharmacy. All orders are verified and dispensed by registered pharmacists.", category: "Orders", order: 1 },
  { id: 2, question: "How long does delivery take?", answer: "Metro cities within 24–48 hours; everywhere else 2–4 business days. Cold-chain orders ship in temperature-controlled packaging.", category: "Orders", order: 2 },
  { id: 3, question: "Do I need a prescription for all medicines?", answer: "Only for prescription-only drugs. Upload your Rx at checkout and our pharmacists will verify it before dispatch.", category: "Prescriptions", order: 3 },
  { id: 4, question: "What is your return policy?", answer: "Unopened products can be returned within 7 days. Damaged or expired items are replaced free of charge.", category: "Returns", order: 4 },
  { id: 5, question: "How do I cancel an order?", answer: "Orders can be cancelled any time before dispatch from My Orders. Refunds are processed within 3–5 business days.", category: "Orders", order: 5 },
];

export const seedMenu = [
  { id: 1, label: "Medicines", href: "#medicines", order: 1 },
  { id: 2, label: "Categories", href: "#categories", order: 2 },
  { id: 3, label: "Consult a Doctor", href: "#consult", order: 3 },
  { id: 4, label: "Wellness", href: "#wellness", order: 4 },
  { id: 5, label: "Reviews", href: "#reviews", order: 5 },
];

export const seedMedia: any[] = [];
const mediaNames = ["hero-medicine", "pharmacy-team", "cold-chain-box", "delivery-van", "vitamin-bundle", "bp-monitor", "thermometer", "skin-serum", "baby-care", "diabetes-kit", "consult-doc", "wellness-journal", "festive-banner", "app-phone", "storefront", "care-pack"];
const mediaTypes = ["image", "image", "image", "image", "image", "image", "image", "image", "image", "image", "image", "image", "image", "image", "video", "document"] as const;
mediaNames.forEach((n, i) => {
  seedMedia.push({
    id: i + 1,
    name: `${n}.${mediaTypes[i] === "video" ? "mp4" : mediaTypes[i] === "document" ? "pdf" : "jpg"}`,
    url: mediaTypes[i] === "image" ? pic(`media-${n}`, 600, 400) : `https://example.com/files/${n}`,
    folder: pick(["Hero", "Products", "Brand", "Campaigns", "Uncategorized"]),
    type: mediaTypes[i],
    size: `${rint(40, 3800)} KB`,
    width: 600,
    height: 400,
    createdAt: daysAgo(rint(1, 60)),
  });
});

export const seedSupport: any[] = [
  { kind: "message", subject: "Where is my order #MD-24123?", customerName: "Rohan Gupta", customerEmail: "rohan.gupta@example.com", message: "Ordered 5 days ago, still shows processing. Need it urgently for my father's medication.", priority: "high", status: "open", assignee: "Sneha K." },
  { kind: "ticket", subject: "Refund not received", customerName: "Priya Sharma", customerEmail: "priya.sharma@example.com", message: "Cancelled order MD-23900 on Monday, refund hasn't hit my account yet.", priority: "medium", status: "pending", assignee: "Amit B." },
  { kind: "message", subject: "Prescription upload issue", customerName: "Arjun Nair", customerEmail: "arjun.nair@example.com", message: "The upload keeps failing on mobile. Tried JPG and PDF both.", priority: "medium", status: "new", assignee: "Unassigned" },
  { kind: "ticket", subject: "Wrong item delivered", customerName: "Meera Iyer", customerEmail: "meera.iyer@example.com", message: "Received sunscreen instead of the serum I ordered. Photos attached.", priority: "urgent", status: "open", assignee: "Sneha K." },
  { kind: "chat", subject: "Live chat — dosage query", customerName: "Kabir Khan", customerEmail: "kabir.khan@example.com", message: "Pharmacist asked me to take the tablet with milk — is that right for this one?", priority: "low", status: "resolved", assignee: "Dr. Patil" },
  { kind: "message", subject: "Delivery to wrong address", customerName: "Tara Bose", customerEmail: "tara.bose@example.com", message: "Courier delivered to the old address. Please arrange a re-delivery.", priority: "high", status: "new", assignee: "Unassigned" },
].map((s, i) => ({
  id: i + 1,
  replies: [
    { by: s.assignee !== "Unassigned" ? s.assignee : "Support Bot", at: daysAgo(1), body: "Thanks for reaching out! We're looking into this and will update you shortly." },
  ],
  createdAt: daysAgo(rint(0, 8)),
  ...s,
}));

export const seedSubscribers = Array.from({ length: 30 }, (_, i) => {
  const name = `${pick(firstNames)} ${pick(lastNames)}`;
  return {
    id: i + 1,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}${i + 3}@gmail.com`,
    name: chance(0.7) ? name : null,
    source: pick(["Homepage", "Checkout", "Footer", "Blog", "Campaign"]),
    status: chance(0.88) ? "subscribed" as const : chance(0.5) ? "unsubscribed" as const : "bounced" as const,
    joinedAt: monthsAgo(rint(0, 12), rint(1, 28)),
    campaigns: rint(0, 9),
  };
});

export const seedUsers: AdminUser[] = [
  { id: 1, name: "Aarav Mehta", email: "admin@medora.health", role: "Super Admin", status: "active", avatar: pic("admin-aarav", 120, 120), lastLogin: hoursAgo(1), twoFactor: true, createdAt: monthsAgo(18) },
  { id: 2, name: "Sneha Kulkarni", email: "sneha@medora.health", role: "Manager", status: "active", avatar: pic("admin-sneha", 120, 120), lastLogin: hoursAgo(3), twoFactor: true, createdAt: monthsAgo(14) },
  { id: 3, name: "Amit Bansal", email: "amit@medora.health", role: "Inventory Manager", status: "active", avatar: pic("admin-amit", 120, 120), lastLogin: daysAgo(1), twoFactor: false, createdAt: monthsAgo(11) },
  { id: 4, name: "Priya Nair", email: "priya@medora.health", role: "Customer Support", status: "active", avatar: pic("admin-priya", 120, 120), lastLogin: hoursAgo(6), twoFactor: false, createdAt: monthsAgo(9) },
  { id: 5, name: "Rohit Deshmukh", email: "rohit@medora.health", role: "Marketing", status: "active", avatar: pic("admin-rohit", 120, 120), lastLogin: daysAgo(2), twoFactor: false, createdAt: monthsAgo(7) },
  { id: 6, name: "Neha Gupta", email: "neha@medora.health", role: "Admin", status: "disabled", avatar: pic("admin-neha", 120, 120), lastLogin: daysAgo(30), twoFactor: false, createdAt: monthsAgo(16) },
];

export const seedNotifications: any[] = [
  { type: "order", title: "New order received", body: "Order MD-24127 from Rohan Gupta — Rs 1,240. Awaiting processing.", at: hoursAgo(1), href: "/admin/orders", read: false },
  { type: "stock", title: "Low stock alert", body: "3 products are below their low-stock threshold. Review inventory.", at: hoursAgo(3), href: "/admin/inventory", read: false },
  { type: "dealer", title: "New dealer application", body: "HealthLine Traders applied to join as a dealer.", at: hoursAgo(7), href: "/admin/dealers", read: false },
  { type: "refund", title: "Refund requested", body: "Meera Iyer requested a refund for order MD-24102.", at: hoursAgo(9), href: "/admin/orders", read: false },
  { type: "review", title: "New review pending", body: "4 reviews are waiting for approval.", at: daysAgo(1), href: "/admin/reviews", read: false },
  { type: "message", title: "New support message", body: "Tara Bose: \"Delivery to wrong address\".", at: daysAgo(1), href: "/admin/support", read: false },
  { type: "system", title: "Daily backup completed", body: "Automated backup finished successfully at 02:00 IST.", at: daysAgo(1), href: "/admin/settings", read: true },
  { type: "order", title: "Order shipped", body: "12 orders were handed to courier partners today.", at: daysAgo(2), href: "/admin/orders", read: true },
  { type: "stock", title: "Purchase order received", body: "PO-2139 from Sun Pharma was received at Mumbai warehouse.", at: daysAgo(2), href: "/admin/inventory", read: true },
  { type: "system", title: "Security scan passed", body: "Weekly vulnerability scan completed — no critical findings.", at: daysAgo(3), href: "/admin/security", read: true },
];

export const seedRoles = [
  { name: "Super Admin", description: "Full access to every module, including security and user management.", permissions: ["*"], users: 1 },
  { name: "Admin", description: "Manage the catalogue, orders and customers. No security settings.", permissions: ["dashboard", "products", "categories", "brands", "inventory", "orders", "customers", "reviews", "dealers", "coupons", "content", "media", "support", "newsletter", "reports", "users", "settings", "notifications", "audit"], users: 1 },
  { name: "Manager", description: "Day-to-day operations across catalogue and sales.", permissions: ["dashboard", "products", "categories", "brands", "inventory", "orders", "customers", "reviews", "dealers", "coupons", "reports"], users: 1 },
  { name: "Inventory Manager", description: "Stock levels, warehouses and purchase orders only.", permissions: ["dashboard", "products.view", "inventory", "reports.view"], users: 1 },
  { name: "Customer Support", description: "Orders, customers and the support inbox.", permissions: ["dashboard", "orders", "customers", "reviews", "support"], users: 1 },
  { name: "Marketing", description: "Promotions, content, media and newsletter.", permissions: ["dashboard", "coupons", "content", "media", "newsletter", "reports.view"], users: 1 },
];

export const seedAudit: any[] = [
  { user: "Sneha Kulkarni", action: "updated", target: "Product #12 — Antiseptic Liquid", at: hoursAgo(2), ip: "103.95.87.12", changes: [{ field: "price", from: 149, to: 129 }] },
  { user: "Amit Bansal", action: "created", target: "Purchase Order PO-2143", at: hoursAgo(5), ip: "103.95.87.44", changes: [{ field: "supplier", from: null, to: "Cipla Ltd" }] },
  { user: "Aarav Mehta", action: "deleted", target: "User #6 — Neha Gupta", at: hoursAgo(26), ip: "103.95.87.2", changes: [{ field: "status", from: "active", to: "disabled" }] },
  { user: "Priya Nair", action: "replied", target: "Ticket #2 — Refund not received", at: hoursAgo(30), ip: "103.95.87.61", changes: [] },
  { user: "Rohit Deshmukh", action: "created", target: "Coupon FESTIVE30", at: daysAgo(2), ip: "103.95.87.33", changes: [{ field: "discount", from: null, to: "30%" }] },
  { user: "Aarav Mehta", action: "updated", target: "Settings — Store Information", at: daysAgo(3), ip: "103.95.87.2", changes: [{ field: "phone", from: "+91 1800 419 0990", to: "+91 1800 419 0995" }] },
  { user: "Sneha Kulkarni", action: "approved", target: "Dealer — CareLink Supplies", at: daysAgo(4), ip: "103.95.87.12", changes: [{ field: "status", from: "pending", to: "approved" }] },
  { user: "Amit Bansal", action: "adjusted", target: "Stock — Blood Glucose Test Strips", at: daysAgo(5), ip: "103.95.87.44", changes: [{ field: "stock", from: 6, to: 56 }] },
];

export const seedSettings: any = {
  store: {
    name: "Medora", tagline: "Your Health Deserves The Best Care", email: "care@medora.health", phone: "+91 1800 419 0990",
    address: "4th Floor, Sunrise Tower, Andheri East, Mumbai 400069", currency: "INR (Rs)", timezone: "Asia/Kolkata",
    logo: pic("medora-logo", 240, 90), favicon: pic("medora-favicon", 64, 64),
  },
  email: { from: "Medora <care@medora.health>", replyTo: "care@medora.health", smtp: { host: "smtp.medora.health", port: 587, user: "care@medora.health", secure: true } },
  payments: {
    methods: [
      { id: "upi", label: "UPI (GPay / PhonePe / Paytm)", enabled: true },
      { id: "card", label: "Credit / Debit Cards", enabled: true },
      { id: "cod", label: "Cash on Delivery", enabled: true },
      { id: "netbanking", label: "Net Banking", enabled: true },
      { id: "wallet", label: "Medora Wallet", enabled: false },
    ],
  },
  shipping: {
    methods: [
      { id: "standard", label: "Standard Delivery (2–4 days)", cost: 49, freeAbove: 499, enabled: true },
      { id: "express", label: "Express Delivery (24h)", cost: 99, freeAbove: 0, enabled: true },
      { id: "coldchain", label: "Cold-Chain Delivery", cost: 149, freeAbove: 0, enabled: true },
    ],
  },
  taxes: { enabled: true, rate: 5, included: false, label: "GST (5%)" },
  languages: [
    { code: "en", label: "English", default: true },
    { code: "hi", label: "हिन्दी", default: false },
    { code: "mr", label: "मराठी", default: false },
    { code: "ta", label: "தமிழ்", default: false },
  ],
  theme: { accent: "#135fc9", radius: 12, font: "Manrope", darkMode: false },
  seo: { titleSuffix: "| Medora — Care, delivered", description: "Genuine medicines delivered safely to your doorstep.", keywords: "pharmacy, medicines, online pharmacy, healthcare", googleVerification: "G-ABCDEF1234" },
  security: { twoFactorRequired: false, passwordMinLength: 10, sessionTimeout: 30, rateLimit: 60, passwordExpiryDays: 90 },
  backup: { autoBackup: true, frequency: "daily", retention: 30, lastBackup: hoursAgo(9) },
};

// ============================================================
export function buildSeed(): DbShape {
  const seq = 10000;
  return {
    seq,
    products: seedProducts,
    categories: seedCategories,
    brands: seedBrands,
    dealers: seedDealers,
    orders: seedOrders,
    customers: seedCustomers,
    reviews: seedReviews,
    warehouses: seedWarehouses,
    purchaseOrders: seedPurchaseOrders,
    stockAdjustments: seedStockAdjustments,
    inventory: seedInventory,
    coupons: seedCoupons,
    flashSales: seedFlashSales,
    content: seedContent.map((c, i) => ({ id: i + 1, ...c })),
    faqs: seedFaqs,
    menu: seedMenu,
    socials: [
      { id: 1, label: "Instagram", url: "https://instagram.com/medora", order: 1 },
      { id: 2, label: "Facebook", url: "https://facebook.com/medora", order: 2 },
      { id: 3, label: "YouTube", url: "https://youtube.com/@medora", order: 3 },
      { id: 4, label: "X", url: "https://x.com/medora", order: 4 },
    ],
    media: seedMedia,
    support: seedSupport,
    subscribers: seedSubscribers,
    users: seedUsers,
    roles: seedRoles.map((r, i) => ({ id: i + 1, ...r })),
    notifications: seedNotifications.map((n, i) => ({ id: i + 1, ...n })),
    audit: seedAudit.map((a, i) => ({ id: i + 1, ...a })),
    settings: seedSettings,
  };
}
