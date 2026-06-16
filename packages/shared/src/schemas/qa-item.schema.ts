import { z } from 'zod'

export const qaItemSchema = z.object({
  id:           z.string().uuid(),
  scope:        z.enum(['global', 'import', 'build', 'library', 'mobile', 'a11y', 'security', 'performance']),
  title:        z.string().min(1).max(300),
  status:       z.enum(['pass', 'fail', 'skip', 'pending']).default('pending'),
  note:         z.string().default(''),
  browser:      z.string().optional(),
  buildVersion: z.string().optional(),
  createdAt:    z.string().datetime(),
})

export type QaItem = z.infer<typeof qaItemSchema>
