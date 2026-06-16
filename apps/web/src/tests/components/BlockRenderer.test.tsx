import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BlockRenderer } from '@/components/blocks'
import type { Block } from '@codex/shared'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeBlock(type: string, data: Record<string, unknown>): Block {
  return {
    id:       'test-block-id',
    buildId:  'test-build-id',
    stageKey: 'overview',
    order:    1,
    locked:   false,
    type,
    data,
  } as Block
}

// ─── Security: no innerHTML ───────────────────────────────────────────────────

describe('BlockRenderer — XSS prevention', () => {
  it('TextBlock: renders content as text, not HTML', () => {
    const xss = '<img src="x" onerror="window.__xss=true"/>'
    const block = makeBlock('text', { content: xss })
    const { container } = render(<BlockRenderer block={block} />)

    // The raw HTML should NOT be injected — the img tag should not exist as DOM
    expect(container.querySelector('img')).toBeNull()
    // The evil string should appear as escaped text only
    expect(container.textContent).toContain('<img')
    // The global should not have been set
    expect((window as unknown as Record<string, unknown>)['__xss']).toBeUndefined()
  })

  it('TextBlock: script tag is never executed', () => {
    const xss = '<script>window.__scriptRan=true</script>'
    const block = makeBlock('text', { content: xss })
    render(<BlockRenderer block={block} />)
    expect((window as unknown as Record<string, unknown>)['__scriptRan']).toBeUndefined()
  })

  it('SourceBlock: renders escaped plain text, no DOM injection', () => {
    const xss = '<img src=x onerror="window.__srcXss=true" />'
    const block = makeBlock('source', { content: xss })
    const { container } = render(<BlockRenderer block={block} />)

    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('<img')
    expect((window as unknown as Record<string, unknown>)['__srcXss']).toBeUndefined()
  })

  it('CardsBlock: card values are text, not HTML', () => {
    const xss = '<b>bold</b><script>evil()</script>'
    const block = makeBlock('cards', {
      cards: [{ label: 'Test', value: xss, variant: 'default' }],
    })
    const { container } = render(<BlockRenderer block={block} />)
    expect(container.querySelector('b')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
  })

  it('ChecklistBlock: item titles are text, not HTML', () => {
    const xss = '<script>window.__checkXss=true</script>Buy milk'
    const block = makeBlock('checklist', {
      items: [{ id: '1', title: xss, done: false, priority: 'medium' }],
    })
    render(<BlockRenderer block={block} />)
    expect((window as unknown as Record<string, unknown>)['__checkXss']).toBeUndefined()
  })
})

// ─── Render smoke tests ───────────────────────────────────────────────────────

describe('BlockRenderer — render smoke tests', () => {
  it('renders TextBlock without crashing', () => {
    const block = makeBlock('text', { content: 'Hello world' })
    expect(() => render(<BlockRenderer block={block} />)).not.toThrow()
  })

  it('renders CardsBlock without crashing', () => {
    const block = makeBlock('cards', {
      cards: [{ label: 'BPM', value: '126', variant: 'default' }],
    })
    expect(() => render(<BlockRenderer block={block} />)).not.toThrow()
  })

  it('renders TableBlock without crashing', () => {
    const block = makeBlock('table', {
      headers: ['Col A', 'Col B'],
      rows: [['val1', 'val2']],
    })
    expect(() => render(<BlockRenderer block={block} />)).not.toThrow()
  })

  it('renders ChecklistBlock without crashing', () => {
    const block = makeBlock('checklist', {
      items: [
        { id: '1', title: 'Task 1', done: true,  priority: 'high'   },
        { id: '2', title: 'Task 2', done: false, priority: 'medium' },
      ],
    })
    expect(() => render(<BlockRenderer block={block} />)).not.toThrow()
  })

  it('renders MeterBlock without crashing', () => {
    const block = makeBlock('meter', {
      label: 'LUFS', value: -14, min: -24, max: 0, unit: 'dBFS',
    })
    expect(() => render(<BlockRenderer block={block} />)).not.toThrow()
  })

  it('renders SourceBlock without crashing', () => {
    const block = makeBlock('source', { content: 'const x = 1;' })
    expect(() => render(<BlockRenderer block={block} />)).not.toThrow()
  })

  it('renders MidiGridBlock without crashing', () => {
    const block = makeBlock('midi-grid', {
      lanes: [
        { name: 'Kick', steps: Array.from({ length: 16 }, (_, i) => ({ active: i % 4 === 0, velocity: 100 })) },
      ],
    })
    expect(() => render(<BlockRenderer block={block} />)).not.toThrow()
  })

  it('renders TimelineBlock without crashing', () => {
    const block = makeBlock('timeline', {
      sections: [
        { name: 'Intro', startBar: 0, endBar: 32, energy: 'low', fxEvents: [] },
      ],
    })
    expect(() => render(<BlockRenderer block={block} />)).not.toThrow()
  })
})

// ─── MeterBlock: aria attributes ─────────────────────────────────────────────

describe('MeterBlock — accessibility', () => {
  it('has role="progressbar"', () => {
    const block = makeBlock('meter', {
      label: 'Level', value: 50, min: 0, max: 100, unit: '%',
    })
    const { container } = render(<BlockRenderer block={block} />)
    const meter = container.querySelector('[role="progressbar"]')
    expect(meter).not.toBeNull()
  })

  it('has correct aria-valuenow', () => {
    const block = makeBlock('meter', {
      label: 'Level', value: 75, min: 0, max: 100, unit: '%',
    })
    const { container } = render(<BlockRenderer block={block} />)
    const meter = container.querySelector('[role="progressbar"]')
    expect(meter?.getAttribute('aria-valuenow')).toBe('75')
  })
})
