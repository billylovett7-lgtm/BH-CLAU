import { z } from 'zod'
import { baseRecordSchema } from './base.schema'
import { deviceSchema } from './device.schema'

export const chainRackSchema = baseRecordSchema.extend({
  schemaVersion: z.literal(1),
  name:          z.string().min(1).max(200),
  role:          z.string().max(100).default(''),
  genre:         z.string().max(50).default(''),
  variant:       z.string().max(100).default(''),
  devices:       z.array(deviceSchema).default([]),
  macros:        z.array(z.object({
    num:     z.number().int().min(1).max(8),
    name:    z.string(),
    default: z.string().optional(),
    range:   z.string().optional(),
  })).default([]),
  gainNotes:     z.string().default(''),
  monoSafety:    z.boolean().default(false),
  favourite:     z.boolean().default(false),
  tags:          z.array(z.string()).default([]),
})

export type ChainRack = z.infer<typeof chainRackSchema>
