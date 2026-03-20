# Shawarma Inn Web + Admin POS

Local-first full-stack app with:
- Customer signup/login + checkout flow
- Customer profile setup + profile management
- Dedicated admin login
- Admin menu management
- Touch-friendly POS billing screen
- SQLite database with zero paid services

## Tech Stack

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express
- Database: SQLite (`data/billing.sqlite`)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Run development mode (frontend + backend together):

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

3. Production build and run:

```bash
npm run build
npm start
```

## Database

- SQLite file is auto-created at: `data/billing.sqlite`
- Schema and seed data are initialized automatically on server startup.
- No manual migration command is required.

## Login Guides

### Customer (Normal User)
- Use `Sign In` from navbar modal or auth section in checkout.
- You can create a new account with email/password.
- On first login/signup, if profile is incomplete, you are redirected to `Profile Setup`.

### Admin
- Open: `/admin/login`
- Default seeded credentials:
  - Email: `admin@shawarmainn.local`
  - Password: `admin12345`

You can override admin credentials with environment variables before starting the server:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `VITE_SWIGGY_URL`
- `VITE_ZOMATO_URL`

## Key Screens

- Customer checkout: `/checkout`
- Customer profile: `/profile`
- Admin dashboard: `/admin`
- POS billing: `/pos`

## POS Workflow

1. Tap menu items to add to cart.
2. Tap again to increase quantity.
3. Total updates automatically.
4. Use `Generate Bill` to save order in DB.
5. Use `Mark Paid` to update status and move to next order number.
6. Use `Copy to Clipboard` to copy invoice text (foundation for print/WhatsApp later).

## Daily Report Endpoint

- `GET /api/admin/reports/daily` (admin auth required)
- Returns: total orders today, total revenue, top-selling item.

## Inventory Foundation

Schema includes foundation tables for future inventory logic:
- `ingredients`
- `ingredient_stock`

Initial seed rows are inserted on first server run.
