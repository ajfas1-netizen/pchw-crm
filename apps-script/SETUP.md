# Striking Details — Book

Server app. The Google Sheet is the database, Google handles the login, and
**nothing is stored on anyone's phone.** A wet or lost phone costs nothing.

## Setup, once, on a laptop

1. **New Google Sheet** → name it `Striking Details Book`.
2. **Extensions → Apps Script.** Delete what's there.
3. Create three files in the editor and paste each one in:
   - `Code.gs` ← paste `Code.gs`
   - `App.html` ← **File → New → HTML file**, name it `App`, paste `App.html`
   - `Forms.html` ← **File → New → HTML file**, name it `Forms`, paste `Forms.html`
   Save.
4. **Run** the function `setupSheet` once (pick it from the dropdown, press Run).
   Authorise when Google asks. It will warn the app is unverified — that is normal
   for your own script: **Advanced → Go to project → Allow.**
   This creates the Contacts, Ledger, Invoices and Settings tabs.
5. **Project Settings → Script Properties → Add:**
   - `ALLOWED` = the emails allowed in, comma separated
     e.g. `nick@gmail.com, ajfas1@gmail.com`
6. **Deploy → New deployment → Web app**
   - Execute as: **User accessing the web app**
   - Who has access: **Anyone with a Google Account**
   - Deploy, copy the `/exec` URL.
7. **Share the Sheet** with Nick as an **Editor**. The script runs as whoever is
   signed in, so he needs access to the Sheet itself.
8. Send Nick the `/exec` link. He opens it, signs in with Google, and it works.
   On iPhone: **Share → Add to Home Screen** to keep it.

## Why "Execute as: User accessing"

That is what lets the app know who is using it. `Session.getActiveUser()` only
returns an email under that setting, which is how the `ALLOWED` check works and
how you get two logins rather than one shared password. The cost is that each
person needs access to the Sheet.

## What lives where

| | |
|---|---|
| Contacts, Ledger, Invoices, Settings | tabs in the Sheet |
| Receipt and business-card photos | Drive folder `Striking Details photos`, link stored in the Sheet |
| Anything on the phone | nothing |

Read the Sheet, chart it, hand it to an accountant. Edits made directly in the
Sheet are read back by the app on next load, so light corrections are fine —
just don't rename the header row.

## Updating the app later

Paste the new `Code.gs` / `App.html` / `Forms.html` over the old ones, then
**Deploy → Manage deployments → edit → Version: New version → Deploy.** Skipping
the new-version step is the usual reason a change does not appear.
