// HTML importer — NO DOM dependency, safe for Web Workers
// Strategy: parse HTML as a string, strip dangerous content,
// extract structured data, convert to safe blocks. Never innerHTML.

import type { ImportResult, DetectedMetadata } from './types'
import type { Block } from '../schemas/block.schema'
import { detectBpm, detectKey, detectRoot, detectGenre, extractTags, stripHtmlTags, escapeText, generateUUID } from './utils'
import { PARSER_VERSION } from './types'

// ── Security: tags and attributes to strip ───────────────────────────────────

const DANGEROUS_TAG_RE = /<(script|style|iframe|frame|object|embed|form|input|button|select|textarea|link|meta|base|applet|xml|svg)[^>]*>[\s\S]*?<\/\1>|<(script|style|iframe|frame|object|embed|form|input|link|meta|base|applet|xml)[^>]*\/?>/gi

const DANGEROUS_ATTR_RE = /\s(on\w+|srcdoc|formaction|action|xlink:href)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi

const DANGEROUS_HREF_RE = /(href|src|data)\s*=\s*"(javascript:|data:|vbscript:|blob:)[^"]*"/gi

function sanitizeHtml(html: string): string {
  return html
    .replace(DANGEROUS_TAG_RE, '')
    .replace(DANGEROUS_ATTR_RE, '')
    .replace(DANGEROUS_HREF_RE, '$1="#"')
    .replace(/<!--[\s\S]*?-->/g, '')  // strip comments
}

// ── Structure extraction ──────────────────────────────────────────────────────

interface HtmlSection {
  heading: string
  level:   number
  content: string
}

function extractSections(html: string): HtmlSection[] {
  const sections: HtmlSection[] = []
  const headingRe = /<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi
  let lastIndex = 0
  let lastHeading: { text: string; level: number } | null = null
  let match: RegExpExecArray | null

  while ((match = headingRe.exec(html)) !== null) {
    if (lastHeading) {
      const content = stripHtmlTags(html.slice(lastIndex, match.index)).trim()
      sections.push({ heading: lastHeading.text, level: lastHeading.level, content })
    }
    lastHeading = { text: stripHtmlTags(match[2]).trim(), level: parseInt(match[1], 10) }
    lastIndex = match.index + match[0].length
  }
  if (lastHeading) {
    const content = stripHtmlTags(html.slice(lastIndex)).trim()
    sections.push({ heading: lastHeading.text, level: lastHeading.level, content })
  }
  return sections
}

interface HtmlTable {
  headers: string[]
  rows:    string[][]
}

function extractTables(html: string): HtmlTable[] {
  const tables: HtmlTable[] = []
  const tableRe = /<table[^>]*>([\s\S]*?)<\/table>/gi
  const rowRe   = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  const cellRe  = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi

  let tableMatch: RegExpExecArray | null
  while ((tableMatch = tableRe.exec(html)) !== null) {
    const rows: string[][] = []
    let rowMatch: RegExpExecArray | null
    rowRe.lastIndex = 0
    while ((rowMatch = rowRe.exec(tableMatch[1])) !== null) {
      const cells: string[] = []
      let cellMatch: RegExpExecArray | null
      cellRe.lastIndex = 0
      while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
        cells.push(stripHtmlTags(cellMatch[1]).trim())
      }
      if (cells.length) rows.push(cells)
    }
    if (rows.length >= 2) {
      tables.push({ headers: rows[0], rows: rows.slice(1) })
    }
  }
  return tables
}

function extractLists(html: string): string[][] {
  const lists: string[][] = []
  const listRe = /<[uo]l[^>]*>([\s\S]*?)<\/[uo]l>/gi
  const itemRe = /<li[^>]*>([\s\S]*?)<\/li>/gi

  let listMatch: RegExpExecArray | null
  while ((listMatch = listRe.exec(html)) !== null) {
    const items: string[] = []
    let itemMatch: RegExpExecArray | null
    itemRe.lastIndex = 0
    while ((itemMatch = itemRe.exec(listMatch[1])) !== null) {
      const text = stripHtmlTags(itemMatch[1]).trim()
      if (text) items.push(text)
    }
    if (items.length) lists.push(items)
  }
  return lists
}

// ── Metadata detection ────────────────────────────────────────────────────────

function extractTitle(html: string): string | undefined {
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (titleTag) return stripHtmlTags(titleTag[1]).trim()
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1) return stripHtmlTags(h1[1]).trim()
  return undefined
}

// ── Block builders ────────────────────────────────────────────────────────────

function buildId(): string { return generateUUID() }

function sectionToBlock(section: HtmlSection, buildId_: string, stageKey: string, order: number): Block {
  const text = escapeText(section.content.slice(0, 4000))
  return {
    type:    'text',
    id:      buildId(),
    buildId: buildId_,
    stageKey,
    order,
    title:   escapeText(section.heading.slice(0, 200)),
    locked:  false,
    data:    { content: text },
  }
}

function tableToBlock(table: HtmlTable, buildId_: string, stageKey: string, order: number): Block {
  return {
    type:    'table',
    id:      buildId(),
    buildId: buildId_,
    stageKey,
    order,
    locked:  false,
    data: {
      headers: table.headers.map(h => escapeText(h.slice(0, 100))),
      rows:    table.rows.map(r => r.map(c => escapeText(c.slice(0, 200)))),
    },
  }
}

function listToChecklist(items: string[], buildId_: string, stageKey: string, order: number): Block {
  return {
    type:    'checklist',
    id:      buildId(),
    buildId: buildId_,
    stageKey,
    order,
    locked:  false,
    data: {
      items: items.slice(0, 50).map(text => ({
        id:        generateUUID(),
        text:      escapeText(text.slice(0, 300)),
        completed: false,
        priority:  'medium' as const,
      })),
    },
  }
}

function sourceBlock(rawText: string, fileName: string, buildId_: string): Block {
  return {
    type:    'source',
    id:      buildId(),
    buildId: buildId_,
    stageKey: 'source',
    order:   0,
    locked:  true,
    data: {
      originalFileName: escapeText(fileName.slice(0, 255)),
      content:          rawText.slice(0, 50_000),
    },
  }
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseHtml(
  html:     string,
  fileName: string,
  buildId_: string = 'preview',
): ImportResult {
  const errors: ImportResult['errors'] = []

  if (html.length > 5 * 1024 * 1024) {
    errors.push({ field: 'file', message: 'File exceeds 5 MB limit' })
    return { detectedMetadata: {}, previewBlocks: [], errors, rawSource: '' }
  }

  const safe = sanitizeHtml(html)
  const plainText = stripHtmlTags(safe)

  const metadata: DetectedMetadata = {
    title: extractTitle(safe),
    bpm:   detectBpm(plainText),
    key:   detectKey(plainText),
    root:  detectRoot(plainText),
    genre: detectGenre(plainText),
    tags:  extractTags(plainText),
  }

  const sections = extractSections(safe)
  const tables   = extractTables(safe)
  const lists    = extractLists(safe)

  const blocks: Block[] = []
  let order = 0

  // Sections → text blocks (up to 20)
  for (const section of sections.slice(0, 20)) {
    if (section.content.length > 10) {
      blocks.push(sectionToBlock(section, buildId_, 'overview', order++))
    }
  }

  // Tables → table blocks (up to 10)
  for (const table of tables.slice(0, 10)) {
    blocks.push(tableToBlock(table, buildId_, 'overview', order++))
  }

  // Lists → checklist blocks (up to 5)
  for (const list of lists.slice(0, 5)) {
    blocks.push(listToChecklist(list, buildId_, 'overview', order++))
  }

  // If no sections found, fall back to full plain text block
  if (blocks.length === 0 && plainText.length > 0) {
    blocks.push({
      type:    'text',
      id:      buildId(),
      buildId: buildId_,
      stageKey: 'overview',
      order:   0,
      locked:  false,
      data:    { content: escapeText(plainText.slice(0, 8000)) },
    })
  }

  // Always add source block with escaped original
  blocks.push(sourceBlock(plainText.slice(0, 50_000), fileName, buildId_))

  return {
    detectedMetadata: metadata,
    previewBlocks:    blocks,
    errors,
    rawSource:        plainText.slice(0, 50_000),
  }
}

export const htmlImporter = { parse: parseHtml, parserVersion: PARSER_VERSION }
