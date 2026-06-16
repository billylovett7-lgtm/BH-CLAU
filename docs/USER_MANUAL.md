# Codex Build Hub — User Manual

**Version:** 0.3.0 (Build Foundation)
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
- **Dashboard** — tells you what to work on next across all tracks

The application works offline by default. All your data stays on your device unless you explicitly enable cloud sync. This matters for producers with unreleased music and private sessions.

---

## Current Status (v0.3.0)

This version has the application foundation built. The navigation, routing, design system, data schemas and import parsers are all in place. Individual feature pages are currently placeholders — they will be filled out starting in Stage 3.

| Feature | Status |
|---|---|
| App navigation (desktop + mobile) | Working |
| Design system and dark theme | Working |
| All 21 routes wired | Working (placeholder pages) |
| 16 data model schemas | Complete |
| Import parsers (HTML, JSON, MD, TXT, MIDI) | Complete |
| Dashboard | Placeholder |
| Build workspace | Placeholder |
| Import centre UI | Placeholder |
| Chain / MIDI / Sample libraries | Placeholder |
| Supabase auth and cloud sync | Not yet built |
| Local database (offline storage) | Not yet built |

---

## Navigation

### Desktop

The top navigation bar is fixed to the top of every page when you are logged in. It contains:

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

---

## The Build System (Coming in Stage 9)

Each track you are working on gets its own **Build** — a structured workspace with 11 stages.

### The 11 Stages

| # | Stage | What you do here |
|---|---|---|
| 01 | Overview | Set the track title, genre, BPM, key, status and priority |
| 02 | Track Diagnosis | Note what is strong, what needs work and what direction the track should go |
| 03 | Arrangement Plan | Map the bar structure, energy curve and transitions |
| 04 | Drum Plan | Plan the kick character, groove feel, timing and fill moments |
| 05 | Drum Rack / MIDI | Document pad maps, piano roll patterns and clip variations |
| 06 | Bass / Sub Fix | Plan the low-end relationship, mono below 100 Hz, sidechain targets |
| 07 | Musical Layers | Hooks, chord movements, vocal moments and space planning |
| 08 | Ableton Chains | Your exact rack and device settings for every processing chain |
| 09 | Mixdown Plan | Balance, dynamics, stereo field and reference comparison |
| 10 | Master / Export | Loudness target, true peak ceiling, format and version log |
| 11 | Notes & Source | Session notes and the original imported source material |

Each stage contains **blocks** — structured pieces of content like text notes, tables, checklists, rack views and MIDI grids. Every block type is defined and validated; nothing is stored as raw unstructured HTML.

### Build Status Options

| Status | Meaning |
|---|---|
| Idea | Concept stage, not yet started |
| In Progress | Actively being worked on |
| Mixing | In the mixdown phase |
| Mastering | At master / export stage |
| Done | Finished and exported |
| Shelved | Paused indefinitely |

### Priority Levels

Builds have a priority (High / Medium / Low) and an optional due date. The dashboard sorts your active builds by these to tell you what to work on first.

---

## Starter Templates (Coming in Stage 9)

When you create a new build you can choose from 8 genre-specific templates. Each template pre-fills BPM, bar count and default stage notes based on how that genre is typically structured.

| Template | BPM | Bars | Key focus |
|---|---|---|---|
| Tech House Club Tool | 126 | 144 | Rolling low end, clean DJ blend zones |
| Deep House Extended | 122 | 160 | Warm harmonic movement, patient energy |
| UK Garage 2-Step | 132 | 160 | Swing drums, vocal responses, bass dropouts |
| DnB Roller | 174 | 192 | Long-form tension, rolling bass, detailed drum changes |
| Melodic Techno Arc | 124 | 192 | Gradual motif development, cinematic transitions |
| Afro House Percussion | 122 | 176 | Layered percussion, controlled melodic density |
| Minimal House Tool | 128 | 144 | Sparse hooks, micro-variation, long blend zones |
| Vocal House Dual Edit | 124 | 160 | Extended and radio edit planning side by side |

---

## Block Types

Every piece of content inside a build stage is stored as a typed block. There are 11 block types:

| Block | Used for |
|---|---|
| Text | Rich text notes, descriptions, guidance |
| Cards | Diagnosis cards, role cards, warning panels, reference cards |
| Table | Arrangement tables, chain parameter tables, gain staging, export specs |
| Checklist | Task lists with priority and completion tracking |
| Timeline | Bar/section maps with energy levels and FX events |
| Rack | Ableton chain view with devices, order, bypass state and settings |
| MIDI Grid | 16-step drum rack or instrument grid with note events |
| Sample Card | Sample metadata, audition button and usage notes |
| Preset Card | Serum preset documentation and macro assignments |
| Meter | Progress rings, loudness targets, gain trim meters |
| Source | Original imported source material — read-only, always escaped |

---

## Import System (Parser Complete, UI Coming in Stage 10)

The import system accepts files you have created elsewhere and converts them into structured build records.

### Supported File Types

| Type | Extensions | What is detected |
|---|---|---|
| HTML | `.html`, `.htm` | Title, BPM, key, genre, sections, tables, lists |
| JSON | `.json` | Build records, chain racks, MIDI patterns, backup files |
| Markdown | `.md` | YAML frontmatter, headings, tables, lists |
| Plain text | `.txt` | `Key: Value` metadata headers, paragraphs |
| MIDI | `.mid`, `.midi` | Note events, BPM, track count, drum grid |

### How Imports Work

1. **Drop a file** onto the import zone
2. The parser detects the file type and extracts metadata (title, BPM, key, genre, tags)
3. A **preview** shows the detected blocks before anything is saved
4. You review, correct any detected metadata, and choose which build or library to save into
5. The structured blocks are saved — the original source is always preserved as escaped text in a Source block

### What the Import System Will Never Do

- Execute any JavaScript from an imported HTML file
- Render imported HTML as live HTML in the page (`innerHTML` is never used)
- Accept files over the size limits (5 MB for text, 25 MB for MIDI)
- Trust metadata values without sanitising them first

---

## Libraries (Coming in Stages 11–12)

Six library sections store reusable content independently of specific builds. Everything in a library can be linked to one or more builds.

### Chains Library
Save your Ableton rack configurations with exact device order, settings, macro mappings, gain notes and mono safety flags. Copy a chain as formatted text to paste directly into session notes. Export as JSON for backup.

### MIDI Patterns Library
Store drum patterns, bass lines, chord sequences and melodic ideas. Each pattern includes note events, velocities, timing, BPM, key, scale and arrangement placement notes. Clip variations let you store the Core, Reduced and Turnaround versions of a pattern together.

### Samples Library
Catalogue audio files with detected or manually entered metadata (type, key, BPM, duration, format). Samples can be auditioned locally via the Web Audio API. Audio stays on your device and is never uploaded unless you explicitly choose to.

### Presets Library
Document Serum (and other synth) presets with macro assignments, oscillator notes, filter settings, envelope behaviour and effect chain notes. Import `.fxp`, `.fst` and `.serumpreset` files to create preset records.

### Grooves Library
Save swing, timing offset and velocity recipes. Each groove specifies which instruments it applies to and which to exclude. Reference grooves from drum plans in your builds.

### Arrangements Library
Store reusable bar structures, section maps, energy plans and DJ blend guidance. An arrangement can be applied to a new build as a starting template for the Arrangement Plan stage.

---

## Dashboard (Coming in Stage 8)

The dashboard answers one question: **what should I work on right now?**

It shows:
- **Continue Working** — the build you most recently touched, its current stage and completion ring
- **Priority Queue** — all active builds sorted by priority and deadline
- **Deadline List** — builds with due dates in date order
- **Recent Imports** — last 5 imported files
- **Storage Status** — local storage and cloud quota usage

---

## Sharing (Coming in Stage 13)

Builds can be shared in three visibility modes:

| Mode | Who can see it |
|---|---|
| Private | Only you |
| Unlisted | Anyone with the link |
| Public | Listed publicly |

Shared pages are always read-only. Viewers cannot edit any content. Share links can have an expiry date and can optionally allow the viewer to copy the build.

---

## Keyboard Shortcuts (Planned)

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
- Cloud sync must be explicitly enabled in Settings
- Audio files, MIDI files and presets are marked `localOnly: true` by default
- Imported source content is always preserved as escaped text — it is never executed
- SHA-256 hashes are used for asset deduplication and verification
- Soft deletion is used throughout — records are flagged `deletedAt` rather than permanently removed

---

## Supported Browsers

| Browser | Support |
|---|---|
| Chrome / Edge (latest) | Full |
| Firefox (latest) | Full |
| Safari 16+ (iPhone / Mac) | Full |
| Safari 15 and below | Not supported |

The app is a Progressive Web App. On iPhone, use **Share → Add to Home Screen** to install it as a standalone app with full-screen display and offline capability.
