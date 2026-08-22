Complete the Medora pharmacy site end-to-end, autonomously. The data layer (MongoDB, 20+ collections, full types in lib/db/types.ts), generic admin CRUD API (/api/admin/[resource]), and storefront catalog API already exist — so completion means: close the commerce loop, wire every fake storefront feature to a backend, fix leftovers, add missing standard files, harden auth, and verify in a real browser.

KEY DECISIONS (made to keep this a self-contained demo, no external accounts/keys needed):
- Guest checkout (name/phone/email/address) — no customer login system. Order tracking via order number + phone. Customer records are still created/found by phone/email so the admin Customers module stays meaningful.
- Payments: real COD + simulated UPI/Card (no gateway keys exist; structure ready for Razorpay/Stripe later). Methods come from settings.payments.methods.
- Prescription uploads stored on local disk in public/uploads/prescriptions (consistent with existing upload route); recorded in media library and attached to the order.
- Chat bot replies stay canned (no AI/SMS provider), but conversations persist as SupportTickets (kind: "chat") visible in the existing admin Support module.

PHASE 0 — Checkpoint
- Commit the 23 modified + 3 untracked files as-is (the finished MongoDB migration) so my work is separable from yours.

PHASE 1 — Fixes, cleanup, foundations
1. Enable the 9 admin nav items wrongly marked disabled/"Soon" in components/admin/shell.tsx (coupons, customers, reviews, dealers, content, media, newsletter, reports, support).
2. Persist cart + wishlist to localStorage in StoreProvider (hydration-safe).
3. Catalog error handling: if /api/store/catalog fails, show an error state with retry instead of a silent empty catalog.
4. Dead code removal: delete components/admin/charts.tsx, StatsBand, Marquee, CareSection, AppSection; strip dead PRODUCTS/CATSUBS from lib/products.ts (keep used helpers); remove three/@types/three from package.json; delete unused boilerplate SVGs in public/.
5. Footer fixes: real policy pages (app/(legal)/delivery, returns, privacy, terms — content pages in site style), remove dead "#app" Download-the-App link, social icons point to platform URLs, "Track Your Order" → /track.
6. Standard files: app/not-found.tsx, app/error.tsx, app/loading.tsx, app/sitemap.ts, app/robots.ts, .env.example, proper metadata/OG in layout, rewrite README (setup, MongoDB, auto-seed, admin login, env vars, demo-payment caveat).
7. Auth hardening: add passwordHash to AdminUser, scrypt hash/verify in lib/auth.ts (node:crypto, no new deps), login route verifies per-user hash (seeded default password demo1234, overridable via ADMIN_PASSWORD env), generate a real AUTH_SECRET into .env.local, keep demo password ONLY for the seeded demo account + document it. Simple in-memory login rate-limit.
8. Small completions: media page alert() → toast; add settings.store.revenueTarget (admin Settings input) so dashboard revenue target is real instead of hardcoded 0.

PHASE 2 — The commerce loop (the biggest gap)
1. New storefront APIs (app/api/store/*): GET product by slug; POST /orders (validates stock, applies coupon from db.coupons, computes totals using same pricing rules as CartDrawer, creates/updates Customer, creates Order with timeline, decrements stock, increments sold, creates admin notification); GET order by number+phone (sanitized) for tracking; POST coupon-validate.
2. /checkout page: address form (validated), order summary, coupon code apply, payment method selection (COD live, UPI/Card simulated), Rx items require attached prescription, place-order flow.
3. Order confirmation page /order/[number] (order details, timeline, what happens next) + clear-cart on success.
4. /track page: order number + phone → status timeline.
5. Product detail pages /product/[slug]: server-rendered from MongoDB (gallery, specs, price/savings, stock, Rx notice, add to cart, breadcrumbs, SEO metadata). Product cards + search suggestions link to these pages.
6. CartDrawer "Proceed to Secure Checkout" → /checkout (replaces the demo toast).

PHASE 3 — Wire the remaining fake features
1. Prescription modal: real file upload (POST /api/store/prescription, saves file + media record), uploaded Rx attached to cart → included in order; admin sees prescription link on the order + in Media library. Orders with Rx products can't be placed without one.
2. Chat widget: persist conversation (localStorage) + POST each message as a SupportTicket (kind "chat"); canned pharmacist reply stays client-side; admin Support module shows real customer chats.
3. Newsletter: POST /api/store/newsletter → dedupe + insert into subscribers (feeds existing admin Newsletter module).
4. Consultation booking: POST /api/store/consult → SupportTicket (kind "ticket") with chosen specialty/slot; admin sees it in Support.
5. Reviews: storefront reads approved product reviews from DB (extend catalog API); product page shows per-product reviews + "write a review" form → POST creates pending Review for admin moderation. ReviewsSection falls back to seeded testimonials if DB has none.

PHASE 4 — Verify and ship
- npm run build (type + lint), start dev server, confirm MongoDB reachable (.env.local) and auto-seed works.
- Browser-test the full loop: browse → product page → add to cart → upload Rx → checkout (coupon + COD) → confirmation → track order; admin: login, new order appears with prescription, chat message in Support, subscriber in Newsletter, pending review in Reviews. Fix everything found.
- Commit per phase with clear messages.

OUT OF SCOPE (needs accounts/keys you'd have to provide): real payment gateway, SMS/OTP, email sending, cloud storage (S3/Cloudinary), customer accounts/login, automated tests. Everything else found in the audit gets done.