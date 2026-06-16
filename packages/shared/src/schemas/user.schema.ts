import { z } from 'zod'

export const userSchema = z.object({
  id:           z.string().uuid(),
  email:        z.string().email(),
  displayName:  z.string().min(1).max(100),
  plan:         z.enum(['free', 'pro', 'team']).default('free'),
  createdAt:    z.string().datetime(),
  lastLoginAt:  z.string().datetime().nullable(),
})

export type User = z.infer<typeof userSchema>
