import { z } from 'zod'

export const buildStageSchema = z.object({
  id:          z.string().uuid(),
  buildId:     z.string().uuid(),
  stageKey:    z.string(),           // e.g. 'overview', 'drums', 'chains'
  title:       z.string(),
  order:       z.number().int().nonnegative(),
  completed:   z.boolean().default(false),
  completedAt: z.string().datetime().nullable().optional(),
  taskChecks:  z.array(z.object({
    id:        z.string().uuid(),
    text:      z.string(),
    done:      z.boolean().default(false),
    priority:  z.enum(['high', 'medium', 'low']).default('medium'),
  })).default([]),
})

export type BuildStage = z.infer<typeof buildStageSchema>
