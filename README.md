# Amazon Clone – Full-Stack E-Commerce Platform

A MERN e-commerce app with customer storefront, secure auth, cart/wishlist, checkout (Stripe test mode or Cash on Delivery), order tracking, reviews, and an admin dashboard.

**Stack:** React 18 · Redux Toolkit · React Router · Vite · Node.js · Express · MongoDB (Mongoose) · JWT (httpOnly cookie) · Stripe Checkout (test mode)

## Features
**Storefront:** hero carousel, category tiles, best sellers / top rated / new arrivals; product search, category, price, rating and in-stock filters; sort by newest, popularity, price, rating; pagination; skeleton loaders; toasts; responsive (mobile/tablet/desktop).
**Auth:** register/login/logout, bcrypt (12 rounds), password policy, JWT in an httpOnly cookie, protected routes, session re-validated on load, login rate limiting.
**Cart & wishlist:** add/remove/update quantity, subtotal/shipping/total, cart persisted in localStorage and re-synced with live price/stock; server-side wishlist.
**Checkout & orders:** saved addresses (CRUD), validated address form, server-side price calculation, atomic stock reservation (no overselling), COD and Stripe Checkout, order history, status timeline, customer cancellation (stock restored).
**Reviews:** one review per user per product, verified-purchase badge, ratings computed from real reviews.
**Admin (role-based):** stats dashboard (revenue, orders by status, 7-day chart, low stock), product CRUD + stock, category CRUD, order list/filter/status workflow (Processing → Shipped → Delivered, or Cancelled).

## Architecture
```
React SPA (Vite)  ──/api (proxy)──▶  Express REST API  ──▶  MongoDB
 Redux: cart, user, wishlist          routes → services → models      Stripe (hosted checkout)
```
```
client/src   components/  pages/ (pages/admin/)  store/  api.js  hooks.js  toast.js  utils.js
server       routes/ (auth, products, orders, wishlist, addresses, admin)
             models/  services/ (stock, orders, reviews)  middleware/  utils/  config/
             seed.js  scripts/ (makeAdmin, smoke)  tests/
```

## Setup
Requires Node 20+ and MongoDB (Docker or Atlas).
```bash
git clone <your-repo-url> && cd amazon-clone
docker compose up -d                       # local MongoDB (or use an Atlas URI)
cp server/.env.example server/.env         # then edit it (see below)
npm run setup
npm run seed                               # demo catalogue (+ admin if ADMIN_* are set)
npm run dev                                # API :5000, web :5173
```
Open http://localhost:5173. Health check: http://localhost:5000/api/health.

### Environment variables (`server/.env`)
| Var | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | ≥32 random chars: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated |
| `COOKIE_SAMESITE` | `lax` (default) or `none` for a cross-site API |
| `STRIPE_SECRET_KEY` | Optional `sk_test_…` key; without it, only COD works |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional; `npm run seed` creates this admin (choose your own) |

`client/.env.example` has `VITE_API_URL` (leave empty normally).
**Make an admin later:** register, then `npm run make-admin --prefix server -- you@example.com`.

## Testing
```bash
npm test          # unit tests (validators, pricing, order flow, sanitizer)
npm run smoke     # end-to-end API checks; needs the API running + seeded DB
```
Stripe test card: `4242 4242 4242 4242`, any future date, any CVC.

## API overview
| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register · login · logout`, `GET /api/auth/me` |
| Products | `GET /api/products` (`keyword, category, minPrice, maxPrice, rating, inStock, sort, page, limit`), `/categories`, `/by-ids`, `/:id`; admin: `POST/PUT/DELETE` |
| Reviews | `GET/POST/DELETE /api/products/:id/reviews` |
| Wishlist | `GET /api/wishlist`, `POST/DELETE /api/wishlist/:productId` |
| Addresses | `GET/POST /api/addresses`, `PUT/DELETE /api/addresses/:id` |
| Orders | `POST /api/orders`, `GET /mine`, `GET /:id`, `PUT /:id/cancel`, `POST /:id/pay`, `POST /:id/verify-payment` |
| Admin | `GET /api/admin/stats`, `GET /orders`, `PUT /orders/:id/status`, categories CRUD |

## Security
httpOnly + Secure + SameSite cookie, bcrypt, Helmet, CORS allow-list, rate limiting, NoSQL-operator stripping, input validation on every write, server-side pricing/stock, role checks on the server, no secrets in the repo, errors hidden in production.

## Deployment
**API → Render:** use `render.yaml` (or root dir `server`, build `npm install`, start `npm start`). Set `MONGO_URI`, `CLIENT_URL=https://<app>.vercel.app`, optional `STRIPE_SECRET_KEY`.
**Web → Vercel:** root dir `client`. Edit `client/vercel.json` and replace `YOUR-RENDER-SERVICE` with your Render hostname; this proxies `/api` so the cookie stays first-party.

## Known limitations / future work
- No Stripe webhook: card payments are confirmed when the customer returns to the site (closing the tab early leaves the order unpaid until they open it again). Refunds are manual.
- Cart is stored in localStorage (not synced across devices).
- No email notifications, password reset, or image upload (products use image URLs; seed uses placeholders).
- Unpaid card orders don't reserve stock and don't expire.
- No frontend automated tests.

## Screenshots
Add images to `docs/` and link them here.
