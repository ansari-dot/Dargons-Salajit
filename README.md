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

## Delivery charges

- **Pakistan** (auto-detected via `/api/location`): flat **₨300 Normal / ₨500 Urgent**.
- **Other countries**: the courier charge in **USD**, set per product in
  *Admin → Products → Add New Product → “Delivery Charges — Other Countries (USD)”*
  (Normal + Urgent), used at checkout and still editable there.
- Order totals are `products − discount + delivery`; admins see the delivery
  method/charge on every order.

## Running the apps

```bash
cd server && npm run dev      # API on http://localhost:5000
cd client && npm run dev      # storefront on http://localhost:3000
cd admin  && npm run dev      # admin dashboard on http://localhost:3001
```

