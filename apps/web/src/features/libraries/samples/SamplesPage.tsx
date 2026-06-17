import { useState } from 'react'
import { useSamples } from '@/hooks/useLibrary'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Badge, Spinner, EmptyState, Select } from '@/components/ui'
import { softDeleteSample } from '@/services/localDb'
import type { Sample } from '@codex/shared'

const TYPE_OPTS = [
  { value: 'all',      label: 'All types'  },
  { value: 'kick',     label: 'Kick'       },
  { value: 'snare',    label: 'Snare'      },
  { value: 'hat',      label: 'Hat'        },
  { value: 'loop',     label: 'Loop'       },
  { value: 'one-shot', label: 'One-shot'   },
  { value: 'vocal',    label: 'Vocal'      },
  { value: 'fx',       label: 'FX'         },
  { value: 'other',    label: 'Other'      },
]

function fmt(sec: number | null | undefined): string {
  if (!sec) return ''
  return sec >= 60 ? `${Math.floor(sec / 60)}m${(sec % 60).toFixed(0)}s` : `${sec.toFixed(1)}s`
}

function SampleDetail({ s, onClose, onDelete }: { s: Sample; onClose: () => void; onDelete: () => void }) {
  return (
    <div className="lib-drawer">
      <div className="lib-drawer__header">
        <div>
          <div className="lib-drawer__title">{s.name}</div>
          {s.role && <div className="lib-drawer__sub" style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>{s.role}</div>}
        </div>
        <button className="lib-drawer__close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="lib-drawer__body">
        <div className="lib-dl">
          <dt>Type</dt><dd>{s.type}</dd>
          {s.genre      && <><dt>Genre</dt><dd className="capitalize">{s.genre.replace(/-/g,' ')}</dd></>}
          {s.bpm        && <><dt>BPM</dt><dd>{s.bpm}</dd></>}
          {s.key        && <><dt>Key</dt><dd>{s.key}</dd></>}
          {s.root       && <><dt>Root</dt><dd>{s.root}</dd></>}
          {s.duration   && <><dt>Duration</dt><dd>{fmt(s.duration)}</dd></>}
          {s.channels   && <><dt>Channels</dt><dd>{s.channels === 1 ? 'Mono' : 'Stereo'}</dd></>}
          {s.sampleRate && <><dt>Sample rate</dt><dd>{(s.sampleRate / 1000).toFixed(1)} kHz</dd></>}
          {s.bitDepth   && <><dt>Bit depth</dt><dd>{s.bitDepth}-bit</dd></>}
          {s.format     && <><dt>Format</dt><dd>{s.format.toUpperCase()}</dd></>}
          <dt>Local only</dt><dd>{s.localOnly ? 'Yes' : 'No'}</dd>
        </div>

        {s.notes && (
          <section className="lib-section">
            <h3 className="lib-section__title">Notes</h3>
            <p className="lib-notes">{s.notes}</p>
          </section>
        )}

        {s.tags.length > 0 && (
          <div className="lib-chip-list">
            {s.tags.map(t => <Badge key={t} variant="default">{t}</Badge>)}
          </div>
        )}
      </div>
      <div className="lib-drawer__footer">
        <button type="button" className="lib-drawer__delete" onClick={onDelete}>Delete sample</button>
      </div>
    </div>
  )
}

export function SamplesPage() {
  const { workspaceId } = useCurrentUser()
  const samples = useSamples(workspaceId)
  const [search,   setSearch]   = useState('')
  const [typeF,    setTypeF]    = useState('all')
  const [selected, setSelected] = useState<Sample | null>(null)

  if (samples === undefined) return <div className="lib-loading"><Spinner size="lg" /></div>

  const filtered = samples.filter(s => {
    const q = search.toLowerCase().trim()
    return (
      (!q || s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)) &&
      (typeF === 'all' || s.type === typeF)
    )
  })

  return (
    <div className={`lib-page${selected ? ' lib-page--split' : ''}`}>
      <div className="lib-list-col">
        <div className="lib-toolbar">
          <h1 className="lib-heading">Samples</h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input className="lib-search" type="search" placeholder="Search…" value={search}
              onChange={e => setSearch(e.target.value)} aria-label="Search samples" />
            <Select value={typeF} onChange={setTypeF} options={TYPE_OPTS} />
          </div>
        </div>
        <div className="lib-count">{filtered.length} sample{filtered.length !== 1 ? 's' : ''}</div>

        {filtered.length === 0
          ? <EmptyState title={samples.length === 0 ? 'No samples' : 'No results'}
              description={samples.length === 0 ? 'Samples from imported builds appear here.' : 'Try a different search.'} />
          : (
            <div className="lib-list">
              {filtered.map(s => (
                <button key={s.id} type="button"
                  className={`lib-row${selected?.id === s.id ? ' lib-row--active' : ''}`}
                  onClick={() => setSelected(selected?.id === s.id ? null : s)}>
                  <div className="lib-row__main">
                    <span className="lib-row__name">{s.name}</span>
                    {(s.genre || s.bpm) && (
                      <span className="lib-row__sub">
                        {[s.genre?.replace(/-/g,' '), s.bpm ? `${s.bpm} BPM` : '', s.key ?? ''].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                  <div className="lib-row__meta">
                    <Badge variant="default">{s.type}</Badge>
                    {s.duration && <span className="lib-row__count">{fmt(s.duration)}</span>}
                  </div>
                </button>
              ))}
            </div>
          )
        }
      </div>

      {selected && <SampleDetail s={selected} onClose={() => setSelected(null)} onDelete={async () => { await softDeleteSample(selected.id); setSelected(null) }} />}
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
      .capitalize { text-transform:capitalize; }
    `}</style>
  )
}
