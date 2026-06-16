// ─── Share link service ───────────────────────────────────────────────────────
// Creates, reads, and revokes public share links via Supabase.
// Share links only work when cloudSyncEnabled is true (data must be in Supabase).

import { supabase, cloudSyncEnabled } from '@/lib/supabaseClient'
import { upsertShareLink, deleteShareLink as deleteShareLinkLocal, getShareLinksByBuild } from './localDb'
import type { ShareLink } from '@codex/shared'

function nanoid(len = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => chars[b % chars.length])
    .join('')
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createShareLink(
  buildId:    string,
  ownerId:    string,
  options: {
    visibility?: ShareLink['visibility']
    allowCopy?:  boolean
    expiresAt?:  string | null
  } = {},
): Promise<ShareLink> {
  if (!cloudSyncEnabled) throw new Error('Cloud sync is disabled. Enable it to share builds.')

  const link: ShareLink = {
    id:         crypto.randomUUID(),
    ownerId,
    buildId,
    slug:       `${nanoid(8)}-${nanoid(4)}`,
    visibility: options.visibility ?? 'unlisted',
    allowCopy:  options.allowCopy  ?? false,
    expiresAt:  options.expiresAt  ?? null,
    createdAt:  new Date().toISOString(),
  }

  const { error } = await supabase.from('share_links').insert({
    id:          link.id,
    owner_id:    link.ownerId,
    build_id:    link.buildId,
    slug:        link.slug,
    visibility:  link.visibility,
    allow_copy:  link.allowCopy,
    expires_at:  link.expiresAt,
    created_at:  link.createdAt,
  })
  if (error) throw error

  await upsertShareLink(link)
  return link
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getShareLinkBySlug(slug: string): Promise<ShareLink | null> {
  if (!cloudSyncEnabled) return null

  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id:         data.id,
    ownerId:    data.owner_id,
    buildId:    data.build_id,
    slug:       data.slug,
    visibility: data.visibility,
    allowCopy:  data.allow_copy,
    expiresAt:  data.expires_at ?? null,
    createdAt:  data.created_at,
  }
}

export async function getBuildShareLinks(buildId: string): Promise<ShareLink[]> {
  return getShareLinksByBuild(buildId)
}

// ─── Revoke ───────────────────────────────────────────────────────────────────

export async function revokeShareLink(id: string): Promise<void> {
  if (!cloudSyncEnabled) return

  const { error } = await supabase.from('share_links').delete().eq('id', id)
  if (error) throw error

  await deleteShareLinkLocal(id)
}

// ─── Public build fetch ───────────────────────────────────────────────────────
// Used on the public share page (no auth required for unlisted/public links).

export async function fetchPublicBuild(slug: string): Promise<{
  build:  Record<string, unknown>
  stages: Record<string, unknown>[]
  blocks: Record<string, unknown>[]
} | null> {
  if (!cloudSyncEnabled) return null

  const link = await getShareLinkBySlug(slug)
  if (!link) return null
  if (link.visibility === 'private') return null
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return null

  const { data: build, error: be } = await supabase
    .from('builds').select('*').eq('id', link.buildId).maybeSingle()
  if (be || !build) return null

  const [{ data: stages }, { data: blocks }] = await Promise.all([
    supabase.from('build_stages').select('*').eq('build_id', link.buildId),
    supabase.from('blocks').select('*').eq('build_id', link.buildId),
  ])

  return {
    build,
    stages: stages ?? [],
    blocks: blocks ?? [],
  }
}
