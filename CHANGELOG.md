# Changelog

All notable changes to Codex Build Hub are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned — Stage 3
- Dexie.js local database service with all 16 model tables
- Typed repository functions (getBuilds, upsertBuild, softDelete, etc.)
- Backup and restore service
- Binary asset storage (IndexedDB blob store)

### Planned — Stage 4
- Full primitive UI component library (Button, Card, Modal, Table, Badge, Input, etc.)
- Radix UI accessible primitives wired up
- All 11 block type renderer components

### Planned — Stage 5–15
- Auth (Supabase email + Google)
- Dashboard command centre with priority queue
- Build workspace (11-stage tabs, block editor, autosave)
- Import centre UI with drag-drop, preview, metadata mapping
- All 6 library pages (Chains, MIDI, Samples, Presets, Grooves, Arrangements)
- Compare, QA, Storage, Settings pages
- Supabase cloud layer (RLS, sync, share links)
- PWA service worker and offline mode
- Vercel + Synology NAS deployment

---

## [0.3.0] — 2026-06-16

### Added — Stage 2: Import Parsers

**`packages/shared/src/importers/`**

- `types.ts` — `ImportResult`, `DetectedMetadata`, `ImportError` interfaces shared across all parsers
- `utils.ts` — DOM-free utility functions: `detectBpm()`, `detectKey()`, `detectRoot()`, `detectGenre()`, `extractTags()`, `stripHtmlTags()`, `escapeText()`, `generateUUID()`
- `htmlImporter.ts` — Parses `.html`/`.htm` files without any DOM API. Strips all dangerous content (scripts, event attributes, iframes, `javascript:` href, `data:` URLs, HTML comments). Converts headings → text blocks, tables → table blocks, lists → checklist blocks. Source is always preserved as escaped plain text, never as live HTML.
- `jsonImporter.ts` — Validates imported JSON against Build, ChainRack, and MidiPattern Zod schemas. Handles full prototype backup format (with `builds[]` array) via the migration system. Emits structured warnings for unknown shapes rather than silently accepting them.
- `markdownImporter.ts` — Parses YAML frontmatter for metadata, converts headings → text blocks, pipe tables → table blocks, unordered/ordered lists → checklist blocks. Strips inline markdown (bold, italic, code, links) before escaping.
- `txtImporter.ts` — Detects `Key: Value` metadata header lines at the top of plain-text files (title, genre, BPM, key, root, tags). Splits body into paragraphs → text blocks, metadata → cards block.
- `midiParser.ts` — Wraps `@tonejs/midi` (browser + Node.js compatible, no DOM). Extracts note events, detects BPM from tempo meta events, maps pitches to General MIDI drum names, builds 16-step grid blocks and note event table blocks. Caps at 10,000 events and 25 MB.

**Security guarantees applied across all parsers:**
- File size limits enforced before parsing (5 MB text, 25 MB MIDI)
- All string output runs through `escapeText()` before entering block `data`
- Source block always stored as escaped plain text (never executable)
- JSON validated through Zod schemas — invalid fields become warnings, not silent data

### Changed
- `packages/shared/package.json` — added `@tonejs/midi` dependency
- `packages/shared/src/index.ts` — exports all importers from barrel

---

## [0.2.0] — 2026-06-16

### Added — Stage 1: Zod Schemas, Constants, Migrations

**`packages/shared/src/schemas/`** — 16 data model schemas

| Schema | Key fields |
|---|---|
| `base.schema.ts` | `id`, `ownerId`, `workspaceId`, `schemaVersion`, `createdAt`, `updatedAt`, `deletedAt` |
| `user.schema.ts` | `email`, `displayName`, `plan` (free/pro/team) |
| `workspace.schema.ts` | `name`, `type` (personal/team), `settings`, `quotaBytes` |
| `build.schema.ts` | `title`, `genre`, `bpm`, `key`, `status`, `priority`, `dueDate`, `progress`, `currentStage` |
| `build-stage.schema.ts` | `stageKey`, `order`, `completed`, `completedAt`, `taskChecks[]` |
| `block.schema.ts` | Discriminated union of 11 block types on `type` field |
| `chain-rack.schema.ts` | `name`, `role`, `devices[]`, `macros[]`, `gainNotes`, `monoSafety` |
| `device.schema.ts` | `name`, `enabled`, `deviceType`, `settings`, `macroMappings[]` |
| `midi-pattern.schema.ts` | `noteEvents[]`, `clipVariations[]`, `ppq`, `grid`, `swing` |
| `sample.schema.ts` | `assetId`, `type`, `duration`, `sampleRate`, `bitDepth`, `localOnly` |
| `preset.schema.ts` | `synth`, `macros[]`, `oscillators`, `filter`, `envelopes`, `effects` |
| `groove.schema.ts` | `swing`, `timing[]`, `velocity[]`, `targets[]`, `exclude[]` |
| `arrangement.schema.ts` | `sections[]`, `energyPlan`, `hookStrategy`, `mixIn`, `mixOut` |
| `import-job.schema.ts` | `fileType`, `status`, `parserVersion`, `detectedMetadata`, `previewBlocks`, `errors[]` |
| `asset.schema.ts` | `mimeType`, `sizeBytes`, `hash` (SHA-256), `storagePath`, `localOnly` |
| `share-link.schema.ts` | `slug`, `visibility` (private/unlisted/public), `expiresAt`, `allowCopy` |
| `qa-item.schema.ts` | `scope`, `status` (pass/fail/skip/pending), `note`, `browser` |

All versioned records include `schemaVersion: z.literal(1)` to support future migrations.

**`packages/shared/src/constants/`**

- `stages.ts` — 11 build stage definitions with keys, order, titles, descriptions
- `genres.ts` — 14 genre values (Tech House, Deep House, UK Garage, DnB, etc.)
- `blockTypes.ts` — 11 block type definitions with display names
- `templates.ts` — 8 genre starter templates with BPM, bar count, and default stage notes

**`packages/shared/src/migrations/`**

- `v0-to-v1.ts` — migrates prototype ZIP export format (no versioning) → `schemaVersion: 1` for both Build and ChainRack records
- `index.ts` — `runMigrations(backup, ownerId, workspaceId)` version dispatcher

---

## [0.1.0] — 2026-06-16

### Added — Stage 0: Monorepo Foundation

**Repository & tooling**
- pnpm workspace monorepo with Turborepo (`apps/*`, `packages/*`)
- Node.js 24 LTS, pnpm 11
- ESLint 9 with TypeScript + React Hooks rules
- Prettier with single quotes, no semicolons, 100-char width
- `.gitattributes` enforcing LF line endings
- `.gitignore` covering node_modules, dist, .env.local, Synology sync folders
- GitHub Actions CI pipeline: lint → typecheck → test → build on every push to `main`
- `.env.example` documenting all required environment variables

**`apps/web/` — React + Vite SPA**
- React 18 + Vite 6 + TypeScript 5 (strict mode)
- `vite-plugin-pwa` configured: offline-capable, installable PWA, Workbox runtime caching for Supabase API calls
- `tsconfig.app.json` with path alias `@/*` → `src/*`
- `index.html` with PWA meta tags, Apple mobile web app config, safe-area viewport

**App shell**
- `src/main.tsx` — React entry point, global CSS imports
- `src/app/App.tsx` — root component with `RouterProvider`
- `src/app/Router.tsx` — all 21 routes defined, lazy-loaded via `React.lazy()` / `Suspense`
- `src/app/guards/` — `AuthGuard` (redirect to `/login`), `PublicGuard` (redirect to `/dashboard`)

**Layout components**
- `TopNav.tsx` — fixed desktop navigation bar with Libraries dropdown menu, search button, active link highlighting
- `MobileNav.tsx` — fixed bottom navigation bar (iPhone safe-area insets, 5 tabs)
- `PageShell.tsx` — wraps authenticated routes, composes TopNav + MobileNav with correct padding

**Design system — `src/styles/`**
- `tokens.css` — full CSS custom property token set: colours (dark base, lime/cyan accents, status, priority, stage), typography scale (xs–3xl), spacing (4px grid, space-1 through space-16), radii, shadows (including glow effects), z-index stack, layout dimensions, transitions, safe-area insets
- `global.css` — CSS reset, base typography, scrollbar styling, focus-visible outline, selection colour, utility classes
- `print.css` — `@media print` overrides hiding interactive elements, page-break rules

**Route stubs** — all 21 routes return placeholder pages:
`/`, `/login`, `/dashboard`, `/builds`, `/builds/new`, `/builds/:buildId`, `/builds/:buildId/print`, `/import`, `/libraries/chains`, `/libraries/midi`, `/libraries/midi/:patternId`, `/libraries/samples`, `/libraries/presets`, `/libraries/grooves`, `/libraries/arrangements`, `/libraries/arrangements/:arrangementId`, `/compare`, `/qa`, `/storage`, `/settings`, `/public/:shareSlug`, `/docs`

**`packages/shared/` — framework-agnostic shared package**
- TypeScript 5 library wired as workspace dependency `@codex/shared`
- Exports barrel at `src/index.ts`

**Infrastructure**
- Supabase project connected (`qlzeefbelqmfmoxktyfo.supabase.co`), credentials in `.env.local`
- GitHub repository: [billylovett7-lgtm/BH-CLAU](https://github.com/billylovett7-lgtm/BH-CLAU)
- `.claude/launch.json` configured for preview tool (Vite via direct node path)
- `pnpm-lock.yaml` committed for reproducible installs

---

## Version History Summary

| Version | Stage | Date | Description |
|---|---|---|---|
| 0.3.0 | Stage 2 | 2026-06-16 | Import parsers (HTML, JSON, MD, TXT, MIDI) |
| 0.2.0 | Stage 1 | 2026-06-16 | All 16 Zod schemas, constants, migrations |
| 0.1.0 | Stage 0 | 2026-06-16 | Monorepo foundation, app shell, design tokens |
