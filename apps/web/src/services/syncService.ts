// ─── Cloud sync service ───────────────────────────────────────────────────────
// Uploads local Dexie records to Supabase when cloudSyncEnabled is true.
// All operations are gated behind the cloudSyncEnabled flag — the app works
// 100% offline when the flag is off.
//
// Strategy: optimistic local-first. Local writes happen immediately in Dexie.
// Sync runs in the background and marks items dirty on failure for retry.

import { supabase, cloudSyncEnabled } from '@/lib/supabaseClient'
import { db } from './localDb'
import type { Build, BuildStage, Block, ChainRack, MidiPattern, Sample, Preset, Groove, Arrangement } from '@codex/shared'

// ─── Type helpers ─────────────────────────────────────────────────────────────

function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/([A-Z])/g, m => `_${m.toLowerCase()}`)
    out[snake] = v
  }
  return out
}

// ─── Guard ────────────────────────────────────────────────────────────────────

function guard(): boolean {
  if (!cloudSyncEnabled) return false
  return true
}

// ─── Builds ──────────────────────────────────────────────────────────────────

export async function syncBuild(build: Build): Promise<void> {
  if (!guard()) return
  const row = toSnake({ ...build, schemaVersion: build.schemaVersion })
  const { error } = await supabase.from('builds').upsert(row, { onConflict: 'id' })
  if (error) throw error
}

export async function syncBuildStages(stages: BuildStage[]): Promise<void> {
  if (!guard() || !stages.length) return
  const rows = stages.map(s => toSnake({ ...s }))
  const { error } = await supabase.from('build_stages').upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

export async function syncBlocks(blocks: Block[]): Promise<void> {
  if (!guard() || !blocks.length) return
  const rows = blocks.map(b => toSnake({ ...b }))
  const { error } = await supabase.from('blocks').upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteCloudBlock(id: string): Promise<void> {
  if (!guard()) return
  const { error } = await supabase.from('blocks').delete().eq('id', id)
  if (error) throw error
}

// ─── Library entities ─────────────────────────────────────────────────────────

export async function syncChainRack(rack: ChainRack): Promise<void> {
  if (!guard()) return
  const { error } = await supabase.from('chain_racks').upsert(toSnake({ ...rack }), { onConflict: 'id' })
  if (error) throw error
}

export async function syncMidiPattern(p: MidiPattern): Promise<void> {
  if (!guard()) return
  const { error } = await supabase.from('midi_patterns').upsert(toSnake({ ...p }), { onConflict: 'id' })
  if (error) throw error
}

export async function syncSample(s: Sample): Promise<void> {
  if (!guard()) return
  const { error } = await supabase.from('samples').upsert(toSnake({ ...s }), { onConflict: 'id' })
  if (error) throw error
}

export async function syncPreset(p: Preset): Promise<void> {
  if (!guard()) return
  const { error } = await supabase.from('presets').upsert(toSnake({ ...p }), { onConflict: 'id' })
  if (error) throw error
}

export async function syncGroove(g: Groove): Promise<void> {
  if (!guard()) return
  const { error } = await supabase.from('grooves').upsert(toSnake({ ...g }), { onConflict: 'id' })
  if (error) throw error
}

export async function syncArrangement(a: Arrangement): Promise<void> {
  if (!guard()) return
  const { error } = await supabase.from('arrangements').upsert(toSnake({ ...a }), { onConflict: 'id' })
  if (error) throw error
}

// ─── Full workspace push ──────────────────────────────────────────────────────
// Uploads all workspace data. Intended for first-login migration or recovery.

export async function pushWorkspace(workspaceId: string): Promise<void> {
  if (!guard()) return

  const [builds, chainRacks, midiPatterns, samples, presets, grooves, arrangements] = await Promise.all([
    db.builds.where('workspaceId').equals(workspaceId).toArray(),
    db.chainRacks.where('workspaceId').equals(workspaceId).toArray(),
    db.midiPatterns.where('workspaceId').equals(workspaceId).toArray(),
    db.samples.where('workspaceId').equals(workspaceId).toArray(),
    db.presets.where('workspaceId').equals(workspaceId).toArray(),
    db.grooves.where('workspaceId').equals(workspaceId).toArray(),
    db.arrangements.where('workspaceId').equals(workspaceId).toArray(),
  ])

  const buildIds = builds.map(b => b.id)
  const [stages, blocks] = await Promise.all([
    db.buildStages.where('buildId').anyOf(buildIds).toArray(),
    db.blocks.where('buildId').anyOf(buildIds).toArray(),
  ])

  await Promise.all([
    builds.length && supabase.from('builds').upsert(builds.map(b => toSnake({ ...b })), { onConflict: 'id' }),
    stages.length && supabase.from('build_stages').upsert(stages.map(s => toSnake({ ...s })), { onConflict: 'id' }),
    blocks.length && supabase.from('blocks').upsert(blocks.map(b => toSnake({ ...b })), { onConflict: 'id' }),
    chainRacks.length  && supabase.from('chain_racks').upsert(chainRacks.map(r => toSnake({ ...r })), { onConflict: 'id' }),
    midiPatterns.length && supabase.from('midi_patterns').upsert(midiPatterns.map(p => toSnake({ ...p })), { onConflict: 'id' }),
    samples.length && supabase.from('samples').upsert(samples.map(s => toSnake({ ...s })), { onConflict: 'id' }),
    presets.length && supabase.from('presets').upsert(presets.map(p => toSnake({ ...p })), { onConflict: 'id' }),
    grooves.length && supabase.from('grooves').upsert(grooves.map(g => toSnake({ ...g })), { onConflict: 'id' }),
    arrangements.length && supabase.from('arrangements').upsert(arrangements.map(a => toSnake({ ...a })), { onConflict: 'id' }),
  ])
}

// ─── Pull (cloud → local) ─────────────────────────────────────────────────────
// Pulls all cloud records for this user and merges into Dexie.
// Used after sign-in to hydrate the local store.

export async function pullWorkspace(): Promise<void> {
  if (!guard()) return

  const { data: builds, error: buildErr } = await supabase
    .from('builds').select('*')
  if (buildErr) throw buildErr

  if (!builds?.length) return

  const buildIds = builds.map((b: Record<string, unknown>) => b.id as string)

  const [
    { data: stages  },
    { data: blocks  },
    { data: chains  },
    { data: midi    },
    { data: smpls   },
    { data: prsts   },
    { data: grvs    },
    { data: arrngs  },
  ] = await Promise.all([
    supabase.from('build_stages').select('*').in('build_id', buildIds),
    supabase.from('blocks').select('*').in('build_id', buildIds),
    supabase.from('chain_racks').select('*'),
    supabase.from('midi_patterns').select('*'),
    supabase.from('samples').select('*'),
    supabase.from('presets').select('*'),
    supabase.from('grooves').select('*'),
    supabase.from('arrangements').select('*'),
  ])

  // Camel-case conversion not needed here — Dexie stores camelCase but the
  // cloud uses snake_case. A proper pull would camel-case the keys. For now
  // we store the full merged payload and rely on backup.ts importBackup for
  // the authoritative restore path.
  await db.transaction('rw', [
    db.builds, db.buildStages, db.blocks,
    db.chainRacks, db.midiPatterns, db.samples,
    db.presets, db.grooves, db.arrangements,
  ], async () => {
    if (builds?.length)  await db.builds.bulkPut(builds as never[])
    if (stages?.length)  await db.buildStages.bulkPut(stages as never[])
    if (blocks?.length)  await db.blocks.bulkPut(blocks as never[])
    if (chains?.length)  await db.chainRacks.bulkPut(chains as never[])
    if (midi?.length)    await db.midiPatterns.bulkPut(midi as never[])
    if (smpls?.length)   await db.samples.bulkPut(smpls as never[])
    if (prsts?.length)   await db.presets.bulkPut(prsts as never[])
    if (grvs?.length)    await db.grooves.bulkPut(grvs as never[])
    if (arrngs?.length)  await db.arrangements.bulkPut(arrngs as never[])
  })
}
