import { useState } from 'react'
import { usePresets } from '@/hooks/useLibrary'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Badge, Spinner, EmptyState, Select } from '@/components/ui'
import { softDeletePreset } from '@/services/localDb'
import type { Preset } from '@codex/shared'

const TYPE_OPTS = [
  { value: 'all',   label: 'All types' },
  { value: 'bass',  label: 'Bass'  },
  { value: 'lead',  label: 'Lead'  },
  { value: 'pad',   label: 'Pad'   },
  { value: 'pluck', label: 'Pluck' },
  { value: 'chord', label: 'Chord' },
  { value: 'fx',    label: 'FX'    },
  { value: 'drum',  label: 'Drum'  },
  { value: 'other', label: 'Other' },
]

function PresetDetail({ p, onClose, onDelete }: { p: Preset; onClose: () => void; onDelete: () => void }) {
  return (
    <div className="lib-drawer">
      <div className="lib-drawer__header">
        <div>
          <div className="lib-drawer__title">{p.name}</div>
          <div className="lib-drawer__sub" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)', marginTop: '2px' }}>
            {p.synth} · {p.type}
          </div>
        </div>
        <button className="lib-drawer__close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="lib-drawer__body">
        <div className="lib-dl">
          {p.genre   && <><dt>Genre</dt><dd className="capitalize">{p.genre.replace(/-/g,' ')}</dd></>}
          {p.version && <><dt>Version</dt><dd>{p.version}</dd></>}
        </div>

        {p.macros.length > 0 && (
          <section className="lib-section">
            <h3 className="lib-section__title">Macros ({p.macros.length})</h3>
            <div className="lib-macro-grid">
              {p.macros.map(m => (
                <div key={m.num} className="lib-macro">
                  <span className="lib-macro__num">{m.num}</span>
                  <span className="lib-macro__name">{m.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {[
          ['Oscillators', p.oscillators],
          ['Filter',      p.filter],
          ['Envelopes',   p.envelopes],
          ['Modulation',  p.modulation],
          ['Effects',     p.effects],
        ].filter(([, v]) => v).map(([label, val]) => (
          <section key={label} className="lib-section">
            <h3 className="lib-section__title">{label}</h3>
            <p className="lib-notes">{val}</p>
          </section>
        ))}

        {p.tags.length > 0 && (
          <div className="lib-chip-list">
            {p.tags.map(t => <Badge key={t} variant="default">{t}</Badge>)}
          </div>
        )}
      </div>
      <div className="lib-drawer__footer">
        <button type="button" className="lib-drawer__delete" onClick={onDelete}>Delete preset</button>
      </div>
    </div>
  )
}

export function PresetsPage() {
  const { workspaceId } = useCurrentUser()
  const presets = usePresets(workspaceId)
  const [search,   setSearch]   = useState('')
  const [typeF,    setTypeF]    = useState('all')
  const [selected, setSelected] = useState<Preset | null>(null)

  if (presets === undefined) return <div className="lib-loading"><Spinner size="lg" /></div>

  const filtered = presets.filter(p => {
    const q = search.toLowerCase().trim()
    return (
      (!q || p.name.toLowerCase().includes(q) || p.synth.toLowerCase().includes(q)) &&
      (typeF === 'all' || p.type === typeF)
    )
  })

  return (
    <div className={`lib-page${selected ? ' lib-page--split' : ''}`}>
      <div className="lib-list-col">
        <div className="lib-toolbar">
          <h1 className="lib-heading">Presets</h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input className="lib-search" type="search" placeholder="Search…" value={search}
              onChange={e => setSearch(e.target.value)} aria-label="Search presets" />
            <Select value={typeF} onChange={setTypeF} options={TYPE_OPTS} />
          </div>
        </div>
        <div className="lib-count">{filtered.length} preset{filtered.length !== 1 ? 's' : ''}</div>

        {filtered.length === 0
          ? <EmptyState title={presets.length === 0 ? 'No presets' : 'No results'}
              description={presets.length === 0 ? 'Presets from imported builds appear here.' : 'Try a different search.'} />
          : (
            <div className="lib-list">
              {filtered.map(p => (
                <button key={p.id} type="button"
                  className={`lib-row${selected?.id === p.id ? ' lib-row--active' : ''}`}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}>
                  <div className="lib-row__main">
                    <span className="lib-row__name">{p.name}</span>
                    <span className="lib-row__sub">
                      {[p.synth, p.genre?.replace(/-/g,' ')].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div className="lib-row__meta">
                    <Badge variant="default">{p.type}</Badge>
                    {p.macros.length > 0 && <span className="lib-row__count">{p.macros.length} macros</span>}
                  </div>
                </button>
              ))}
            </div>
          )
        }
      </div>

      {selected && <PresetDetail p={selected} onClose={() => setSelected(null)} onDelete={async () => { await softDeletePreset(selected.id); setSelected(null) }} />}
      <LibStyles />
    </div>
  )
}

function LibStyles() {
  return (
    <style>{`
      .lib-page { display:flex; height:100%; min-height:0; }
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
      .lib-drawer { width:360px; flex-shrink:0; display:flex; flex-direction:column; overflow-y:auto; }
      .lib-drawer__header { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--space-3); padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border); }
      .lib-drawer__title { font-size:var(--text-lg); font-weight:var(--font-weight-bold); color:var(--color-text); }
      .lib-drawer__close { background:none; border:none; color:var(--color-text-faint); cursor:pointer; font-size:20px; line-height:1; padding:0; flex-shrink:0; }
      .lib-drawer__body { padding:var(--space-4) var(--space-5); display:flex; flex-direction:column; gap:var(--space-5); }
      .lib-section { display:flex; flex-direction:column; gap:var(--space-2); }
      .lib-section__title { font-size:var(--text-sm); font-weight:var(--font-weight-semibold); color:var(--color-text-faint); text-transform:uppercase; letter-spacing:0.08em; margin:0; }
      .lib-dl { display:grid; grid-template-columns:auto 1fr; gap:var(--space-1) var(--space-4); font-size:var(--text-sm); }
      .lib-dl dt { color:var(--color-text-faint); }
      .lib-dl dd { color:var(--color-text-muted); margin:0; }
      .lib-chip-list { display:flex; flex-wrap:wrap; gap:var(--space-1); }
      .lib-notes { font-size:var(--text-sm); color:var(--color-text-muted); line-height:var(--leading-relaxed); white-space:pre-wrap; margin:0; }
      .lib-macro-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:var(--space-2); }
      .lib-macro { display:flex; align-items:center; gap:var(--space-2); padding:var(--space-2) var(--space-3); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:var(--text-sm); }
      .lib-macro__num { font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-accent-lime); width:14px; flex-shrink:0; }
      .lib-macro__name { color:var(--color-text-muted); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .capitalize { text-transform:capitalize; }
    `}</style>
  )
}
