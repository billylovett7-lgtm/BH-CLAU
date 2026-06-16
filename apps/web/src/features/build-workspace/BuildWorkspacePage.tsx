import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBuild, useBuildStages, useStageBlocks } from '@/hooks/useBuild'
import { addTextBlock, toggleStageComplete, updateBuildField, recalculateProgress, removeBlock } from '@/services/buildService'
import { BlockRenderer } from '@/components/blocks'
import { Button, Spinner, StatusBadge, PriorityBadge, Badge, useToast } from '@/components/ui'
import { STAGES } from '@codex/shared'
import type { Block, BuildStatus } from '@codex/shared'

// ─── Stage panel ─────────────────────────────────────────────────────────────

function StagePanel({ buildId, stageKey, stageId, completed }: {
  buildId:   string
  stageKey:  string
  stageId:   string
  completed: boolean
}) {
  const { toast }     = useToast()
  const blocks        = useStageBlocks(buildId, stageKey)
  const [adding, setAdding] = useState(false)
  const textareaRef   = useRef<HTMLTextAreaElement>(null)

  async function handleAddNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const content = textareaRef.current?.value.trim() ?? ''
    if (!content) return
    try {
      const order = (blocks?.length ?? 0) + 1
      await addTextBlock(buildId, stageKey, content, order)
      if (textareaRef.current) textareaRef.current.value = ''
      setAdding(false)
    } catch (err) {
      toast({ title: 'Failed to add note', description: String(err), variant: 'error' })
    }
  }

  async function handleToggleComplete() {
    await toggleStageComplete(stageId, !completed)
    await recalculateProgress(buildId)
  }

  async function handleRemoveBlock(block: Block) {
    try {
      await removeBlock(block.id)
    } catch (err) {
      toast({ title: 'Failed to remove block', description: String(err), variant: 'error' })
    }
  }

  return (
    <div className="stage-panel">
      {/* Stage completion toggle */}
      <div className="stage-panel__controls">
        <button
          type="button"
          className={`stage-check${completed ? ' stage-check--done' : ''}`}
          onClick={handleToggleComplete}
          aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {completed ? '✓ Done' : 'Mark done'}
        </button>
      </div>

      {/* Blocks */}
      {blocks === undefined
        ? <Spinner size="sm" />
        : blocks.length === 0 && !adding
          ? <p className="stage-empty">No notes yet. Add a note to get started.</p>
          : (
            <div className="stage-blocks">
              {blocks.map(block => (
                <div key={block.id} className="stage-block-wrap">
                  <BlockRenderer block={block} />
                  <button
                    type="button"
                    className="stage-block-remove"
                    onClick={() => handleRemoveBlock(block)}
                    aria-label="Remove block"
                  >×</button>
                </div>
              ))}
            </div>
          )
      }

      {/* Add note form */}
      {adding
        ? (
          <form onSubmit={handleAddNote} className="stage-add-form">
            <textarea
              ref={textareaRef}
              className="stage-add-textarea"
              placeholder="Add a note…"
              rows={4}
              autoFocus
            />
            <div className="stage-add-actions">
              <Button type="submit" variant="primary" size="sm">Add note</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </form>
        )
        : (
          <button type="button" className="stage-add-btn" onClick={() => setAdding(true)}>
            + Add text note
          </button>
        )
      }
    </div>
  )
}

// ─── Progress ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r    = 18
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width="44" height="44" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--color-bg-3)" strokeWidth="3" />
      <circle cx="22" cy="22" r={r} fill="none"
        stroke="var(--color-accent-lime)" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BuildWorkspacePage() {
  const { id }      = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const build       = useBuild(id ?? '')
  const stages      = useBuildStages(id ?? '')
  const [activeKey, setActiveKey] = useState<string>(STAGES[0].key)

  if (build === undefined || stages === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (build === null) {
    return (
      <div className="ws-not-found">
        <h1>Build not found</h1>
        <Button variant="ghost" onClick={() => navigate('/builds')}>Back to builds</Button>
      </div>
    )
  }

  const activeStage = stages.find(s => s.stageKey === activeKey)
  const completedCount = stages.filter(s => s.completed).length

  async function handleStatusCycle() {
    const cycle: BuildStatus[] = ['idea', 'in-progress', 'mixing', 'mastering', 'done', 'shelved']
    const idx  = cycle.indexOf(build!.status)
    const next = cycle[(idx + 1) % cycle.length]
    await updateBuildField(build!.id, { status: next })
  }

  return (
    <div className="ws-page">

      {/* ── Header ── */}
      <div className="ws-header">
        <button className="ws-back" onClick={() => navigate('/builds')} type="button">
          ← Builds
        </button>

        <div className="ws-title-row">
          <div className="ws-title-group">
            <h1 className="ws-title">{build.title}</h1>
            <div className="ws-meta">
              {[
                build.genre?.replace(/-/g, ' '),
                build.bpm ? `${build.bpm} BPM` : '',
                build.key ?? '',
              ].filter(Boolean).join(' · ')}
            </div>
          </div>

          <div className="ws-header-actions">
            <ProgressRing pct={build.progress} />
            <div className="ws-header-badges">
              <button type="button" className="ws-status-btn" onClick={handleStatusCycle}>
                <StatusBadge status={build.status} />
              </button>
              <PriorityBadge priority={build.priority} />
              <Badge variant="default">{completedCount}/{stages.length} stages</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stage tabs ── */}
      <div className="ws-tabs" role="tablist" aria-label="Build stages">
        {STAGES.map(s => {
          const dbStage = stages.find(st => st.stageKey === s.key)
          return (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={activeKey === s.key}
              className={[
                'ws-tab',
                activeKey === s.key ? 'ws-tab--active' : '',
                dbStage?.completed   ? 'ws-tab--done'   : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setActiveKey(s.key)}
            >
              <span className="ws-tab__num">{s.order}</span>
              <span className="ws-tab__label">{s.title}</span>
              {dbStage?.completed && <span className="ws-tab__check" aria-hidden>✓</span>}
            </button>
          )
        })}
      </div>

      {/* ── Active stage ── */}
      <div className="ws-stage-area" role="tabpanel">
        {activeStage && (
          <>
            <div className="ws-stage-header">
              <div>
                <div className="ws-stage-title">{activeStage.title}</div>
                <div className="ws-stage-desc">
                  {STAGES.find(s => s.key === activeKey)?.description}
                </div>
              </div>
            </div>

            <StagePanel
              buildId={build.id}
              stageKey={activeKey}
              stageId={activeStage.id}
              completed={activeStage.completed}
            />
          </>
        )}
      </div>

      <style>{`
        .ws-page { display:flex; flex-direction:column; height:100%; min-height:0; }
        .ws-header { padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border); background:var(--color-surface); }
        .ws-back { background:none; border:none; color:var(--color-text-muted); cursor:pointer; font-size:var(--text-sm); padding:0; margin-bottom:var(--space-2); display:block; }
        .ws-back:hover { color:var(--color-text); }
        .ws-title-row { display:flex; align-items:center; justify-content:space-between; gap:var(--space-4); flex-wrap:wrap; }
        .ws-title-group { min-width:0; }
        .ws-title { font-size:var(--text-xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0 0 var(--space-1); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:500px; }
        .ws-meta { font-size:var(--text-sm); color:var(--color-text-faint); text-transform:capitalize; }
        .ws-header-actions { display:flex; align-items:center; gap:var(--space-3); flex-shrink:0; }
        .ws-header-badges { display:flex; flex-direction:column; align-items:flex-end; gap:var(--space-1); }
        .ws-status-btn { background:none; border:none; padding:0; cursor:pointer; }
        .ws-tabs { display:flex; overflow-x:auto; padding:0 var(--space-5); background:var(--color-surface); border-bottom:1px solid var(--color-border); gap:0; scrollbar-width:none; }
        .ws-tabs::-webkit-scrollbar { display:none; }
        .ws-tab { display:flex; align-items:center; gap:var(--space-1); padding:var(--space-2) var(--space-3); border:none; border-bottom:2px solid transparent; background:none; color:var(--color-text-faint); cursor:pointer; white-space:nowrap; font-size:var(--text-sm); transition:color var(--transition-fast),border-color var(--transition-fast); }
        .ws-tab:hover { color:var(--color-text); }
        .ws-tab--active { color:var(--color-text); border-bottom-color:var(--color-accent-cyan); }
        .ws-tab--done .ws-tab__label { color:var(--color-accent-lime); }
        .ws-tab__num { font-size:var(--text-xs); font-family:var(--font-mono); opacity:0.5; }
        .ws-tab__label { font-weight:var(--font-weight-medium); }
        .ws-tab__check { font-size:var(--text-xs); color:var(--color-accent-lime); margin-left:2px; }
        .ws-stage-area { flex:1; overflow-y:auto; padding:var(--space-5); max-width:820px; width:100%; margin:0 auto; }
        .ws-stage-header { margin-bottom:var(--space-5); }
        .ws-stage-title { font-size:var(--text-lg); font-weight:var(--font-weight-bold); color:var(--color-text); margin-bottom:var(--space-1); }
        .ws-stage-desc { font-size:var(--text-sm); color:var(--color-text-faint); }
        .ws-not-found { display:flex; flex-direction:column; align-items:center; gap:var(--space-4); padding:var(--space-16); text-align:center; color:var(--color-text-muted); }
        /* ─ stage panel ─ */
        .stage-panel { display:flex; flex-direction:column; gap:var(--space-4); }
        .stage-panel__controls { display:flex; align-items:center; justify-content:flex-end; }
        .stage-check { border:1px solid var(--color-border); border-radius:var(--radius-sm); background:transparent; color:var(--color-text-faint); padding:var(--space-1) var(--space-2); font-size:var(--text-xs); cursor:pointer; transition:all var(--transition-fast); }
        .stage-check:hover { border-color:var(--color-accent-lime); color:var(--color-accent-lime); }
        .stage-check--done { border-color:var(--color-accent-lime); color:var(--color-accent-lime); background:rgba(200,241,53,0.08); }
        .stage-empty { font-size:var(--text-base); color:var(--color-text-faint); text-align:center; padding:var(--space-6) 0; margin:0; }
        .stage-blocks { display:flex; flex-direction:column; gap:var(--space-3); }
        .stage-block-wrap { position:relative; }
        .stage-block-remove { position:absolute; top:var(--space-2); right:var(--space-2); width:22px; height:22px; border-radius:var(--radius-sm); border:none; background:var(--color-bg-3); color:var(--color-text-faint); cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity var(--transition-fast); }
        .stage-block-wrap:hover .stage-block-remove { opacity:1; }
        .stage-block-remove:hover { background:var(--color-danger-muted); color:var(--color-danger); }
        .stage-add-form { display:flex; flex-direction:column; gap:var(--space-2); }
        .stage-add-textarea { width:100%; box-sizing:border-box; padding:var(--space-3); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md); color:var(--color-text); font-size:var(--text-base); font-family:inherit; resize:vertical; outline:none; }
        .stage-add-textarea:focus { border-color:var(--color-accent-cyan); }
        .stage-add-actions { display:flex; gap:var(--space-2); }
        .stage-add-btn { border:1px dashed var(--color-border); border-radius:var(--radius-md); background:transparent; color:var(--color-text-faint); padding:var(--space-3); width:100%; cursor:pointer; font-size:var(--text-sm); transition:border-color var(--transition-fast),color var(--transition-fast); text-align:center; }
        .stage-add-btn:hover { border-color:var(--color-accent-cyan); color:var(--color-accent-cyan); }
      `}</style>
    </div>
  )
}
