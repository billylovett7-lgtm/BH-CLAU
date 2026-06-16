import { z } from 'zod'
import { baseRecordSchema } from './base.schema'

export const sampleSchema = baseRecordSchema.extend({
  schemaVersion: z.literal(1),
  assetId:       z.string().uuid().nullable().optional(),
  name:          z.string().min(1).max(200),
  type:          z.enum(['kick', 'snare', 'hat', 'loop', 'one-shot', 'vocal', 'fx', 'other']).default('other'),
  genre:         z.string().max(50).default(''),
  root:          z.string().max(5).nullable().optional(),
  key:           z.string().max(10).nullable().optional(),
  bpm:           z.number().positive().max(300).nullable().optional(),
  duration:      z.number().nonnegative().nullable().optional(),   // seconds
  channels:      z.number().int().positive().nullable().optional(),
  sampleRate:    z.number().int().positive().nullable().optional(),
  bitDepth:      z.number().int().positive().nullable().optional(),
  format:        z.string().max(10).default(''),
  role:          z.string().max(100).default(''),
  tags:          z.array(z.string()).default([]),
  notes:         z.string().default(''),
  localOnly:     z.boolean().default(true),  // audio stays local unless explicitly shared
})

export type Sample = z.infer<typeof sampleSchema>
