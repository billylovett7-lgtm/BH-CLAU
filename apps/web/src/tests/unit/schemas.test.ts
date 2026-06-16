import { describe, it, expect } from 'vitest'
import {
  buildSchema,
  buildStageSchema,
  blockSchema,
  chainRackSchema,
  midiPatternSchema,
  sampleSchema,
  presetSchema,
  grooveSchema,
  arrangementSchema,
  importJobSchema,
  shareLinkSchema,
} from '@codex/shared'

// ─── Build schema ─────────────────────────────────────────────────────────────

describe('buildSchema', () => {
  const base = {
    id: 'aaaaaaaa-0000-4000-8000-000000000001',
    ownerId: 'aaaaaaaa-0000-4000-8000-000000000002',
    workspaceId: 'aaaaaaaa-0000-4000-8000-000000000003',
    schemaVersion: 1 as const,
    title: 'Test Build',
    genre: 'tech-house',
    subgenre: '',
    bpm: 126,
    key: 'G minor',
    root: null,
    status: 'in-progress' as const,
    priority: 'high' as const,
    dueDate: null,
    favourite: false,
    archived: false,
    tags: ['club'],
    progress: 0,
    currentStage: 'overview',
    sourceSummary: '',
    notes: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deletedAt: null,
  }

  it('accepts a valid build', () => {
    expect(() => buildSchema.parse(base)).not.toThrow()
  })

  it('rejects empty title', () => {
    expect(() => buildSchema.parse({ ...base, title: '' })).toThrow()
  })

  it('rejects invalid status', () => {
    expect(() => buildSchema.parse({ ...base, status: 'active' })).toThrow()
  })

  it('rejects progress > 100', () => {
    expect(() => buildSchema.parse({ ...base, progress: 101 })).toThrow()
  })

  it('allows null bpm', () => {
    expect(() => buildSchema.parse({ ...base, bpm: null })).not.toThrow()
  })
})

// ─── Block schema ─────────────────────────────────────────────────────────────

describe('blockSchema (text)', () => {
  const textBlock = {
    id: 'aaaaaaaa-0000-4000-8000-000000000004',
    buildId: 'aaaaaaaa-0000-4000-8000-000000000001',
    stageKey: 'overview',
    order: 1,
    locked: false,
    type: 'text',
    data: { content: 'Hello world' },
  }

  it('parses a text block', () => {
    const result = blockSchema.parse(textBlock)
    expect(result.type).toBe('text')
  })

  it('rejects unknown block type', () => {
    expect(() => blockSchema.parse({ ...textBlock, type: 'video' })).toThrow()
  })
})

describe('blockSchema (meter)', () => {
  it('accepts a valid meter block', () => {
    const meterBlock = {
      id: 'aaaaaaaa-0000-4000-8000-000000000005',
      buildId: 'aaaaaaaa-0000-4000-8000-000000000001',
      stageKey: 'mix',
      order: 1,
      locked: false,
      type: 'meter',
      data: { label: 'LUFS', value: -14, min: -24, max: 0, unit: 'dBFS' },
    }
    expect(() => blockSchema.parse(meterBlock)).not.toThrow()
  })
})

// ─── ChainRack schema ─────────────────────────────────────────────────────────

describe('chainRackSchema', () => {
  const base = {
    id: 'aaaaaaaa-0000-4000-8000-000000000010',
    ownerId: 'aaaaaaaa-0000-4000-8000-000000000002',
    workspaceId: 'aaaaaaaa-0000-4000-8000-000000000003',
    schemaVersion: 1 as const,
    name: 'Bass Rack',
    role: 'Low end',
    genre: 'tech-house',
    variant: '',
    devices: [],
    macros: [],
    gainNotes: '',
    monoSafety: true,
    favourite: false,
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deletedAt: null,
  }

  it('accepts a valid chain rack', () => {
    expect(() => chainRackSchema.parse(base)).not.toThrow()
  })

  it('rejects empty name', () => {
    expect(() => chainRackSchema.parse({ ...base, name: '' })).toThrow()
  })
})

// ─── ShareLink schema ─────────────────────────────────────────────────────────

describe('shareLinkSchema', () => {
  it('accepts a valid share link', () => {
    expect(() => shareLinkSchema.parse({
      id:         'aaaaaaaa-0000-4000-8000-000000000020',
      ownerId:    'aaaaaaaa-0000-4000-8000-000000000002',
      buildId:    'aaaaaaaa-0000-4000-8000-000000000001',
      slug:       'abc123de-wxyz',
      visibility: 'unlisted',
      expiresAt:  null,
      allowCopy:  false,
      createdAt:  '2024-01-01T00:00:00Z',
    })).not.toThrow()
  })

  it('rejects slug with uppercase', () => {
    expect(() => shareLinkSchema.parse({
      id:         'aaaaaaaa-0000-4000-8000-000000000021',
      ownerId:    'aaaaaaaa-0000-4000-8000-000000000002',
      buildId:    'aaaaaaaa-0000-4000-8000-000000000001',
      slug:       'ABC-INVALID',
      visibility: 'unlisted',
      expiresAt:  null,
      allowCopy:  false,
      createdAt:  '2024-01-01T00:00:00Z',
    })).toThrow()
  })

  it('rejects slug shorter than 8 chars', () => {
    expect(() => shareLinkSchema.parse({
      id:         'aaaaaaaa-0000-4000-8000-000000000022',
      ownerId:    'aaaaaaaa-0000-4000-8000-000000000002',
      buildId:    'aaaaaaaa-0000-4000-8000-000000000001',
      slug:       'short',
      visibility: 'unlisted',
      expiresAt:  null,
      allowCopy:  false,
      createdAt:  '2024-01-01T00:00:00Z',
    })).toThrow()
  })
})

// ─── MidiPattern schema ───────────────────────────────────────────────────────

describe('midiPatternSchema', () => {
  it('accepts valid midi pattern', () => {
    expect(() => midiPatternSchema.parse({
      id:             'aaaaaaaa-0000-4000-8000-000000000030',
      ownerId:        'aaaaaaaa-0000-4000-8000-000000000002',
      workspaceId:    'aaaaaaaa-0000-4000-8000-000000000003',
      schemaVersion:  1,
      name:           'Kick pattern',
      type:           'drum',
      genre:          '',
      bpm:            126,
      bars:           1,
      grid:           16,
      swing:          0,
      ppq:            96,
      noteEvents:     [],
      clipVariations: [],
      placement:      '',
      tags:           [],
      createdAt:      '2024-01-01T00:00:00Z',
      updatedAt:      '2024-01-01T00:00:00Z',
      deletedAt:      null,
    })).not.toThrow()
  })
})
