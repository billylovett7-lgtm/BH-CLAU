import { z } from 'zod'
import { baseRecordSchema } from './base.schema'

export const buildStatusSchema = z.enum([
  'idea', 'in-progress', 'mixing', 'mastering', 'done', 'shelved',
])

export const buildPrioritySchema = z.enum(['high', 'medium', 'low'])

export const buildSchema = baseRecordSchema.extend({
  schemaVersion: z.literal(1),
  title:         z.string().min(1).max(200),
  genre:         z.string().max(50).default(''),
  subgenre:      z.string().max(50).default(''),
  bpm:           z.number().positive().max(300).nullable().optional(),
  key:           z.string().max(10).nullable().optional(),
  root:          z.string().max(5).nullable().optional(),
  status:        buildStatusSchema.default('in-progress'),
  priority:      buildPrioritySchema.default('medium'),
  dueDate:       z.string().datetime().nullable().optional(),
  favourite:     z.boolean().default(false),
  archived:      z.boolean().default(false),
  tags:          z.array(z.string()).default([]),
  progress:      z.number().min(0).max(100).default(0),
  currentStage:  z.string().default('overview'),
  sourceSummary: z.string().max(500).default(''),
  notes:         z.string().default(''),
})

export const createBuildSchema = buildSchema.omit({
  id: true, ownerId: true, workspaceId: true,
  schemaVersion: true, createdAt: true, updatedAt: true, deletedAt: true,
  progress: true, currentStage: true,
})

export type Build       = z.infer<typeof buildSchema>
export type BuildStatus   = z.infer<typeof buildStatusSchema>
export type BuildPriority = z.infer<typeof buildPrioritySchema>
export type CreateBuild = z.infer<typeof createBuildSchema>
