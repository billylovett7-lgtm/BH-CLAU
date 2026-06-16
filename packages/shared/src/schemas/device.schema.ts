import { z } from 'zod'

export const deviceSchema = z.object({
  id:            z.string().uuid(),
  rackId:        z.string().uuid(),
  order:         z.number().int().nonnegative(),
  name:          z.string().min(1).max(200),
  enabled:       z.boolean().default(true),
  deviceType:    z.enum(['effect', 'instrument', 'midi', 'rack', 'utility']).default('effect'),
  settings:      z.string().default(''),   // free-text parameter notes
  purpose:       z.string().default(''),
  warnings:      z.array(z.string()).default([]),
  macroMappings: z.array(z.object({
    macroNum: z.number().int().min(1).max(8),
    name:     z.string(),
    range:    z.string().optional(),
  })).default([]),
})

export type Device = z.infer<typeof deviceSchema>
