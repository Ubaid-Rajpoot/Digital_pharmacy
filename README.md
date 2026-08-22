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

On first run against an empty database, Medora seeds itself with a deterministic demo dataset
(`lib/db/seed.ts`): products, categories, brands, coupons, users, roles and more.

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

## Notes & limitations

- **Payments are simulated** (COD is the only "real" method). No gateway keys are needed to run the demo.
- **Uploads go to local disk** (`public/uploads/`) — fine for development and single-server deploys;
  swap for S3/Cloudinary in `app/api/admin/upload` before deploying serverless.
- Chat replies and emails are canned placeholders (no AI/SMS/SMTP providers are configured).
  Chat messages, consultations and newsletter sign-ups are persisted and appear in the admin panel.
- Reset the demo data at any time by dropping the `medora` database (it re-seeds on next request).
