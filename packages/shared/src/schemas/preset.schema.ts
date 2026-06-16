import { z } from 'zod'
import { baseRecordSchema } from './base.schema'

export const presetSchema = baseRecordSchema.extend({
  schemaVersion: z.literal(1),
  assetId:       z.string().uuid().nullable().optional(),
  name:          z.string().min(1).max(200),
  synth:         z.string().max(50).default('Serum'),
  type:          z.enum(['bass', 'lead', 'pad', 'pluck', 'chord', 'fx', 'drum', 'other']).default('other'),
  genre:         z.string().max(50).default(''),
  version:       z.string().max(20).default(''),
  macros: z.array(z.object({
    num:   z.number().int().min(1).max(8),
    name:  z.string(),
    notes: z.string().optional(),
  })).default([]),
  oscillators:   z.string().default(''),   // free-text osc notes
  filter:        z.string().default(''),
  envelopes:     z.string().default(''),
  modulation:    z.string().default(''),
  effects:       z.string().default(''),
  tags:          z.array(z.string()).default([]),
})

export type Preset = z.infer<typeof presetSchema>
