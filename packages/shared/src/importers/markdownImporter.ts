// Markdown importer — line-by-line parser, no external dependencies
// Converts headings → text blocks, tables → table blocks, lists → checklist blocks

import type { ImportResult, DetectedMetadata } from './types'
import type { Block } from '../schemas/block.schema'
import { detectBpm, detectKey, detectRoot, detectGenre, extractTags, escapeText, generateUUID } from './utils'
import { PARSER_VERSION } from './types'

function newId(): string { return generateUUID() }

type LineType = 'heading' | 'table-row' | 'table-sep' | 'list-item' | 'blank' | 'text'

interface ParsedLine {
  type:    LineType
  raw:     string
  level?:  number   // for headings
  cells?:  string[] // for table rows
  text?:   string
}

function classifyLine(line: string): ParsedLine {
  const heading = line.match(/^(#{1,6})\s+(.+)/)
  if (heading) return { type: 'heading', raw: line, level: heading[1].length, text: heading[2].trim() }

  if (/^\|.*\|/.test(line)) {
    const cells = line.split('|').slice(1, -1).map(c => c.trim())
    if (cells.every(c => /^[-: ]+$/.test(c))) return { type: 'table-sep', raw: line }
    return { type: 'table-row', raw: line, cells }
  }

  const listItem = line.match(/^[\s]*[-*+]\s+(.+)/)
  if (listItem) return { type: 'list-item', raw: line, text: listItem[1].trim() }

  const orderedItem = line.match(/^[\s]*\d+\.\s+(.+)/)
  if (orderedItem) return { type: 'list-item', raw: line, text: orderedItem[1].trim() }

  if (line.trim() === '') return { type: 'blank', raw: line }

  return { type: 'text', raw: line, text: line.trim() }
}

// Strip inline markdown (bold, italic, code, links) → plain text
function stripInline(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')    // [text](url) → text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')         // images removed
    .replace(/`([^`]+)`/g, '$1')                  // `code` → code
    .replace(/\*\*([^*]+)\*\*/g, '$1')            // **bold**
    .replace(/__([^_]+)__/g, '$1')                // __bold__
    .replace(/\*([^*]+)\*/g, '$1')                // *italic*
    .replace(/_([^_]+)_/g, '$1')                  // _italic_
    .replace(/~~([^~]+)~~/g, '$1')                // ~~strike~~
    .trim()
}

// Detect YAML frontmatter block
function parseFrontmatter(lines: string[]): { meta: Record<string, string>; rest: string[] } {
  const meta: Record<string, string> = {}
  if (lines[0]?.trim() !== '---') return { meta, rest: lines }

  let end = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
  if (end === -1) return { meta, rest: lines }

  for (const line of lines.slice(1, end)) {
    const m = line.match(/^(\w+):\s*(.+)/)
    if (m) meta[m[1].toLowerCase()] = m[2].trim()
  }

  return { meta, rest: lines.slice(end + 1) }
}

export function parseMarkdown(
  text:     string,
  fileName: string,
  buildId_: string = 'preview',
): ImportResult {
  const errors: ImportResult['errors'] = []

  if (text.length > 5 * 1024 * 1024) {
    errors.push({ field: 'file', message: 'File exceeds 5 MB limit' })
    return { detectedMetadata: {}, previewBlocks: [], errors, rawSource: '' }
  }

  const allLines    = text.split(/\r?\n/)
  const { meta, rest } = parseFrontmatter(allLines)
  const lines       = rest.map(classifyLine)
  const plainText   = rest.map(l => stripInline(l)).join(' ')

  // ── Metadata ──────────────────────────────────────────────────────────────
  const title  = meta.title  ?? stripInline(lines.find(l => l.type === 'heading' && l.level === 1)?.text ?? '')
  const genre  = meta.genre  ?? detectGenre(plainText)
  const rawBpm = meta.bpm    ? parseFloat(meta.bpm) : detectBpm(plainText)
  const bpm    = rawBpm && rawBpm >= 60 && rawBpm <= 250 ? rawBpm : undefined
  const key    = meta.key    ?? detectKey(plainText)
  const root   = meta.root   ?? detectRoot(plainText)
  const tags   = meta.tags   ? meta.tags.split(',').map(t => t.trim()) : extractTags(plainText)

  const metadata: DetectedMetadata = {
    title: title || undefined,
    genre,
    bpm,
    key,
    root,
    tags,
  }

  // ── Block construction ────────────────────────────────────────────────────
  const blocks: Block[] = []
  let order = 0
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Table
    if (line.type === 'table-row') {
      const headers = line.cells ?? []
      const rows: string[][] = []
      i++
      if (lines[i]?.type === 'table-sep') i++ // skip separator
      while (i < lines.length && lines[i].type === 'table-row') {
        rows.push(lines[i].cells ?? [])
        i++
      }
      if (rows.length > 0) {
        blocks.push({
          type:    'table',
          id:      newId(),
          buildId: buildId_,
          stageKey: 'overview',
          order:   order++,
          locked:  false,
          data: {
            headers: headers.map(h => escapeText(h.slice(0, 100))),
            rows:    rows.map(r => r.map(c => escapeText(c.slice(0, 200)))),
          },
        })
      }
      continue
    }

    // List → checklist
    if (line.type === 'list-item') {
      const items: string[] = []
      while (i < lines.length && lines[i].type === 'list-item') {
        items.push(escapeText((lines[i].text ?? '').slice(0, 300)))
        i++
      }
      blocks.push({
        type:    'checklist',
        id:      newId(),
        buildId: buildId_,
        stageKey: 'overview',
        order:   order++,
        locked:  false,
        data: {
          items: items.slice(0, 50).map(t => ({
            id: generateUUID(),
            text: t,
            completed: false,
            priority: 'medium' as const,
          })),
        },
      })
      continue
    }

    // Heading + following content → text block
    if (line.type === 'heading') {
      const headingText = escapeText((line.text ?? '').slice(0, 200))
      const contentLines: string[] = []
      i++
      while (i < lines.length && lines[i].type !== 'heading') {
        if (lines[i].type !== 'blank' && lines[i].type !== 'table-row' && lines[i].type !== 'list-item') {
          contentLines.push(escapeText(stripInline(lines[i].raw).slice(0, 500)))
        } else {
          break
        }
        i++
      }
      if (contentLines.length > 0) {
        blocks.push({
          type:    'text',
          id:      newId(),
          buildId: buildId_,
          stageKey: 'overview',
          order:   order++,
          title:   headingText,
          locked:  false,
          data:    { content: contentLines.join('\n') },
        })
      }
      continue
    }

    i++
  }

  // Fallback: if no blocks, treat whole file as text
  if (blocks.length === 0 && plainText.trim().length > 0) {
    blocks.push({
      type:    'text',
      id:      newId(),
      buildId: buildId_,
      stageKey: 'overview',
      order:   0,
      locked:  false,
      data:    { content: escapeText(plainText.slice(0, 8000)) },
    })
  }

  // Source block
  blocks.push({
    type:    'source',
    id:      newId(),
    buildId: buildId_,
    stageKey: 'source',
    order:   0,
    locked:  true,
    data:    { originalFileName: escapeText(fileName.slice(0, 255)), content: text.slice(0, 50_000) },
  })

  return { detectedMetadata: metadata, previewBlocks: blocks, errors, rawSource: text.slice(0, 50_000) }
}

export const markdownImporter = { parse: parseMarkdown, parserVersion: PARSER_VERSION }
