// ============================================================
// MEDORA CONTROL CENTRE — data store
// MongoDB-backed store (database: medora). On first run the
// database is seeded from lib/db/seed.ts; after that every
// mutation is persisted to MongoDB so data survives restarts.
// The API layer (app/api/**) is the only consumer and keeps
// the same read()/write() interface as before.
//
// Every read()/write() loads a fresh snapshot from MongoDB.
// Serverless platforms run many instances in parallel, and a
// long-lived in-memory copy would let one stale instance roll
// the whole database back when it persists.
// ============================================================

import { MongoClient, type Db, type Filter, type Document } from "mongodb";
import { buildSeed } from "./seed";
import type { DbShape } from "./types";

// Local dev may run against a local MongoDB; deployed environments must
// set MONGODB_URI — fail fast below instead of hanging on a bad address.
const MONGODB_URI =
  process.env.MONGODB_URI ||
  (process.env.NODE_ENV === "production" ? "" : "mongodb://127.0.0.1:27017");
const MONGODB_DB = process.env.MONGODB_DB || "medora";

const ARRAY_COLLECTIONS = [
  "products", "categories", "brands", "dealers", "orders", "customers",
  "reviews", "warehouses", "purchaseOrders", "stockAdjustments", "inventory",
  "coupons", "flashSales", "content", "faqs", "menu", "socials", "media",
  "support", "subscribers", "users", "roles", "notifications", "audit",
] as const;

// The connection lives on globalThis so Next.js dev hot-reloads (and any
// module re-evaluation) reuse it instead of opening a new one.
const globalForDb = globalThis as unknown as {
  medoraMongo?: { client: MongoClient; db: Db };
};

let client: MongoClient | null = globalForDb.medoraMongo?.client ?? null;
let db: Db | null = globalForDb.medoraMongo?.db ?? null;
let writeQueue: Promise<void> = Promise.resolve();

async function connect(): Promise<Db> {
  if (db) return db;
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not configured. Set it in the environment variables of this deployment."
    );
  }
  client = new MongoClient(MONGODB_URI, {
    // Fail fast instead of the driver's 30 s default: on serverless a
    // hanging connection gets killed by the platform and the client
    // just sees a spinner that never stops.
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  await client.connect();
  db = client.db(MONGODB_DB);
  globalForDb.medoraMongo = { client, db };
  return db;
}

/** Lightweight connectivity probe used by /api/health. */
export async function pingDb(): Promise<void> {
  const database = await connect();
  await database.command({ ping: 1 });
}

/** Strip MongoDB's _id so rows match the JSON shape the API expects. */
function stripId<T extends Record<string, unknown>>(doc: T): T {
  const { _id, ...rest } = doc;
  return rest as T;
}

/** System records only — used when SEED_DEMO_DATA=false. */
function blankShape(): DbShape {
  return {
    ...buildSeed(),
    products: [], categories: [], brands: [], dealers: [], orders: [],
    customers: [], reviews: [], warehouses: [], purchaseOrders: [],
    stockAdjustments: [], inventory: [], coupons: [], flashSales: [],
    content: [], faqs: [], menu: [], socials: [], media: [], support: [],
    subscribers: [], notifications: [], audit: [],
  };
}

async function load(): Promise<DbShape> {
  const database = await connect();

  // A database is seeded at most once, tracked by the `meta.seed` flag —
  // NOT by collection emptiness, so wiping the data never triggers a
  // re-seed. SEED_DEMO_DATA=false initializes a blank store (only system
  // records: admin users, roles, settings) instead of the demo dataset.
  const seeded = await database.collection("meta").findOne({ key: "seed" } as Filter<Document>);
  if (!seeded) {
    const shape = process.env.SEED_DEMO_DATA === "false" ? blankShape() : buildSeed();
    await persistShape(shape);
    await database
      .collection("meta")
      .updateOne({ key: "seed" } as Filter<Document>, { $set: { key: "seed", value: true } }, { upsert: true });
    return shape;
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
  return shape;
}

/** Replace every collection in MongoDB from a full snapshot. */
function persistShape(snap: DbShape): Promise<void> {
  // Swallow any previous failure so one failed persist does not
  // poison every later write on this instance.
  writeQueue = writeQueue.catch(() => undefined).then(async () => {
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
  return writeQueue;
}

/** Run a read-only transaction against a fresh snapshot of the store. */
export async function read<T>(fn: (db: DbShape) => T): Promise<T> {
  return fn(await load());
}

/** Run a write transaction; the store is persisted to MongoDB afterwards. */
export async function write<T>(fn: (db: DbShape) => T | Promise<T>): Promise<T> {
  const database = await load();
  const result = await fn(database);
  await persistShape(database);
  return result;
}

export async function nextId(db: DbShape): Promise<number> {
  db.seq += 1;
  return db.seq;
}

/** Wipe the database and re-seed it. */
export async function resetDb() {
  const shape = buildSeed();
  await persistShape(shape);
  return shape;
}
