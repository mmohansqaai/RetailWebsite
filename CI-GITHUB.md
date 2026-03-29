# GitHub CI — step by step

This repo includes a **GitHub Actions** workflow that runs automatically when you push code or open/update a pull request against `main` (or `master`).

---

## What CI does

| Job | What it checks |
|-----|----------------|
| **Frontend** | `npm ci` → `npm run lint` → `npm run build` (Vite production build) |
| **Server** | `npm ci` in `server/` → `prisma validate` → `prisma generate` |

It does **not** start Postgres or run `prisma db push` / migrations (that would need a database secret in GitHub). Those stay part of deploy or local dev.

---

## Step 1 — Put the workflow file on GitHub

The workflow lives at:

`.github/workflows/ci.yml`

If you work locally:

```bash
git add .github/workflows/ci.yml CI-GITHUB.md
git commit -m "Add GitHub Actions CI"
git push origin main
```

After the push, GitHub picks up the workflow automatically.

---

## Step 2 — Confirm Actions are enabled (usually already on)

1. Open your repo on GitHub: `https://github.com/YOUR_USER/YOUR_REPO`
2. Click **Actions**
3. You should see workflow **CI** listed
4. Open the latest run — both **Frontend** and **Server** jobs should be green

If Actions were disabled for the repo, GitHub will prompt you to enable them the first time.

---

## Step 3 — How runs are triggered

| Event | When CI runs |
|-------|----------------|
| `push` to `main` or `master` | Every push |
| `pull_request` targeting `main` or `master` | On open, sync, and reopen of the PR |

Other branches: no CI unless you add them under `on:` in `ci.yml`.

---

## Step 4 — Read failures

1. **Actions** → select the failed workflow run
2. Click the red job (**Frontend** or **Server**)
3. Expand the failed step to see logs

Common fixes:

- **Lint errors** — fix ESLint issues locally (`npm run lint`)
- **Build errors** — fix TypeScript/JS or Vite issues (`npm run build`)
- **Prisma validate** — fix `server/prisma/schema.prisma`

---

## Step 5 — (Optional) Require CI before merge

1. Repo → **Settings** → **Branches**
2. **Add branch protection rule** for `main`
3. Enable **Require status checks to pass before merging**
4. Search and select:
   - `Frontend (lint + build)`
   - `Server (Prisma + schema)`

Then PRs cannot merge until both jobs pass.

---

## Step 6 — (Optional) CI badge in README

Add to `README.md` (replace `USER` and `REPO`):

```markdown
[![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/ci.yml)
```

---

## Changing Node version

Edit `.github/workflows/ci.yml` → `node-version: "20"` in both jobs.

---

## Adding tests later

When you add `npm test` (e.g. Vitest or Playwright), add a step after install:

```yaml
- name: Test
  run: npm test
```

You can also add a separate job for E2E tests with a Postgres service container — that’s more advanced; ask if you want that pattern documented.
