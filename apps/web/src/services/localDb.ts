import Dexie, { type Table } from 'dexie'
import type {
  Build,
  BuildStage,
  Block,
  ChainRack,
  MidiPattern,
  Sample,
  Preset,
  Groove,
  Arrangement,
  ImportJob,
  Asset,
  ShareLink,
  QaItem,
  User,
  Workspace,
} from '@codex/shared'

// ─── Binary blob store (local-only, never synced) ─────────────────────────

export interface AssetBlob {
  assetId: string
  data: Blob
  storedAt: string
}

// ─── Database class ────────────────────────────────────────────────────────

class CodexDb extends Dexie {
  builds!:       Table<Build>
  buildStages!:  Table<BuildStage>
  blocks!:       Table<Block>
  chainRacks!:   Table<ChainRack>
  midiPatterns!: Table<MidiPattern>
  samples!:      Table<Sample>
  presets!:      Table<Preset>
  grooves!:      Table<Groove>
  arrangements!: Table<Arrangement>
  importJobs!:   Table<ImportJob>
  assets!:       Table<Asset>
  shareLinks!:   Table<ShareLink>
  qaItems!:      Table<QaItem>
  users!:        Table<User>
  workspaces!:   Table<Workspace>
  assetBlobs!:   Table<AssetBlob>

  constructor() {
    super('codex-build-hub')
    this.version(1).stores({
      // Primary key is always the first field.
      // Compound indices use [field1+field2] syntax.
      // &field means unique index.
      builds:       'id, workspaceId, status, priority, genre, createdAt, updatedAt, deletedAt, favourite, archived',
      buildStages:  'id, buildId, stageKey, [buildId+stageKey]',
      blocks:       'id, buildId, stageKey, [buildId+stageKey]',
      chainRacks:   'id, workspaceId, genre, deletedAt, favourite',
      midiPatterns: 'id, workspaceId, type, genre, deletedAt',
      samples:      'id, workspaceId, type, genre, deletedAt, localOnly',
      presets:      'id, workspaceId, type, deletedAt',
      grooves:      'id, workspaceId, deletedAt',
      arrangements: 'id, workspaceId, genre, deletedAt',
      importJobs:   'id, ownerId, fileType, status, createdAt',
      assets:       'id, ownerId, hash, mimeType, localOnly',
      shareLinks:   'id, &slug, buildId, ownerId, visibility',
      qaItems:      'id, scope, status',
      users:        'id',
      workspaces:   'id, ownerId',
      assetBlobs:   'assetId',
    })
  }
}

export const db = new CodexDb()

// ─── Internal helpers ─────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString()
}

function isLive(deletedAt: string | null | undefined): boolean {
  return deletedAt === null || deletedAt === undefined
}

// ─── Builds ───────────────────────────────────────────────────────────────

export async function getBuilds(workspaceId: string): Promise<Build[]> {
  return db.builds
    .where('workspaceId').equals(workspaceId)
    .filter(b => isLive(b.deletedAt))
    .toArray()
}

export async function getActiveBuilds(workspaceId: string): Promise<Build[]> {
  return db.builds
    .where('workspaceId').equals(workspaceId)
    .filter(b => isLive(b.deletedAt) && b.status !== 'done' && b.status !== 'shelved')
    .toArray()
}

export async function getFavouriteBuilds(workspaceId: string): Promise<Build[]> {
  return db.builds
    .where('workspaceId').equals(workspaceId)
    .filter(b => isLive(b.deletedAt) && b.favourite === true)
    .toArray()
}

export async function getBuild(id: string): Promise<Build | undefined> {
  return db.builds.get(id)
}

export async function upsertBuild(build: Build): Promise<void> {
  await db.builds.put({ ...build, updatedAt: now() })
}

export async function softDeleteBuild(id: string): Promise<void> {
  await db.builds.update(id, { deletedAt: now(), updatedAt: now() })
}

export async function restoreBuild(id: string): Promise<void> {
  await db.builds.update(id, { deletedAt: null, updatedAt: now() })
}

// ─── Build stages ─────────────────────────────────────────────────────────

export async function getBuildStages(buildId: string): Promise<BuildStage[]> {
  return db.buildStages.where('buildId').equals(buildId).sortBy('order')
}

export async function getBuildStage(buildId: string, stageKey: string): Promise<BuildStage | undefined> {
  return db.buildStages.where('[buildId+stageKey]').equals([buildId, stageKey]).first()
}

export async function upsertBuildStage(stage: BuildStage): Promise<void> {
  await db.buildStages.put(stage)
}

export async function upsertBuildStages(stages: BuildStage[]): Promise<void> {
  await db.buildStages.bulkPut(stages)
}

export async function deleteBuildStagesByBuild(buildId: string): Promise<void> {
  await db.buildStages.where('buildId').equals(buildId).delete()
}

// ─── Blocks ───────────────────────────────────────────────────────────────

export async function getBlocksByBuild(buildId: string): Promise<Block[]> {
  return db.blocks.where('buildId').equals(buildId).sortBy('order')
}

export async function getBlocksByStage(buildId: string, stageKey: string): Promise<Block[]> {
  const blocks = await db.blocks
    .where('[buildId+stageKey]').equals([buildId, stageKey])
    .toArray()
  return blocks.sort((a, b) => a.order - b.order)
}

export async function upsertBlock(block: Block): Promise<void> {
  await db.blocks.put(block)
}

export async function upsertBlocks(blocks: Block[]): Promise<void> {
  await db.blocks.bulkPut(blocks)
}

export async function deleteBlock(id: string): Promise<void> {
  await db.blocks.delete(id)
}

export async function deleteBlocksByBuild(buildId: string): Promise<void> {
  await db.blocks.where('buildId').equals(buildId).delete()
}

// ─── Chain racks ──────────────────────────────────────────────────────────

export async function getChainRacks(workspaceId: string): Promise<ChainRack[]> {
  return db.chainRacks
    .where('workspaceId').equals(workspaceId)
    .filter(r => isLive(r.deletedAt))
    .toArray()
}

export async function getChainRack(id: string): Promise<ChainRack | undefined> {
  return db.chainRacks.get(id)
}

export async function upsertChainRack(rack: ChainRack): Promise<void> {
  await db.chainRacks.put({ ...rack, updatedAt: now() })
}

export async function softDeleteChainRack(id: string): Promise<void> {
  await db.chainRacks.update(id, { deletedAt: now(), updatedAt: now() })
}

// ─── MIDI patterns ────────────────────────────────────────────────────────

export async function getMidiPatterns(workspaceId: string): Promise<MidiPattern[]> {
  return db.midiPatterns
    .where('workspaceId').equals(workspaceId)
    .filter(p => isLive(p.deletedAt))
    .toArray()
}

export async function getMidiPattern(id: string): Promise<MidiPattern | undefined> {
  return db.midiPatterns.get(id)
}

export async function upsertMidiPattern(pattern: MidiPattern): Promise<void> {
  await db.midiPatterns.put({ ...pattern, updatedAt: now() })
}

export async function softDeleteMidiPattern(id: string): Promise<void> {
  await db.midiPatterns.update(id, { deletedAt: now(), updatedAt: now() })
}

// ─── Samples ──────────────────────────────────────────────────────────────

export async function getSamples(workspaceId: string): Promise<Sample[]> {
  return db.samples
    .where('workspaceId').equals(workspaceId)
    .filter(s => isLive(s.deletedAt))
    .toArray()
}

export async function getSample(id: string): Promise<Sample | undefined> {
  return db.samples.get(id)
}

export async function upsertSample(sample: Sample): Promise<void> {
  await db.samples.put({ ...sample, updatedAt: now() })
}

export async function softDeleteSample(id: string): Promise<void> {
  await db.samples.update(id, { deletedAt: now(), updatedAt: now() })
}

// ─── Presets ──────────────────────────────────────────────────────────────

export async function getPresets(workspaceId: string): Promise<Preset[]> {
  return db.presets
    .where('workspaceId').equals(workspaceId)
    .filter(p => isLive(p.deletedAt))
    .toArray()
}

export async function getPreset(id: string): Promise<Preset | undefined> {
  return db.presets.get(id)
}

export async function upsertPreset(preset: Preset): Promise<void> {
  await db.presets.put({ ...preset, updatedAt: now() })
}

export async function softDeletePreset(id: string): Promise<void> {
  await db.presets.update(id, { deletedAt: now(), updatedAt: now() })
}

// ─── Grooves ──────────────────────────────────────────────────────────────

export async function getGrooves(workspaceId: string): Promise<Groove[]> {
  return db.grooves
    .where('workspaceId').equals(workspaceId)
    .filter(g => isLive(g.deletedAt))
    .toArray()
}

export async function getGroove(id: string): Promise<Groove | undefined> {
  return db.grooves.get(id)
}

export async function upsertGroove(groove: Groove): Promise<void> {
  await db.grooves.put({ ...groove, updatedAt: now() })
}

export async function softDeleteGroove(id: string): Promise<void> {
  await db.grooves.update(id, { deletedAt: now(), updatedAt: now() })
}

// ─── Arrangements ─────────────────────────────────────────────────────────

export async function getArrangements(workspaceId: string): Promise<Arrangement[]> {
  return db.arrangements
    .where('workspaceId').equals(workspaceId)
    .filter(a => isLive(a.deletedAt))
    .toArray()
}

export async function getArrangement(id: string): Promise<Arrangement | undefined> {
  return db.arrangements.get(id)
}

export async function upsertArrangement(arrangement: Arrangement): Promise<void> {
  await db.arrangements.put({ ...arrangement, updatedAt: now() })
}

export async function softDeleteArrangement(id: string): Promise<void> {
  await db.arrangements.update(id, { deletedAt: now(), updatedAt: now() })
}

// ─── Import jobs ──────────────────────────────────────────────────────────

export async function getImportJobs(ownerId: string): Promise<ImportJob[]> {
  const jobs = await db.importJobs.where('ownerId').equals(ownerId).toArray()
  return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getRecentImportJobs(ownerId: string, limit = 5): Promise<ImportJob[]> {
  const jobs = await getImportJobs(ownerId)
  return jobs.slice(0, limit)
}

export async function getImportJob(id: string): Promise<ImportJob | undefined> {
  return db.importJobs.get(id)
}

export async function upsertImportJob(job: ImportJob): Promise<void> {
  await db.importJobs.put(job)
}

export async function deleteImportJob(id: string): Promise<void> {
  await db.importJobs.delete(id)
}

// ─── Assets ───────────────────────────────────────────────────────────────

export async function getAssets(ownerId: string): Promise<Asset[]> {
  return db.assets.where('ownerId').equals(ownerId).toArray()
}

export async function getAsset(id: string): Promise<Asset | undefined> {
  return db.assets.get(id)
}

export async function getAssetByHash(hash: string): Promise<Asset | undefined> {
  return db.assets.where('hash').equals(hash).first()
}

export async function upsertAsset(asset: Asset): Promise<void> {
  await db.assets.put(asset)
}

export async function deleteAsset(id: string): Promise<void> {
  await db.assets.delete(id)
  await db.assetBlobs.delete(id)
}

// ─── Asset blobs ──────────────────────────────────────────────────────────

export async function getAssetBlob(assetId: string): Promise<Blob | undefined> {
  const record = await db.assetBlobs.get(assetId)
  return record?.data
}

export async function putAssetBlob(assetId: string, data: Blob): Promise<void> {
  await db.assetBlobs.put({ assetId, data, storedAt: now() })
}

export async function deleteAssetBlob(assetId: string): Promise<void> {
  await db.assetBlobs.delete(assetId)
}

// ─── Share links ──────────────────────────────────────────────────────────

export async function getShareLinksByBuild(buildId: string): Promise<ShareLink[]> {
  return db.shareLinks.where('buildId').equals(buildId).toArray()
}

export async function getShareLinkBySlug(slug: string): Promise<ShareLink | undefined> {
  return db.shareLinks.where('slug').equals(slug).first()
}

export async function upsertShareLink(link: ShareLink): Promise<void> {
  await db.shareLinks.put(link)
}

export async function deleteShareLink(id: string): Promise<void> {
  await db.shareLinks.delete(id)
}

// ─── QA items ─────────────────────────────────────────────────────────────

export async function getQaItems(): Promise<QaItem[]> {
  return db.qaItems.toArray()
}

export async function getQaItemsByScope(scope: QaItem['scope']): Promise<QaItem[]> {
  return db.qaItems.where('scope').equals(scope).toArray()
}

export async function upsertQaItem(item: QaItem): Promise<void> {
  await db.qaItems.put(item)
}

export async function upsertQaItems(items: QaItem[]): Promise<void> {
  await db.qaItems.bulkPut(items)
}

// ─── Users ────────────────────────────────────────────────────────────────

export async function getUser(id: string): Promise<User | undefined> {
  return db.users.get(id)
}

export async function upsertUser(user: User): Promise<void> {
  await db.users.put(user)
}

// ─── Workspaces ───────────────────────────────────────────────────────────

export async function getWorkspace(id: string): Promise<Workspace | undefined> {
  return db.workspaces.get(id)
}

export async function getWorkspacesByOwner(ownerId: string): Promise<Workspace[]> {
  return db.workspaces.where('ownerId').equals(ownerId).toArray()
}

export async function upsertWorkspace(ws: Workspace): Promise<void> {
  await db.workspaces.put(ws)
}

// ─── Storage usage ────────────────────────────────────────────────────────

export interface StorageStats {
  builds:       number
  blocks:       number
  chainRacks:   number
  midiPatterns: number
  samples:      number
  presets:      number
  grooves:      number
  arrangements: number
  assets:       number
  blobs:        number
}

export async function getStorageStats(workspaceId: string): Promise<StorageStats> {
  const [
    builds, blocks, chainRacks, midiPatterns,
    samples, presets, grooves, arrangements, assets, blobs,
  ] = await Promise.all([
    db.builds.where('workspaceId').equals(workspaceId).count(),
    db.builds
      .where('workspaceId').equals(workspaceId)
      .primaryKeys()
      .then(ids => db.blocks.where('buildId').anyOf(ids as string[]).count()),
    db.chainRacks.where('workspaceId').equals(workspaceId).count(),
    db.midiPatterns.where('workspaceId').equals(workspaceId).count(),
    db.samples.where('workspaceId').equals(workspaceId).count(),
    db.presets.where('workspaceId').equals(workspaceId).count(),
    db.grooves.where('workspaceId').equals(workspaceId).count(),
    db.arrangements.where('workspaceId').equals(workspaceId).count(),
    db.assets.count(),
    db.assetBlobs.count(),
  ])
  return { builds, blocks, chainRacks, midiPatterns, samples, presets, grooves, arrangements, assets, blobs }
}

// ─── Atomic workspace purge ───────────────────────────────────────────────

export async function purgeWorkspace(workspaceId: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.builds, db.buildStages, db.blocks, db.chainRacks, db.midiPatterns,
      db.samples, db.presets, db.grooves, db.arrangements],
    async () => {
      const buildIds = await db.builds
        .where('workspaceId').equals(workspaceId)
        .primaryKeys() as string[]

      await db.builds.where('workspaceId').equals(workspaceId).delete()
      await db.chainRacks.where('workspaceId').equals(workspaceId).delete()
      await db.midiPatterns.where('workspaceId').equals(workspaceId).delete()
      await db.samples.where('workspaceId').equals(workspaceId).delete()
      await db.presets.where('workspaceId').equals(workspaceId).delete()
      await db.grooves.where('workspaceId').equals(workspaceId).delete()
      await db.arrangements.where('workspaceId').equals(workspaceId).delete()

      if (buildIds.length > 0) {
        await db.buildStages.where('buildId').anyOf(buildIds).delete()
        await db.blocks.where('buildId').anyOf(buildIds).delete()
      }
    },
  )
}
