import { db } from './localDb'
import type {
  Build,
  BuildStage,
  Block,
  ChainRack,
  MidiPattern,
  Sample,
  Preset,
  Groove,
  Arrangement,
} from '@codex/shared'

// ─── Backup payload ───────────────────────────────────────────────────────

export interface BackupPayload {
  version: 1
  exportedAt: string
  workspaceId: string
  builds:       Build[]
  buildStages:  BuildStage[]
  blocks:       Block[]
  chainRacks:   ChainRack[]
  midiPatterns: MidiPattern[]
  samples:      Sample[]
  presets:      Preset[]
  grooves:      Groove[]
  arrangements: Arrangement[]
}

// ─── Export ───────────────────────────────────────────────────────────────

export async function exportBackup(workspaceId: string): Promise<BackupPayload> {
  const [builds, chainRacks, midiPatterns, samples, presets, grooves, arrangements] =
    await Promise.all([
      db.builds.where('workspaceId').equals(workspaceId).toArray(),
      db.chainRacks.where('workspaceId').equals(workspaceId).toArray(),
      db.midiPatterns.where('workspaceId').equals(workspaceId).toArray(),
      db.samples.where('workspaceId').equals(workspaceId).toArray(),
      db.presets.where('workspaceId').equals(workspaceId).toArray(),
      db.grooves.where('workspaceId').equals(workspaceId).toArray(),
      db.arrangements.where('workspaceId').equals(workspaceId).toArray(),
    ])

  const buildIds = builds.map(b => b.id)
  const [buildStages, blocks] = buildIds.length > 0
    ? await Promise.all([
        db.buildStages.where('buildId').anyOf(buildIds).toArray(),
        db.blocks.where('buildId').anyOf(buildIds).toArray(),
      ])
    : [[], []]

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    workspaceId,
    builds,
    buildStages,
    blocks: blocks as Block[],
    chainRacks,
    midiPatterns,
    samples,
    presets,
    grooves,
    arrangements,
  }
}

export function downloadBackup(payload: BackupPayload): void {
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = payload.exportedAt.slice(0, 10)
  a.download = `codex-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Import ───────────────────────────────────────────────────────────────

export interface ImportResult {
  imported: number
  skipped:  string[]
}

export async function importBackup(payload: BackupPayload): Promise<ImportResult> {
  const skipped: string[] = []
  let imported = 0

  if (payload.version !== 1) {
    throw new Error(`Unsupported backup version: ${payload.version}`)
  }

  await db.transaction(
    'rw',
    [db.builds, db.buildStages, db.blocks, db.chainRacks, db.midiPatterns,
      db.samples, db.presets, db.grooves, db.arrangements],
    async () => {
      const put = async (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        table: { bulkPut: (items: any[]) => Promise<unknown> },
        records: unknown[],
      ) => {
        if (!records || records.length === 0) return
        await table.bulkPut(records as any[])
        imported += records.length
      }

      await put(db.builds,       payload.builds)
      await put(db.buildStages,  payload.buildStages)
      await put(db.blocks,       payload.blocks)
      await put(db.chainRacks,   payload.chainRacks)
      await put(db.midiPatterns, payload.midiPatterns)
      await put(db.samples,      payload.samples)
      await put(db.presets,      payload.presets)
      await put(db.grooves,      payload.grooves)
      await put(db.arrangements, payload.arrangements)
    },
  )

  return { imported, skipped }
}

// ─── Validation ───────────────────────────────────────────────────────────

export function validateBackupPayload(raw: unknown): BackupPayload {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Backup file is not a valid JSON object')
  }
  const obj = raw as Record<string, unknown>
  if (obj.version !== 1) {
    throw new Error(`Unrecognised backup version: ${obj.version}`)
  }
  if (typeof obj.workspaceId !== 'string') {
    throw new Error('Backup is missing workspaceId')
  }
  const requiredArrays = [
    'builds', 'buildStages', 'blocks', 'chainRacks',
    'midiPatterns', 'samples', 'presets', 'grooves', 'arrangements',
  ]
  for (const key of requiredArrays) {
    if (!Array.isArray(obj[key])) {
      throw new Error(`Backup is missing required array: ${key}`)
    }
  }
  return obj as unknown as BackupPayload
}

export async function importBackupFromFile(file: File): Promise<ImportResult> {
  const text = await file.text()
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('File is not valid JSON')
  }
  const payload = validateBackupPayload(raw)
  return importBackup(payload)
}
