import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBuild, useBuildStages, useStageBlocks } from '@/hooks/useBuild'
import { toggleStageComplete, updateBuildField, recalculateProgress, removeBlock, updateBlock, createBlock, deleteBuild } from '@/services/buildService'
import { BlockRenderer } from '@/components/blocks'
import { Button, Spinner, StatusBadge, PriorityBadge, Badge, useToast } from '@/components/ui'
import { STAGES, GENRES } from '@codex/shared'
import type { Block, Build, BuildStatus } from '@codex/shared'

// ─── Key options (for meta editor) ───────────────────────────────────────────

const KEY_OPTIONS = [
  { value: '',   label: 'Unknown' },
  ...['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].flatMap(n => [
    { value: `${n} major`, label: `${n} major` },
    { value: `${n} minor`, label: `${n} minor` },
  ]),
]

const GENRE_OPTIONS = [
  { value: '', label: 'Unknown' },
  ...GENRES.map(g => ({ value: g.value, label: g.label })),
]

// ─── Meta editor ─────────────────────────────────────────────────────────────

function MetaEditor({ build, onClose }: {
  build: NonNullable<ReturnType<typeof useBuild>>
  onClose: () => void
}) {
  const { toast } = useToast()
  const [title,    setTitle]    = useState(build.title)
  const [bpm,      setBpm]      = useState(build.bpm != null ? String(build.bpm) : '')
  const [key,      setKey]      = useState(build.key ?? '')
  const [genre,    setGenre]    = useState(build.genre ?? '')
  const [priority, setPriority] = useState(build.priority)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await updateBuildField(build.id, {
        title:    title.trim(),
        bpm:      bpm ? parseFloat(bpm) : null,
        key:      key  || null,
        genre:    genre || '',
        priority: priority as Build['priority'],
      })
      onClose()
    } catch (err) {
      toast({ title: 'Save failed', description: String(err), variant: 'error' })
    }
  }

  return (
    <form onSubmit={save} className="ws-meta-editor">
      <input
        className="ws-meta-input ws-meta-input--title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Track title"
        required
        autoFocus
      />
      <div className="ws-meta-row">
        <input
          className="ws-meta-input"
          type="number"
          min={60} max={250}
          value={bpm}
          onChange={e => setBpm(e.target.value)}
          placeholder="BPM"
          style={{ width: 80 }}
        />
        <select className="ws-meta-select" value={key} onChange={e => setKey(e.target.value)}>
          {KEY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="ws-meta-select" value={genre} onChange={e => setGenre(e.target.value)}>
          {GENRE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="ws-meta-select" value={priority} onChange={e => setPriority(e.target.value as Build['priority'])}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div className="ws-meta-actions">
        <Button type="submit" variant="primary" size="sm">Save</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}

// ─── Block type picker ────────────────────────────────────────────────────────

type AddMode = 'picker' | 'text' | null

const BLOCK_TYPES = [
  { type: 'text',      label: 'Text note',  icon: '¶' },
  { type: 'checklist', label: 'Checklist',  icon: '✓' },
  { type: 'cards',     label: 'Cards',      icon: '⊞' },
  { type: 'table',     label: 'Table',      icon: '⊟' },
] as const

type QuickBlockType = typeof BLOCK_TYPES[number]['type']

function defaultPayload(type: QuickBlockType): Omit<Block, 'id' | 'buildId' | 'stageKey' | 'order' | 'locked'> {
  switch (type) {
    case 'text':
      return { type: 'text', data: { content: '' } }
    case 'checklist':
      return { type: 'checklist', data: { items: [
        { id: crypto.randomUUID(), text: 'New item', completed: false, priority: 'medium' as const },
      ] } }
    case 'cards':
      return { type: 'cards', data: { cards: [
        { label: 'Label', value: 'Value', variant: 'default' as const },
      ] } }
    case 'table':
      return { type: 'table', data: {
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows:    [['', '', ''], ['', '', '']],
      } }
  }
}

// ─── Stage panel ─────────────────────────────────────────────────────────────

function StagePanel({ buildId, stageKey, stageId, completed }: {
  buildId:   string
  stageKey:  string
  stageId:   string
  completed: boolean
}) {
  const { toast }   = useToast()
  const blocks      = useStageBlocks(buildId, stageKey)
  const [mode, setMode] = useState<AddMode>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleAddText(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const content = textareaRef.current?.value.trim() ?? ''
    if (!content) return
    try {
      await createBlock(buildId, stageKey, (blocks?.length ?? 0) + 1, { type: 'text', data: { content } })
      if (textareaRef.current) textareaRef.current.value = ''
      setMode(null)
    } catch (err) {
      toast({ title: 'Failed to add block', description: String(err), variant: 'error' })
    }
  }

  async function handlePickType(type: QuickBlockType) {
    if (type === 'text') { setMode('text'); return }
    try {
      await createBlock(buildId, stageKey, (blocks?.length ?? 0) + 1, defaultPayload(type))
      setMode(null)
    } catch (err) {
      toast({ title: 'Failed to add block', description: String(err), variant: 'error' })
    }
  }

  async function handleToggleComplete() {
    await toggleStageComplete(stageId, !completed)
    await recalculateProgress(buildId)
  }

  async function handleUpdateBlock(block: Block) {
    try { await updateBlock(block) }
    catch (err) { toast({ title: 'Failed to save', description: String(err), variant: 'error' }) }
  }

  async function handleRemoveBlock(block: Block) {
    try { await removeBlock(block.id) }
    catch (err) { toast({ title: 'Failed to remove block', description: String(err), variant: 'error' }) }
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
        : blocks.length === 0 && !mode
          ? <p className="stage-empty">Nothing here yet — add a block below.</p>
          : (
            <div className="stage-blocks">
              {blocks.map(block => (
                <div key={block.id} className="stage-block-wrap">
                  <BlockRenderer block={block} onUpdate={handleUpdateBlock} />
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

      {/* Block type picker */}
      {mode === 'picker' && (
        <div className="stage-type-picker">
          {BLOCK_TYPES.map(bt => (
            <button key={bt.type} type="button" className="stage-type-btn" onClick={() => handlePickType(bt.type)}>
              <span className="stage-type-btn__icon">{bt.icon}</span>
              <span>{bt.label}</span>
            </button>
          ))}
          <button type="button" className="stage-type-btn stage-type-btn--cancel" onClick={() => setMode(null)}>
            Cancel
          </button>
        </div>
      )}

      {/* Text input */}
      {mode === 'text' && (
        <form onSubmit={handleAddText} className="stage-add-form">
          <textarea
            ref={textareaRef}
            className="stage-add-textarea"
            placeholder="Add a note…"
            rows={4}
            autoFocus
          />
          <div className="stage-add-actions">
            <Button type="submit" variant="primary" size="sm">Add note</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMode(null)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Add block button */}
      {!mode && (
        <button type="button" className="stage-add-btn" onClick={() => setMode('picker')}>
          + Add block
        </button>
      )}
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

  const activeStage    = stages.find(s => s.stageKey === activeKey)
  const completedCount = stages.filter(s => s.completed).length
  const [editingMeta, setEditingMeta] = useState(false)

  async function handleStatusCycle() {
    const cycle: BuildStatus[] = ['idea', 'in-progress', 'mixing', 'mastering', 'done', 'shelved']
    const idx  = cycle.indexOf(build!.status)
    const next = cycle[(idx + 1) % cycle.length]
    await updateBuildField(build!.id, { status: next })
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${build!.title}"? This cannot be undone.`)) return
    await deleteBuild(build!.id)
    navigate('/builds', { replace: true })
  }

  return (
    <div className="ws-page">

      {/* ── Header ── */}
      <div className="ws-header">
        <div className="ws-header-top">
          <button className="ws-back" onClick={() => navigate('/builds')} type="button">
            ← Builds
          </button>
          <div className="ws-header-top-actions">
            <button type="button" className="ws-icon-btn" onClick={() => setEditingMeta(e => !e)} title="Edit details">
              <EditIcon />
            </button>
            <button type="button" className="ws-icon-btn ws-icon-btn--danger" onClick={handleDelete} title="Delete build">
              <TrashIcon />
            </button>
          </div>
        </div>

        {editingMeta
          ? <MetaEditor build={build} onClose={() => setEditingMeta(false)} />
          : (
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
          )
        }
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
        .ws-header-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-2); }
        .ws-header-top-actions { display:flex; gap:var(--space-1); }
        .ws-back { background:none; border:none; color:var(--color-text-muted); cursor:pointer; font-size:var(--text-sm); padding:0; }
        .ws-back:hover { color:var(--color-text); }
        .ws-icon-btn { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border:1px solid transparent; border-radius:var(--radius-sm); background:none; color:var(--color-text-faint); cursor:pointer; transition:all var(--transition-fast); }
        .ws-icon-btn:hover { background:var(--color-surface-hover); border-color:var(--color-border); color:var(--color-text); }
        .ws-icon-btn--danger:hover { background:var(--color-danger-muted); border-color:var(--color-danger); color:var(--color-danger); }
        .ws-meta-editor { display:flex; flex-direction:column; gap:var(--space-2); padding:var(--space-3); background:var(--color-bg-2); border:1px solid var(--color-border); border-radius:var(--radius-md); }
        .ws-meta-input { padding:var(--space-2) var(--space-3); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-sm); color:var(--color-text); font-size:var(--text-sm); font-family:inherit; outline:none; }
        .ws-meta-input:focus { border-color:var(--color-accent-cyan); }
        .ws-meta-input--title { font-size:var(--text-base); font-weight:var(--font-weight-semibold); }
        .ws-meta-select { padding:var(--space-2) var(--space-3); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-sm); color:var(--color-text); font-size:var(--text-sm); outline:none; }
        .ws-meta-select:focus { border-color:var(--color-accent-cyan); }
        .ws-meta-row { display:flex; gap:var(--space-2); flex-wrap:wrap; }
        .ws-meta-actions { display:flex; gap:var(--space-2); }
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
        .stage-type-picker { display:flex; flex-wrap:wrap; gap:var(--space-2); padding:var(--space-3); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md); }
        .stage-type-btn { display:flex; align-items:center; gap:var(--space-1); padding:var(--space-2) var(--space-3); border:1px solid var(--color-border); border-radius:var(--radius-sm); background:var(--color-bg-2); color:var(--color-text-muted); cursor:pointer; font-size:var(--text-sm); transition:all var(--transition-fast); }
        .stage-type-btn:hover { border-color:var(--color-accent-cyan); color:var(--color-accent-cyan); background:var(--color-surface-hover); }
        .stage-type-btn__icon { font-size:var(--text-base); opacity:0.7; }
        .stage-type-btn--cancel { color:var(--color-text-faint); margin-left:auto; }
        .block--editable { cursor:pointer; }
        .block--editable:hover { outline:1px solid var(--color-border); border-radius:var(--radius-md); }
        .block-text__editor { width:100%; box-sizing:border-box; padding:var(--space-2); background:var(--color-bg-2); border:1px solid var(--color-accent-cyan); border-radius:var(--radius-sm); color:var(--color-text); font-size:var(--text-base); font-family:inherit; resize:vertical; outline:none; line-height:var(--leading-relaxed); }
        .block-text__hint { font-size:var(--text-xs); color:var(--color-text-faint); margin-top:var(--space-1); }
      `}</style>
    </div>
  )
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M9.5 1.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M2 3.5h9M5 3.5V2.5h3v1M3.5 3.5l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
