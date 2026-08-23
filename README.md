# Striking Details — Book

Phone-first CRM and ledger for Striking Details (Palm City, FL).

## Current version — `apps-script/`

Google Apps Script serves the app, a Google Sheet is the database, Google
accounts are the login. **No business data is stored on the phone.** Setup in
`apps-script/SETUP.md`.

- `Code.gs` — server: auth, read/write the Sheet, photo uploads to Drive
- `App.html` — shell, business logic, the four tabs
- `Forms.html` — forms, invoice renderer, event handling

## Legacy — root `index.html`

The earlier build, which stored everything in the phone's browser storage behind
a passcode. Superseded: iOS deletes web-app storage for apps unseen for about a
week, and a detailer's phone gets wet. Kept only for reference; do not send
anyone to it.
