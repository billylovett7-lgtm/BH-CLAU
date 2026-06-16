import { z } from 'zod'

export const workspaceSettingsSchema = z.object({
  defaultGenre:   z.string().optional(),
  compactMode:    z.boolean().default(false),
  cloudSync:      z.boolean().default(false),
})

export const workspaceSchema = z.object({
  id:          z.string().uuid(),
  ownerId:     z.string().uuid(),
  name:        z.string().min(1).max(100),
  type:        z.enum(['personal', 'team']).default('personal'),
  settings:    workspaceSettingsSchema.default({}),
  quotaBytes:  z.number().int().nonnegative().default(0),
  createdAt:   z.string().datetime(),
})

export type Workspace = z.infer<typeof workspaceSchema>
export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>
