# Dargons-Salajit

A full-stack application featuring:
- **admin**: Admin dashboard (Vite + React / TS)
- **client**: Customer Web App (Next.js / TS)
- **server**: Express backend API & Node services

## Database (no installation required)

The API needs a MySQL-compatible database. If none is running on
`DB_HOST:DB_PORT` (see `server/.env`) the server boots a **portable MariaDB that
lives inside `server/.localdb`** — no Windows service, no admin rights, nothing
installed system-wide.

```bash
cd server
npm run db:start     # download + initialise + start (first run downloads ~90 MB)
npm run db:status    # is the database reachable with the .env credentials?
npm run db:stop      # shut the portable database down
npm run db:remove    # delete .localdb (portable server + all local data)
```

`npm start` / `npm run dev` run the check automatically, so starting the API is
enough. The `sl` database and every table are created/upgraded on boot
(`server/config/initDb.js`), so a brand new data directory needs no manual SQL.

Prefer your own MySQL/MariaDB? Install it, make sure it listens on the port and
match `DB_USER` / `DB_PASSWORD` / `DB_NAME` in `server/.env` — the portable one is
then ignored. `GET /api/health` reports `"database": "connected"` when all is well.

## Currency detection (VPN aware)

The storefront currency always follows the visitor's **current public IP**:

1. The browser resolves its own public IP with `https://api.ipify.org?format=json`.
2. It calls the backend: `GET /api/location?ip=<browser ip>` (`cache: "no-store"`).
3. The backend geolocates exactly that IP (ipwho.is → ip-api.com → freeipapi.com)
   and answers with `location.countryCode` + `currency`.
4. **Pakistan → `PKR` · Arab League countries → their local currency ·
   any other country → its own local currency (`USD` only as a fallback).**

### Which currency does a visitor see?

Prices are stored in **PKR** (the base currency) and converted for display with a
live exchange rate — the backend caches `open.er-api.com/v6/latest/PKR` for
10 minutes and also ships an offline fallback table. `GET /api/location` returns
the currency code, its **full name**, the rate and the rate table:

| Detected country | Currency | Example price |
| --- | --- | --- |
| Pakistan | `PKR` | `₨1,299.00` |
| UAE · Saudi Arabia · Qatar · Kuwait · Bahrain · Oman · Jordan · Lebanon · Syria · Iraq · Palestine · Egypt · Libya · Tunisia · Algeria · Morocco · Sudan · Yemen · Mauritania · Somalia · Djibouti · Comoros | `AED` `SAR` `QAR` `KWD` `BHD` `OMR` `JOD` `LBP` `SYP` `IQD` `ILS` `EGP` `LYD` `TND` `DZD` `MAD` `SDG` `YER` `MRU` `SOS` `DJF` `KMF` | `AED 17.23` |
| Any other country | its own currency — `EUR` `GBP` `INR` `JPY` `BRL` `ZAR` … (~150 currencies; Germany → `EUR`, UK → `GBP`, India → `INR`, Japan → `JPY`) | `€4.18` |
| Country with no mapping | `USD` (fallback) | `$4.67` |

- The header currency picker lists **every world currency with its name**
  (~150 ISO 4217 codes, filterable with the search box):
  `AED — UAE Dirham`, `KWD — Kuwaiti Dinar`, …
- KWD · BHD · OMR · JOD · LYD · TND · IQD use **3 decimals**; BIF · CLP · DJF ·
  GNF · ISK · JPY · KMF · KRW · PYG · RWF · UGX · VND · VUV · XAF · XOF · XPF
  use **0**; everything else uses 2 — the currency's real ISO 4217 minor units.
- `currency.ts` / `currencyExchange.service.js` hold the country → currency map,
  the names and the fallback rates and must stay in sync — run
  `node _check_currency.cjs` after touching either file (add
  `npx tsc lib/utils/currency.ts --outDir ../_tmp_currency --module commonjs
  --types node` from `client/` first to also smoke-test formatting).

`client/components/providers/StoreProvider.tsx` re-detects **every 10 seconds**
(plus on tab focus / visibility / reconnect), so turning a VPN on or off while
the page is open switches every price component with no page refresh.

- Single source of truth: `state.ui.selectedCurrency` (+ `currencyName` /
  `currencyRate`) in Redux (`uiSlice`).
- Nothing is persisted in `localStorage`, so a stale value can never override a
  freshly detected currency.
- A manual choice from the header dropdown survives polling only while the
  detected country stays the same; a real country change always wins.
- The API never uses its own (server) public IP and refuses to guess when no
  usable browser IP is supplied.

## Delivery charges

- **Pakistan** (auto-detected via `/api/location`): flat **₨300 Normal / ₨500 Urgent**.
- **Other countries**: the courier charge is shown and entered in the customer's
  **own display currency** (USD, AED, SAR, …) at checkout, and converted back to
  PKR for storage. The per-product default is set in
  *Admin → Products → Add New Product → “Delivery Charges — Other Countries (USD)”*
  (Normal + Urgent) and is converted into that currency.
- Order totals are `products − discount + delivery`; admins see the delivery
  method/charge on every order.

## Running the apps

```bash
cd server && npm run dev      # API on http://localhost:5000
cd client && npm run dev      # storefront on http://localhost:3000
cd admin  && npm run dev      # admin dashboard on http://localhost:3001
```

