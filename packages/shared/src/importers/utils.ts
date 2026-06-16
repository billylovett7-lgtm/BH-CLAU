// Shared utilities used across all importers — no DOM dependency

export function escapeText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Detect BPM in a string: "126 BPM", "BPM: 126", "tempo: 124", "@ 128bpm"
export function detectBpm(text: string): number | undefined {
  const patterns = [
    /\b(\d{2,3})\s*bpm\b/i,
    /\bbpm[:\s]+(\d{2,3})\b/i,
    /\btempo[:\s]+(\d{2,3})\b/i,
    /[@at]\s*(\d{2,3})\s*bpm\b/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      const v = parseInt(m[1], 10)
      if (v >= 60 && v <= 250) return v
    }
  }
  return undefined
}

// Detect musical key: "Key: Am", "in A minor", "F# Major"
export function detectKey(text: string): string | undefined {
  const m = text.match(
    /\b(?:key[:\s]+)?([A-G][b#]?\s*(?:major|minor|maj|min|m))\b/i,
  )
  return m ? m[1].trim() : undefined
}

// Detect root note: "Root: C", "root note A"
export function detectRoot(text: string): string | undefined {
  const m = text.match(/\broot(?:\s*note)?[:\s]+([A-G][b#]?)\b/i)
  return m ? m[1].trim() : undefined
}

// Detect genre from known list
const GENRE_PATTERNS: [RegExp, string][] = [
  [/tech[\s-]?house/i,          'tech-house'],
  [/deep[\s-]?house/i,          'deep-house'],
  [/minimal[\s-]?(?:house|deep|tech)/i, 'minimal-house'],
  [/uk[\s-]?garage|2[\s-]?step/i, 'uk-garage'],
  [/uk[\s-]?140/i,              'uk-140'],
  [/dubstep/i,                  'deep-dubstep'],
  [/liquid[\s-]?(?:drum|dnb)/i, 'liquid-dnb'],
  [/drum[\s-]?(?:and|&|n)[\s-]?bass|dnb|d&b/i, 'liquid-dnb'],
  [/melodic[\s-]?techno/i,      'melodic-techno'],
  [/afro[\s-]?house/i,          'afro-house'],
  [/vocal[\s-]?house/i,         'vocal-house'],
  [/leftfield|bass[\s-]?music/i, 'leftfield-bass'],
]

export function detectGenre(text: string): string | undefined {
  for (const [pattern, genre] of GENRE_PATTERNS) {
    if (pattern.test(text)) return genre
  }
  return undefined
}

// Extract tags from #hashtag patterns or comma-separated tag lists
export function extractTags(text: string): string[] {
  const hashTags = [...text.matchAll(/#([a-zA-Z][a-zA-Z0-9_-]*)/g)].map(m => m[1].toLowerCase())
  return [...new Set(hashTags)].slice(0, 20)
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function generateUUID(): string {
  return crypto.randomUUID()
}
