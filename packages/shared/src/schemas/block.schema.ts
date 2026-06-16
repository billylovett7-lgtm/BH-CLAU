import { z } from 'zod'

const blockBase = z.object({
  id:            z.string().uuid(),
  buildId:       z.string().uuid(),
  stageKey:      z.string(),
  order:         z.number().int().nonnegative(),
  title:         z.string().optional(),
  locked:        z.boolean().default(false),
  sourceImportId: z.string().uuid().nullable().optional(),
})

// --- 11 block types ---

export const textBlockSchema = blockBase.extend({
  type: z.literal('text'),
  data: z.object({
    content: z.string(),  // safe sanitized rich text or plain text
  }),
})

export const cardsBlockSchema = blockBase.extend({
  type: z.literal('cards'),
  data: z.object({
    cards: z.array(z.object({
      label:       z.string(),
      value:       z.string(),
      variant:     z.enum(['default', 'warning', 'success', 'danger']).default('default'),
    })),
  }),
})

export const tableBlockSchema = blockBase.extend({
  type: z.literal('table'),
  data: z.object({
    headers: z.array(z.string()),
    rows:    z.array(z.array(z.string())),
  }),
})

export const checklistBlockSchema = blockBase.extend({
  type: z.literal('checklist'),
  data: z.object({
    items: z.array(z.object({
      id:        z.string().uuid(),
      text:      z.string(),
      completed: z.boolean().default(false),
      priority:  z.enum(['high', 'medium', 'low']).default('medium'),
      stage:     z.string().optional(),
    })),
  }),
})

export const timelineBlockSchema = blockBase.extend({
  type: z.literal('timeline'),
  data: z.object({
    sections: z.array(z.object({
      label:      z.string(),
      startBar:   z.number().int(),
      endBar:     z.number().int(),
      energy:     z.enum(['low', 'build', 'peak', 'drop', 'breakdown']).optional(),
      notes:      z.string().optional(),
      fxEvents:   z.array(z.string()).default([]),
    })),
  }),
})

export const rackBlockSchema = blockBase.extend({
  type: z.literal('rack'),
  data: z.object({
    rackName:    z.string(),
    role:        z.string().optional(),
    devices: z.array(z.object({
      name:     z.string(),
      enabled:  z.boolean().default(true),
      settings: z.string().optional(),
      purpose:  z.string().optional(),
      warnings: z.array(z.string()).default([]),
    })),
    gainNotes:   z.string().optional(),
    monoSafety:  z.boolean().optional(),
  }),
})

export const midiGridBlockSchema = blockBase.extend({
  type: z.literal('midiGrid'),
  data: z.object({
    gridType:   z.enum(['drum', 'instrument']).default('drum'),
    bars:       z.number().int().positive().default(1),
    grid:       z.number().int().positive().default(16),
    swing:      z.number().min(0).max(100).default(0),
    lanes: z.array(z.object({
      name:   z.string(),
      steps:  z.array(z.object({
        active:   z.boolean(),
        velocity: z.number().int().min(0).max(127).default(100),
        offset:   z.number().default(0),
      })),
      note:   z.number().int().min(0).max(127).optional(),
    })),
  }),
})

export const sampleCardBlockSchema = blockBase.extend({
  type: z.literal('sampleCard'),
  data: z.object({
    sampleId:  z.string().uuid().optional(),
    name:      z.string(),
    role:      z.string().optional(),
    notes:     z.string().optional(),
    assetId:   z.string().uuid().nullable().optional(),
  }),
})

export const presetCardBlockSchema = blockBase.extend({
  type: z.literal('presetCard'),
  data: z.object({
    presetId:  z.string().uuid().optional(),
    name:      z.string(),
    synth:     z.string().optional(),
    macros:    z.array(z.object({ name: z.string(), value: z.string() })).default([]),
    notes:     z.string().optional(),
  }),
})

export const meterBlockSchema = blockBase.extend({
  type: z.literal('meter'),
  data: z.object({
    label:   z.string(),
    value:   z.number(),
    min:     z.number().default(0),
    max:     z.number().default(100),
    unit:    z.string().optional(),
    variant: z.enum(['progress', 'loudness', 'gain', 'qa']).default('progress'),
  }),
})

export const sourceBlockSchema = blockBase.extend({
  type: z.literal('source'),
  data: z.object({
    originalFileName: z.string(),
    content:          z.string(),  // escaped plain text — never rendered as HTML
    importJobId:      z.string().uuid().optional(),
  }),
})

// --- Discriminated union ---

export const blockSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  cardsBlockSchema,
  tableBlockSchema,
  checklistBlockSchema,
  timelineBlockSchema,
  rackBlockSchema,
  midiGridBlockSchema,
  sampleCardBlockSchema,
  presetCardBlockSchema,
  meterBlockSchema,
  sourceBlockSchema,
])

export type Block          = z.infer<typeof blockSchema>
export type TextBlock      = z.infer<typeof textBlockSchema>
export type CardsBlock     = z.infer<typeof cardsBlockSchema>
export type TableBlock     = z.infer<typeof tableBlockSchema>
export type ChecklistBlock = z.infer<typeof checklistBlockSchema>
export type TimelineBlock  = z.infer<typeof timelineBlockSchema>
export type RackBlock      = z.infer<typeof rackBlockSchema>
export type MidiGridBlock  = z.infer<typeof midiGridBlockSchema>
export type SampleCardBlock  = z.infer<typeof sampleCardBlockSchema>
export type PresetCardBlock  = z.infer<typeof presetCardBlockSchema>
export type MeterBlock     = z.infer<typeof meterBlockSchema>
export type SourceBlock    = z.infer<typeof sourceBlockSchema>
export type BlockType      = Block['type']
