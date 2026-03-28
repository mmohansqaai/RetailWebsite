# Deploy on **Vercel** (web) + **Render** (API)

This is the recommended split:

| Layer | Host | What it runs |
|-------|------|----------------|
| **Database** | [Neon](https://neon.tech) (free Postgres) | Connection string only — no server to manage |
| **API** | [Render](https://render.com) | Node app in `server/` (this repo includes `render.yaml`) |
| **Web app** | [Vercel](https://vercel.com) | Static `dist/` from Vite (`vercel.json` handles SPA routing) |

PostgreSQL is required (Prisma is configured for it). Local dev: `docker compose` or Neon — see `README.md`.

---

## 1) Push code to GitHub

See `GITHUB.md`. Render and Vercel both deploy from a Git repo.

---

## 2) Create a PostgreSQL database (Neon)

1. Sign up at [neon.tech](https://neon.tech) → create a project.
2. Copy the **connection string** (starts with `postgresql://`).  
   You will use it as **`DATABASE_URL`** on Render.

---

## 3) Deploy the API on Render

### Option A — Blueprint (uses `render.yaml` in this repo)

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect your GitHub repo and select the branch (e.g. `main`).
3. Render reads `render.yaml` and creates a **Web Service** with `rootDir: server`.
4. When prompted, set **`DATABASE_URL`** to your **Neon** connection string.
5. **`JWT_SECRET`** can use the auto-generated value from the blueprint, or set your own in **Environment**.
6. Click **Apply** / finish deploy.

### Option B — Manual Web Service

1. **New** → **Web Service** → connect the same repo.
2. **Root Directory:** `server`
3. **Build Command:**  
   `npm install && npx prisma generate && npx prisma db push`
4. **Start Command:**  
   `npm start`
5. **Environment** (minimum):

   | Key | Value |
   |-----|--------|
   | `NODE_VERSION` | `20` |
   | `DATABASE_URL` | Your Neon connection string |
   | `JWT_SECRET` | Long random string (e.g. `openssl rand -hex 32`) |

   Render injects **`PORT`** — the app already reads it.

6. **Health check path:** `/api/health` (optional but recommended).

7. After deploy, copy the service URL, e.g. `https://nova-retail-api.onrender.com`.

8. **Test:**

   ```bash
   curl https://YOUR-SERVICE.onrender.com/api/health
   ```

   Expect: `{"ok":true}`

### Seed demo users & products (one-time)

From your laptop (same DB as production):

```bash
cd server
export DATABASE_URL="postgresql://...your-neon-url..."
npx prisma db push
npx prisma db seed
```

Or use **Render Shell** (if available on your plan) with the same commands and `DATABASE_URL` from the service environment.

---

## 4) Deploy the frontend on Vercel

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import the **same** GitHub repo.
2. **Framework Preset:** Vite  
3. **Root Directory:** `.` (repository root, not `server`).
4. **Build Command:** `npm run build`  
5. **Output Directory:** `dist`
6. **Environment Variables:**

   | Name | Value |
   |------|--------|
   | `VITE_API_URL` | Your Render API URL **with no trailing slash**, e.g. `https://nova-retail-api.onrender.com` |

7. Deploy. Open the `.vercel.app` URL — sign in and browse products.

**Note:** `vercel.json` rewrites all routes to `index.html` so React Router works on refresh.

---

## 5) Checklist

- [ ] Neon `DATABASE_URL` is set on Render and matches what you used for `db seed`.
- [ ] `curl https://YOUR-RENDER-URL/api/health` works.
- [ ] `VITE_API_URL` on Vercel is exactly your Render API origin (https, no path).
- [ ] After changing `VITE_API_URL`, trigger a **Redeploy** on Vercel so the client rebuilds.

---

## Troubleshooting (Vercel + Render)

| Issue | What to do |
|-------|------------|
| Render **build** fails on Prisma | Logs should show `prisma generate` / `db push`. Ensure `DATABASE_URL` is valid and Postgres allows connections from Render’s IPs (Neon allows all by default). |
| API **502** / cold start | Free Render web services **spin down** after idle; first request can take ~30–60s. Upgrade or accept cold starts for demos. |
| Blank API responses / CORS | API uses `cors` with `origin: true`. Set `VITE_API_URL` to the **exact** public API URL. |
| Vercel app loads but no products | Wrong or missing `VITE_API_URL`; redeploy after fixing env. |
| Login fails | Run `db seed` against the **same** DB Render uses. |

---

## Alternatives

- **API on Railway** instead of Render: see older steps in git history or `DEPLOYMENT.md`.
- **Database on Render Postgres** instead of Neon: create a Postgres instance on Render and set `DATABASE_URL` to its **Internal** or **External** URL as appropriate.

For Nginx / single-VPS deploys, see `DEPLOYMENT.md`.
