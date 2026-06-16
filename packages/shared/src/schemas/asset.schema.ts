import { z } from 'zod'

export const assetSchema = z.object({
  id:          z.string().uuid(),
  ownerId:     z.string().uuid(),
  fileName:    z.string().max(255),
  mimeType:    z.string().max(100),
  sizeBytes:   z.number().int().nonnegative(),
  hash:        z.string().length(64),   // SHA-256 hex
  storagePath: z.string().optional(),   // Supabase Storage path (when cloud)
  localOnly:   z.boolean().default(true),
  createdAt:   z.string().datetime(),
})

export type Asset = z.infer<typeof assetSchema>
