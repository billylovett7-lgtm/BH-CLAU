import { migrateBuildV0, migrateChainRackV0 } from './v0-to-v1'

export interface BackupPayload {
  schemaVersion?: number
  exportedAt?:    string
  builds?:        Record<string, unknown>[]
  chains?:        Record<string, unknown>[]
  [key: string]:  unknown
}

export interface MigratedPayload {
  schemaVersion: number
  builds:        unknown[]
  chains:        unknown[]
}

export function runMigrations(
  backup: BackupPayload,
  ownerId: string,
  workspaceId: string,
): MigratedPayload {
  const version = backup.schemaVersion ?? 0

  if (version === 0) {
    return {
      schemaVersion: 1,
      builds: (backup.builds ?? []).map(b => migrateBuildV0(b, ownerId, workspaceId)),
      chains: (backup.chains ?? []).map(c => migrateChainRackV0(c, ownerId, workspaceId)),
    }
  }

  // Already at current version — pass through
  return {
    schemaVersion: version,
    builds:        backup.builds ?? [],
    chains:        backup.chains ?? [],
  }
}

export { migrateBuildV0, migrateChainRackV0 }
