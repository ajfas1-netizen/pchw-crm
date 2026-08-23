# Setup

## 1. Create the project
supabase.com → new project. Any name. Pick a region near Florida (us-east-1).
Save the database password it gives you somewhere safe; you will not need it often.

## 2. Build the tables
Left sidebar → **SQL Editor** → **New query** → paste all of `schema.sql` → **Run**.
It creates Contacts, Ledger, Invoices and Settings, and turns on row level security
so nothing is readable without a login.

## 3. Turn OFF public sign-ups
**Authentication → Sign In / Providers → Email** → switch **Allow new users to sign up** off.

This matters. Any signed-in account can read the whole book, which is fine when the
only account is the one you create, and a hole if strangers can make their own.

## 4. Create the one account
**Authentication → Users → Add user → Create new user**
- Email: `book@palmcityhandwash.com`
- Password: the 4-digit PIN followed by `striking-details-book-v1`
  e.g. if the PIN is 1234 the password is `1234striking-details-book-v1`
- Tick **Auto Confirm User**

The app adds that suffix itself, so Nick only ever types four digits.

## 5. Make a photos bucket
**Storage → New bucket** → name it `photos` → tick **Public bucket** → Create.

## 6. Point the app at the project
**Project Settings → API**, copy:
- Project URL
- `anon` `public` key

Open the app, and it will ask for both on first run. Paste and continue.

The anon key is designed to sit in a public page — it grants nothing on its own.
Row level security is what protects the data, which is why step 3 is not optional.

## Changing the PIN later
**Authentication → Users → the account → Reset password**, set it to the new four
digits plus the same `striking-details-book-v1` suffix. Nothing in the app changes.
