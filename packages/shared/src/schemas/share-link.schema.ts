import { z } from 'zod'

export const shareLinkSchema = z.object({
  id:          z.string().uuid(),
  ownerId:     z.string().uuid(),
  buildId:     z.string().uuid(),
  slug:        z.string().min(8).max(64).regex(/^[a-z0-9-]+$/),
  visibility:  z.enum(['private', 'unlisted', 'public']).default('unlisted'),
  expiresAt:   z.string().datetime().nullable().optional(),
  allowCopy:   z.boolean().default(false),
  createdAt:   z.string().datetime(),
})

export type ShareLink = z.infer<typeof shareLinkSchema>
