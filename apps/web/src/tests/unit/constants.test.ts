import { describe, it, expect } from 'vitest'
import { STAGES, STAGE_KEYS, getStage, GENRES, TEMPLATES, BLOCK_TYPES } from '@codex/shared'

describe('STAGES', () => {
  it('has exactly 11 stages', () => {
    expect(STAGES).toHaveLength(11)
  })

  it('stage orders are 1–11 without gaps', () => {
    const orders = STAGES.map(s => s.order).sort((a, b) => a - b)
    orders.forEach((o, i) => expect(o).toBe(i + 1))
  })

  it('every stage has a non-empty key and title', () => {
    for (const s of STAGES) {
      expect(s.key.length).toBeGreaterThan(0)
      expect(s.title.length).toBeGreaterThan(0)
    }
  })

  it('STAGE_KEYS has 11 entries matching STAGES', () => {
    expect(STAGE_KEYS).toHaveLength(11)
    for (const key of STAGE_KEYS) {
      expect(STAGES.map(s => s.key)).toContain(key)
    }
  })

  it('getStage returns the right stage', () => {
    const s = getStage('overview')
    expect(s?.title).toBe('Overview')
  })

  it('getStage returns undefined for unknown key', () => {
    // @ts-expect-error testing invalid key
    expect(getStage('nonexistent')).toBeUndefined()
  })
})

describe('GENRES', () => {
  it('has at least 10 genres', () => {
    expect(GENRES.length).toBeGreaterThanOrEqual(10)
  })

  it('every genre has value and label', () => {
    for (const g of GENRES) {
      expect(g.value.length).toBeGreaterThan(0)
      expect(g.label.length).toBeGreaterThan(0)
    }
  })
})

describe('TEMPLATES', () => {
  it('has at least one template', () => {
    expect(TEMPLATES.length).toBeGreaterThan(0)
  })

  it('every template has required fields', () => {
    for (const t of TEMPLATES) {
      expect(t.id).toBeTruthy()
      expect(t.title).toBeTruthy()
      expect(t.bpm).toBeGreaterThan(0)
    }
  })
})

describe('BLOCK_TYPES', () => {
  const EXPECTED_TYPES = ['text', 'cards', 'table', 'checklist', 'timeline', 'rack', 'midiGrid', 'sampleCard', 'presetCard', 'meter', 'source']

  it('contains all 11 block types', () => {
    expect(BLOCK_TYPES).toHaveLength(11)
    const typeValues = BLOCK_TYPES.map(b => b.type)
    for (const t of EXPECTED_TYPES) {
      expect(typeValues).toContain(t)
    }
  })

  it('every entry has type and label', () => {
    for (const b of BLOCK_TYPES) {
      expect(b.type.length).toBeGreaterThan(0)
      expect(b.label.length).toBeGreaterThan(0)
    }
  })
})
