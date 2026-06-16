import { z } from 'zod'

export const importJobStatusSchema = z.enum([
  'pending', 'detecting', 'validating', 'preview', 'saving', 'done', 'error',
])

export const importJobSchema = z.object({
  id:               z.string().uuid(),
  ownerId:          z.string().uuid(),
  fileName:         z.string().max(255),
  fileType:         z.enum(['html', 'json', 'md', 'txt', 'midi', 'audio', 'preset']),
  status:           importJobStatusSchema,
  parserVersion:    z.string().default('1.0.0'),
  detectedMetadata: z.object({
    title:   z.string().optional(),
    genre:   z.string().optional(),
    bpm:     z.number().optional(),
    key:     z.string().optional(),
    tags:    z.array(z.string()).optional(),
  }).nullable().optional(),
  previewBlocks:    z.array(z.unknown()).default([]),  // typed at runtime via block schema
  errors:           z.array(z.object({
    field:   z.string(),
    message: z.string(),
  })).default([]),
  createdAt:        z.string().datetime(),
})

export type ImportJob       = z.infer<typeof importJobSchema>
export type ImportJobStatus = z.infer<typeof importJobStatusSchema>
