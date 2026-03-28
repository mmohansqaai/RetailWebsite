# Push this project to GitHub

## What is already done locally

- `git init` on the `main` branch  
- First commit with the app source (frontend + `server/`)  
- **Not** committed (see `.gitignore`): `node_modules/`, `dist/`, `server/.env`, `server/prisma/dev.db`

## Step 1 — Create an empty repository on GitHub

1. Log in at [github.com](https://github.com).
2. Click **+** → **New repository**.
3. Name it (e.g. `RetailWebsite`).
4. Leave **without** README / `.gitignore` / license (you already have files locally).
5. Click **Create repository**.

Copy the repository URL GitHub shows, e.g.:

- HTTPS: `https://github.com/YOUR_USERNAME/RetailWebsite.git`
- SSH: `git@github.com:YOUR_USERNAME/RetailWebsite.git`

## Step 2 — Add the remote and push

In your project folder (`RetailWebsite`):

```bash
cd /path/to/RetailWebsite

git remote add origin https://github.com/YOUR_USERNAME/RetailWebsite.git
git branch -M main
git push -u origin main
```

Use your real URL instead of `YOUR_USERNAME/RetailWebsite`.

If GitHub asks for credentials, use a **Personal Access Token** (HTTPS) or SSH keys (SSH). See: [GitHub docs — authentication](https://docs.github.com/en/get-started/getting-started-with-git/about-remote-repositories).

## Optional — GitHub CLI

If you use [`gh`](https://cli.github.com/):

```bash
cd /path/to/RetailWebsite
gh repo create RetailWebsite --private --source=. --remote=origin --push
```

Adjust `--public` / `--private` as you like.

## After pushing

- Clone elsewhere: `git clone https://github.com/YOUR_USERNAME/RetailWebsite.git`
- New machine: copy `server/.env.example` → `server/.env`, run `npm install`, `npm install --prefix server`, Prisma commands from `README.md`.

## Security reminder

Never commit `server/.env` or real database URLs/JWT secrets. Teammates should use `server/.env.example` and their own secrets.
