// ============================================================
// MEDORA CONTROL CENTRE — data store
// A JSON-file-backed store (data/db.json) so CRUD survives
// reloads without a real database. Swap the internals for
// Postgres/Prisma later — the API layer is the only consumer.
// ============================================================

import { promises as fs } from "fs";
import path from "path";
import { buildSeed } from "./seed";
import type { DbShape } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let cache: DbShape | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function load(): Promise<DbShape> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    cache = JSON.parse(raw) as DbShape;
  } catch {
    cache = buildSeed();
    await persist();
  }
  return cache;
}

async function persist() {
  if (!cache) return;
  const snap = JSON.stringify(cache, null, 2);
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, snap, "utf8");
  });
  await writeQueue;
}

/** Run a read-only transaction against the store. */
export async function read<T>(fn: (db: DbShape) => T): Promise<T> {
  const db = await load();
  return fn(db);
}

/** Run a write transaction; the store is persisted afterwards. */
export async function write<T>(fn: (db: DbShape) => T): Promise<T> {
  const db = await load();
  const result = fn(db);
  await persist();
  return result;
}

export async function nextId(db: DbShape): Promise<number> {
  db.seq += 1;
  return db.seq;
}

export async function resetDb() {
  cache = buildSeed();
  await persist();
  return cache;
}
