// Product catalogue + helpers, ported from the data embedded in medical_store2.html.

export type Product = {
  id: number;
  name: string;
  brand: string;
  cat: string;
  price: number;
  mrp: number;
  rating: number;
  rev: number;
  seed: string;
  /** Additional image seeds used by the quick-view product gallery. */
  gallery?: string[];
  tint: string;
  rx?: boolean;
  stock?: boolean; // undefined = in stock
  desc: string;
  salt: string;
};

export const PRODUCTS: Product[] = [
  { id: 1, name: "Paracetamol 500mg · Fever & Pain Relief", brand: "Cipla", cat: "rx", price: 32, mrp: 40, rating: 4.8, rev: 2140, seed: "paracetamol-tablets", gallery: ["paracetamol-tablets", "paracetamol-tablets-pack", "paracetamol-tablets-detail"], tint: "pm-mint", desc: "Fast-acting relief from fever, headache and body ache. India's most trusted first-line tablet, verified batch by batch.", salt: "Paracetamol 500mg · 15 tablets" },
  { id: 2, name: "Vitamin D3 60,000 IU Weekly Capsules", brand: "HealthVit", cat: "vitamins", price: 149, mrp: 199, rating: 4.7, rev: 1876, seed: "vitamin-d3-capsules", gallery: ["vitamin-d3-capsules", "vitamin-d3-capsules-pack", "vitamin-d3-capsules-detail"], tint: "pm-peach", desc: "High-strength weekly Vitamin D3 to fight fatigue, support bones and lift immunity — the sunshine, bottled.", salt: "Cholecalciferol 60,000 IU · 8 softgels" },
  { id: 3, name: "Multivitamin Gold · 23 Essential Nutrients", brand: "Revital", cat: "vitamins", price: 345, mrp: 425, rating: 4.6, rev: 1543, seed: "multivitamin-bottle-gold", gallery: ["multivitamin-bottle-gold", "multivitamin-bottle-gold-pack", "multivitamin-bottle-gold-detail"], tint: "pm-blue", desc: "A complete daily foundation for energy, immunity and focus. One capsule, 23 nutrients, zero guesswork.", salt: "Multivitamins + Minerals + Ginseng · 30 caps" },
  { id: 4, name: "Omega-3 Fish Oil · Triple Strength 1000mg", brand: "Seacod", cat: "heart", price: 599, mrp: 799, rating: 4.7, rev: 987, seed: "omega3-fish-oil-softgels", gallery: ["omega3-fish-oil-softgels", "omega3-fish-oil-softgels-pack", "omega3-fish-oil-softgels-detail"], tint: "pm-blue", rx: true, stock: false, desc: "Molecularly distilled EPA & DHA for heart, brain and joints. Burp-free, heavy-metal tested.", salt: "EPA 360mg + DHA 240mg · 60 softgels" },
  { id: 5, name: "Blood Glucose Test Strips (50 count)", brand: "Accu-Chek", cat: "diabetes", price: 950, mrp: 1150, rating: 4.9, rev: 3210, seed: "glucose-test-strips", gallery: ["glucose-test-strips", "glucose-test-strips-pack", "glucose-test-strips-detail"], tint: "pm-mint", desc: "Lab-accurate readings in 5 seconds. Compatible with Active meters, sealed for freshness.", salt: "Enzymatic strips · 50 pcs" },
  { id: 6, name: "Metformin SR 500mg Prolonged Release", brand: "USV", cat: "diabetes", price: 28, mrp: 34, rating: 4.8, rev: 1765, seed: "metformin-tablets", gallery: ["metformin-tablets", "metformin-tablets-pack", "metformin-tablets-detail"], tint: "pm-lav", rx: true, desc: "Sustained-release glucose control with gentler digestion. Dispensed against valid prescription only.", salt: "Metformin HCl 500mg SR · 20 tablets" },
  { id: 7, name: "Baby Diaper Rash Cream · Pediatrician Tested", brand: "Himalaya", cat: "baby", price: 135, mrp: 165, rating: 4.8, rev: 876, seed: "baby-rash-cream", gallery: ["baby-rash-cream", "baby-rash-cream-pack", "baby-rash-cream-detail"], tint: "pm-peach", desc: "Soothes and protects delicate skin with zinc oxide and aloe. Fragrance-free, paraben-free, worry-free.", salt: "Zinc Oxide + Aloe Vera · 75g" },
  { id: 8, name: "SPF 50+ Sunscreen · Matte Finish, Non-greasy", brand: "La Shield", cat: "skin", price: 425, mrp: 525, rating: 4.6, rev: 1432, seed: "sunscreen-spf50-tube", gallery: ["sunscreen-spf50-tube", "sunscreen-spf50-tube-pack", "sunscreen-spf50-tube-detail"], tint: "pm-peach", stock: false, desc: "Broad-spectrum UVA/UVB protection that disappears on skin. Dermatologist recommended for daily use.", salt: "SPF 50+ PA+++ · 50g" },
  { id: 9, name: "Vitamin C + Zinc Effervescent · Orange", brand: "Limcee", cat: "vitamins", price: 180, mrp: 220, rating: 4.5, rev: 2098, seed: "vitamin-c-effervescent", gallery: ["vitamin-c-effervescent", "vitamin-c-effervescent-pack", "vitamin-c-effervescent-detail"], tint: "pm-mint", desc: "Fizzy daily immunity in a glass. 1000mg Vitamin C with Zinc, gentle on the stomach.", salt: "Ascorbic Acid 1000mg + Zn 10mg · 15 tabs" },
  { id: 10, name: "Digital Infrared Thermometer · 1s Read", brand: "Omron", cat: "devices", price: 899, mrp: 1099, rating: 4.7, rev: 1211, seed: "digital-thermometer-white", gallery: ["digital-thermometer-white", "digital-thermometer-white-pack", "digital-thermometer-white-detail"], tint: "pm-blue", desc: "Forehead-to-read in one second, fever alarm, 25-memory recall. Calibrated and tested before dispatch.", salt: "Infrared, ±0.2°C accuracy · 1 unit" },
  { id: 11, name: "Cough Relief Syrup · Honey & Tulsi", brand: "Benadryl", cat: "rx", price: 118, mrp: 132, rating: 4.4, rev: 954, seed: "cough-syrup-bottle", gallery: ["cough-syrup-bottle", "cough-syrup-bottle-pack", "cough-syrup-bottle-detail"], tint: "pm-mint", desc: "Soothing relief for dry and wet cough with the comfort of honey and tulsi. Non-drowsy day formula.", salt: "Diphenhydramine + Honey-Tulsi · 150ml" },
  { id: 12, name: "Antiseptic Liquid · First Aid Protection", brand: "Dettol", cat: "personal", price: 129, mrp: 149, rating: 4.9, rev: 4321, seed: "antiseptic-liquid-classic", gallery: ["antiseptic-liquid-classic", "antiseptic-liquid-classic-pack", "antiseptic-liquid-classic-detail"], tint: "pm-lav", desc: "The trusted classic for cuts, wounds and hygiene. Kills 99.9% of germs, every time.", salt: "Chloroxylenol 4.8% · 550ml" },
  { id: 13, name: "Amlodipine 5mg · Blood Pressure Care", brand: "Cipla", cat: "heart", price: 30, mrp: 42, rating: 4.8, rev: 1108, seed: "bp-tablets-strip", gallery: ["bp-tablets-strip", "bp-tablets-strip-pack", "bp-tablets-strip-detail"], tint: "pm-blue", rx: true, desc: "Consistent once-daily blood pressure management. Prescription verified by our cardiac pharmacist.", salt: "Amlodipine 5mg · 15 tablets" },
  { id: 14, name: "Baby Gentle Hair-to-Toe Wash · No Tears", brand: "Johnson's", cat: "baby", price: 249, mrp: 299, rating: 4.7, rev: 764, seed: "baby-wash-bottle-soft", gallery: ["baby-wash-bottle-soft", "baby-wash-bottle-soft-pack", "baby-wash-bottle-soft-detail"], tint: "pm-lav", desc: "pH-balanced, tear-free cleansing for newborn skin and hair. Pediatrician & dermatologist tested.", salt: "Soap-free formula · 500ml" },
  { id: 15, name: "Niacinamide 10% Serum · Clarity & Calm", brand: "Minimalist", cat: "skin", price: 499, mrp: 599, rating: 4.6, rev: 1876, seed: "niacinamide-serum-glass", gallery: ["niacinamide-serum-glass", "niacinamide-serum-glass-pack", "niacinamide-serum-glass-detail"], tint: "pm-lav", desc: "Dermatologist-grade serum for marks, texture and oil balance. Fragrance-free, tested for sensitive skin.", salt: "Niacinamide 10% + Zinc 1% · 30ml" },
  { id: 16, name: "Automatic BP Monitor · IntelliSense Cuff", brand: "Omron", cat: "devices", price: 1899, mrp: 2450, rating: 4.8, rev: 2310, seed: "bp-monitor-machine", gallery: ["bp-monitor-machine", "bp-monitor-machine-pack", "bp-monitor-machine-detail"], tint: "pm-mint", stock: false, desc: "Clinically validated upper-arm monitor with irregular heartbeat detection. 3-year Medora warranty.", salt: "Oscillometric · 30-memory · 1 unit" },
];

export const CATNAME: Record<string, string> = {
  rx: "Prescription",
  vitamins: "Vitamins",
  diabetes: "Diabetes",
  heart: "Heart",
  skin: "Skin",
  baby: "Baby",
  devices: "Devices",
  personal: "Personal Care",
};

export const FREE_AT = 499; // free-delivery threshold (PKR)

export const rupees = (n: number) => "Rs " + n.toLocaleString("en-PK");
export const pctOff = (p: Product) => Math.round((1 - p.price / p.mrp) * 100);
export const starStr = (r: number) => "★".repeat(Math.round(r));
export const isInStock = (p: Product) => p.stock !== false;

/** picsum.photos url for a seed + dimensions */
export const pic = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;
