import { upsertBuild, upsertBuildStages, upsertBlocks, upsertBlock, deleteBlock, db } from './localDb'
import type { Build, BuildStage, Block, TextBlock } from '@codex/shared'
import { STAGES } from '@codex/shared'
import { buildSeedBlocks } from './stageSeeds'

// ─── Create ───────────────────────────────────────────────────────────────────

interface CreateBuildInput {
  title:      string
  genre?:     string
  bpm?:       number | null
  key?:       string | null
  status?:    Build['status']
  priority?:  Build['priority']
  templateId?: string
}

export async function createBuild(
  input:       CreateBuildInput,
  ownerId:     string,
  workspaceId: string,
): Promise<string> {
  const id  = crypto.randomUUID()
  const now = new Date().toISOString()

  const build: Build = {
    id,
    ownerId,
    workspaceId,
    schemaVersion:  1,
    title:          input.title,
    genre:          input.genre     ?? '',
    subgenre:       '',
    bpm:            input.bpm      ?? null,
    key:            input.key      ?? null,
    root:           null,
    status:         input.status   ?? 'in-progress',
    priority:       input.priority ?? 'medium',
    dueDate:        null,
    favourite:      false,
    archived:       false,
    tags:           [],
    progress:       0,
    currentStage:   'overview',
    sourceSummary:  '',
    notes:          '',
    createdAt:      now,
    updatedAt:      now,
    deletedAt:      null,
  }

  const stages: BuildStage[] = STAGES.map(s => ({
    id:          crypto.randomUUID(),
    buildId:     id,
    stageKey:    s.key,
    title:       s.title,
    order:       s.order,
    completed:   false,
    completedAt: null,
    taskChecks:  [],
  }))

  await upsertBuild(build)
  await upsertBuildStages(stages)
  await upsertBlocks(buildSeedBlocks(id, input.templateId))

  return id
}

// ─── Update fields ────────────────────────────────────────────────────────────

export async function updateBuildField(
  id:     string,
  fields: Partial<Pick<Build, 'title' | 'genre' | 'bpm' | 'key' | 'status' | 'priority' | 'currentStage' | 'progress' | 'notes'>>,
): Promise<void> {
  await db.builds.update(id, { ...fields, updatedAt: new Date().toISOString() })
}

// ─── Block operations ─────────────────────────────────────────────────────────

export async function addTextBlock(
  buildId:  string,
  stageKey: string,
  content:  string,
  order:    number,
): Promise<void> {
  const block: TextBlock = {
    id:       crypto.randomUUID(),
    buildId,
    stageKey,
    order,
    locked:   false,
    type:     'text',
    data:     { content },
  }
  await upsertBlock(block as Block)
}

export async function updateBlockContent(
  block:      Block & { data: { content: string } },
  newContent: string,
): Promise<void> {
  await upsertBlock({ ...block, data: { ...block.data, content: newContent } } as Block)
}

export async function removeBlock(id: string): Promise<void> {
  await deleteBlock(id)
}

// ─── Stage completion ─────────────────────────────────────────────────────────

export async function toggleStageComplete(
  stageId:   string,
  completed: boolean,
): Promise<void> {
  await db.buildStages.update(stageId, {
    completed,
    completedAt: completed ? new Date().toISOString() : null,
  })
}

// ─── Recalculate progress ─────────────────────────────────────────────────────

export async function recalculateProgress(buildId: string): Promise<void> {
  const stages = await db.buildStages.where('buildId').equals(buildId).toArray()
  if (!stages.length) return
  const pct = Math.round((stages.filter(s => s.completed).length / stages.length) * 100)
  await db.builds.update(buildId, { progress: pct, updatedAt: new Date().toISOString() })
}
