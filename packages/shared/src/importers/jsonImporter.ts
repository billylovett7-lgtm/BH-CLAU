// JSON importer — validates against known schemas, handles prototype backup format

import { buildSchema } from '../schemas/build.schema'
import { chainRackSchema } from '../schemas/chain-rack.schema'
import { midiPatternSchema } from '../schemas/midi-pattern.schema'
import { runMigrations } from '../migrations/index'
import type { ImportResult, DetectedMetadata } from './types'
import type { Block } from '../schemas/block.schema'
import { escapeText, generateUUID, detectBpm, detectGenre } from './utils'
import { PARSER_VERSION } from './types'

const ANONYMOUS_OWNER     = '00000000-0000-0000-0000-000000000001'
const ANONYMOUS_WORKSPACE = '00000000-0000-0000-0000-000000000002'

function previewId(): string { return generateUUID() }

function jsonToBlocks(obj: Record<string, unknown>, buildId_: string): Block[] {
  const blocks: Block[] = []

  // Top-level string/number fields → cards block
  const cards = Object.entries(obj)
    .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
    .slice(0, 20)
    .map(([k, v]) => ({
      label:   escapeText(k),
      value:   escapeText(String(v).slice(0, 200)),
      variant: 'default' as const,
    }))

  if (cards.length) {
    blocks.push({
      type:    'cards',
      id:      previewId(),
      buildId: buildId_,
      stageKey: 'overview',
      order:   0,
      locked:  false,
      data:    { cards },
    })
  }

  return blocks
}

function detectFromJson(obj: Record<string, unknown>): DetectedMetadata {
  const text = JSON.stringify(obj)
  return {
    title: typeof obj.title === 'string' ? obj.title.slice(0, 200) : undefined,
    genre: typeof obj.genre === 'string' ? obj.genre : detectGenre(text),
    bpm:   typeof obj.bpm === 'number' ? obj.bpm : detectBpm(text),
    key:   typeof obj.key === 'string' ? obj.key : undefined,
    root:  typeof obj.root === 'string' ? obj.root : undefined,
    tags:  Array.isArray(obj.tags) ? obj.tags.filter(t => typeof t === 'string').slice(0, 20) : [],
  }
}

export function parseJson(
  text:     string,
  fileName: string,
  buildId_: string = 'preview',
): ImportResult {
  const errors: ImportResult['errors'] = []
  const blocks: Block[] = []
  let metadata: DetectedMetadata = {}

  if (text.length > 5 * 1024 * 1024) {
    errors.push({ field: 'file', message: 'File exceeds 5 MB limit' })
    return { detectedMetadata: {}, previewBlocks: [], errors, rawSource: '' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    errors.push({ field: 'file', message: 'Invalid JSON — could not parse file' })
    return { detectedMetadata: {}, previewBlocks: [], errors, rawSource: text.slice(0, 50_000) }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    errors.push({ field: 'file', message: 'JSON must be an object at the top level' })
    return { detectedMetadata: {}, previewBlocks: [], errors, rawSource: text.slice(0, 50_000) }
  }

  const obj = parsed as Record<string, unknown>

  // ── Try full backup format (has builds array) ──────────────────────────────
  if (Array.isArray(obj.builds)) {
    try {
      const migrated = runMigrations(
        { schemaVersion: (obj.schemaVersion as number) ?? 0, builds: obj.builds as Record<string, unknown>[], chains: (obj.chains as Record<string, unknown>[]) ?? [] },
        ANONYMOUS_OWNER,
        ANONYMOUS_WORKSPACE,
      )
      metadata = { title: `Backup — ${migrated.builds.length} build(s)` }
      for (const build of migrated.builds.slice(0, 3)) {
        const b = build as Record<string, unknown>
        blocks.push(...jsonToBlocks(b, buildId_))
      }
    } catch (e) {
      errors.push({ field: 'builds', message: `Migration error: ${String(e)}` })
    }
    return { detectedMetadata: metadata, previewBlocks: blocks, errors, rawSource: text.slice(0, 50_000) }
  }

  // ── Try single build ───────────────────────────────────────────────────────
  const buildResult = buildSchema.safeParse({ ...obj, schemaVersion: 1, ownerId: ANONYMOUS_OWNER, workspaceId: ANONYMOUS_WORKSPACE, id: generateUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null })
  if (buildResult.success) {
    metadata = detectFromJson(obj)
    blocks.push(...jsonToBlocks(obj, buildId_))
    return { detectedMetadata: metadata, previewBlocks: blocks, errors, rawSource: text.slice(0, 50_000) }
  }

  // ── Try single chain rack ──────────────────────────────────────────────────
  const chainResult = chainRackSchema.safeParse({ ...obj, schemaVersion: 1, ownerId: ANONYMOUS_OWNER, workspaceId: ANONYMOUS_WORKSPACE, id: generateUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null })
  if (chainResult.success) {
    metadata = { title: chainResult.data.name, genre: chainResult.data.genre, tags: chainResult.data.tags }
    blocks.push({
      type:    'rack',
      id:      previewId(),
      buildId: buildId_,
      stageKey: 'chains',
      order:   0,
      locked:  false,
      data: {
        rackName: chainResult.data.name,
        role:     chainResult.data.role,
        devices:  chainResult.data.devices.map(d => ({ name: d.name, enabled: d.enabled, settings: d.settings, purpose: d.purpose, warnings: d.warnings })),
        gainNotes:  chainResult.data.gainNotes,
        monoSafety: chainResult.data.monoSafety,
      },
    })
    return { detectedMetadata: metadata, previewBlocks: blocks, errors, rawSource: text.slice(0, 50_000) }
  }

  // ── Try MIDI pattern ───────────────────────────────────────────────────────
  const midiResult = midiPatternSchema.safeParse({ ...obj, schemaVersion: 1, ownerId: ANONYMOUS_OWNER, workspaceId: ANONYMOUS_WORKSPACE, id: generateUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null })
  if (midiResult.success) {
    metadata = { title: midiResult.data.name, genre: midiResult.data.genre, bpm: midiResult.data.bpm ?? undefined }
    blocks.push(...jsonToBlocks(obj, buildId_))
    return { detectedMetadata: metadata, previewBlocks: blocks, errors, rawSource: text.slice(0, 50_000) }
  }

  // ── Unknown JSON shape — import as generic cards ───────────────────────────
  errors.push({ field: 'schema', message: 'JSON did not match a known record type — importing as generic data' })
  metadata = detectFromJson(obj)
  blocks.push(...jsonToBlocks(obj, buildId_))
  blocks.push({
    type:    'source',
    id:      previewId(),
    buildId: buildId_,
    stageKey: 'source',
    order:   0,
    locked:  true,
    data:    { originalFileName: escapeText(fileName.slice(0, 255)), content: text.slice(0, 50_000) },
  })

  return { detectedMetadata: metadata, previewBlocks: blocks, errors, rawSource: text.slice(0, 50_000) }
}

export const jsonImporter = { parse: parseJson, parserVersion: PARSER_VERSION }
