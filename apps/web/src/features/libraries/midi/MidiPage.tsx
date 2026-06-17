import { useState } from 'react'
import { useMidiPatterns } from '@/hooks/useLibrary'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Badge, Spinner, EmptyState, Select } from '@/components/ui'
import { softDeleteMidiPattern } from '@/services/localDb'
import type { MidiPattern } from '@codex/shared'

const TYPE_OPTS = [
  { value: 'all',    label: 'All types' },
  { value: 'drum',   label: 'Drum'    },
  { value: 'bass',   label: 'Bass'    },
  { value: 'chord',  label: 'Chord'   },
  { value: 'melody', label: 'Melody'  },
  { value: 'perc',   label: 'Perc'    },
  { value: 'other',  label: 'Other'   },
]

const TYPE_VARIANT: Record<string, 'lime' | 'cyan' | 'blue' | 'purple' | 'default'> = {
  drum: 'lime', bass: 'cyan', chord: 'blue', melody: 'purple', perc: 'default',
}

function PatternDetail({ p, onClose, onDelete }: { p: MidiPattern; onClose: () => void; onDelete: () => void }) {
  return (
    <div className="lib-drawer">
      <div className="lib-drawer__header">
        <div>
          <div className="lib-drawer__title">{p.name}</div>
          <div className="lib-drawer__sub">
            <Badge variant={TYPE_VARIANT[p.type] ?? 'default'}>{p.type}</Badge>
          </div>
        </div>
        <button className="lib-drawer__close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="lib-drawer__body">
        <div className="lib-dl">
          {p.genre && <><dt>Genre</dt><dd className="capitalize">{p.genre.replace(/-/g, ' ')}</dd></>}
          {p.bpm   && <><dt>BPM</dt><dd>{p.bpm}</dd></>}
          {p.key   && <><dt>Key</dt><dd>{p.key}</dd></>}
          {p.scale && <><dt>Scale</dt><dd>{p.scale}</dd></>}
          <dt>Bars</dt><dd>{p.bars}</dd>
          <dt>Grid</dt><dd>1/{p.grid}</dd>
          {p.swing > 0 && <><dt>Swing</dt><dd>{p.swing}%</dd></>}
          <dt>Notes</dt><dd>{p.noteEvents.length} events</dd>
        </div>

        {p.clipVariations.length > 0 && (
          <section className="lib-section">
            <h3 className="lib-section__title">Clip variations ({p.clipVariations.length})</h3>
            <div className="lib-list-inner">
              {p.clipVariations.map((v, i) => (
                <div key={i} className="lib-inner-row">
                  <span className="lib-inner-name">{v.name}</span>
                  <span className="lib-inner-meta">{v.noteEvents.length} events</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {p.placement && (
          <section className="lib-section">
            <h3 className="lib-section__title">Placement</h3>
            <p className="lib-notes">{p.placement}</p>
          </section>
        )}

        {p.tags.length > 0 && (
          <div className="lib-chip-list">
            {p.tags.map(t => <Badge key={t} variant="default">{t}</Badge>)}
          </div>
        )}
      </div>
      <div className="lib-drawer__footer">
        <button type="button" className="lib-drawer__delete" onClick={onDelete}>Delete pattern</button>
      </div>
    </div>
  )
}

export function MidiPage() {
  const { workspaceId } = useCurrentUser()
  const patterns = useMidiPatterns(workspaceId)
  const [search,   setSearch]   = useState('')
  const [typeF,    setTypeF]    = useState('all')
  const [selected, setSelected] = useState<MidiPattern | null>(null)

  if (patterns === undefined) return <div className="lib-loading"><Spinner size="lg" /></div>

  const filtered = patterns.filter(p => {
    const q = search.toLowerCase().trim()
    return (
      (!q || p.name.toLowerCase().includes(q)) &&
      (typeF === 'all' || p.type === typeF)
    )
  })

  return (
    <div className={`lib-page${selected ? ' lib-page--split' : ''}`}>
      <div className="lib-list-col">
        <div className="lib-toolbar">
          <h1 className="lib-heading">MIDI Patterns</h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input className="lib-search" type="search" placeholder="Search…" value={search}
              onChange={e => setSearch(e.target.value)} aria-label="Search patterns" />
            <Select value={typeF} onChange={setTypeF} options={TYPE_OPTS} />
          </div>
        </div>
        <div className="lib-count">{filtered.length} pattern{filtered.length !== 1 ? 's' : ''}</div>

        {filtered.length === 0
          ? <EmptyState title={patterns.length === 0 ? 'No MIDI patterns' : 'No results'}
              description={patterns.length === 0 ? 'MIDI patterns from imported builds appear here.' : 'Try a different search.'} />
          : (
            <div className="lib-list">
              {filtered.map(p => (
                <button key={p.id} type="button"
                  className={`lib-row${selected?.id === p.id ? ' lib-row--active' : ''}`}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}>
                  <div className="lib-row__main">
                    <span className="lib-row__name">{p.name}</span>
                    {(p.genre || p.bpm) && (
                      <span className="lib-row__sub">
                        {[p.genre?.replace(/-/g,' '), p.bpm ? `${p.bpm} BPM` : ''].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                  <div className="lib-row__meta">
                    <Badge variant={TYPE_VARIANT[p.type] ?? 'default'}>{p.type}</Badge>
                    <span className="lib-row__count">{p.bars}B · 1/{p.grid}</span>
                  </div>
                </button>
              ))}
            </div>
          )
        }
      </div>

      {selected && <PatternDetail p={selected} onClose={() => setSelected(null)} onDelete={async () => { await softDeleteMidiPattern(selected.id); setSelected(null) }} />}
      <LibSharedStyles />
    </div>
  )
}

function LibSharedStyles() {
  return (
    <style>{`
      .lib-page { display:flex; gap:0; height:100%; min-height:0; }
      .lib-list-col { flex:1; min-width:0; padding:var(--space-5); overflow-y:auto; }
      .lib-page--split .lib-list-col { max-width:460px; border-right:1px solid var(--color-border); }
      .lib-toolbar { display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); margin-bottom:var(--space-3); flex-wrap:wrap; }
      .lib-heading { font-size:var(--text-2xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0; }
      .lib-search { height:32px; min-width:160px; padding:0 var(--space-3); border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); color:var(--color-text); font-size:var(--text-sm); outline:none; }
      .lib-search:focus { border-color:var(--color-accent-cyan); }
      .lib-count { font-size:var(--text-sm); color:var(--color-text-faint); margin-bottom:var(--space-3); }
      .lib-loading { display:flex; justify-content:center; padding:var(--space-16); }
      .lib-list { border:1px solid var(--color-border); border-radius:var(--radius-lg); overflow:hidden; }
      .lib-row { display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); padding:var(--space-3) var(--space-4); border:none; border-bottom:1px solid var(--color-border-subtle); background:transparent; text-align:left; cursor:pointer; width:100%; transition:background var(--transition-fast); }
      .lib-row:last-child { border-bottom:none; }
      .lib-row:hover { background:var(--color-surface-hover); }
      .lib-row--active { background:rgba(0,229,255,0.06); border-left:2px solid var(--color-accent-cyan); }
      .lib-row__main { display:flex; flex-direction:column; gap:2px; min-width:0; flex:1; }
      .lib-row__name { font-size:var(--text-base); font-weight:var(--font-weight-medium); color:var(--color-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .lib-row__sub { font-size:var(--text-sm); color:var(--color-text-faint); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-transform:capitalize; }
      .lib-row__meta { display:flex; align-items:center; gap:var(--space-2); flex-shrink:0; }
      .lib-row__count { font-size:var(--text-xs); font-family:var(--font-mono); color:var(--color-text-faint); }
      .lib-row__fav { color:var(--color-accent-lime); }
      /* drawer */
      .lib-drawer { width:360px; flex-shrink:0; display:flex; flex-direction:column; overflow-y:auto; }
      .lib-drawer__header { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--space-3); padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border); }
      .lib-drawer__title { font-size:var(--text-lg); font-weight:var(--font-weight-bold); color:var(--color-text); }
      .lib-drawer__sub { margin-top:var(--space-1); }
      .lib-drawer__close { background:none; border:none; color:var(--color-text-faint); cursor:pointer; font-size:20px; line-height:1; padding:0; flex-shrink:0; }
      .lib-drawer__body { padding:var(--space-4) var(--space-5); display:flex; flex-direction:column; gap:var(--space-5); }
      .lib-section { display:flex; flex-direction:column; gap:var(--space-2); }
      .lib-section__title { font-size:var(--text-sm); font-weight:var(--font-weight-semibold); color:var(--color-text-faint); text-transform:uppercase; letter-spacing:0.08em; margin:0; }
      .lib-dl { display:grid; grid-template-columns:auto 1fr; gap:var(--space-1) var(--space-4); font-size:var(--text-sm); }
      .lib-dl dt { color:var(--color-text-faint); }
      .lib-dl dd { color:var(--color-text-muted); margin:0; }
      .lib-chip-list { display:flex; flex-wrap:wrap; gap:var(--space-1); }
      .lib-notes { font-size:var(--text-sm); color:var(--color-text-muted); line-height:var(--leading-relaxed); white-space:pre-wrap; margin:0; }
      .lib-list-inner { border:1px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden; }
      .lib-inner-row { display:flex; align-items:center; justify-content:space-between; padding:var(--space-2) var(--space-3); border-bottom:1px solid var(--color-border-subtle); font-size:var(--text-sm); }
      .lib-inner-row:last-child { border-bottom:none; }
      .lib-inner-name { color:var(--color-text-muted); }
      .lib-inner-meta { font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-faint); }
      .capitalize { text-transform:capitalize; }
    `}</style>
  )
}
