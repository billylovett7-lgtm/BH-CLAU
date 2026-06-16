import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPublicBuild } from '@/services/shareService'
import { cloudSyncEnabled } from '@/lib/supabaseClient'
import { Spinner } from '@/components/ui'
import { BlockRenderer } from '@/components/blocks'
import { STAGES } from '@codex/shared'
import type { Block } from '@codex/shared'

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PublicBuildPage() {
  const { slug } = useParams<{ slug: string }>()
  const [state, setState] = useState<'loading' | 'not-found' | 'expired' | 'loaded' | 'local-only'>('loading')
  const [data, setData] = useState<{
    build:  Record<string, unknown>
    stages: Record<string, unknown>[]
    blocks: Record<string, unknown>[]
  } | null>(null)
  const [activeKey, setActiveKey] = useState(STAGES[0].key)

  useEffect(() => {
    if (!cloudSyncEnabled) { setState('local-only'); return }
    if (!slug) { setState('not-found'); return }

    fetchPublicBuild(slug)
      .then(result => {
        if (!result) { setState('not-found'); return }
        setData(result)
        setState('loaded')
      })
      .catch(() => setState('not-found'))
  }, [slug])

  if (state === 'loading') {
    return (
      <div className="pub-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (state === 'local-only') {
    return (
      <div className="pub-center">
        <div className="pub-message">
          <h1>Sharing is unavailable</h1>
          <p>Cloud sync is disabled. Enable it to access shared builds.</p>
        </div>
      </div>
    )
  }

  if (state === 'not-found' || !data) {
    return (
      <div className="pub-center">
        <div className="pub-message">
          <h1>Build not found</h1>
          <p>This link may have expired or been revoked.</p>
        </div>
      </div>
    )
  }

  const build   = data.build
  const stages  = data.stages as Array<{ stage_key: string; title: string; order: number; completed: boolean }>
  const blocks  = data.blocks as Array<Block & { stage_key: string }>

  const activeBlocks = blocks.filter(b => b.stage_key === activeKey)

  return (
    <div className="pub-page">
      {/* Header */}
      <div className="pub-header">
        <div className="pub-logo">
          <span className="pub-logo__dot" />
          <span className="pub-logo__text">BUILD HUB</span>
        </div>
        <h1 className="pub-title">{build.title as string}</h1>
        <div className="pub-meta">
          {[
            (build.genre as string)?.replace(/-/g,' '),
            build.bpm ? `${build.bpm} BPM` : '',
            build.key as string ?? '',
          ].filter(Boolean).join(' · ')}
        </div>
        <div className="pub-progress">
          <div className="pub-progress__bar" style={{ width: `${build.progress as number ?? 0}%` }} />
        </div>
      </div>

      {/* Stage tabs */}
      <div className="pub-tabs">
        {STAGES.map(s => {
          const dbStage = stages.find(st => st.stage_key === s.key)
          return (
            <button key={s.key} type="button"
              className={`pub-tab${activeKey === s.key ? ' pub-tab--active' : ''}${dbStage?.completed ? ' pub-tab--done' : ''}`}
              onClick={() => setActiveKey(s.key)}>
              {s.order}. {s.title}
              {dbStage?.completed && <span className="pub-tab__check" aria-hidden>✓</span>}
            </button>
          )
        })}
      </div>

      {/* Blocks */}
      <div className="pub-content">
        {activeBlocks.length === 0
          ? <p className="pub-empty">No notes for this stage.</p>
          : activeBlocks.map(b => <BlockRenderer key={b.id} block={b} />)
        }
      </div>

      <style>{`
        .pub-page { min-height:100dvh; background:var(--color-bg); color:var(--color-text); }
        .pub-center { display:flex; align-items:center; justify-content:center; min-height:100dvh; }
        .pub-message { text-align:center; max-width:400px; padding:var(--space-6); }
        .pub-message h1 { font-size:var(--text-2xl); font-weight:var(--font-weight-bold); margin:0 0 var(--space-3); }
        .pub-message p { font-size:var(--text-base); color:var(--color-text-muted); margin:0; }
        .pub-header { padding:var(--space-6) var(--space-5) var(--space-4); border-bottom:1px solid var(--color-border); }
        .pub-logo { display:flex; align-items:center; gap:var(--space-2); margin-bottom:var(--space-4); }
        .pub-logo__dot { width:8px; height:8px; border-radius:50%; background:var(--color-accent-lime); }
        .pub-logo__text { font-size:var(--text-xs); font-weight:var(--font-weight-semibold); letter-spacing:0.12em; color:var(--color-text-faint); }
        .pub-title { font-size:var(--text-3xl); font-weight:var(--font-weight-bold); margin:0 0 var(--space-1); }
        .pub-meta { font-size:var(--text-base); color:var(--color-text-faint); text-transform:capitalize; }
        .pub-progress { height:3px; background:var(--color-bg-3); border-radius:2px; margin-top:var(--space-4); }
        .pub-progress__bar { height:100%; background:var(--color-accent-lime); border-radius:2px; transition:width 0.4s; }
        .pub-tabs { display:flex; overflow-x:auto; padding:0 var(--space-5); border-bottom:1px solid var(--color-border); gap:0; scrollbar-width:none; }
        .pub-tabs::-webkit-scrollbar { display:none; }
        .pub-tab { padding:var(--space-2) var(--space-3); border:none; border-bottom:2px solid transparent; background:none; color:var(--color-text-faint); cursor:pointer; white-space:nowrap; font-size:var(--text-sm); transition:color var(--transition-fast),border-color var(--transition-fast); }
        .pub-tab:hover { color:var(--color-text); }
        .pub-tab--active { color:var(--color-text); border-bottom-color:var(--color-accent-cyan); }
        .pub-tab--done .pub-tab__check { color:var(--color-accent-lime); margin-left:4px; font-size:var(--text-xs); }
        .pub-content { max-width:780px; margin:0 auto; padding:var(--space-6) var(--space-5); display:flex; flex-direction:column; gap:var(--space-3); }
        .pub-empty { font-size:var(--text-sm); color:var(--color-text-faint); text-align:center; padding:var(--space-8) 0; }
      `}</style>
    </div>
  )
}
