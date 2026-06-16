# Codex Build Hub — Site Setup Manual

**Version:** 0.10.0
**Last updated:** 2026-06-16

This document covers everything needed to get the project running — locally for development, on a Synology NAS for private hosting, and on Vercel for public deployment.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Environment Variables](#3-environment-variables)
4. [Supabase Setup](#4-supabase-setup)
5. [GitHub Setup](#5-github-setup)
6. [Vercel Deployment](#6-vercel-deployment)
7. [Synology NAS Hosting (DS223+)](#7-synology-nas-hosting-ds223)
8. [GitHub Actions CI](#8-github-actions-ci)
9. [Project Structure Reference](#9-project-structure-reference)
10. [Common Commands](#10-common-commands)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

Install these before anything else.

### Node.js

Download the LTS version from [nodejs.org](https://nodejs.org). This project requires Node.js 20 or higher.

Verify after installing:
```
node --version   # should show v20.x.x or higher
```

### pnpm

Install via npm after Node.js is set up:
```
npm install -g pnpm
```

Verify:
```
pnpm --version   # should show 9.x.x or higher
```

**Windows note:** Close and reopen your terminal after installing Node.js and pnpm so the PATH updates take effect.

### Git

Download from [git-scm.com](https://git-scm.com). Verify:
```
git --version
```

---

## 2. Local Development Setup

### Clone the Repository

```bash
git clone https://github.com/billylovett7-lgtm/BH-CLAU.git
cd BH-CLAU
```

### Install Dependencies

```bash
pnpm install
```

This installs all dependencies across the monorepo (`apps/web` and `packages/shared`) in one command.

### Configure Environment Variables

```bash
# Windows
copy apps\web\.env.example apps\web\.env.local

# Mac / Linux
cp apps/web/.env.example apps/web/.env.local
```

Open `apps/web/.env.local`. For local-only (offline) use, the defaults work without any changes — just leave `VITE_ENABLE_CLOUD_SYNC=false`. Only fill in Supabase credentials if you want cloud sync.

### Start the Development Server

```bash
pnpm --dir apps/web dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The dev server includes Hot Module Replacement — changes to source files update the browser instantly without a full reload.

---

## 3. Environment Variables

All variables are prefixed with `VITE_` so Vite can expose them to the frontend bundle. Never put secrets that should stay server-side in these variables — only public keys and configuration.

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_APP_ENV` | No | `development` | Set to `production` when deploying |
| `VITE_SUPABASE_URL` | No | placeholder | Your Supabase project URL (only needed when cloud sync is on) |
| `VITE_SUPABASE_ANON_KEY` | No | placeholder | Supabase anon/public key (only needed when cloud sync is on) |
| `VITE_PUBLIC_APP_URL` | No | `http://localhost:5173` | The full URL where the app is hosted |
| `VITE_ENABLE_CLOUD_SYNC` | No | `false` | Set to `true` to enable Supabase cloud sync and authentication |
| `VITE_MAX_TEXT_IMPORT_MB` | No | `5` | Maximum size for HTML/JSON/MD/TXT imports |
| `VITE_MAX_AUDIO_IMPORT_MB` | No | `250` | Maximum size for audio file imports |
| `VITE_SENTRY_DSN` | No | — | Sentry error monitoring DSN (leave blank to disable) |
| `VITE_PLAUSIBLE_DOMAIN` | No | — | Plausible analytics domain (leave blank to disable) |

**Important:** When `VITE_ENABLE_CLOUD_SYNC=false` (the default), the app runs entirely offline and the Supabase URL/key are not used. You do not need a Supabase account to run the app in local mode. Placeholder values are used internally so the Supabase client initialises without throwing.

### Files

| File | Committed | Purpose |
|---|---|---|
| `apps/web/.env.example` | Yes | Template with placeholder values — safe to commit |
| `apps/web/.env.local` | **No** | Your real secrets — never committed to git |
| `.env.production` | No | Production overrides (set these in Vercel dashboard instead) |

---

## 4. Supabase Setup

Supabase provides the database, authentication and file storage when cloud sync is enabled. The app works fully offline without it.

### Get Your Credentials

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** — paste into `VITE_SUPABASE_URL`
   - **anon public key** — paste into `VITE_SUPABASE_ANON_KEY`

### Current Project

| Item | Value |
|---|---|
| Project URL | `https://qlzeefbelqmfmoxktyfo.supabase.co` |
| Region | Check your Supabase dashboard |

### Enabling Cloud Sync

Cloud sync is disabled by default. To enable it:

1. Set `VITE_ENABLE_CLOUD_SYNC=true` in `apps/web/.env.local`
2. Apply the database migrations (see below)
3. Restart the dev server

### Applying Database Migrations

The SQL migration files in `supabase/migrations/` define all database tables, indexes and Row Level Security policies. Apply them using the Supabase CLI:

```bash
# Install Supabase CLI (once)
npm install -g supabase

# Log in
supabase login

# Apply migrations to your cloud project
supabase db push --project-ref qlzeefbelqmfmoxktyfo
```

The migration at `supabase/migrations/20240001_initial_schema.sql` creates:
- 12 tables: workspaces, builds, build_stages, blocks, chain_racks, midi_patterns, samples, presets, grooves, arrangements, share_links, import_jobs
- RLS policies so each user can only see their own data
- Public read policy for share_links with visibility set to `public` or `unlisted`
- Indexes on workspace_id, build_id and slug columns

---

## 5. GitHub Setup

### Repository

The project is hosted at: [github.com/billylovett7-lgtm/BH-CLAU](https://github.com/billylovett7-lgtm/BH-CLAU)

### Adding Repository Secrets (for CI)

The GitHub Actions CI pipeline needs Supabase credentials to build the app with cloud sync enabled. If you are only building in local mode, these are optional (the build uses placeholder values automatically).

To add them:

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Click **New repository secret** and add:

| Secret name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

### Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code. CI runs on every push. Vercel deploys from here. |
| `develop` | Integration branch for features (optional, add when team grows) |
| `feature/*` | Individual feature branches |

---

## 6. Vercel Deployment

Vercel provides zero-configuration hosting for Vite/React apps with automatic deployments on every push to `main`.

### First-Time Setup

1. Go to [vercel.com](https://vercel.com) and sign up or log in with GitHub
2. Click **Add New Project**
3. Import the `BH-CLAU` repository
4. Configure the build settings:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `apps/web` |
| Build Command | `pnpm --dir apps/web build` |
| Output Directory | `apps/web/dist` |
| Install Command | `pnpm install` |

5. Add environment variables (click **Environment Variables**):

| Key | Value | Environment |
|---|---|---|
| `VITE_APP_ENV` | `production` | Production |
| `VITE_SUPABASE_URL` | Your project URL | All |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | All |
| `VITE_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Production |
| `VITE_ENABLE_CLOUD_SYNC` | `false` (or `true` if using Supabase) | Production |
| `VITE_MAX_TEXT_IMPORT_MB` | `5` | All |
| `VITE_MAX_AUDIO_IMPORT_MB` | `250` | All |

6. Click **Deploy**

Vercel gives you a URL like `bh-clau.vercel.app` within about 60 seconds.

### Automatic Deployments

After the first setup, every push to `main` automatically triggers a new deployment. Pull requests get their own preview URL.

### Custom Domain

In Vercel → your project → **Settings → Domains**, add your custom domain and follow the DNS instructions.

---

## 7. Synology NAS Hosting (DS223+)

The DS223+ is well-suited for hosting the built static app on your local network or publicly via DDNS. The app is a static site (HTML/CSS/JS files) — no Node.js server is needed at runtime.

### One-Time NAS Setup

#### Step 1 — Install Required Packages

In DSM (DiskStation Manager):
- Package Center → install **Web Station**
- Package Center → install **Container Manager** (Docker, optional but useful)

#### Step 2 — Set Up HTTPS

In DSM:
1. Go to **Control Panel → Security → Certificate**
2. Click **Add → Get a certificate from Let's Encrypt**
3. Enter your domain name (either a Synology DDNS domain or your own domain)
4. Let's Encrypt certificates auto-renew every 90 days

#### Step 3 — Set Up DDNS (for external access)

If you want to access the app from outside your home network:

1. Go to **Control Panel → External Access → DDNS**
2. Click **Add** and choose **Synology** as the service provider
3. Choose a hostname — you will get something like `yourname.synology.me`
4. On your router, forward ports **80** and **443** to your NAS's local IP address

#### Step 4 — Create a Shared Folder for the App

In DSM:
1. Go to **Control Panel → Shared Folder**
2. Create a new shared folder called `codex-build-hub`
3. Set it to not be visible in the network (it will only be served by Web Station, not browsed directly)

#### Step 5 — Configure Web Station

In Web Station:
1. Go to **Virtual Host** or **Web Service Portal**
2. Create a new portal pointing to the `codex-build-hub` shared folder
3. Set your domain name and enable HTTPS

---

### Build and Deploy to the NAS

Every time you want to update what is running on the NAS:

#### On your development machine:

```bash
# Build the app
pnpm --dir apps/web build
```

This creates the `apps/web/dist/` folder containing the complete app as static files (including the PWA service worker).

#### Copy dist/ to the NAS:

**Option A — Synology Drive (drag and drop)**
If you have Synology Drive installed, open the `codex-build-hub` shared folder in Synology Drive and drag the contents of `dist/` into it.

**Option B — SCP from terminal**
```bash
scp -r apps/web/dist/* billy@your-nas-ip:/volume1/codex-build-hub/
```

**Option C — rsync (faster on repeated deploys)**
```bash
rsync -avz --delete apps/web/dist/ billy@your-nas-ip:/volume1/codex-build-hub/
```

#### The app is now live at your DDNS address.

---

### Docker Option (Alternative to Web Station)

If you prefer Docker, a `docker/docker-compose.yml` is included in the project. It runs a Caddy web server to serve the built files:

```bash
# On your NAS (via SSH or Container Manager)
docker compose -f docker/docker-compose.yml up -d
```

Configure the `docker/Caddyfile` with your domain name before running.

---

### NAS Architecture Summary

```
Internet
    │
    ▼
Router (port 443 forwarded)
    │
    ▼
Synology DS223+
    ├── Web Station / Caddy  →  serves apps/web/dist/ as HTTPS static site
    └── Let's Encrypt HTTPS  →  auto-renewed certificate

Cloud (separate, optional)
    └── Supabase (qlzeefbelqmfmoxktyfo.supabase.co)
        ├── Auth
        ├── Postgres database
        └── Storage (when VITE_ENABLE_CLOUD_SYNC=true)
```

The NAS only serves the frontend HTML/CSS/JS. All data operations use local IndexedDB by default. Cloud sync to Supabase is optional and gated behind the `VITE_ENABLE_CLOUD_SYNC` flag.

---

## 8. GitHub Actions CI

The CI pipeline runs automatically on every push to `main` or `develop`, and on every pull request to `main`.

### What It Does

```
Push to main
    │
    ├── pnpm install (with lockfile)
    ├── pnpm lint (ESLint across all packages)
    ├── pnpm typecheck (TypeScript across all packages)
    ├── pnpm test (Vitest — 63 unit and component tests)
    └── pnpm --dir apps/web build (Vite production build)
```

If any step fails, the push is flagged as failed in GitHub. Vercel will not deploy a build that fails CI.

### CI Configuration

The workflow is defined in `.github/workflows/ci.yml`.

### Required Secrets

Add these in GitHub → Settings → Secrets → Actions if you want CI to build with real Supabase credentials. If you leave them unset, the build still passes using placeholder values (local mode):

| Secret | Where used |
|---|---|
| `VITE_SUPABASE_URL` | Build step (Vite env substitution) |
| `VITE_SUPABASE_ANON_KEY` | Build step |

---

## 9. Project Structure Reference

```
codex-build-hub/
│
├── apps/
│   └── web/                        React + Vite + TypeScript SPA
│       ├── public/                 Static assets (favicon, PWA icons)
│       ├── src/
│       │   ├── app/                Router, providers, auth guards
│       │   │   ├── guards/         AuthGuard, PublicGuard
│       │   │   ├── App.tsx
│       │   │   ├── Providers.tsx
│       │   │   └── Router.tsx
│       │   ├── components/
│       │   │   ├── blocks/         BlockRenderer + 11 block components
│       │   │   ├── layout/         TopNav, MobileNav, PageShell
│       │   │   └── ui/             Button, Select, Input, Badge, Modal, etc.
│       │   ├── features/           One folder per page / feature area
│       │   │   ├── auth/           LoginPage
│       │   │   ├── build-workspace/ BuildWorkspacePage, BuildPrintPage
│       │   │   ├── builds/         BuildsPage, NewBuildPage
│       │   │   ├── compare/        ComparePage
│       │   │   ├── dashboard/      DashboardPage
│       │   │   ├── import-center/  ImportPage
│       │   │   ├── libraries/      chains, midi, samples, presets, grooves, arrangements
│       │   │   ├── marketing/      LandingPage, DocsPage
│       │   │   ├── public-share/   PublicBuildPage
│       │   │   ├── qa/             QaPage
│       │   │   ├── settings/       SettingsPage
│       │   │   └── storage/        StoragePage
│       │   ├── hooks/              useBuild, useBuilds, useLibrary, useCurrentUser
│       │   ├── lib/                supabaseClient, localIdentity, queryClient
│       │   ├── services/           buildService, importService, backup, syncService, shareService
│       │   ├── store/              authStore (Zustand)
│       │   ├── styles/             global.css, print.css (CSS custom properties)
│       │   ├── tests/
│       │   │   ├── components/     BlockRenderer.test.tsx
│       │   │   ├── unit/           schemas, parsers, migrations, constants
│       │   │   └── setup.ts        Vitest global setup
│       │   └── vite-env.d.ts       Vite type declarations (import.meta.env, CSS imports)
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                     Framework-agnostic (no React, no DOM)
│       └── src/
│           ├── schemas/            Authoritative Zod schemas (16 models)
│           ├── constants/          STAGES (11), GENRES, BLOCK_TYPES (11), TEMPLATES (8)
│           ├── importers/          HTML/JSON/MD/TXT/MIDI parsers + XSS sanitiser
│           └── migrations/         Backup version migration functions
│
├── supabase/
│   ├── config.toml                 Local Supabase configuration
│   └── migrations/
│       └── 20240001_initial_schema.sql   Full schema with RLS policies
│
├── docker/
│   ├── docker-compose.yml          Self-hosted deployment (Caddy)
│   └── Caddyfile                   Reverse proxy config
│
├── docs/
│   ├── SETUP.md                    This file
│   └── USER_MANUAL.md              End-user feature guide
│
├── .github/workflows/ci.yml        GitHub Actions CI/CD
├── .env.example                    Environment variable template (at root — copy to apps/web/.env.local)
├── CHANGELOG.md
├── package.json                    Monorepo root (Turborepo scripts)
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── turbo.json
```

---

## 10. Common Commands

Run all of these from the **monorepo root** (`C:\Users\billy\Documents\Build Hub - Claude` on Windows):

| Command | What it does |
|---|---|
| `pnpm --dir apps/web dev` | Start the dev server at localhost:5173 |
| `pnpm --dir apps/web build` | Build for production → `apps/web/dist/` |
| `pnpm --dir apps/web preview` | Preview the production build locally |
| `pnpm --dir apps/web test` | Run all 63 Vitest tests |
| `pnpm --dir apps/web test --run` | Run tests once (no watch mode) |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm typecheck` | Run TypeScript type-check across all packages |
| `pnpm --dir apps/web exec tsc --noEmit` | Type-check the web app only |
| `pnpm install` | Install / update all dependencies |
| `git push origin main` | Push to GitHub (triggers CI + Vercel deploy) |

---

## 11. Troubleshooting

### `node` or `pnpm` not recognised after installation

Close and reopen your terminal. Windows does not update the PATH in already-open terminals.

### `pnpm install` fails with ERR_PNPM_IGNORED_BUILDS

Run:
```bash
pnpm approve-builds
```
And approve `esbuild` and `msw`. This is a one-time security prompt from pnpm.

### Vite dev server won't start — port 5173 in use

Another process is already using port 5173. Either kill it or start on a different port:
```bash
pnpm --dir apps/web dev --port 5174
```

### App loads but shows a blank page

The most common cause is a missing `apps/web/.env.local` file or a corrupt one. The app uses placeholder Supabase values by default, so missing credentials alone will not cause a blank page — but an `.env.local` with a malformed URL (not empty, but invalid) can.

Steps to diagnose:
1. Open browser DevTools → Console → look for any red errors
2. Confirm `apps/web/.env.local` exists (copy from `apps/web/.env.example` if missing)
3. Hard-refresh (`Ctrl+Shift+R`) to clear any stale cached bundle
4. If the error mentions `supabaseUrl`, check that `VITE_SUPABASE_URL` is either a valid HTTPS URL or left unset (blank)

### TypeScript build errors on Vercel

The most common causes:
- A component using `onChange` on `<Select>` — use `onChange` (the component accepts it as an alias for `onValueChange`)
- Status values (`'on-hold'`, `'completed'`, `'abandoned'`) are not in the schema — valid values are: `idea`, `in-progress`, `mixing`, `mastering`, `done`, `shelved`
- CSS side-effect imports failing — `src/vite-env.d.ts` must exist with `/// <reference types="vite/client" />`
- `import.meta.env` not typed — same fix as above

Run `pnpm --dir apps/web build` locally before pushing to catch these before Vercel does.

### Changes not showing on the NAS after deploy

1. Confirm the build completed without errors: `pnpm --dir apps/web build`
2. Confirm the `dist/` folder was fully copied to the NAS shared folder
3. Hard-refresh the browser (`Ctrl+Shift+R` or `Cmd+Shift+R`) to bypass cache
4. If the PWA service worker is caching the old version, go to DevTools → Application → Service Workers → click **Unregister**, then reload

### Supabase connection errors

- Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Confirm `VITE_ENABLE_CLOUD_SYNC=true` if you want to connect (default is `false`)
- Check the Supabase dashboard to see if your project is paused (free tier projects pause after inactivity)
- Confirm the migrations have been applied: `supabase db push --project-ref qlzeefbelqmfmoxktyfo`

### MIDI import produces no note events

- Confirm the file is a valid Type 0 or Type 1 MIDI file (not an Ableton `.als` or Logic `.logicx`)
- Check that the file is under 25 MB
- Some MIDI files use non-standard encodings — check the browser console for parse errors

### Tests failing locally

Run:
```bash
pnpm --dir apps/web test --run
```

Common failures:
- `IndexedDB` errors — the test setup stubs `indexedDB` as `undefined`; if a test imports a service that calls Dexie at module level, it will fail. Keep Dexie calls inside functions, not at the top level of a module.
- `crypto.randomUUID` errors — the setup polyfills this for jsdom; if a new test environment doesn't have it, add the polyfill to `src/tests/setup.ts`

---

## Support

If you find a bug or need help, check the [GitHub Issues](https://github.com/billylovett7-lgtm/BH-CLAU/issues) page.
