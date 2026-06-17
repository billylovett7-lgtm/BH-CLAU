import { useState } from 'react'
import { useGrooves } from '@/hooks/useLibrary'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Badge, Spinner, EmptyState } from '@/components/ui'
import { softDeleteGroove } from '@/services/localDb'
import type { Groove } from '@codex/shared'

function GrooveDetail({ g, onClose, onDelete }: { g: Groove; onClose: () => void; onDelete: () => void }) {
  const maxVel = Math.max(...g.velocity.map(v => v.velocity), 1)

  return (
    <div className="lib-drawer">
      <div className="lib-drawer__header">
        <div className="lib-drawer__title">{g.name}</div>
        <button className="lib-drawer__close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="lib-drawer__body">
        <div className="lib-dl">
          {g.genre && <><dt>Genre</dt><dd className="capitalize">{g.genre.replace(/-/g,' ')}</dd></>}
          <dt>Grid</dt><dd>1/{g.grid}</dd>
          {g.swing > 0 && <><dt>Swing</dt><dd>{g.swing}%</dd></>}
          {g.random > 0 && <><dt>Humanise</dt><dd>{g.random}%</dd></>}
        </div>

        {g.timing.length > 0 && (
          <section className="lib-section">
            <h3 className="lib-section__title">Timing offsets ({g.timing.length} steps)</h3>
            <div className="groove-steps">
              {g.timing.map(t => (
                <div key={t.step} className="groove-step"
                  title={`Step ${t.step + 1}: ${t.offset > 0 ? '+' : ''}${t.offset}`}>
                  <div className="groove-step__num">{t.step + 1}</div>
                  <div className="groove-step__bar" style={{
                    height: `${Math.abs(t.offset) * 2}px`,
                    background: t.offset > 0 ? 'var(--color-accent-lime)' : 'var(--color-accent-cyan)',
                  }} />
                </div>
              ))}
            </div>
          </section>
        )}

        {g.velocity.length > 0 && (
          <section className="lib-section">
            <h3 className="lib-section__title">Velocity map ({g.velocity.length} steps)</h3>
            <div className="groove-vel-steps">
              {g.velocity.map(v => (
                <div key={v.step} className="groove-vel-step"
                  title={`Step ${v.step + 1}: ${v.velocity}`}>
                  <div className="groove-vel-bar" style={{
                    height: `${(v.velocity / maxVel) * 32}px`,
                    background: 'var(--color-accent-lime)',
                    opacity: 0.4 + (v.velocity / maxVel) * 0.6,
                  }} />
                </div>
              ))}
            </div>
          </section>
        )}

        {g.targets.length > 0 && (
          <section className="lib-section">
            <h3 className="lib-section__title">Applies to</h3>
            <div className="lib-chip-list">
              {g.targets.map(t => <Badge key={t} variant="lime">{t}</Badge>)}
            </div>
          </section>
        )}

        {g.exclude.length > 0 && (
          <section className="lib-section">
            <h3 className="lib-section__title">Excludes</h3>
            <div className="lib-chip-list">
              {g.exclude.map(t => <Badge key={t} variant="danger">{t}</Badge>)}
            </div>
          </section>
        )}

        {g.notes && (
          <section className="lib-section">
            <h3 className="lib-section__title">Notes</h3>
            <p className="lib-notes">{g.notes}</p>
          </section>
        )}
      </div>
      <div className="lib-drawer__footer">
        <button type="button" className="lib-drawer__delete" onClick={onDelete}>Delete groove</button>
      </div>
    </div>
  )
}

export function GroovesPage() {
  const { workspaceId } = useCurrentUser()
  const grooves = useGrooves(workspaceId)
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<Groove | null>(null)

  if (grooves === undefined) return <div className="lib-loading"><Spinner size="lg" /></div>

  const filtered = grooves.filter(g =>
    !search.trim() || g.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={`lib-page${selected ? ' lib-page--split' : ''}`}>
      <div className="lib-list-col">
        <div className="lib-toolbar">
          <h1 className="lib-heading">Grooves</h1>
          <input className="lib-search" type="search" placeholder="Search…" value={search}
            onChange={e => setSearch(e.target.value)} aria-label="Search grooves" />
        </div>
        <div className="lib-count">{filtered.length} groove{filtered.length !== 1 ? 's' : ''}</div>

        {filtered.length === 0
          ? <EmptyState title={grooves.length === 0 ? 'No grooves' : 'No results'}
              description={grooves.length === 0 ? 'Groove templates from imported builds appear here.' : 'Try a different search.'} />
          : (
            <div className="lib-list">
              {filtered.map(g => (
                <button key={g.id} type="button"
                  className={`lib-row${selected?.id === g.id ? ' lib-row--active' : ''}`}
                  onClick={() => setSelected(selected?.id === g.id ? null : g)}>
                  <div className="lib-row__main">
                    <span className="lib-row__name">{g.name}</span>
                    {g.genre && <span className="lib-row__sub">{g.genre.replace(/-/g,' ')}</span>}
                  </div>
                  <div className="lib-row__meta">
                    <span className="lib-row__count">1/{g.grid}</span>
                    {g.swing > 0 && <Badge variant="default">{g.swing}% swing</Badge>}
                  </div>
                </button>
              ))}
            </div>
          )
        }
      </div>

      {selected && <GrooveDetail g={selected} onClose={() => setSelected(null)} onDelete={async () => { await softDeleteGroove(selected.id); setSelected(null) }} />}

      <style>{`
        .lib-page { display:flex; height:100%; min-height:0; }
        .lib-list-col { flex:1; min-width:0; padding:var(--space-5); overflow-y:auto; }
        .lib-page--split .lib-list-col { max-width:460px; border-right:1px solid var(--color-border); }
        .lib-toolbar { display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); margin-bottom:var(--space-3); }
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
        .lib-row__sub { font-size:var(--text-sm); color:var(--color-text-faint); text-transform:capitalize; }
        .lib-row__meta { display:flex; align-items:center; gap:var(--space-2); flex-shrink:0; }
        .lib-row__count { font-size:var(--text-xs); font-family:var(--font-mono); color:var(--color-text-faint); }
        /* drawer */
        .lib-drawer { width:360px; flex-shrink:0; display:flex; flex-direction:column; overflow-y:auto; }
        .lib-drawer__header { display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border); }
        .lib-drawer__title { font-size:var(--text-lg); font-weight:var(--font-weight-bold); color:var(--color-text); }
        .lib-drawer__close { background:none; border:none; color:var(--color-text-faint); cursor:pointer; font-size:20px; line-height:1; padding:0; flex-shrink:0; }
        .lib-drawer__body { padding:var(--space-4) var(--space-5); display:flex; flex-direction:column; gap:var(--space-5); }
        .lib-section { display:flex; flex-direction:column; gap:var(--space-2); }
        .lib-section__title { font-size:var(--text-sm); font-weight:var(--font-weight-semibold); color:var(--color-text-faint); text-transform:uppercase; letter-spacing:0.08em; margin:0; }
        .lib-dl { display:grid; grid-template-columns:auto 1fr; gap:var(--space-1) var(--space-4); font-size:var(--text-sm); }
        .lib-dl dt { color:var(--color-text-faint); }
        .lib-dl dd { color:var(--color-text-muted); margin:0; }
        .lib-chip-list { display:flex; flex-wrap:wrap; gap:var(--space-1); }
        .lib-notes { font-size:var(--text-sm); color:var(--color-text-muted); white-space:pre-wrap; margin:0; }
        /* groove viz */
        .groove-steps { display:flex; align-items:flex-end; gap:2px; padding:var(--space-2) 0; min-height:40px; }
        .groove-step { display:flex; flex-direction:column; align-items:center; gap:2px; min-width:12px; }
        .groove-step__num { font-size:8px; font-family:var(--font-mono); color:var(--color-text-faint); }
        .groove-step__bar { width:8px; border-radius:2px; min-height:2px; }
        .groove-vel-steps { display:flex; align-items:flex-end; gap:2px; height:36px; }
        .groove-vel-step { display:flex; align-items:flex-end; min-width:10px; }
        .groove-vel-bar { width:8px; border-radius:2px 2px 0 0; min-height:2px; }
        .capitalize { text-transform:capitalize; }
      `}</style>
    </div>
  )
}
