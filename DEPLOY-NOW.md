# Deploy Nova Retail to the web (step by step)

You deploy **two pieces**:

| Piece | What it is | Typical host |
|-------|------------|--------------|
| **API** | Node app in `server/` | Railway, Render, Fly.io |
| **Web app** | Static files from `npm run build` | Vercel, Netlify, Cloudflare Pages |

The database is **PostgreSQL** (Neon, Supabase, or the DB bundled with Railway/Render).

---

## Part A — PostgreSQL database

### Option A1: Neon (free tier, good default)

1. Go to [neon.tech](https://neon.tech) and sign up.
2. Create a project; copy the **connection string** (starts with `postgresql://` or `postgres://`).
3. Keep it for Part B (`DATABASE_URL`).

### Option A2: Docker on your machine only (local dev)

```bash
docker compose up -d
```

Use `server/.env` with:

`DATABASE_URL="postgresql://nova:nova@localhost:5432/nova_retail?schema=public"`

---

## Part B — Deploy the API (Railway example)

1. Push this repo to **GitHub** (see `GITHUB.md`).
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → select the repo.
3. **Add service** → pick the same repo, set **Root Directory** to `server`.
4. **Add PostgreSQL** in the project (Railway plugin) **or** use Neon: **Variables** → add `DATABASE_URL` = your Neon URL.
5. **Variables** (service):

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | From Neon **or** Railway Postgres (copy “Connect” URL) |
   | `JWT_SECRET` | Long random string (generate locally: `openssl rand -hex 32`) |
   | `PORT` | Often auto-set by Railway — if required, use `3001` |

6. **Settings → Deploy** → **Custom start command** (if needed): `npm start`  
   **Custom build command** (if needed):

   ```bash
   npm install && npx prisma generate && npx prisma db push
   ```

7. After deploy, open the **public URL** Railway gives you (e.g. `https://nova-retail-api.up.railway.app`). Test:

   ```bash
   curl https://YOUR-API-HOST/api/health
   ```

8. **Seed demo data** (one-time). From your laptop (with `DATABASE_URL` pointing at the **same** DB):

   ```bash
   cd server
   export DATABASE_URL="postgresql://..."   # same as production
   npx prisma db push
   npx prisma db seed
   ```

   Or use Railway’s **one-off shell** / **Run command** with the same commands.

---

## Part C — Deploy the frontend (Vercel example)

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import the **same** GitHub repo.
2. Framework: **Vite**. Root directory: **`.`** (repo root, not `server`).
3. **Build Command:** `npm run build`  
   **Output Directory:** `dist`
4. **Environment Variables:**

   | Name | Value |
   |------|--------|
   | `VITE_API_URL` | Your API’s public URL **with no trailing slash**, e.g. `https://nova-retail-api.up.railway.app` |

5. Deploy. Open the Vercel URL → log in → products should load from the API.

> If the browser shows CORS errors, the API already allows CORS; ensure `VITE_API_URL` is exactly the origin Railway shows (https, no path).

---

## Part D — Same machine (one VPS) alternative

If you use a **single Linux server** with Nginx:

1. Install Node, PostgreSQL (or use Neon remotely).
2. Build: `VITE_API_URL=` empty **if** Nginx serves the app and proxies `/api` to `127.0.0.1:3001` (see `DEPLOYMENT.md`).
3. Otherwise set `VITE_API_URL` at build time to your API subdomain.

---

## Checklist

- [ ] `DATABASE_URL` is PostgreSQL everywhere (local + Railway).
- [ ] `npx prisma db push` and `npx prisma db seed` ran against production DB once.
- [ ] `JWT_SECRET` set on the API.
- [ ] `VITE_API_URL` on Vercel matches your live API base URL.
- [ ] `curl https://YOUR-API/api/health` returns `{"ok":true}`.

---

## Troubleshooting

| Problem | What to check |
|--------|----------------|
| API 502 / crash | Railway logs; `prisma generate` + `db push` in build |
| Frontend can’t load products | Wrong `VITE_API_URL`; rebuild after changing env |
| 401 on login | DB not seeded; run `db seed` against production `DATABASE_URL` |

For more detail (Nginx, split hosts), see `DEPLOYMENT.md`.
