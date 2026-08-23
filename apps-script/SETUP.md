# Cloud backup setup

Do this on a laptop. Ten minutes, once.

1. **New Google Sheet.** Name it `Striking Details Book`.
2. **Extensions → Apps Script.** Delete whatever is there, paste in all of `Code.gs`, Save.
3. **Project Settings** (cog, left side) → **Script Properties** → **Add script property**
   - Property: `SECRET`
   - Value: a long random string you invent. Twenty-plus characters. Keep it somewhere safe.
4. **Deploy → New deployment → Web app**
   - Description: anything
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy, then Authorize when Google asks. It will warn the app is unverified — that is
     normal for your own script. Advanced → Go to project → Allow.
5. Copy the **Web app URL**. It ends in `/exec`.
6. In the Book app: **More → Cloud backup → Connect a Google Sheet**. Paste the URL and the
   same SECRET. Tap Test and save.

## Why access has to be "Anyone"

The phone calls this without signing into Google, so Google has to let anonymous requests
through. The SECRET is what actually protects it — every request is rejected without it.
Treat that string like a password. Never put it in a repo, a screenshot or a text message.

If you ever think it leaked: change the SECRET in Script Properties, then re-enter the new
one in the app. Old requests stop working immediately.

## What ends up in the sheet

- **Contacts**, **Ledger**, **Invoices** tabs, rewritten on every sync
- **Meta** tab with the last sync time and the take-home target
- Receipt photos go to a Drive folder called `Striking Details receipts`, and the sheet holds
  the link. This is what stops photos filling the phone.

## Important

The **phone is the source of truth.** Each sync overwrites the sheet with what is on the
phone. Read the sheet, build charts off it, but do not edit it and expect the changes to come
back — the next sync will wipe them. Use **Restore from the sheet** only when moving to a new
phone or recovering from a loss.
