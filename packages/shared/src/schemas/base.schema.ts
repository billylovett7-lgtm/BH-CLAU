import { z } from 'zod'

export const uuidSchema = z.string().uuid()

export const baseRecordSchema = z.object({
  id:            z.string().uuid(),
  ownerId:       z.string().uuid(),
  workspaceId:   z.string().uuid(),
  schemaVersion: z.number().int().positive(),
  createdAt:     z.string().datetime(),
  updatedAt:     z.string().datetime(),
  deletedAt:     z.string().datetime().nullable(),
})

export type BaseRecord = z.infer<typeof baseRecordSchema>
