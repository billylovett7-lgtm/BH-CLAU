import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useArrangements } from '@/hooks/useLibrary'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Badge, Spinner, EmptyState } from '@/components/ui'
import type { Arrangement } from '@codex/shared'

const ENERGY_VARIANT: Record<string, 'lime' | 'cyan' | 'blue' | 'warning' | 'default'> = {
  peak: 'lime', build: 'cyan', drop: 'blue', low: 'default', breakdown: 'warning', outro: 'default',
}

function SectionBar({ section, totalBars }: { section: Arrangement['sections'][number]; totalBars: number }) {
  const width = ((section.endBar - section.startBar) / totalBars) * 100
  const left  = (section.startBar / totalBars) * 100
  return (
    <div className="arr-section" style={{ left: `${left}%`, width: `${width}%` }}
      title={`${section.name} (${section.startBar}–${section.endBar})`}>
      <span className="arr-section__name">{section.name}</span>
    </div>
  )
}

function ArrangementDetail({ a, onClose }: { a: Arrangement; onClose: () => void }) {
  return (
    <div className="lib-drawer">
      <div className="lib-drawer__header">
        <div>
          <div className="lib-drawer__title">{a.name}</div>
          {a.genre && <div className="lib-drawer__sub" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)', marginTop: '2px' }}>
            {a.genre.replace(/-/g,' ')}
          </div>}
        </div>
        <button className="lib-drawer__close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="lib-drawer__body">
        <div className="lib-dl">
          <dt>Total bars</dt><dd>{a.bars}</dd>
          <dt>Phrase size</dt><dd>{a.phraseSize} bars</dd>
          {a.sections.length > 0 && <><dt>Sections</dt><dd>{a.sections.length}</dd></>}
        </div>

        {a.sections.length > 0 && (
          <section className="lib-section">
            <h3 className="lib-section__title">Structure</h3>
            <div className="arr-timeline">
              {a.sections.map((s, i) => (
                <SectionBar key={i} section={s} totalBars={a.bars} />
              ))}
            </div>
            <div className="arr-sections-list">
              {a.sections.map((s, i) => (
                <div key={i} className="arr-sec-row">
                  <span className="arr-sec-name">{s.name}</span>
                  <span className="arr-sec-bars">{s.startBar}–{s.endBar}</span>
                  {s.energy && <Badge variant={ENERGY_VARIANT[s.energy] ?? 'default'}>{s.energy}</Badge>}
                </div>
              ))}
            </div>
          </section>
        )}

        {[
          ['Energy plan',  a.energyPlan],
          ['Hook strategy',a.hookStrategy],
          ['Mix in',       a.mixIn],
          ['Mix out',      a.mixOut],
          ['Notes',        a.notes],
        ].filter(([,v]) => v).map(([label, val]) => (
          <section key={label} className="lib-section">
            <h3 className="lib-section__title">{label}</h3>
            <p className="lib-notes">{val}</p>
          </section>
        ))}
      </div>
    </div>
  )
}

export function ArrangementsPage() {
  const { workspaceId } = useCurrentUser()
  const arrangements = useArrangements(workspaceId)
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<Arrangement | null>(null)

  if (arrangements === undefined) return <div className="lib-loading"><Spinner size="lg" /></div>

  const filtered = arrangements.filter(a =>
    !search.trim() ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.genre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={`lib-page${selected ? ' lib-page--split' : ''}`}>
      <div className="lib-list-col">
        <div className="lib-toolbar">
          <h1 className="lib-heading">Arrangements</h1>
          <input className="lib-search" type="search" placeholder="Search…" value={search}
            onChange={e => setSearch(e.target.value)} aria-label="Search arrangements" />
        </div>
        <div className="lib-count">{filtered.length} arrangement{filtered.length !== 1 ? 's' : ''}</div>

        {filtered.length === 0
          ? <EmptyState title={arrangements.length === 0 ? 'No arrangements' : 'No results'}
              description={arrangements.length === 0 ? 'Arrangement plans from imported builds appear here.' : 'Try a different search.'} />
          : (
            <div className="lib-list">
              {filtered.map(a => (
                <button key={a.id} type="button"
                  className={`lib-row${selected?.id === a.id ? ' lib-row--active' : ''}`}
                  onClick={() => setSelected(selected?.id === a.id ? null : a)}>
                  <div className="lib-row__main">
                    <span className="lib-row__name">{a.name}</span>
                    {a.genre && <span className="lib-row__sub">{a.genre.replace(/-/g,' ')}</span>}
                  </div>
                  <div className="lib-row__meta">
                    <span className="lib-row__count">{a.bars}B</span>
                    <Badge variant="default">{a.sections.length} sections</Badge>
                  </div>
                </button>
              ))}
            </div>
          )
        }
      </div>

      {selected && <ArrangementDetail a={selected} onClose={() => setSelected(null)} />}

      <style>{`
        .lib-page { display:flex; height:100%; min-height:0; }
        .lib-list-col { flex:1; min-width:0; padding:var(--space-5); overflow-y:auto; }
        .lib-page--split .lib-list-col { max-width:460px; border-right:1px solid var(--color-border); }
        .lib-toolbar { display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); margin-bottom:var(--space-3); }
        .lib-heading { font-size:var(--text-2xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0; }
        .lib-search { height:32px; min-width:180px; padding:0 var(--space-3); border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); color:var(--color-text); font-size:var(--text-sm); outline:none; }
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
        .lib-drawer { width:380px; flex-shrink:0; display:flex; flex-direction:column; overflow-y:auto; }
        .lib-drawer__header { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--space-3); padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--color-border); }
        .lib-drawer__title { font-size:var(--text-lg); font-weight:var(--font-weight-bold); color:var(--color-text); }
        .lib-drawer__close { background:none; border:none; color:var(--color-text-faint); cursor:pointer; font-size:20px; line-height:1; padding:0; flex-shrink:0; }
        .lib-drawer__body { padding:var(--space-4) var(--space-5); display:flex; flex-direction:column; gap:var(--space-5); }
        .lib-section { display:flex; flex-direction:column; gap:var(--space-2); }
        .lib-section__title { font-size:var(--text-sm); font-weight:var(--font-weight-semibold); color:var(--color-text-faint); text-transform:uppercase; letter-spacing:0.08em; margin:0; }
        .lib-dl { display:grid; grid-template-columns:auto 1fr; gap:var(--space-1) var(--space-4); font-size:var(--text-sm); }
        .lib-dl dt { color:var(--color-text-faint); }
        .lib-dl dd { color:var(--color-text-muted); margin:0; }
        .lib-notes { font-size:var(--text-sm); color:var(--color-text-muted); white-space:pre-wrap; margin:0; line-height:var(--leading-relaxed); }
        /* arrangement timeline */
        .arr-timeline { position:relative; height:24px; background:var(--color-bg-3); border-radius:var(--radius-sm); margin-bottom:var(--space-2); overflow:hidden; }
        .arr-section { position:absolute; top:0; bottom:0; display:flex; align-items:center; padding:0 4px; overflow:hidden; border-right:1px solid var(--color-bg); background:var(--color-accent-cyan); opacity:0.5; }
        .arr-section:nth-child(odd) { background:var(--color-accent-lime); }
        .arr-section__name { font-size:8px; font-family:var(--font-mono); color:var(--color-bg); white-space:nowrap; overflow:hidden; }
        .arr-sections-list { display:flex; flex-direction:column; gap:0; border:1px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden; }
        .arr-sec-row { display:flex; align-items:center; gap:var(--space-2); padding:var(--space-2) var(--space-3); border-bottom:1px solid var(--color-border-subtle); font-size:var(--text-sm); }
        .arr-sec-row:last-child { border-bottom:none; }
        .arr-sec-name { flex:1; color:var(--color-text-muted); }
        .arr-sec-bars { font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-faint); }
      `}</style>
    </div>
  )
}
