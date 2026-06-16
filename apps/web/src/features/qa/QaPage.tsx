import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getQaItems, upsertQaItem, upsertQaItems } from '@/services/localDb'
import { Badge, Select, Spinner, Button, useToast } from '@/components/ui'
import type { QaItem } from '@codex/shared'

// ─── Built-in QA checklist ────────────────────────────────────────────────────

const DEFAULT_ITEMS: Omit<QaItem, 'id' | 'status' | 'note' | 'createdAt'>[] = [
  // Import
  { scope: 'import', title: 'HTML file imports without console errors' },
  { scope: 'import', title: 'JSON backup round-trips correctly (export → import → compare)' },
  { scope: 'import', title: 'MIDI file generates correct step grid' },
  { scope: 'import', title: 'Duplicate file shows warning banner' },
  { scope: 'import', title: 'Unsupported file type shows error, not crash' },
  // Build
  { scope: 'build',  title: 'Create new build from blank' },
  { scope: 'build',  title: 'Create new build from template (metadata pre-filled)' },
  { scope: 'build',  title: 'Add text note to each stage' },
  { scope: 'build',  title: 'Mark stage complete — progress ring updates' },
  { scope: 'build',  title: 'Builds list filter by status works' },
  { scope: 'build',  title: 'Builds list sort by priority works' },
  // Library
  { scope: 'library', title: 'Chain rack detail drawer shows devices and macros' },
  { scope: 'library', title: 'MIDI pattern detail shows clip variations' },
  { scope: 'library', title: 'Sample detail shows duration and format' },
  { scope: 'library', title: 'Arrangement timeline renders correctly' },
  { scope: 'library', title: 'Groove velocity bars render proportionally' },
  // Compare
  { scope: 'global', title: 'Compare page shows both build stage blocks side by side' },
  { scope: 'global', title: 'Stage selector changes both columns' },
  // Storage
  { scope: 'global', title: 'Storage page shows accurate entity counts' },
  { scope: 'global', title: 'Backup download produces valid JSON' },
  { scope: 'global', title: 'Restore from backup restores all data' },
  // Mobile
  { scope: 'mobile', title: 'Dashboard renders without horizontal overflow on 375px' },
  { scope: 'mobile', title: 'Build workspace tabs scroll horizontally on mobile' },
  { scope: 'mobile', title: 'Drop zone works with camera roll on iOS Safari' },
  // Accessibility
  { scope: 'a11y',   title: 'All interactive elements are keyboard accessible' },
  { scope: 'a11y',   title: 'All images have alt text or aria-hidden' },
  { scope: 'a11y',   title: 'Color contrast meets WCAG AA (check lime on dark bg)' },
  { scope: 'a11y',   title: 'Screen reader announces badge text' },
  // Security
  { scope: 'security', title: 'Imported HTML source does not execute scripts' },
  { scope: 'security', title: 'No innerHTML used anywhere in block renderers' },
  { scope: 'security', title: 'LocalStorage keys are namespaced (codex:)' },
  // Performance
  { scope: 'performance', title: 'Dashboard loads with 100+ builds in < 300ms' },
  { scope: 'performance', title: 'Dexie queries do not fire on unrelated state changes' },
]

const SCOPE_OPTS = [
  { value: 'all',         label: 'All scopes'   },
  { value: 'global',      label: 'Global'       },
  { value: 'import',      label: 'Import'       },
  { value: 'build',       label: 'Build'        },
  { value: 'library',     label: 'Library'      },
  { value: 'mobile',      label: 'Mobile'       },
  { value: 'a11y',        label: 'Accessibility'},
  { value: 'security',    label: 'Security'     },
  { value: 'performance', label: 'Performance'  },
]

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
  pass: 'success', fail: 'danger', skip: 'warning', pending: 'default',
}

function StatusCycle({ item, onChange }: { item: QaItem; onChange: (s: QaItem['status']) => void }) {
  const cycle: QaItem['status'][] = ['pending', 'pass', 'fail', 'skip']
  function next() {
    const idx = cycle.indexOf(item.status)
    onChange(cycle[(idx + 1) % cycle.length])
  }
  return (
    <button type="button" className="qa-status-btn" onClick={next} aria-label={`Status: ${item.status}. Click to cycle.`}>
      <Badge variant={STATUS_VARIANT[item.status]}>{item.status}</Badge>
    </button>
  )
}

function QaRow({ item, onUpdate }: { item: QaItem; onUpdate: (updated: QaItem) => void }) {
  const [editing, setEditing] = useState(false)
  const [note,    setNote]    = useState(item.note)

  async function saveNote() {
    await onUpdate({ ...item, note: note.trim() })
    setEditing(false)
  }

  return (
    <div className={`qa-row qa-row--${item.status}`}>
      <StatusCycle item={item} onChange={s => onUpdate({ ...item, status: s })} />
      <div className="qa-row__main">
        <div className="qa-row__title">{item.title}</div>
        {editing
          ? (
            <div className="qa-note-form">
              <input
                className="qa-note-input"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note…"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') saveNote(); if (e.key === 'Escape') setEditing(false) }}
              />
              <button type="button" className="qa-note-save" onClick={saveNote}>Save</button>
              <button type="button" className="qa-note-cancel" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          )
          : item.note
            ? (
              <div className="qa-note" role="button" tabIndex={0} onClick={() => setEditing(true)}
                onKeyDown={e => e.key === 'Enter' && setEditing(true)}>
                {item.note}
              </div>
            )
            : (
              <button type="button" className="qa-add-note" onClick={() => setEditing(true)}>+ Add note</button>
            )
        }
      </div>
      <Badge variant="default">{item.scope}</Badge>
    </div>
  )
}

export function QaPage() {
  const { toast } = useToast()
  const items = useLiveQuery(() => getQaItems())
  const [scopeF, setScopeF] = useState('all')
  const [seeded, setSeeded] = useState(false)

  // Seed default items once
  useEffect(() => {
    if (seeded || items === undefined) return
    setSeeded(true)
    if (items.length === 0) {
      const now = new Date().toISOString()
      const defaults: QaItem[] = DEFAULT_ITEMS.map(d => ({
        ...d,
        id:        crypto.randomUUID(),
        status:    'pending',
        note:      '',
        createdAt: now,
      }))
      upsertQaItems(defaults).catch(console.error)
    }
  }, [items, seeded])

  async function handleUpdate(updated: QaItem) {
    try { await upsertQaItem(updated) }
    catch (err) { toast({ title: 'Failed to save', description: String(err), variant: 'error' }) }
  }

  async function handleResetAll() {
    if (!items) return
    try {
      await upsertQaItems(items.map(i => ({ ...i, status: 'pending' as const, note: '' })))
      toast({ title: 'All items reset to pending', variant: 'success' })
    } catch (err) {
      toast({ title: 'Reset failed', description: String(err), variant: 'error' })
    }
  }

  if (items === undefined) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Spinner size="lg" /></div>

  const filtered = scopeF === 'all' ? items : items.filter(i => i.scope === scopeF)

  const counts = {
    pass:    items.filter(i => i.status === 'pass').length,
    fail:    items.filter(i => i.status === 'fail').length,
    skip:    items.filter(i => i.status === 'skip').length,
    pending: items.filter(i => i.status === 'pending').length,
  }

  return (
    <div className="qa-page">
      <div className="qa-header">
        <h1 className="qa-heading">QA Checklist</h1>
        <Button variant="ghost" size="sm" onClick={handleResetAll}>Reset all</Button>
      </div>

      {/* Summary */}
      <div className="qa-summary">
        {(['pass', 'fail', 'skip', 'pending'] as const).map(s => (
          <div key={s} className="qa-summary-item">
            <Badge variant={STATUS_VARIANT[s]}>{s}</Badge>
            <span className="qa-summary-count">{counts[s]}</span>
          </div>
        ))}
        <div className="qa-summary-item">
          <span className="qa-summary-pct">
            {items.length ? Math.round((counts.pass / items.length) * 100) : 0}% passing
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="qa-toolbar">
        <Select value={scopeF} onChange={setScopeF} options={SCOPE_OPTS} />
        <span className="qa-count">{filtered.length} items</span>
      </div>

      {/* List */}
      <div className="qa-list">
        {filtered.map(item => (
          <QaRow key={item.id} item={item} onUpdate={handleUpdate} />
        ))}
      </div>

      <style>{`
        .qa-page { max-width:780px; margin:0 auto; padding:var(--space-6) var(--space-4); display:flex; flex-direction:column; gap:var(--space-5); }
        .qa-header { display:flex; align-items:center; justify-content:space-between; }
        .qa-heading { font-size:var(--text-2xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0; }
        .qa-summary { display:flex; align-items:center; gap:var(--space-4); flex-wrap:wrap; padding:var(--space-3) var(--space-4); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); }
        .qa-summary-item { display:flex; align-items:center; gap:var(--space-2); }
        .qa-summary-count { font-size:var(--text-lg); font-weight:var(--font-weight-bold); font-family:var(--font-mono); color:var(--color-text); }
        .qa-summary-pct { font-size:var(--text-base); font-weight:var(--font-weight-semibold); color:var(--color-accent-lime); margin-left:auto; }
        .qa-toolbar { display:flex; align-items:center; gap:var(--space-3); }
        .qa-count { font-size:var(--text-sm); color:var(--color-text-faint); }
        .qa-list { display:flex; flex-direction:column; gap:0; border:1px solid var(--color-border); border-radius:var(--radius-lg); overflow:hidden; }
        .qa-row { display:flex; align-items:flex-start; gap:var(--space-3); padding:var(--space-3) var(--space-4); border-bottom:1px solid var(--color-border-subtle); }
        .qa-row:last-child { border-bottom:none; }
        .qa-row--pass { background:rgba(200,241,53,0.03); }
        .qa-row--fail { background:rgba(255,59,59,0.04); }
        .qa-row--skip { background:rgba(255,170,0,0.03); }
        .qa-status-btn { background:none; border:none; padding:0; cursor:pointer; flex-shrink:0; margin-top:1px; }
        .qa-row__main { flex:1; min-width:0; display:flex; flex-direction:column; gap:var(--space-1); }
        .qa-row__title { font-size:var(--text-base); color:var(--color-text-muted); line-height:var(--leading-snug); }
        .qa-note { font-size:var(--text-sm); color:var(--color-text-faint); font-style:italic; cursor:pointer; }
        .qa-note:hover { color:var(--color-text-muted); }
        .qa-add-note { background:none; border:none; padding:0; font-size:var(--text-xs); color:var(--color-text-faint); cursor:pointer; }
        .qa-add-note:hover { color:var(--color-accent-cyan); }
        .qa-note-form { display:flex; align-items:center; gap:var(--space-2); }
        .qa-note-input { flex:1; padding:2px 6px; border:1px solid var(--color-accent-cyan); border-radius:var(--radius-sm); background:var(--color-surface); color:var(--color-text); font-size:var(--text-sm); outline:none; }
        .qa-note-save,.qa-note-cancel { background:none; border:none; font-size:var(--text-xs); cursor:pointer; padding:0; }
        .qa-note-save { color:var(--color-accent-lime); }
        .qa-note-cancel { color:var(--color-text-faint); }
      `}</style>
    </div>
  )
}
