import { useState } from 'react'
import { useChainRacks } from '@/hooks/useLibrary'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Badge, Spinner, EmptyState } from '@/components/ui'
import type { ChainRack } from '@codex/shared'

// ─── Detail drawer ────────────────────────────────────────────────────────────

function ChainDetail({ rack, onClose }: { rack: ChainRack; onClose: () => void }) {
  return (
    <div className="lib-drawer">
      <div className="lib-drawer__header">
        <div>
          <div className="lib-drawer__title">{rack.name}</div>
          {rack.role && <div className="lib-drawer__sub">{rack.role}</div>}
        </div>
        <button className="lib-drawer__close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="lib-drawer__body">
        <div className="lib-dl">
          {rack.genre  && <><dt>Genre</dt><dd className="capitalize">{rack.genre.replace(/-/g,'  ')}</dd></>}
          {rack.variant && <><dt>Variant</dt><dd>{rack.variant}</dd></>}
          {rack.monoSafety && <><dt>Mono safety</dt><dd>Yes</dd></>}
          {rack.gainNotes && <><dt>Gain notes</dt><dd>{rack.gainNotes}</dd></>}
        </div>

        {rack.devices.length > 0 && (
          <section className="lib-section">
            <h3 className="lib-section__title">Devices ({rack.devices.length})</h3>
            <div className="lib-chip-list">
              {rack.devices.map((d, i) => (
                <Badge key={i} variant={d.active ? 'lime' : 'default'}>
                  {d.name}{d.bypassed ? ' [bypassed]' : ''}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {rack.macros.length > 0 && (
          <section className="lib-section">
            <h3 className="lib-section__title">Macros</h3>
            <div className="lib-macro-grid">
              {rack.macros.map(m => (
                <div key={m.num} className="lib-macro">
                  <span className="lib-macro__num">{m.num}</span>
                  <span className="lib-macro__name">{m.name}</span>
                  {m.range && <span className="lib-macro__range">{m.range}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {rack.tags.length > 0 && (
          <div className="lib-chip-list">
            {rack.tags.map(t => <Badge key={t} variant="default">{t}</Badge>)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ChainsPage() {
  const { workspaceId } = useCurrentUser()
  const racks = useChainRacks(workspaceId)
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<ChainRack | null>(null)

  if (racks === undefined) {
    return <div className="lib-loading"><Spinner size="lg" /></div>
  }

  const filtered = racks.filter(r =>
    !search.trim() ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.role.toLowerCase().includes(search.toLowerCase()) ||
    r.genre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={`lib-page${selected ? ' lib-page--split' : ''}`}>
      <div className="lib-list-col">
        <div className="lib-toolbar">
          <h1 className="lib-heading">Chain Racks</h1>
          <input className="lib-search" type="search" placeholder="Search…" value={search}
            onChange={e => setSearch(e.target.value)} aria-label="Search chain racks" />
        </div>
        <div className="lib-count">{filtered.length} rack{filtered.length !== 1 ? 's' : ''}</div>

        {filtered.length === 0
          ? <EmptyState title={racks.length === 0 ? 'No chain racks' : 'No results'}
              description={racks.length === 0 ? 'Chain racks from imported builds will appear here.' : 'Try a different search.'} />
          : (
            <div className="lib-list">
              {filtered.map(r => (
                <button key={r.id} type="button"
                  className={`lib-row${selected?.id === r.id ? ' lib-row--active' : ''}`}
                  onClick={() => setSelected(selected?.id === r.id ? null : r)}>
                  <div className="lib-row__main">
                    <span className="lib-row__name">{r.name}</span>
                    {r.role && <span className="lib-row__sub">{r.role}</span>}
                  </div>
                  <div className="lib-row__meta">
                    {r.genre && <Badge variant="default">{r.genre.replace(/-/g, ' ')}</Badge>}
                    <span className="lib-row__count">{r.devices.length} devices</span>
                    {r.favourite && <span className="lib-row__fav">★</span>}
                  </div>
                </button>
              ))}
            </div>
          )
        }
      </div>

      {selected && <ChainDetail rack={selected} onClose={() => setSelected(null)} />}

      <LibStyles />
    </div>
  )
}

function LibStyles() {
  return (
    <style>{`
      .lib-page { display:flex; gap:0; height:100%; min-height:0; }
      .lib-list-col { flex:1; min-width:0; padding:var(--space-5); overflow-y:auto; }
      .lib-page--split .lib-list-col { max-width:420px; border-right:1px solid var(--color-border); }
      .lib-toolbar { display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); margin-bottom:var(--space-3); }
      .lib-heading { font-size:var(--text-2xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0; }
      .lib-search { height:32px; min-width:180px; padding:0 var(--space-3); border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); color:var(--color-text); font-size:var(--text-sm); outline:none; }
      .lib-search:focus { border-color:var(--color-accent-cyan); }
      .lib-count { font-size:var(--text-sm); color:var(--color-text-faint); margin-bottom:var(--space-3); }
      .lib-loading { display:flex; justify-content:center; padding:var(--space-16); }
      .lib-list { display:flex; flex-direction:column; gap:0; border:1px solid var(--color-border); border-radius:var(--radius-lg); overflow:hidden; }
      .lib-row { display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); padding:var(--space-3) var(--space-4); border:none; border-bottom:1px solid var(--color-border-subtle); background:transparent; text-align:left; cursor:pointer; width:100%; transition:background var(--transition-fast); }
      .lib-row:last-child { border-bottom:none; }
      .lib-row:hover { background:var(--color-surface-hover); }
      .lib-row--active { background:rgba(0,229,255,0.06); border-left:2px solid var(--color-accent-cyan); }
      .lib-row__main { display:flex; flex-direction:column; gap:2px; min-width:0; }
      .lib-row__name { font-size:var(--text-base); font-weight:var(--font-weight-medium); color:var(--color-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .lib-row__sub { font-size:var(--text-sm); color:var(--color-text-faint); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .lib-row__meta { display:flex; align-items:center; gap:var(--space-2); flex-shrink:0; }
      .lib-row__count { font-size:var(--text-xs); font-family:var(--font-mono); color:var(--color-text-faint); }
      .lib-row__fav { color:var(--color-accent-lime); font-size:var(--text-sm); }
      /* drawer */
      .lib-drawer { width:360px; flex-shrink:0; border-left:1px solid var(--color-border); display:flex; flex-direction:column; overflow-y:auto; }
      .lib-drawer__header { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--space-3); padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border); }
      .lib-drawer__title { font-size:var(--text-lg); font-weight:var(--font-weight-bold); color:var(--color-text); }
      .lib-drawer__sub { font-size:var(--text-sm); color:var(--color-text-faint); }
      .lib-drawer__close { background:none; border:none; color:var(--color-text-faint); cursor:pointer; font-size:20px; line-height:1; padding:0; flex-shrink:0; }
      .lib-drawer__body { padding:var(--space-4) var(--space-5); display:flex; flex-direction:column; gap:var(--space-5); }
      .lib-section { display:flex; flex-direction:column; gap:var(--space-2); }
      .lib-section__title { font-size:var(--text-sm); font-weight:var(--font-weight-semibold); color:var(--color-text-faint); text-transform:uppercase; letter-spacing:0.08em; margin:0; }
      .lib-dl { display:grid; grid-template-columns:auto 1fr; gap:var(--space-1) var(--space-4); font-size:var(--text-sm); }
      .lib-dl dt { color:var(--color-text-faint); }
      .lib-dl dd { color:var(--color-text-muted); margin:0; }
      .lib-chip-list { display:flex; flex-wrap:wrap; gap:var(--space-1); }
      .lib-macro-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:var(--space-2); }
      .lib-macro { display:flex; align-items:center; gap:var(--space-2); padding:var(--space-2) var(--space-3); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:var(--text-sm); }
      .lib-macro__num { font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-accent-lime); width:14px; flex-shrink:0; }
      .lib-macro__name { color:var(--color-text-muted); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .lib-macro__range { font-size:var(--text-xs); font-family:var(--font-mono); color:var(--color-text-faint); }
      .capitalize { text-transform:capitalize; }
    `}</style>
  )
}
