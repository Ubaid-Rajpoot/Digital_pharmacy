// ============================================================
// MEDORA CONTROL CENTRE — data store
// MongoDB-backed store (database: medora). On first run the
// database is seeded from lib/db/seed.ts; after that every
// mutation is persisted to MongoDB so data survives restarts.
// The API layer (app/api/**) is the only consumer and keeps
// the same read()/write() interface as before.
// ============================================================

import { MongoClient, type Db, type Filter, type Document } from "mongodb";
import { buildSeed } from "./seed";
import type { DbShape } from "./types";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGODB_DB = process.env.MONGODB_DB || "medora";

const ARRAY_COLLECTIONS = [
  "products", "categories", "brands", "dealers", "orders", "customers",
  "reviews", "warehouses", "purchaseOrders", "stockAdjustments", "inventory",
  "coupons", "flashSales", "content", "faqs", "menu", "socials", "media",
  "support", "subscribers", "users", "roles", "notifications", "audit",
] as const;

let client: MongoClient | null = null;
let db: Db | null = null;
let cache: DbShape | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function connect(): Promise<Db> {
  if (!db) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(MONGODB_DB);
  }
  return db;
}

/** Strip MongoDB's _id so rows match the JSON shape the API expects. */
function stripId<T extends Record<string, unknown>>(doc: T): T {
  const { _id, ...rest } = doc;
  return rest as T;
}

async function load(): Promise<DbShape> {
  if (cache) return cache;
  const database = await connect();

  const productCount = await database.collection("products").countDocuments();
  if (productCount === 0) {
    // Fresh database — seed it once.
    cache = buildSeed();
    await persist();
    return cache;
  }

  const shape = {} as DbShape;
  for (const name of ARRAY_COLLECTIONS) {
    const docs = await database.collection(name).find({}).toArray();
    (shape as unknown as Record<string, unknown>)[name] = docs.map((d) => stripId(d as unknown as Record<string, unknown>));
  }
  const meta = await database.collection("meta").findOne({ key: "seq" } as Filter<Document>);
  shape.seq = typeof meta?.value === "number" ? meta.value : 10000;
  const settingsDoc = await database.collection("settings").findOne({ key: "settings" } as Filter<Document>);
  shape.settings = (settingsDoc?.value as DbShape["settings"]) ?? buildSeed().settings;
  cache = shape;
  return cache;
}

async function persist() {
  if (!cache) return;
  // Snapshot so a queued write persists a consistent state.
  const snap = structuredClone(cache);
  writeQueue = writeQueue.then(async () => {
    const database = await connect();
    for (const name of ARRAY_COLLECTIONS) {
      const docs = (snap as unknown as Record<string, unknown>)[name] as Record<string, unknown>[] | undefined;
      const col = database.collection(name);
      await col.deleteMany({});
      if (docs && docs.length) await col.insertMany(docs as never[]);
    }
    await database
      .collection("meta")
      .replaceOne({ key: "seq" } as Filter<Document>, { key: "seq", value: snap.seq }, { upsert: true });
    await database
      .collection("settings")
      .replaceOne({ key: "settings" } as Filter<Document>, { key: "settings", value: snap.settings }, { upsert: true });
  });
  await writeQueue;
}

/** Run a read-only transaction against the store. */
export async function read<T>(fn: (db: DbShape) => T): Promise<T> {
  const database = await load();
  return fn(database);
}

/** Run a write transaction; the store is persisted to MongoDB afterwards. */
export async function write<T>(fn: (db: DbShape) => T | Promise<T>): Promise<T> {
  const database = await load();
  const result = await fn(database);
  await persist();
  return result;
}

export async function nextId(db: DbShape): Promise<number> {
  db.seq += 1;
  return db.seq;
}

/** Wipe the database and re-seed it. */
export async function resetDb() {
  cache = buildSeed();
  await persist();
  return cache;
}
