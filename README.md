# BayOne Retail (Demo — testing only)

A realistic React + Vite retail web app (storefront + ops workspace) you can run locally and use as a target for Playwright/self-healing automation. **This is a demo website for testing purposes only — not a live store.**

## Tech Stack

- React
- Vite
- JavaScript (ESM)
- `react-router-dom` (routing)
- `zustand` (client state)
- **Backend**: Express + Prisma + **PostgreSQL** (local Docker or a free Neon DB — see `server/.env.example`)

## Prerequisites

Install the following on your machine:

- Node.js (recommended: latest LTS)
- npm (comes with Node.js)

Verify installation:

```bash
node -v
npm -v
```

## Quick start (frontend + API + database)

**1. PostgreSQL** — pick one:

- **Docker (easiest locally):** from the project root run `docker compose up -d`, then use `server/.env` copied from `server/.env.example` (URL matches `docker-compose.yml`).
- **Neon (free, no Docker):** create a project at [neon.tech](https://neon.tech), copy the connection string into `server/.env` as `DATABASE_URL=...`.

**2. Install and migrate**

From the project root:

```bash
cd RetailWebsite
npm install
npm install --prefix server
cp server/.env.example server/.env
# Edit server/.env — set DATABASE_URL and JWT_SECRET

cd server
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..
unset npm_config_devdir
npm run dev:full
```

This runs:

- **API** at `http://localhost:3001` (Express)
- **Web app** at `http://localhost:5173` (Vite; proxies `/api` to the API)

Demo logins (created by the seed):

- **Customer**: `test@demo.com` / `password123`
- **Admin**: `admin@demo.com` / `admin123`

### Run only the frontend (API must be up separately)

```bash
unset npm_config_devdir
npm run dev
```

### Run only the API

From the **project root**:

```bash
npm run server
```

From inside the **`server/`** folder (same thing):

```bash
npm run server
# or: npm run dev
```

## Run locally (development)

Use `npm run dev:full` (see above), or run `npm run server` and `npm run dev` in two terminals.

## Build for production

```bash
unset npm_config_devdir
npm run build
```

Build output is generated in the `dist/` folder.

## Preview production build

```bash
unset npm_config_devdir
npm run preview
```

Open the preview URL shown in terminal (usually `http://localhost:4173`).

## Available npm Scripts

- `npm run dev` - Start Vite only
- `npm run dev:full` - Start API + Vite together
- `npm run server` - Start API only (`server/`)
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Server / database (from `server/`)

- `npx prisma db push` - Apply schema to SQLite
- `npx prisma db seed` - Seed demo users and products

## API overview

- `POST /api/auth/login` — JSON `{ email, password }` → JWT + user
- `POST /api/auth/register` — JSON `{ email, password, name? }` → JWT + user
- `GET /api/products` — optional `?q=` search
- `GET /api/products/:id`
- `POST /api/admin/products` — Bearer token (admin role), create product
- `DELETE /api/admin/products/:id` — Bearer token (admin role)
- `POST /api/orders` — Bearer token (logged-in user), body `{ items: [{ productId, qty }], shipping }`

## Production preview note

`npm run preview` serves the static frontend only. Run the API separately (or deploy both) and set `VITE_API_URL` to your API base URL when building the client if you are not using a reverse proxy.

## Troubleshooting

### Warning: `Unknown env config "devdir"`

If npm prints:

`npm warn Unknown env config "devdir"...`

Temporary fix for current terminal:

```bash
unset npm_config_devdir
```

Permanent fix:

```bash
sed -i '' '/npm_config_devdir/d' ~/.zshrc ~/.zprofile ~/.profile 2>/dev/null
unset npm_config_devdir
exec zsh
```

Then verify:

```bash
npm config get prefix
```

## App routes

- **Public**
  - `/login`
- **Authenticated**
  - `/app/dashboard`
  - `/app/products`
  - `/app/products/:productId`
  - `/app/cart`
  - `/app/checkout`
  - `/app/settings`
- **Admin only**
  - `/app/admin`

## Notes for Automation Testing

This app supports self-healing automation scenarios.

- **Testing Mode**: Toggle in `Settings` to introduce instability patterns (dynamic IDs/classes + slight text changes) *only when you want them*.
- **Feature flags**: Toggle in `Settings` (e.g., disable quick checkout, hide admin insights).
