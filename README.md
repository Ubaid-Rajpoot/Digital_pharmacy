# Medora — Digital Pharmacy (Storefront + Admin Control Centre)

A complete e-pharmacy demo: a customer-facing storefront (browse → cart → prescription upload →
checkout → order tracking) and a 20-module admin panel, both backed by **MongoDB**.

Built with **Next.js (App Router) · React · TypeScript · Tailwind v4 · MongoDB · Recharts**.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

**Requirements:** a reachable MongoDB instance. Copy `.env.example` to `.env.local` and set
`MONGODB_URI` (a local `mongodb://127.0.0.1:27017` works out of the box).

On first run against a fresh database, Medora seeds itself once with a deterministic demo
dataset (`lib/db/seed.ts`) — tracked by a `meta.seed` flag, so wiping the data never
re-seeds it. Set `SEED_DEMO_DATA=false` in `.env.local` to start with a **completely blank
store** (only admin users, roles and settings are initialized — you then create your own
categories/products from the admin panel).

### Admin panel

- URL: `http://localhost:3000/admin`
- Login: any seeded account, e.g. **admin@medora.health** / **demo1234**
  (all accounts share the default password — override it with the `ADMIN_PASSWORD` env var
  *before the first seed*, or change passwords from **Users & Roles**)
- Passwords are stored as scrypt hashes; sessions are HMAC-signed cookies.

### Storefront

- `/` — catalogue (live from MongoDB), search, filters, quick view, cart (persists in the browser)
- `/product/[id]` — product detail pages
- `/checkout` — guest checkout: address, coupons, COD / UPI / card (payments are simulated — no
  gateway keys are configured; wire Razorpay/Stripe into `app/api/store/orders` when ready)
- `/order/[number]` — order confirmation
- `/track` — track an order by number + phone
- `/policies/[delivery|returns|privacy|terms]` — policy pages

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017` |
| `MONGODB_DB` | Database name | `medora` |
| `AUTH_SECRET` | Secret for admin session cookies (set a random value in production) | dev fallback |
| `ADMIN_PASSWORD` | Password for seeded admin accounts | `demo1234` |
| `SEED_DEMO_DATA` | `true` seeds the demo dataset on a fresh DB; `false` starts blank | `true` |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata/sitemap | `http://localhost:3000` |

## Project layout

```
app/(store)/        storefront pages (shared cart/header/footer layout)
app/admin/          admin panel (login + 20 module pages)
app/api/store/      public storefront APIs (catalog, orders, coupons, rx, chat, …)
app/api/admin/      authenticated admin APIs (generic resource CRUD, auth, stats, upload)
components/         storefront UI components
components/admin/   admin UI components (shell, hooks, charts, widgets)
lib/db/             MongoDB data layer, entity types, seed data
lib/                auth/RBAC, password hashing, storefront mappers, API helpers
```

## Deployment (Vercel via GitHub Actions)

Every push to `main` deploys to Vercel automatically (`.github/workflows/deploy.yml`).

**One-time setup:**

1. Push this repo to GitHub, then import it as a project on [vercel.com](https://vercel.com) (Framework: Next.js — no build overrides needed; the app only touches MongoDB at runtime, so builds work without a database).
2. Add the three secrets to **GitHub → Settings → Secrets and variables → Actions**:
   - `VERCEL_TOKEN` — Vercel → Settings → Tokens
   - `VERCEL_ORG_ID` — Vercel team Settings → General → Vercel ID
   - `VERCEL_PROJECT_ID` — Project → Settings → General → Project ID
3. Add runtime env vars to **Vercel → Project → Settings → Environment Variables** (Production):

   | Variable | Notes |
   | --- | --- |
   | `MONGODB_URI` | A reachable MongoDB (e.g. a free [Atlas](https://www.mongodb.com/atlas) cluster) — `127.0.0.1` will NOT work on Vercel |
   | `MONGODB_DB` | `medora` |
   | `AUTH_SECRET` | Random string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) — sessions break if it changes |
| `NEXT_PUBLIC_SITE_URL` | Your production URL |
| `SEED_DEMO_DATA` | `true` to auto-seed the demo dataset on the fresh DB, `false` for a blank store |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for uploads (Vercel → Storage → your Blob store) — required for media/prescription uploads |
| `BLOB_STORE_ID` | Blob store id (informational; the token determines the store) |

After that: `git push origin main` → GitHub Action builds and deploys. Uploads (media + prescriptions) go to Vercel Blob — just set `BLOB_READ_WRITE_TOKEN` (and `BLOB_STORE_ID`) on both Vercel and your `.env.local`.

## Notes & limitations

- **Payments are simulated** (COD is the only "real" method). No gateway keys are needed to run the demo.
- Uploads (admin media + customer prescriptions) are stored in **Vercel Blob** via
  `@vercel/blob` (`BLOB_READ_WRITE_TOKEN`), so files persist across deploys and work
  on serverless. Create the Blob store in Vercel → Storage and copy the token into
  the project env vars.
- Chat replies and emails are canned placeholders (no AI/SMS/SMTP providers are configured).
  Chat messages, consultations and newsletter sign-ups are persisted and appear in the admin panel.
- Reset to a blank store at any time: delete the business-data collections in MongoDB and
  restart (the `meta.seed` flag prevents re-seeding), or drop the whole database with
  `SEED_DEMO_DATA=false` set.
