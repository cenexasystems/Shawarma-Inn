# UPGRADE PLAN

## Current Auth Flow (Before Upgrade)
- Customer auth UI existed in modal/checkout but backend login/signup was not fully wired.
- Session handling was local-state based and not shared globally across components.
- Profile and order history relied on Supabase hooks, with no guaranteed local-first backend.

## Current Checkout Behavior (Before Upgrade)
- Checkout page displayed login/signup controls and delivery fields.
- Order submit opened WhatsApp and attempted order persistence through Supabase hooks.
- Guest checkout was possible from cart details.

## Additions Implemented In This Upgrade
- Local-first backend with Express + SQLite (`data/billing.sqlite`) and seeded admin account.
- Shared auth system with customer signup/login and separate admin login route (`/admin/login`).
- Role-gated admin routes (`/admin`, `/pos`) and protected customer profile flow.
- Profile setup flow after first login/signup for incomplete profiles.
- Admin menu management (create, update, activate/deactivate, soft delete).
- Touch-friendly POS billing screen with tap-to-add items, generate bill, mark paid, and invoice copy.
- Daily report endpoint and UI summary, plus inventory schema foundation tables.
- WhatsApp floating action button for quick contact.
