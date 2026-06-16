// Migrates prototype ZIP export format → schemaVersion 1
// The prototype stored data in localStorage as raw JS objects with no versioning.

import { buildSchema } from '../schemas/build.schema'
import { chainRackSchema } from '../schemas/chain-rack.schema'
import type { Build } from '../schemas/build.schema'
import type { ChainRack } from '../schemas/chain-rack.schema'

function toISOString(val: unknown): string {
  if (typeof val === 'string' && val) {
    try { return new Date(val).toISOString() } catch { /* fall through */ }
  }
  return new Date().toISOString()
}

function toUUID(val: unknown): string {
  if (typeof val === 'string' && val.match(/^[0-9a-f-]{36}$/i)) return val
  return crypto.randomUUID()
}

export function migrateBuildV0(raw: Record<string, unknown>, ownerId: string, workspaceId: string): Build {
  const now = new Date().toISOString()
  return buildSchema.parse({
    id:            toUUID(raw.id),
    ownerId,
    workspaceId,
    schemaVersion: 1,
    createdAt:     toISOString(raw.createdAt ?? raw.created),
    updatedAt:     toISOString(raw.updatedAt ?? raw.updated ?? now),
    deletedAt:     null,
    title:         String(raw.title ?? raw.name ?? 'Untitled Build'),
    genre:         String(raw.genre ?? ''),
    subgenre:      String(raw.subgenre ?? ''),
    bpm:           raw.bpm != null ? Number(raw.bpm) : null,
    key:           raw.key != null ? String(raw.key) : null,
    root:          raw.root != null ? String(raw.root) : null,
    status:        'in-progress',
    priority:      'medium',
    dueDate:       null,
    favourite:     Boolean(raw.favourite ?? raw.starred ?? false),
    archived:      Boolean(raw.archived ?? false),
    tags:          Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    progress:      typeof raw.progress === 'number' ? raw.progress : 0,
    currentStage:  String(raw.currentStage ?? raw.stage ?? 'overview'),
    sourceSummary: String(raw.sourceSummary ?? raw.summary ?? ''),
    notes:         String(raw.notes ?? ''),
  })
}

export function migrateChainRackV0(raw: Record<string, unknown>, ownerId: string, workspaceId: string): ChainRack {
  const now = new Date().toISOString()
  return chainRackSchema.parse({
    id:            toUUID(raw.id),
    ownerId,
    workspaceId,
    schemaVersion: 1,
    createdAt:     toISOString(raw.createdAt ?? now),
    updatedAt:     toISOString(raw.updatedAt ?? now),
    deletedAt:     null,
    name:          String(raw.name ?? 'Untitled Chain'),
    role:          String(raw.role ?? ''),
    genre:         String(raw.genre ?? ''),
    variant:       String(raw.variant ?? ''),
    devices:       Array.isArray(raw.devices) ? raw.devices : [],
    macros:        Array.isArray(raw.macros) ? raw.macros : [],
    gainNotes:     String(raw.gainNotes ?? ''),
    monoSafety:    Boolean(raw.monoSafety ?? false),
    favourite:     Boolean(raw.favourite ?? false),
    tags:          Array.isArray(raw.tags) ? raw.tags.map(String) : [],
  })
}
