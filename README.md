# General Online Store — Full Stack

A production-shaped rebuild of the original HTML prototype: a **FastAPI + PostgreSQL** backend and a **React (Vite)** frontend, wired together over a REST API. This replaces the in-memory mock data from the prototype with a real relational database.

```
general-store/
├── backend/           FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/
│   │   ├── models.py       Users, Categories, Products, Cart, Wishlist, Orders, OrderItems, Payments, Reviews, Notifications
│   │   ├── schemas.py      Pydantic request/response models
│   │   ├── routers/        auth, categories, products, cart, wishlist, orders, notifications, admin
│   │   ├── security.py     password hashing + JWT
│   │   ├── seed.py         populates the DB with demo catalog + accounts
│   │   └── main.py         app entrypoint, CORS, router registration
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/          React + Vite SPA (same visual design as the prototype)
│   ├── src/
│   │   ├── api.js          typed fetch client for the backend
│   │   ├── context.jsx     auth, cart, toast state
│   │   ├── ShopData.jsx    categories/products/wishlist cache
│   │   ├── pages/           customer screens (home, cart, checkout, orders, profile…)
│   │   ├── admin/            admin dashboard screens
│   │   └── styles.css      the original design system, unchanged
│   ├── package.json
│   └── .env.example
└── docker-compose.yml  one-command Postgres + backend
```

## 1. Run PostgreSQL

**Option A — Docker (recommended):**
```bash
docker compose up -d db
```

**Option B — local Postgres install:**
```bash
createdb general_store
```

## 2. Backend (FastAPI)

```bash
cd backend
python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env      # edit DATABASE_URL / SECRET_KEY if needed

python -m app.seed        # creates tables + loads demo catalog and accounts
uvicorn app.main:app --reload --port 8000
```

API docs (interactive): **http://localhost:8000/docs**

Demo accounts created by the seed script:
| Role     | Email               | Password  |
|----------|---------------------|-----------|
| Admin    | admin@store.com     | admin123  |
| Customer | jane@example.com    | password  |

## 3. Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL, defaults to http://localhost:8000
npm run dev
```

Open **http://localhost:5173**.

## 4. Or run everything with Docker

```bash
docker compose up --build
# then, in a second terminal:
cd frontend && npm install && npm run dev
```

(The frontend is left outside docker-compose so you get instant hot-reload during development; add a frontend service to the compose file for a fully containerized deploy.)

## What's real here vs. the prototype

- **Database**: real PostgreSQL tables via SQLAlchemy — `users`, `categories`, `products`, `cart_items`, `wishlist_items`, `orders`, `order_items`, `payments`, `reviews`, `notifications`.
- **Auth**: passwords hashed with bcrypt, sessions via JWT bearer tokens (`/auth/signup`, `/auth/login`, `/auth/me`).
- **Cart & checkout**: cart lives server-side per user; checkout creates an `Order` + `OrderItem` rows, decrements `Product.stock`, writes a `Payment` row, and fires a `Notification`.
- **Admin**: dashboard stats, product/category CRUD, order status updates, customer list, sales-by-category report, and inventory — all backed by real queries, not mock arrays.
- **Reviews**: posting a review recalculates the product's average rating and review count in the database.

## Payments — now wired to Flutterwave

Card and Mobile Money payments go through a real Flutterwave checkout:

1. The frontend opens Flutterwave's payment widget for the order total.
2. When the customer completes payment, the frontend sends the transaction ID to `POST /orders/verify-payment`.
3. The backend re-checks that transaction directly with Flutterwave's API using your **secret key** — confirming it's real, successful, and for the correct amount — before creating the order. The frontend's word alone is never trusted.
4. Cash on Delivery skips the gateway entirely (no money changes hands online) and goes straight to `POST /orders`.

### Setup

**Backend** — in `backend/.env`:
```
FLUTTERWAVE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
```

**Frontend** — in `frontend/.env`:
```
VITE_FLUTTERWAVE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
```

Get both from your Flutterwave dashboard → **Settings → API Keys**. Start with the **Test** keys (safe, no real money moves) — swap to **Live** keys only after Flutterwave verifies your account for real payouts.

The currency is set to `NGN` in `frontend/src/pages/Checkout.jsx` (`flwConfig.currency`) since Flutterwave's mobile money coverage is strongest there — change it if your account/customers use a different currency.

### Testing with test keys

Flutterwave provides test card numbers and test mobile money flows in their docs (search "Flutterwave test cards"). Using test keys, no real charges happen — you can walk through a full checkout safely.

## What's still a placeholder (by design)- **Google Play**: this is a responsive web app. To ship to the Play Store you'd wrap it (e.g. with Capacitor/Cordova) or rebuild the UI in Flutter/React Native against this same API, then publish through the Google Play Console.
- **Migrations**: tables are created with `Base.metadata.create_all()` for simplicity. For a real production rollout, switch to Alembic migrations so schema changes are versioned.
- **Live deployment**: this still runs on `localhost`. To make it a real website, host Postgres + the backend somewhere like Railway/Render, and the frontend on Vercel/Netlify.

## API quick reference

| Area          | Endpoints |
|---------------|-----------|
| Auth          | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` |
| Categories    | `GET /categories`, `POST/PUT/DELETE /categories/{id}` (admin) |
| Products      | `GET /products?category_id=&search=&deals_only=`, `GET/POST/PUT/DELETE /products/{id}`, `GET/POST /products/{id}/reviews` |
| Cart          | `GET/POST/DELETE /cart`, `PUT/DELETE /cart/{product_id}` |
| Wishlist      | `GET/POST /wishlist`, `DELETE /wishlist/{product_id}` |
| Orders        | `GET/POST /orders`, `POST /orders/verify-payment`, `GET /orders/{id}`, `GET /orders/admin/all`, `PUT /orders/admin/{id}/status` |
| Notifications | `GET /notifications`, `PUT /notifications/read-all` |
| Admin         | `GET /admin/dashboard`, `GET /admin/customers`, `GET /admin/reports/sales-by-category`, `GET /admin/inventory` |
