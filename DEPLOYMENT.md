# Deploy Nova Retail to the web (step by step)

This project has **two deployable parts**:

1. **Frontend** — static files from `npm run build` (Vite/React).
2. **Backend** — Node.js API in `server/` (Express + Prisma).

**Quick deploy guide:** see **`DEPLOY-NOW.md`** (Vercel + Render + Neon, step by step; includes `render.yaml`).

They must be able to talk to each other over HTTPS in production. The frontend calls the API using either:

- **Same domain** — e.g. `https://yourdomain.com` serves the app and `https://yourdomain.com/api` is proxied to Node, **or**
- **Different domains** — set `VITE_API_URL` when building the frontend to your API base URL (e.g. `https://api.yourdomain.com`).

---

## Before you deploy (read once)

### 1) Use PostgreSQL in production (recommended)

The default **SQLite** file (`server/prisma/dev.db`) is fine on **one** machine. Many cloud hosts (especially serverless) **do not** keep a writable SQLite file between restarts.

**Recommendation:** use **PostgreSQL** (or another hosted SQL database) and point Prisma at it.

1. Create a PostgreSQL database (e.g. Neon, Supabase, Railway, AWS RDS, etc.).
2. Copy its connection string (often called `DATABASE_URL`).
3. In `server/prisma/schema.prisma`, change:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. On your machine (or CI), from `server/`:

   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

> If you stay on SQLite on a **single VPS** with a persistent disk, you can skip `provider` change and keep `file:./dev.db` — but back up that file.

### 2) Secrets

Generate a long random string for **`JWT_SECRET`** (server). Never commit real secrets to git.

---

## Path A — Single VPS (one Linux server) — simplest mental model

Good for: DigitalOcean Droplet, AWS EC2, Linode, Hetzner, etc.

### Step 1. Get a server

- Ubuntu 22.04 LTS is a common choice.
- Note the server **public IP** or hostname.
- Open **ports 80 and 443** (HTTP/HTTPS) in the cloud firewall.

### Step 2. Install Node.js (LTS)

On the server (example using NodeSource or official docs — follow current instructions for your OS):

```bash
node -v
npm -v
```

### Step 3. Clone your project

```bash
git clone <your-repo-url> RetailWebsite
cd RetailWebsite
```

### Step 4. Install dependencies

```bash
npm install
npm install --prefix server
```

### Step 5. Configure the API (server)

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL URL (recommended) or SQLite file path |
| `JWT_SECRET` | Long random string |
| `PORT` | e.g. `3001` (internal; reverse proxy will forward to it) |

Run migrations and seed:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..
```

### Step 6. Build the frontend with your public API URL

If the **browser** will call the API at `https://api.yourdomain.com` (no proxy on the same host):

```bash
export VITE_API_URL="https://api.yourdomain.com"
npm run build
```

If you will put **API and app on the same origin** (recommended for simplicity), see **Step 8** and you may build with:

```bash
unset VITE_API_URL
npm run build
```

(Empty `VITE_API_URL` means the app uses relative `/api/...` URLs.)

### Step 7. Run the API as a process (systemd example)

Create `/etc/systemd/system/nova-api.service` (adjust paths and user):

```ini
[Unit]
Description=Nova Retail API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/RetailWebsite/server
EnvironmentFile=/path/to/RetailWebsite/server/.env
ExecStart=/usr/bin/node src/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nova-api
sudo systemctl start nova-api
```

Confirm the API responds (from the server):

```bash
curl -s http://127.0.0.1:3001/api/health
```

### Step 8. Serve the frontend and proxy `/api` to Node

**Option A — Nginx**

- Put `dist/` contents (from `npm run build`) in e.g. `/var/www/nova-retail/`.
- Configure Nginx to:
  - Serve static files for `/`.
  - `proxy_pass` to `http://127.0.0.1:3001` for `/api/`.

**Option B — Caddy** (often simpler TLS)

- Same idea: static site + reverse proxy `/api` to `127.0.0.1:3001`.

### Step 9. TLS (HTTPS)

Use **Let’s Encrypt** (certbot) or your host’s certificate. Point your **domain** DNS **A record** to the server IP.

### Step 10. Smoke test

1. Open `https://yourdomain.com` — app loads.
2. Log in with seeded users (if you ran seed):
   - `test@demo.com` / `password123`
   - `admin@demo.com` / `admin123`
3. Open **Products** — list loads.
4. **Checkout** — place a test order.

---

## Path B — Split hosting (frontend + API separate)

Typical: **static host** (Netlify, Vercel, Cloudflare Pages, S3+CloudFront) + **Node host** (Railway, Render, Fly.io, etc.).

### Backend (API)

1. Create a new project/service pointing at the `server/` folder (or your repo with `root directory` = `server`).
2. Set environment variables in the host UI:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT` (often set automatically; use the host’s `PORT` if required).
3. **Build command** (example):

   ```bash
   npm install && npx prisma generate && npx prisma db push && npx prisma db seed
   ```

4. **Start command** (example):

   ```bash
   node src/index.js
   ```

5. Copy the **public API URL** (e.g. `https://nova-api.onrender.com`).

### Frontend

1. Create a static site project pointing at the repo root (or `root` = frontend only if you split repos).
2. **Build command:**

   ```bash
   npm install && VITE_API_URL="https://YOUR-API-HOST" npm run build
   ```

3. **Publish directory:** `dist`

4. Deploy.

### CORS

The server already enables CORS with `origin: true`. If you lock down origins later, set the allowed frontend origin explicitly in `server/src/index.js`.

---

## Quick command reference (build artifacts)

| Where | Command |
|-------|---------|
| Root | `npm install` |
| Root | `npm run build` → output in `dist/` |
| Server | `npm install` in `server/` |
| Server | `npx prisma generate` |
| Server | `npx prisma db push` (production DB) |
| Server | `npx prisma db seed` (optional demo data) |
| Server | `node src/index.js` or `npm run dev` |

---

## Checklist before going live

- [ ] `JWT_SECRET` is strong and unique.
- [ ] `DATABASE_URL` points to a **persistent** production database.
- [ ] Prisma schema matches DB (`db push` or migrations run).
- [ ] Frontend `VITE_API_URL` matches your real API URL (or same-origin proxy is configured).
- [ ] HTTPS is enabled.
- [ ] Demo seed users (`db seed`) are **removed or disabled** in real production if you don’t want public test accounts.

---

## Troubleshooting

- **Blank page / failed API calls:** Open browser DevTools → Network. Confirm requests go to the correct API URL and return 200/401 as expected.
- **401 on checkout:** User must be logged in; token must be sent (`Authorization: Bearer <token>`).
- **CORS errors:** API URL must match what you built into the client (`VITE_API_URL`) or use same-origin proxy.

For local development, see `README.md`.
