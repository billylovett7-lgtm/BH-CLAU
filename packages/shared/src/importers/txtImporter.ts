// TXT importer — detects metadata from key:value patterns, converts to blocks

import type { ImportResult, DetectedMetadata } from './types'
import type { Block } from '../schemas/block.schema'
import { detectBpm, detectKey, detectRoot, detectGenre, extractTags, escapeText, generateUUID } from './utils'
import { PARSER_VERSION } from './types'

function newId(): string { return generateUUID() }

// Match "Key: Value" style metadata lines at the start of the file
const META_LINE_RE = /^([A-Za-z ]{2,20})\s*[:=]\s*(.+)$/

function extractMetaBlock(lines: string[]): { meta: Record<string, string>; bodyStart: number } {
  const meta: Record<string, string> = {}
  let i = 0
  // Read up to 20 lines looking for metadata patterns
  while (i < Math.min(lines.length, 20)) {
    const line = lines[i].trim()
    if (line === '') { i++; continue }
    const m = line.match(META_LINE_RE)
    if (m) {
      meta[m[1].trim().toLowerCase()] = m[2].trim()
      i++
    } else {
      break
    }
  }
  return { meta, bodyStart: i }
}

function splitIntoParagraphs(lines: string[]): string[] {
  const paragraphs: string[] = []
  let current: string[] = []

  for (const line of lines) {
    if (line.trim() === '') {
      if (current.length) {
        paragraphs.push(current.join(' ').trim())
        current = []
      }
    } else {
      current.push(line.trim())
    }
  }
  if (current.length) paragraphs.push(current.join(' ').trim())
  return paragraphs.filter(p => p.length > 0)
}

export function parseTxt(
  text:     string,
  fileName: string,
  buildId_: string = 'preview',
): ImportResult {
  const errors: ImportResult['errors'] = []

  if (text.length > 5 * 1024 * 1024) {
    errors.push({ field: 'file', message: 'File exceeds 5 MB limit' })
    return { detectedMetadata: {}, previewBlocks: [], errors, rawSource: '' }
  }

  const lines = text.split(/\r?\n/)
  const { meta, bodyStart } = extractMetaBlock(lines)
  const bodyLines = lines.slice(bodyStart)
  const bodyText  = bodyLines.join(' ')

  // ── Metadata ──────────────────────────────────────────────────────────────
  const rawBpm = meta.bpm ? parseFloat(meta.bpm) : detectBpm(text)
  const metadata: DetectedMetadata = {
    title: meta.title   ?? meta.name   ?? meta.track  ?? undefined,
    genre: meta.genre   ?? meta.style  ?? detectGenre(text),
    bpm:   rawBpm && rawBpm >= 60 && rawBpm <= 250 ? rawBpm : undefined,
    key:   meta.key     ?? detectKey(text),
    root:  meta.root    ?? detectRoot(text),
    tags:  meta.tags
      ? meta.tags.split(',').map(t => t.trim()).filter(Boolean)
      : extractTags(text),
  }

  // ── Cards block from extracted metadata ───────────────────────────────────
  const blocks: Block[] = []
  let order = 0

  const metaCards = Object.entries(meta)
    .slice(0, 12)
    .map(([k, v]) => ({ label: escapeText(k), value: escapeText(v.slice(0, 200)), variant: 'default' as const }))

  if (metaCards.length > 0) {
    blocks.push({
      type:    'cards',
      id:      newId(),
      buildId: buildId_,
      stageKey: 'overview',
      order:   order++,
      title:   'Detected Metadata',
      locked:  false,
      data:    { cards: metaCards },
    })
  }

  // ── Body paragraphs → text blocks ────────────────────────────────────────
  const paragraphs = splitIntoParagraphs(bodyLines)

  for (const para of paragraphs.slice(0, 15)) {
    if (para.length < 10) continue
    blocks.push({
      type:    'text',
      id:      newId(),
      buildId: buildId_,
      stageKey: 'overview',
      order:   order++,
      locked:  false,
      data:    { content: escapeText(para.slice(0, 4000)) },
    })
  }

  // Fallback
  if (blocks.length === 0) {
    blocks.push({
      type:    'text',
      id:      newId(),
      buildId: buildId_,
      stageKey: 'overview',
      order:   0,
      locked:  false,
      data:    { content: escapeText(bodyText.slice(0, 8000)) },
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

export const txtImporter = { parse: parseTxt, parserVersion: PARSER_VERSION }
