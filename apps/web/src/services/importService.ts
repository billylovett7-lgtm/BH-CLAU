import {
  parseHtml,
  parseJson,
  parseMarkdown,
  parseTxt,
  parseMidi,
} from '@codex/shared'
import type { ImportJob, ImportResult } from '@codex/shared'
import { upsertImportJob, getImportJobs } from './localDb'
import { PARSER_VERSION } from '@codex/shared'

// ─── File type detection ──────────────────────────────────────────────────────

export type SupportedExt = 'html' | 'json' | 'md' | 'txt' | 'midi'

const EXT_MAP: Record<string, SupportedExt> = {
  html: 'html', htm: 'html',
  json: 'json',
  md: 'md', markdown: 'md',
  txt: 'txt',
  mid: 'midi', midi: 'midi',
}

export function detectFileType(name: string): SupportedExt | null {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_MAP[ext] ?? null
}

// ─── Duplicate detection ──────────────────────────────────────────────────────

export async function findDuplicateJob(
  fileName: string,
  ownerId:  string,
): Promise<ImportJob | null> {
  const jobs = await getImportJobs(ownerId)
  return jobs.find(j => j.fileName === fileName && j.status === 'done') ?? null
}

// ─── Run parser ───────────────────────────────────────────────────────────────

export async function runParser(
  file:    File,
  fileType: SupportedExt,
): Promise<ImportResult> {
  if (fileType === 'midi') {
    const buf = await file.arrayBuffer()
    return parseMidi(new Uint8Array(buf), file.name)
  }

  const text = await file.text()

  switch (fileType) {
    case 'html': return parseHtml(text, file.name)
    case 'json': return parseJson(text, file.name)
    case 'md':   return parseMarkdown(text, file.name)
    case 'txt':  return parseTxt(text, file.name)
  }
}

// ─── Create / update job ──────────────────────────────────────────────────────

export async function createImportJob(
  file:    File,
  ownerId: string,
): Promise<{ job: ImportJob; result: ImportResult | null; fileType: SupportedExt | null }> {
  const fileType = detectFileType(file.name)
  const now      = new Date().toISOString()
  const id       = crypto.randomUUID()

  const job: ImportJob = {
    id,
    ownerId,
    fileName:         file.name,
    fileType:         (fileType ?? 'txt') as ImportJob['fileType'],
    status:           'detecting',
    parserVersion:    PARSER_VERSION,
    detectedMetadata: null,
    previewBlocks:    [],
    errors:           [],
    createdAt:        now,
  }
  await upsertImportJob(job)

  if (!fileType) {
    await upsertImportJob({ ...job, status: 'error', errors: [{ field: 'file', message: 'Unsupported file type' }] })
    return { job: { ...job, status: 'error' }, result: null, fileType: null }
  }

  try {
    await upsertImportJob({ ...job, status: 'validating' })
    const result = await runParser(file, fileType)

    const updatedJob: ImportJob = {
      ...job,
      status:           result.errors.length ? 'error' : 'preview',
      detectedMetadata: result.detectedMetadata ?? null,
      previewBlocks:    result.previewBlocks,
      errors:           result.errors,
    }
    await upsertImportJob(updatedJob)
    return { job: updatedJob, result, fileType }
  } catch (err) {
    const errJob: ImportJob = {
      ...job,
      status: 'error',
      errors: [{ field: 'parser', message: String(err) }],
    }
    await upsertImportJob(errJob)
    return { job: errJob, result: null, fileType }
  }
}

export async function markJobDone(jobId: string, job: ImportJob): Promise<void> {
  await upsertImportJob({ ...job, status: 'done' })
}
