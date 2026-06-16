import { z } from 'zod'
import { baseRecordSchema } from './base.schema'

export const arrangementSectionSchema = z.object({
  name:       z.string(),
  startBar:   z.number().int().nonnegative(),
  endBar:     z.number().int().positive(),
  energy:     z.enum(['low', 'build', 'peak', 'drop', 'breakdown', 'outro']).optional(),
  elements:   z.array(z.string()).default([]),  // what's playing in this section
  notes:      z.string().optional(),
})

export const arrangementSchema = baseRecordSchema.extend({
  schemaVersion: z.literal(1),
  name:          z.string().min(1).max(200),
  genre:         z.string().max(50).default(''),
  bars:          z.number().int().positive().default(128),
  phraseSize:    z.number().int().positive().default(8),
  sections:      z.array(arrangementSectionSchema).default([]),
  energyPlan:    z.string().default(''),
  hookStrategy:  z.string().default(''),
  mixIn:         z.string().default(''),   // DJ blend-in guidance
  mixOut:        z.string().default(''),   // DJ blend-out guidance
  notes:         z.string().default(''),
})

export type Arrangement        = z.infer<typeof arrangementSchema>
export type ArrangementSection = z.infer<typeof arrangementSectionSchema>
