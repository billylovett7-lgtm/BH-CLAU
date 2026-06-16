# Codex Build Hub

Production operating system for underground electronic music producers.

## Quick Start

### Prerequisites
- [Node.js 20+](https://nodejs.org) (LTS)
- pnpm: `npm install -g pnpm`

### Setup

```bash
# 1. Clone
git clone https://github.com/billylovett7-lgtm/BH-CLAU.git
cd BH-CLAU

# 2. Install dependencies
pnpm install

# 3. Configure environment
copy .env.example .env.local
# Edit .env.local and add your Supabase URL and anon key

# 4. Start dev server
pnpm --dir apps/web dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_ENABLE_CLOUD_SYNC` | Set `true` to enable cloud sync (default: `false`) |
| `VITE_MAX_TEXT_IMPORT_MB` | Max size for text imports (default: `5`) |
| `VITE_MAX_AUDIO_IMPORT_MB` | Max size for audio imports (default: `250`) |

---

## Project Structure

```
codex-build-hub/
├── apps/
│   └── web/          # React + Vite + TypeScript SPA
│       └── src/
│           ├── app/           # Router, providers, auth guards
│           ├── components/    # Reusable UI components
│           ├── features/      # Dashboard, builds, libraries, import etc.
│           ├── services/      # Supabase, local DB, sync, export
│           ├── schemas/       # Zod schemas
│           └── styles/        # Design tokens + global CSS
└── packages/
    └── shared/       # Framework-agnostic schemas, types, importers
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm --dir apps/web dev` | Start dev server at localhost:5173 |
| `pnpm --dir apps/web build` | Production build → `apps/web/dist/` |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm test` | Run all tests |

## Tech Stack

- **Frontend:** React 18, Vite 6, TypeScript 5
- **Routing:** React Router 6
- **State:** Zustand + TanStack Query
- **Local DB:** Dexie.js (IndexedDB)
- **Cloud:** Supabase (Auth, Postgres, Storage)
- **Validation:** Zod
- **UI primitives:** Radix UI
- **PWA:** vite-plugin-pwa
