# Codex Build Hub — User Manual

**Version:** 0.10.0
**Last updated:** 2026-06-16

---

## What Is Codex Build Hub?

Codex Build Hub is a production operating system for underground electronic music producers. It is a single application where you manage every track you are finishing — from the initial idea through to export-ready master.

It combines:
- **Track build workspaces** — 11-stage structured finish plans for each track
- **Ableton chain documentation** — your exact rack and device settings saved and reusable
- **MIDI pattern library** — drum patterns, bass lines, chord sequences with note event data
- **Sample and preset catalogues** — your sounds linked to the builds they appear in
- **Arrangement library** — reusable bar structures and energy plans
- **Groove pool** — saved swing, timing and velocity recipes
- **Import system** — bring in your existing HTML, Markdown, JSON or text build notes
- **Compare tool** — view two builds side-by-side at any stage
- **QA checklist** — 33-point release readiness checklist
- **Dashboard** — tells you what to work on next across all tracks

The application works offline by default. All your data stays on your device unless you explicitly enable cloud sync. This matters for producers with unreleased music and private sessions.

---

## Current Status (v0.10.0)

All core features are built and working. The application is fully functional in local-only mode (no account required).

| Feature | Status |
|---|---|
| App navigation (desktop + mobile) | Working |
| Design system and dark theme | Working |
| Local database (IndexedDB via Dexie) | Working |
| 16 data model schemas (Zod validated) | Complete |
| Dashboard | Working |
| Build workspace (11 stages, all block types) | Working |
| Builds list with search and filters | Working |
| New build with genre templates | Working |
| Import centre (drag-drop, preview, mapper) | Working |
| Import parsers (HTML, JSON, MD, TXT, MIDI) | Complete |
| Chain / MIDI / Sample / Preset libraries | Working |
| Grooves and Arrangements libraries | Working |
| Compare tool (two-build side-by-side) | Working |
| QA release checklist | Working |
| Storage manager (export / import / purge) | Working |
| Settings page | Working |
| Public share links | Working |
| Cloud sync (Supabase) | Built, off by default |
| Test suite | 63 passing tests |
| PWA (installable, offline-capable) | Working |

---

## Navigation

### Desktop

The top navigation bar is fixed to the top of every page. It contains:

- **BUILD HUB** (logo) — returns to the dashboard
- **Dashboard** — your production command centre
- **Builds** — your full track library
- **Libraries** — dropdown menu containing:
  - Chains
  - MIDI Patterns
  - Samples
  - Presets
  - Grooves
  - Arrangements
- **Import** — bring in files from outside the app
- **Search button** (top right) — global search across all content

### Mobile (iPhone)

A bottom navigation bar with five tabs replaces the desktop nav on small screens:

| Tab | Destination |
|---|---|
| Home | Dashboard |
| Builds | Your build library |
| Import | Import centre |
| Library | Chains library |
| Settings | App preferences |

The bottom nav respects the iPhone home indicator safe area so controls are never hidden behind the gesture bar.

### Installing as a PWA

On iPhone: **Safari → Share → Add to Home Screen**
On Android: **Chrome → menu → Add to Home Screen**
On desktop: click the install icon in the address bar (Chrome / Edge)

Once installed, the app opens full-screen without the browser chrome and works offline using the cached service worker.

---

## Dashboard

The dashboard answers one question: **what should I work on right now?**

It shows:
- **Continue Working** — your active builds with a **+ New build** shortcut
- **Recent Imports** — the last 5 imported files with an **Import file** shortcut
- **Library** — entity counts for Builds, Chain Racks, MIDI Patterns, Samples, Presets, Grooves and Arrangements — each card links to the matching library page

When you have no builds yet, the empty state shows a **Create build** button to get started immediately.

---

## Builds

### Builds List

The builds page shows all your tracks. Use the controls to find what you need:

- **Search** — filters by title in real time
- **Status** filter — Idea / In Progress / Mixing / Mastering / Done / Shelved
- **Priority** filter — High / Medium / Low
- **Genre** filter — all genres in the system
- **Sort** — Updated (default), Created, Title A–Z, Priority, Progress
- **Grid / List toggle** — switch between card and compact row view

Each build card shows the title, genre/BPM/key metadata, a progress ring showing how many of the 11 stages are complete, and the status and priority badges.

### Creating a Build

Click **+ New build** (dashboard or builds list) to open the new build form.

**Templates (optional):** Choose a genre-specific template to pre-fill BPM and other metadata. Available templates:

| Template | BPM | Focus |
|---|---|---|
| Tech House Club Tool | 126 | Rolling low end, clean DJ blend zones |
| Deep House Extended | 122 | Warm harmonic movement, patient energy |
| UK Garage 2-Step | 132 | Swing drums, vocal responses, bass dropouts |
| DnB Roller | 174 | Long-form tension, rolling bass, detailed drum changes |
| Melodic Techno Arc | 124 | Gradual motif development, cinematic transitions |
| Afro House Percussion | 122 | Layered percussion, controlled melodic density |
| Minimal House Tool | 128 | Sparse hooks, micro-variation, long blend zones |
| Vocal House Dual Edit | 124 | Extended and radio edit planning side by side |

**Required:** Title.
**Optional:** Genre, BPM, Key, Status (default: In Progress), Priority (default: Medium).

Click **Create build** to open the workspace immediately.

### Build Status Values

| Status | Meaning |
|---|---|
| Idea | Concept stage, not yet started |
| In Progress | Actively being worked on |
| Mixing | In the mixdown phase |
| Mastering | At master / export stage |
| Done | Finished and exported |
| Shelved | Paused indefinitely |

Click the status badge inside the build workspace to cycle through these in order.

---

## Build Workspace

Each build has its own workspace with 11 stages.

### The 11 Stages

| # | Stage | What you do here |
|---|---|---|
| 01 | Overview | Track title, genre, BPM, key, status and priority metadata |
| 02 | Diagnosis | What is strong, what needs work and which direction the track should go |
| 03 | Arrangement | Bar structure, energy curve, section map and transitions |
| 04 | Drums | Kick character, groove feel, timing and fill moments |
| 05 | MIDI | Pad maps, piano roll patterns and clip variations |
| 06 | Bass | Low-end relationship, mono below 100 Hz, sidechain targets |
| 07 | Layers | Hooks, chord movements, vocal moments and space planning |
| 08 | Chains | Ableton rack and device settings for every processing chain |
| 09 | Mix | Balance, dynamics, stereo field and reference comparison |
| 10 | Master | Loudness target, true peak ceiling, format and version log |
| 11 | Source | Session notes and the original imported source material |

### Stage Tabs

The stage tabs are shown as a scrollable row at the top of the workspace. Completed stages show a ✓ indicator. Click any tab to jump to that stage.

### Adding Notes

Each stage has an **Add text note** form at the bottom. Type your note and press **Add note** to save it. Notes are stored as Text blocks and appear immediately (no page reload needed — they use live database queries).

### Marking Stages Done

Each stage has a **Mark stage done / Mark incomplete** toggle. Completed stages count toward the progress ring shown in the workspace header. The progress percentage is recalculated automatically.

### Status Cycling

Click the status badge in the workspace header to cycle the build status: Idea → In Progress → Mixing → Mastering → Done → Shelved → back to Idea.

### Removing Blocks

Each block has a **Remove** button (× icon). Removing a block is immediate and cannot be undone.

---

## Block Types

Every piece of content inside a build stage is stored as a typed block. There are 11 block types:

| Block | Used for |
|---|---|
| Text | Written notes, descriptions, guidance |
| Cards | Diagnosis cards, role cards, warning panels, reference cards |
| Table | Arrangement tables, chain parameter tables, gain staging, export specs |
| Checklist | Task lists with priority and completion tracking |
| Timeline | Bar/section maps with energy levels and FX events |
| Rack | Ableton chain view with devices, order, bypass state and settings |
| MIDI Grid | 16-step drum rack or instrument grid with note events |
| Sample Card | Sample metadata and usage notes |
| Preset Card | Serum preset documentation and macro assignments |
| Meter | Progress rings, loudness targets, gain trim meters |
| Source | Original imported source material — read-only, always escaped |

All block content is stored as structured data validated against Zod schemas. Raw HTML is never stored or rendered — content is always escaped before display.

---

## Import System

The import system accepts files you have created elsewhere and converts them into structured build records.

### Supported File Types

| Type | Extensions | What is detected |
|---|---|---|
| HTML | `.html`, `.htm` | Title, BPM, key, genre, sections, tables, lists |
| JSON | `.json` | Build records, chain racks, MIDI patterns, backup files |
| Markdown | `.md`, `.markdown` | YAML frontmatter, headings, tables, lists |
| Plain text | `.txt` | `Key: Value` metadata headers, paragraphs |
| MIDI | `.mid`, `.midi` | Note events, BPM, track count, drum grid |

### How to Import

1. Go to **Import** in the navigation
2. **Drop a file** onto the drop zone, or click the zone to choose a file
3. The parser runs and shows a **preview** of the detected blocks
4. In the metadata mapper, review and correct the title, genre, BPM, key
5. Optionally link the import to an existing build
6. Click **Save to library** to create the build and save all blocks

The original source content is always preserved as a Source block — escaped text, never executable.

### What the Import System Will Never Do

- Execute any JavaScript from an imported HTML file
- Render imported HTML as live HTML in the page (`innerHTML` is never used)
- Accept files over the size limits (5 MB for text, 25 MB for MIDI)
- Trust metadata values without sanitising them first

---

## Libraries

Six library sections store reusable content independently of specific builds. Navigate to each via **Libraries** in the top nav.

All library pages share the same layout: a searchable list on the left, and a detail drawer that slides in on the right when you click a row.

### Chains Library

Save your Ableton rack configurations with device order, settings, macro mappings, gain notes and mono safety flags. The detail drawer shows all devices with their enabled state highlighted in lime green.

### MIDI Patterns Library

Store drum patterns, bass lines, chord sequences and melodic ideas. Filter by pattern type (drums, bass, chords, melody, arp). The detail drawer shows note events, BPM, key, scale, time signature and clip variations.

### Samples Library

Catalogue audio files with detected or manually entered metadata (type, key, BPM, duration, format). The detail drawer shows all metadata and usage notes. Audio stays on your device and is never uploaded unless you explicitly choose to.

### Presets Library

Document Serum (and other synth) presets with macro assignments, oscillator notes, filter settings, envelope behaviour and effect chain notes. Filter by synth type. The detail drawer shows full preset documentation.

### Grooves Library

Save swing, timing offset and velocity recipes. The detail drawer shows timing offset bars and velocity bars visualised as horizontal indicators. Each groove specifies which instruments it applies to and which to exclude.

### Arrangements Library

Store reusable bar structures, section maps, energy plans and DJ blend guidance. The detail drawer shows a section timeline bar and all section metadata. An arrangement can be applied to a new build as a starting template.

---

## Compare Tool

Navigate to **Libraries → Compare** (or use the Tools dropdown if available) to open the compare view.

**How to use:**
1. Select **Build A** from the left dropdown
2. Select **Build B** from the right dropdown
3. Select a **Stage** to compare
4. The two builds are shown side-by-side with all blocks visible for the chosen stage

The compare view is read-only. It is useful for spotting differences in approach between two mixes, or for copying ideas from a finished build into a new one.

---

## QA Checklist

The QA page provides a 33-point release readiness checklist covering every aspect of a finished track — arrangement, sound design, mix, master and export.

### Using the Checklist

Each item can be set to one of four states by clicking the status button:

| State | Meaning |
|---|---|
| Pending | Not yet checked |
| Pass | Confirmed good |
| Fail | Needs attention |
| Skip | Not applicable for this track |

Click the item text area to add an inline note explaining a pass, fail or skip decision.

### Scope Filter

Use the **Scope** dropdown to filter the checklist to a specific area: Arrangement, Sound Design, Mix, Master or Export.

### Summary Bar

The bottom of the page shows a count of Pass / Fail / Skip / Pending items and the percentage passing. Aim for 100% Pass or Skip before export.

---

## Storage Manager

Navigate to **Settings → Storage** (or the Settings page) to manage your local data.

### Stats

The top of the page shows entity counts for every data type — builds, stages, blocks, chain racks, MIDI patterns, samples, presets, grooves and arrangements.

### Export Backup

Click **Export backup** to download a complete JSON backup of all your data. The file includes all builds, stages, blocks and library entries. Save this somewhere safe (cloud storage, external drive) as a regular backup routine.

### Import Backup

Click **Import backup** to restore data from a previously exported backup file. The import merges records — it does not wipe existing data first.

### Purge Workspace

The **Purge workspace** button permanently deletes all local data. You must type `DELETE` exactly into the confirmation field before the button becomes active. This cannot be undone — export a backup first.

---

## Settings

The Settings page shows:

- **Workspace ID** — your local workspace identifier (copy button)
- **User ID** — your local user identifier (copy button)
- **Cloud sync status** — shows whether cloud sync is on or off
- **Sign out** — only shown when cloud sync is enabled and you are signed in
- **Keyboard shortcuts** — reference table of all available shortcuts

---

## Sharing

Builds can be shared as read-only public links when cloud sync is enabled.

To create a share link, open a build workspace and use the Share option. Choose a visibility mode:

| Mode | Who can see it |
|---|---|
| Private | Only you |
| Unlisted | Anyone with the link |
| Public | Listed publicly |

Share links can have an optional expiry date. Viewers see the full 11-stage workspace in read-only mode and cannot edit any content.

Share links use a random slug (e.g. `/public/abc123`) and are served without authentication.

---

## Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Open command palette / search | `Ctrl+K` |
| New build | `Ctrl+N` |
| Previous stage | `Ctrl+[` |
| Next stage | `Ctrl+]` |
| Save current block | `Ctrl+S` |

---

## Data and Privacy

- All data is stored locally in your browser (IndexedDB) by default
- Cloud sync must be explicitly enabled in Settings (via `VITE_ENABLE_CLOUD_SYNC=true`)
- Audio files, MIDI files and presets are marked `localOnly: true` by default
- Imported source content is always preserved as escaped text — it is never executed or rendered as HTML
- SHA-256 hashes are used for asset deduplication and verification
- Soft deletion is used throughout — records are flagged `deletedAt` rather than permanently removed, enabling safe backup and restore operations

---

## Supported Browsers

| Browser | Support |
|---|---|
| Chrome / Edge (latest) | Full, including PWA install |
| Firefox (latest) | Full |
| Safari 16+ (iPhone / Mac) | Full, including Add to Home Screen |
| Safari 15 and below | Not supported (missing IndexedDB features) |

The app is a Progressive Web App. On iPhone, use **Share → Add to Home Screen** to install it as a standalone app with full-screen display and offline capability. On desktop Chrome or Edge, an install prompt appears in the address bar.
