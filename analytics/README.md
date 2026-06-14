# Visit tracking

Each page view on the site is POSTed to a Google Apps Script web app, which
appends a row to a Google Sheet. Visitor location (country / region / city) is
resolved client-side from the free, no-key [ipwho.is](https://ipwho.is) API.

- **Client:** [`public/analytics.js`](../public/analytics.js) — loaded from `index.html`.
- **Backend:** [`Code.gs`](./Code.gs) — runs in Google Apps Script.
- **Data store:** a Google Sheet you own.

## One-time setup (~5 min, free, no credit card)

1. Create a new Google Sheet at <https://sheets.new>. Name it e.g. "Site visits".
2. In that sheet: **Extensions → Apps Script**. This opens a script project
   bound to the sheet.
3. Delete the placeholder code and paste the full contents of
   [`Code.gs`](./Code.gs). Click the save (disk) icon.
4. Click **Deploy → New deployment**.
   - Gear icon → **Web app**.
   - **Execute as:** Me.
   - **Who has access:** **Anyone**. (Required so the public site can post.)
   - Click **Deploy**, then **Authorize access** and approve the permissions
     prompt (it's your own script writing to your own sheet).
5. Copy the **Web app URL** (ends in `/exec`).
6. Open [`public/analytics.js`](../public/analytics.js) and replace
   `PASTE_YOUR_APPS_SCRIPT_URL_HERE` with that URL.
7. Commit and push. GitHub Pages serves the change; visits start logging.

### Verify it works

- Open the `/exec` URL in a browser — it should say "Visit tracker is live."
- Visit your deployed site (not `localhost` — local visits are skipped on
  purpose), then refresh the Google Sheet. A new row should appear with a
  timestamp, path, and location columns.

## Notes

- **Updating `Code.gs` later:** paste the new code, then **Deploy → Manage
  deployments → edit (pencil) → Version: New version → Deploy**. The `/exec`
  URL stays the same.
- **Localhost is ignored** so your own dev hits don't pollute the data. Remove
  the `localhost` guard in `analytics.js` to test locally.
- **Privacy:** the `ip` column stores the visitor's IP. To stop recording it,
  drop `'ip'` from the `FIELDS` array in `Code.gs` and remove the `ip` field in
  `analytics.js`.
- **Cost / limits:** Apps Script and ipwho.is free tiers comfortably handle a
  personal site's traffic. ipwho.is allows generous free usage with no key.
