import { describe, it, expect } from 'vitest'
import { runMigrations } from '@codex/shared'

const ANON_OWNER = '00000000-0000-4000-8000-000000000001'
const ANON_WS    = '00000000-0000-4000-8000-000000000002'

describe('runMigrations', () => {
  it('passes through a v1 payload and keeps builds array', () => {
    const build = { title: 'My Track', status: 'in-progress' }
    const payload = { schemaVersion: 1, builds: [build], chains: [] }
    const result = runMigrations(payload, ANON_OWNER, ANON_WS)
    expect(result.schemaVersion).toBe(1)
    expect(result.builds).toHaveLength(1)
    expect((result.builds[0] as Record<string, unknown>).title).toBe('My Track')
  })

  it('migrates a v0 payload to v1', () => {
    const payload = { schemaVersion: 0, builds: [{ title: 'Old' }], chains: [] }
    const result = runMigrations(payload, ANON_OWNER, ANON_WS)
    expect(result.schemaVersion).toBe(1)
  })

  it('handles missing builds array', () => {
    expect(() => runMigrations({ schemaVersion: 1 }, ANON_OWNER, ANON_WS)).not.toThrow()
  })

  it('returns an object with schemaVersion, builds, chains', () => {
    const result = runMigrations({ schemaVersion: 1, builds: [], chains: [] }, ANON_OWNER, ANON_WS)
    expect(typeof result).toBe('object')
    expect(result).not.toBeNull()
    expect('schemaVersion' in result).toBe(true)
    expect('builds' in result).toBe(true)
    expect('chains' in result).toBe(true)
  })
})
