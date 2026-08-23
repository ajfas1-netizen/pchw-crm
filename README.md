# Striking Details — Book

CRM and ledger for Striking Details (Palm City, FL). Static app, Supabase behind it.

- **Data**: Postgres on Supabase. Nothing is stored on the phone.
- **Login**: a 4-digit PIN, which is the password to one shared account. Real auth,
  real row level security — the PIN is never in this repo.
- **Photos**: Supabase Storage.
- **Hosting**: GitHub Pages.

Setup: `supabase/SETUP.md`. Schema: `supabase/schema.sql`.

`legacy-device-local.html` is the abandoned first build that kept everything in the
phone's browser storage. Kept for reference only.
