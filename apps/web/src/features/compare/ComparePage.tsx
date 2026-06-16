import { useState } from 'react'
import { useBuilds } from '@/hooks/useBuilds'
import { useBuildStages, useStageBlocks } from '@/hooks/useBuild'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Select, StatusBadge, PriorityBadge, Spinner, EmptyState } from '@/components/ui'
import { BlockRenderer } from '@/components/blocks'
import { STAGES } from '@codex/shared'
import type { Build } from '@codex/shared'

// ─── Stage comparison panel ───────────────────────────────────────────────────

function StageColumn({ buildId, stageKey }: { buildId: string; stageKey: string }) {
  const blocks = useStageBlocks(buildId, stageKey)
  if (blocks === undefined) return <Spinner size="sm" />
  if (!blocks.length) return (
    <p className="compare-empty">No notes for this stage.</p>
  )
  return (
    <div className="compare-blocks">
      {blocks.map(b => <BlockRenderer key={b.id} block={b} />)}
    </div>
  )
}

// ─── Build column header ──────────────────────────────────────────────────────

function BuildHeader({ build }: { build: Build }) {
  const stages  = useBuildStages(build.id)
  const done    = stages?.filter(s => s.completed).length ?? 0
  const total   = stages?.length ?? 0
  const pct     = build.progress

  return (
    <div className="compare-build-header">
      <div className="compare-build-title">{build.title}</div>
      <div className="compare-build-meta">
        {[build.genre?.replace(/-/g,' '), build.bpm ? `${build.bpm} BPM` : ''].filter(Boolean).join(' · ')}
      </div>
      <div className="compare-build-badges">
        <StatusBadge   status={build.status}   />
        <PriorityBadge priority={build.priority} />
        <span className="compare-build-progress">{pct}% · {done}/{total} stages</span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ComparePage() {
  const { workspaceId } = useCurrentUser()
  const builds          = useBuilds(workspaceId)
  const [leftId,  setLeftId]  = useState('')
  const [rightId, setRightId] = useState('')
  const [stageKey, setStageKey] = useState(STAGES[0].key)

  if (builds === undefined) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Spinner size="lg" /></div>

  const buildOpts = [
    { value: '', label: 'Select a build…' },
    ...builds.map(b => ({ value: b.id, label: b.title })),
  ]

  const stageOpts = STAGES.map(s => ({ value: s.key, label: `${s.order}. ${s.title}` }))

  const leftBuild  = builds.find(b => b.id === leftId)
  const rightBuild = builds.find(b => b.id === rightId)

  return (
    <div className="compare-page">
      <h1 className="compare-heading">Compare builds</h1>

      {builds.length < 2
        ? (
          <EmptyState title="Need at least 2 builds"
            description="Create or import builds first to compare them side by side." />
        )
        : (
          <>
            {/* Selectors */}
            <div className="compare-selectors">
              <div className="compare-selector-col">
                <label className="compare-label">Build A</label>
                <Select value={leftId} onChange={setLeftId} options={buildOpts} />
              </div>
              <div className="compare-selector-center">
                <label className="compare-label">Stage</label>
                <Select value={stageKey} onChange={setStageKey} options={stageOpts} />
              </div>
              <div className="compare-selector-col">
                <label className="compare-label">Build B</label>
                <Select value={rightId} onChange={setRightId} options={buildOpts} />
              </div>
            </div>

            {/* Comparison grid */}
            {leftBuild && rightBuild
              ? (
                <>
                  {/* Build headers */}
                  <div className="compare-grid compare-grid--header">
                    <BuildHeader build={leftBuild}  />
                    <BuildHeader build={rightBuild} />
                  </div>

                  {/* Stage content */}
                  <div className="compare-grid">
                    <div className="compare-col">
                      <div className="compare-stage-label">
                        {STAGES.find(s => s.key === stageKey)?.title}
                      </div>
                      <StageColumn buildId={leftId}  stageKey={stageKey} />
                    </div>
                    <div className="compare-divider" aria-hidden />
                    <div className="compare-col">
                      <div className="compare-stage-label">
                        {STAGES.find(s => s.key === stageKey)?.title}
                      </div>
                      <StageColumn buildId={rightId} stageKey={stageKey} />
                    </div>
                  </div>
                </>
              )
              : (
                <p className="compare-hint">Select two builds above to compare them.</p>
              )
            }
          </>
        )
      }

      <style>{`
        .compare-page { padding:var(--space-6) var(--space-5); max-width:1200px; margin:0 auto; display:flex; flex-direction:column; gap:var(--space-6); }
        .compare-heading { font-size:var(--text-2xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0; }
        .compare-selectors { display:grid; grid-template-columns:1fr auto 1fr; gap:var(--space-4); align-items:end; }
        .compare-selector-col,.compare-selector-center { display:flex; flex-direction:column; gap:var(--space-1); }
        .compare-label { font-size:var(--text-sm); font-weight:var(--font-weight-medium); color:var(--color-text-faint); text-transform:uppercase; letter-spacing:0.06em; }
        .compare-grid { display:grid; grid-template-columns:1fr 1px 1fr; gap:var(--space-4); }
        .compare-grid--header { border-bottom:1px solid var(--color-border); padding-bottom:var(--space-4); }
        .compare-divider { background:var(--color-border); }
        .compare-col { min-width:0; }
        .compare-build-header { display:flex; flex-direction:column; gap:var(--space-2); }
        .compare-build-title { font-size:var(--text-lg); font-weight:var(--font-weight-bold); color:var(--color-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .compare-build-meta { font-size:var(--text-sm); color:var(--color-text-faint); text-transform:capitalize; }
        .compare-build-badges { display:flex; align-items:center; gap:var(--space-2); flex-wrap:wrap; }
        .compare-build-progress { font-size:var(--text-xs); font-family:var(--font-mono); color:var(--color-text-faint); }
        .compare-stage-label { font-size:var(--text-sm); font-weight:var(--font-weight-semibold); color:var(--color-text-faint); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:var(--space-3); }
        .compare-blocks { display:flex; flex-direction:column; gap:var(--space-3); }
        .compare-empty { font-size:var(--text-sm); color:var(--color-text-faint); text-align:center; padding:var(--space-6) 0; }
        .compare-hint { font-size:var(--text-base); color:var(--color-text-faint); text-align:center; padding:var(--space-8) 0; }
      `}</style>
    </div>
  )
}
