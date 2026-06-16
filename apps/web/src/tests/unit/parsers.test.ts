import { describe, it, expect } from 'vitest'
import { parseHtml, parseJson, parseMarkdown, parseTxt } from '@codex/shared'

// ─── HTML parser ──────────────────────────────────────────────────────────────

describe('parseHtml', () => {
  it('returns previewBlocks from HTML content', () => {
    const result = parseHtml('<h1>My Track</h1><p>Some notes about the track.</p>', 'test.html')
    expect(result).toHaveProperty('previewBlocks')
    expect(Array.isArray(result.previewBlocks)).toBe(true)
  })

  it('detects title from h1 tag', () => {
    const result = parseHtml('<h1>Deep House WIP</h1>', 'test.html')
    expect(result.detectedMetadata?.title).toContain('Deep House WIP')
  })

  it('strips script tags — XSS prevention', () => {
    const malicious = '<script>alert("xss")</script><p>Safe content</p>'
    const result = parseHtml(malicious, 'xss.html')
    // rawSource must not contain the script tag content
    expect(result.rawSource).not.toContain('alert("xss")')
    // previewBlocks must not reference the evil payload
    const blockTexts = result.previewBlocks
      .map(b => JSON.stringify(b))
      .join(' ')
    expect(blockTexts).not.toContain('alert(')
  })

  it('strips on* event attributes — XSS prevention', () => {
    const malicious = '<img src="x" onerror="evil()" /><p>text</p>'
    const result = parseHtml(malicious, 'event.html')
    const blockTexts = result.previewBlocks.map(b => JSON.stringify(b)).join(' ')
    expect(blockTexts).not.toContain('onerror')
    expect(blockTexts).not.toContain('evil()')
  })

  it('strips javascript: href — XSS prevention', () => {
    const malicious = '<a href="javascript:alert(1)">click</a>'
    const result = parseHtml(malicious, 'href.html')
    const blockTexts = result.previewBlocks.map(b => JSON.stringify(b)).join(' ')
    expect(blockTexts).not.toContain('javascript:')
  })

  it('strips iframe tags — src content not exposed', () => {
    const malicious = '<iframe src="https://evil.com"></iframe><p>text</p>'
    const result = parseHtml(malicious, 'test.html')
    const blockTexts = result.previewBlocks.map(b => JSON.stringify(b)).join(' ')
    // The dangerous src value must not appear
    expect(blockTexts).not.toContain('evil.com')
  })

  it('always returns a rawSource string', () => {
    const result = parseHtml('<p>content</p>', 'test.html')
    expect(typeof result.rawSource).toBe('string')
  })

  it('returns errors array', () => {
    const result = parseHtml('', 'empty.html')
    expect(Array.isArray(result.errors)).toBe(true)
  })
})

// ─── Markdown parser ──────────────────────────────────────────────────────────

describe('parseMarkdown', () => {
  it('parses markdown headings into blocks', () => {
    const md = '# My Track\n\nSome notes here.\n\n## Section\n\nMore content.'
    const result = parseMarkdown(md, 'notes.md')
    expect(result.previewBlocks.length).toBeGreaterThan(0)
  })

  it('detects BPM from markdown text', () => {
    const md = '# Deep House\n\nBPM: 122. Key of G minor.'
    const result = parseMarkdown(md, 'notes.md')
    expect(result.detectedMetadata?.bpm).toBe(122)
  })

  it('never produces blocks with dangerouslySetInnerHTML keys', () => {
    const md = '# Test\n\n<script>alert(1)</script>'
    const result = parseMarkdown(md, 'md-xss.md')
    const allJson = JSON.stringify(result.previewBlocks)
    expect(allJson).not.toContain('dangerouslySetInnerHTML')
    expect(allJson).not.toContain('innerHTML')
  })
})

// ─── TXT parser ───────────────────────────────────────────────────────────────

describe('parseTxt', () => {
  it('produces at least one block from plain text', () => {
    const result = parseTxt('Some plain text notes about my track.', 'notes.txt')
    expect(result.previewBlocks.length).toBeGreaterThan(0)
  })

  it('handles empty input without error', () => {
    expect(() => parseTxt('', 'empty.txt')).not.toThrow()
  })

  it('text blocks use type text or source', () => {
    const result = parseTxt('Hello world', 'test.txt')
    const validTypes = new Set(['text', 'source', 'cards', 'table', 'checklist'])
    for (const block of result.previewBlocks) {
      expect(validTypes.has(block.type)).toBe(true)
    }
  })
})

// ─── JSON parser ──────────────────────────────────────────────────────────────

describe('parseJson', () => {
  it('handles invalid JSON gracefully', () => {
    const result = parseJson('{ invalid json }', 'bad.json')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('handles valid JSON object', () => {
    const result = parseJson(JSON.stringify({ title: 'My Track', bpm: 126 }), 'track.json')
    expect(Array.isArray(result.previewBlocks)).toBe(true)
  })

  it('handles empty string', () => {
    expect(() => parseJson('', 'empty.json')).not.toThrow()
  })

  it('detects BPM from JSON field', () => {
    const result = parseJson(JSON.stringify({ bpm: 135, title: 'Test' }), 'track.json')
    expect(result.detectedMetadata?.bpm).toBe(135)
  })
})
