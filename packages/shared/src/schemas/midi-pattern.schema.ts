import { z } from 'zod'
import { baseRecordSchema } from './base.schema'

export const noteEventSchema = z.object({
  pitch:    z.number().int().min(0).max(127),
  velocity: z.number().int().min(0).max(127),
  startTick: z.number().int().nonnegative(),
  durationTicks: z.number().int().positive(),
  channel:  z.number().int().min(0).max(15).default(0),
})

export const clipVariationSchema = z.object({
  name:       z.string(),
  noteEvents: z.array(noteEventSchema),
  notes:      z.string().optional(),
})

export const midiPatternSchema = baseRecordSchema.extend({
  schemaVersion:  z.literal(1),
  name:           z.string().min(1).max(200),
  type:           z.enum(['drum', 'bass', 'chord', 'melody', 'perc', 'other']).default('drum'),
  genre:          z.string().max(50).default(''),
  bpm:            z.number().positive().max(300).nullable().optional(),
  key:            z.string().max(10).nullable().optional(),
  scale:          z.string().max(50).optional(),
  root:           z.string().max(5).optional(),
  bars:           z.number().int().positive().default(1),
  grid:           z.number().int().positive().default(16),
  swing:          z.number().min(0).max(100).default(0),
  ppq:            z.number().int().positive().default(96),
  noteEvents:     z.array(noteEventSchema).default([]),
  clipVariations: z.array(clipVariationSchema).default([]),
  placement:      z.string().default(''),   // arrangement placement notes
  tags:           z.array(z.string()).default([]),
})

export type MidiPattern    = z.infer<typeof midiPatternSchema>
export type NoteEvent      = z.infer<typeof noteEventSchema>
export type ClipVariation  = z.infer<typeof clipVariationSchema>
