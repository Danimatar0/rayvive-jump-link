# Orders Setup — Google Sheets + Apps Script

This is the one-time setup that makes checkout and the `/orders` dashboard work.
Budget about 15 minutes. You do not need to understand the Google APIs — Apps
Script handles all of it.

**What you are building:**

```
Customer website  →  Apps Script Web App  →  Google Sheets
   (public)            (holds the secrets)      (your orders)
                              ↑
                     /orders admin dashboard
```

Everything sensitive — the admin password and the price list the server trusts —
lives inside the Apps Script project. Nothing secret is ever shipped to the
browser.

---

## Step 1 — Create the spreadsheet

1. Go to [sheets.new](https://sheets.new) to create a blank spreadsheet.
2. Rename it **Rayvive Orders** (top-left).

You do **not** need to create the tabs or type the column headers by hand —
Step 3 does that for you.

---

## Step 2 — Add the Apps Script

1. In that spreadsheet: **Extensions → Apps Script**.
2. Delete whatever is in `Code.gs`.
3. Open `apps-script/Code.gs` from this repository, copy its **entire**
   contents, and paste it in.
4. Click the **Save** icon (or Ctrl+S).
5. Rename the project (top-left) to **Rayvive Orders API**.

> Keep this separate from your existing newsletter script. They are two
> different Web Apps pointing at two different spreadsheets.

---

## Step 3 — Create the sheets and grant access

1. In the Apps Script editor, choose **`setupSheets`** from the function
   dropdown at the top.
2. Click **Run**.
3. Google will ask for authorization the first time:
   - **Review permissions** → choose your Google account
   - You will see "Google hasn't verified this app" — this is expected for your
     own script. Click **Advanced → Go to Rayvive Orders API (unsafe)**.
   - Click **Allow**.
4. Go back to the spreadsheet. You should now have two tabs: **Orders** and
   **Order Items**, each with a bold, frozen header row.

### What the sheets hold

**Orders** — one row per order:

| Column | Notes |
|---|---|
| Order ID | `RV-20260822-0001` — the id shown to the customer |
| Order Date | when it was placed |
| Order Status | Pending → Confirmed → Processing → Shipped → Delivered / Cancelled |
| Payment Status | COD / Pending / Paid / Failed |
| Payment Method | Cash on Delivery |
| First Name, Last Name, Full Name, Email, Phone | customer |
| Country, City, Area, Address, Building, Delivery Notes | delivery |
| Items Summary, Item Count | quick view without opening Order Items |
| Subtotal, Shipping, Total, Currency | **calculated by the server**, not the browser |
| Meta Event ID | equals the Order ID; used to deduplicate the Meta Purchase event |
| Source, UTM Source/Medium/Campaign/Content/Term | which ad produced the sale |
| Landing Page, Referrer, FBCLID, FBP | attribution detail |
| Client Request Id | how duplicate submissions are detected |
| Created At | ISO timestamp |

**Order Items** — one row per product in an order, joined by Order ID:

| Order ID | Product ID | Product Name | Variant | Quantity | Unit Price | Line Total |
|---|---|---|---|---|---|---|

Two sheets rather than one means a two-product order does not duplicate the
customer's address across rows, and totals stay correct.

You can safely **add** your own columns to the right, or reorder them — the
script looks columns up by header name, not position. Do not rename the
existing headers.

---

## Step 4 — Set your two secrets

Still in the Apps Script editor:

1. Click the **gear icon (Project Settings)** in the left sidebar.
2. Scroll to **Script Properties** → **Add script property**.
3. Add these two:

| Property | Value |
|---|---|
| `ADMIN_PASSWORD` | the password you will type at `/orders`. Pick a strong one. |
| `SESSION_SECRET` | a long random string, 40+ characters. You never type this — it only signs login sessions. |

For `SESSION_SECRET`, mash the keyboard or run this anywhere:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. Click **Save script properties**.

> These two values never leave Google's servers. They are not in the website
> bundle, not in GitHub, and not in any `VITE_` variable.

---

## Step 5 — Deploy as a Web App

1. Top-right: **Deploy → New deployment**.
2. Click the gear next to "Select type" → **Web app**.
3. Fill in:
   - **Description**: `Rayvive orders v1`
   - **Execute as**: **Me (your@email.com)** ← required, so the script can write to your sheet
   - **Who has access**: **Anyone** ← required, so customers who aren't logged into Google can order
4. Click **Deploy**, authorize if prompted.
5. Copy the **Web app URL**. It looks like:

```
https://script.google.com/macros/s/AKfycbx.....................'/exec
```

> **"Anyone" does not mean your orders are public.** It only means the endpoint
> can be *called* by anyone — exactly like any public API. Reading orders
> requires the admin password, which is checked inside the script.

### Test the deployment

Paste the Web app URL into a browser tab. You should see:

```json
{"ok":true,"service":"rayvive-orders","message":"This endpoint accepts POST requests. Deployment is live."}
```

---

## Step 6 — Point the website at it

**For local development**, create a `.env` file in the project root:

```
VITE_ORDERS_API_URL=https://script.google.com/macros/s/AKfycbx.../exec
VITE_WHATSAPP_NUMBER=96181807324
```

Then restart `npm run dev` — Vite only reads `.env` at startup.

**For the live site**, add it as a GitHub secret:

1. Your repo → **Settings → Secrets and variables → Actions**
2. **New repository secret**
3. Name: `VITE_ORDERS_API_URL`, Value: the same URL
4. Push to `main` (or run the Deploy workflow manually) to rebuild.

---

## Step 7 — Test the whole flow

1. Open the site, add a rope to the cart, and complete checkout with your own
   phone number.
2. Check the **Orders** tab — a new row should appear within a second or two.
3. Check **Order Items** — one row per product.
4. Go to `/orders`, enter your `ADMIN_PASSWORD`, and confirm the order is listed.
5. Open the order, change its status to **Confirmed**, then look at the
   spreadsheet — the Order Status cell should have changed.
6. Delete your test rows from both sheets when you're done.

---

## Updating prices later

Prices live in **two** places, and both must match:

1. `src/data/products.json` — what the customer sees
2. `PRODUCTS` at the top of `apps-script/Code.gs` — what the server charges

This duplication is deliberate. The server cannot trust a price sent by a
browser, so it keeps its own copy. If they ever disagree, **the Apps Script
price wins** and the mismatch is written to the script's execution log.

To change a price:

1. Edit `src/data/products.json`, commit, push.
2. Edit `PRODUCTS` in the Apps Script editor, save.
3. **Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy.**

> That last step matters. Saving the script is not enough — the Web App keeps
> serving the deployed version until you publish a new one. The URL stays the
> same.

Same applies to the shipping fees in `SHIPPING_ZONES` (Beirut `$4`,
outside-Beirut `$5`) — mirrored in `src/config/commerce.ts`.

---

## Marking a product sold out

Set `available: false` in `PRODUCTS` in `Code.gs` **and** `"soldOut": true` in
`products.json`. The server rejects orders for unavailable products even if
someone edits the page in their browser.

---

## Troubleshooting

**Checkout says "We couldn't reach our server"**
`VITE_ORDERS_API_URL` is missing or wrong. Check it is set, and that you
restarted the dev server / rebuilt the site after setting it.

**Checkout says "The server could not process this request"**
Open the Apps Script editor → **Executions** in the left sidebar. The failed run
shows the actual error.

**Login says "Admin access is not configured on the server"**
`ADMIN_PASSWORD` is missing from Script Properties (Step 4).

**"Too many failed attempts"**
Ten wrong passwords locks login for 15 minutes. Wait it out.

**Orders stopped appearing after I edited the script**
You saved but did not deploy a new version — see "Updating prices later".

**I changed a column header and things broke**
Change it back. The script finds columns by header name.
