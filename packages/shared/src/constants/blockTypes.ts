export const BLOCK_TYPES = [
  { type: 'text',        label: 'Text',          description: 'Rich text or markdown-derived content' },
  { type: 'cards',       label: 'Cards',         description: 'Diagnosis, role, warning or reference cards' },
  { type: 'table',       label: 'Table',         description: 'Arrangement tables, chain settings, gain staging' },
  { type: 'checklist',   label: 'Checklist',     description: 'Persistent task lists with priority and completion' },
  { type: 'timeline',    label: 'Timeline',      description: 'Bar/section maps with energy and FX events' },
  { type: 'rack',        label: 'Rack',          description: 'Ableton chain/rack with devices and settings' },
  { type: 'midiGrid',    label: 'MIDI Grid',     description: '16-step drum rack or instrument grid' },
  { type: 'sampleCard',  label: 'Sample Card',   description: 'Sample metadata and usage notes' },
  { type: 'presetCard',  label: 'Preset Card',   description: 'Serum preset documentation and macro notes' },
  { type: 'meter',       label: 'Meter',         description: 'Progress, loudness or gain meter' },
  { type: 'source',      label: 'Source',        description: 'Original imported source in safe read-only form' },
] as const

export type BlockTypeValue = typeof BLOCK_TYPES[number]['type']
