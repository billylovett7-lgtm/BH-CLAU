import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, useToast } from '@/components/ui'
import { createBuild } from '@/services/buildService'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { GENRES, TEMPLATES } from '@codex/shared'
import type { BuildTemplate } from '@codex/shared'

// ─── Key options ──────────────────────────────────────────────────────────────

const KEY_OPTIONS = [
  { value: '',    label: 'Unknown' },
  ...['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    .flatMap(n => [
      { value: `${n} major`, label: `${n} major` },
      { value: `${n} minor`, label: `${n} minor` },
    ]),
]

const GENRE_OPTIONS = [
  { value: '', label: 'Select genre…' },
  ...GENRES.map(g => ({ value: g.value, label: g.label })),
]

const STATUS_OPTIONS = [
  { value: 'in-progress', label: 'In Progress' },
  { value: 'on-hold',     label: 'On Hold'     },
]

const PRIORITY_OPTIONS = [
  { value: 'high',   label: 'High'   },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low'    },
]

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({
  tpl,
  selected,
  onSelect,
}: {
  tpl:      BuildTemplate
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`tpl-card${selected ? ' tpl-card--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="tpl-card__title">{tpl.title}</div>
      <div className="tpl-card__desc">{tpl.description}</div>
      <div className="tpl-card__meta">
        {tpl.genre.replace(/-/g, ' ')} · {tpl.bpm} BPM
      </div>
      <div className="tpl-card__tags">
        {tpl.tags.map(t => (
          <span key={t} className="tpl-tag">{t}</span>
        ))}
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function NewBuildPage() {
  const navigate             = useNavigate()
  const { toast }            = useToast()
  const { userId, workspaceId } = useCurrentUser()

  // form state
  const [title,    setTitle]    = useState('')
  const [genre,    setGenre]    = useState('')
  const [bpm,      setBpm]      = useState('')
  const [key,      setKey]      = useState('')
  const [status,   setStatus]   = useState('in-progress')
  const [priority, setPriority] = useState('medium')
  const [template, setTemplate] = useState<BuildTemplate | null>(null)
  const [saving,   setSaving]   = useState(false)

  // apply template to form fields
  function applyTemplate(tpl: BuildTemplate) {
    if (template?.id === tpl.id) {
      setTemplate(null)
      return
    }
    setTemplate(tpl)
    if (!title) setTitle(tpl.title)
    setGenre(tpl.genre)
    setBpm(String(tpl.bpm))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    try {
      const id = await createBuild(
        {
          title:    title.trim(),
          genre:    genre || undefined,
          bpm:      bpm ? parseFloat(bpm) : null,
          key:      key || null,
          status:   status as 'in-progress' | 'on-hold',
          priority: priority as 'high' | 'medium' | 'low',
        },
        userId,
        workspaceId,
      )
      navigate(`/builds/${id}`, { replace: true })
    } catch (err) {
      toast({ title: 'Failed to create build', description: String(err), variant: 'error' })
      setSaving(false)
    }
  }

  return (
    <div className="new-build-page">
      <div className="new-build-header">
        <button className="new-build-back" onClick={() => navigate('/builds')} type="button">
          ← Back
        </button>
        <h1 className="new-build-heading">New build</h1>
      </div>

      <form onSubmit={handleSubmit} className="new-build-form">

        {/* ── Template picker ── */}
        <section className="new-build-section">
          <h2 className="new-build-section-title">Start from a template (optional)</h2>
          <div className="tpl-grid">
            {TEMPLATES.map(tpl => (
              <TemplateCard
                key={tpl.id}
                tpl={tpl}
                selected={template?.id === tpl.id}
                onSelect={() => applyTemplate(tpl)}
              />
            ))}
          </div>
        </section>

        {/* ── Core fields ── */}
        <section className="new-build-section">
          <h2 className="new-build-section-title">Build details</h2>
          <div className="new-build-fields">
            <Input
              label="Title"
              required
              placeholder="e.g. Deep House WIP June 16"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />

            <div className="new-build-row">
              <div style={{ flex: 1 }}>
                <label className="field__label">Genre</label>
                <Select value={genre} onChange={setGenre} options={GENRE_OPTIONS} />
              </div>
              <div style={{ width: 120 }}>
                <Input
                  label="BPM"
                  type="number"
                  placeholder="128"
                  min={60} max={250}
                  value={bpm}
                  onChange={e => setBpm(e.target.value)}
                />
              </div>
            </div>

            <div className="new-build-row">
              <div style={{ flex: 1 }}>
                <label className="field__label">Key</label>
                <Select value={key} onChange={setKey} options={KEY_OPTIONS} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field__label">Status</label>
                <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field__label">Priority</label>
                <Select value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Actions ── */}
        <div className="new-build-actions">
          <Button type="button" variant="ghost" onClick={() => navigate('/builds')}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving} disabled={!title.trim()}>
            Create build
          </Button>
        </div>
      </form>

      <style>{`
        .new-build-page { max-width:720px; margin:0 auto; padding:var(--space-6) var(--space-4); }
        .new-build-header { display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-6); }
        .new-build-back { background:none; border:none; color:var(--color-text-muted); cursor:pointer; font-size:var(--text-sm); padding:0; }
        .new-build-back:hover { color:var(--color-text); }
        .new-build-heading { font-size:var(--text-2xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0; }
        .new-build-form { display:flex; flex-direction:column; gap:var(--space-8); }
        .new-build-section { display:flex; flex-direction:column; gap:var(--space-4); }
        .new-build-section-title { font-size:var(--text-sm); font-weight:var(--font-weight-semibold); color:var(--color-text-faint); text-transform:uppercase; letter-spacing:0.08em; margin:0; }
        .new-build-fields { display:flex; flex-direction:column; gap:var(--space-4); }
        .new-build-row { display:flex; gap:var(--space-3); flex-wrap:wrap; }
        .new-build-actions { display:flex; justify-content:flex-end; gap:var(--space-3); padding-top:var(--space-2); border-top:1px solid var(--color-border); }
        .tpl-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:var(--space-3); }
        .tpl-card { text-align:left; display:flex; flex-direction:column; gap:var(--space-2); padding:var(--space-3); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); cursor:pointer; transition:background var(--transition-fast),border-color var(--transition-fast); }
        .tpl-card:hover { background:var(--color-surface-hover); border-color:#333; }
        .tpl-card--selected { border-color:var(--color-accent-lime); background:rgba(200,241,53,0.06); }
        .tpl-card__title { font-size:var(--text-base); font-weight:var(--font-weight-semibold); color:var(--color-text); }
        .tpl-card__desc { font-size:var(--text-sm); color:var(--color-text-muted); line-height:var(--leading-relaxed); }
        .tpl-card__meta { font-size:var(--text-xs); color:var(--color-text-faint); text-transform:capitalize; }
        .tpl-card__tags { display:flex; flex-wrap:wrap; gap:4px; }
        .tpl-tag { font-size:var(--text-xs); padding:2px 6px; background:var(--color-bg-3); border-radius:var(--radius-sm); color:var(--color-text-faint); }
        .field__label { display:block; font-size:var(--text-sm); font-weight:var(--font-weight-medium); color:var(--color-text-muted); margin-bottom:var(--space-1); }
      `}</style>
    </div>
  )
}
