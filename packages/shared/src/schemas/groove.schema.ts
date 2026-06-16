import { z } from 'zod'
import { baseRecordSchema } from './base.schema'

export const grooveSchema = baseRecordSchema.extend({
  schemaVersion: z.literal(1),
  name:          z.string().min(1).max(200),
  genre:         z.string().max(50).default(''),
  grid:          z.number().int().positive().default(16),
  swing:         z.number().min(0).max(100).default(0),
  timing: z.array(z.object({
    step:   z.number().int().nonnegative(),
    offset: z.number(),           // ticks offset (-50 to +50)
  })).default([]),
  random:        z.number().min(0).max(100).default(0),  // humanise amount
  velocity: z.array(z.object({
    step:     z.number().int().nonnegative(),
    velocity: z.number().int().min(0).max(127),
  })).default([]),
  targets:       z.array(z.string()).default([]),   // instruments this groove applies to
  exclude:       z.array(z.string()).default([]),   // instruments to exclude
  notes:         z.string().default(''),
})

export type Groove = z.infer<typeof grooveSchema>
