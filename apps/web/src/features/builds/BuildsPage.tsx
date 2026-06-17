import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBuilds } from '@/hooks/useBuilds'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Button, StatusBadge, PriorityBadge, Badge, Spinner, EmptyState, Select } from '@/components/ui'
import { deleteBuild, toggleFavourite } from '@/services/buildService'
import type { Build } from '@codex/shared'
import { GENRES } from '@codex/shared'

// ─── Filters ─────────────────────────────────────────────────────────────────

type StatusFilter   = 'all' | Build['status']
type PriorityFilter = 'all' | Build['priority']

const STATUS_OPTIONS = [
  { value: 'all',         label: 'All statuses' },
  { value: 'idea',        label: 'Idea'         },
  { value: 'in-progress', label: 'In Progress'  },
  { value: 'mixing',      label: 'Mixing'       },
  { value: 'mastering',   label: 'Mastering'    },
  { value: 'done',        label: 'Done'         },
  { value: 'shelved',     label: 'Shelved'      },
]

const PRIORITY_OPTIONS = [
  { value: 'all',    label: 'All priorities' },
  { value: 'high',   label: 'High'          },
  { value: 'medium', label: 'Medium'        },
  { value: 'low',    label: 'Low'           },
]

const GENRE_OPTIONS = [
  { value: 'all', label: 'All genres' },
  ...GENRES.map(g => ({ value: g.value, label: g.label })),
]

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last modified' },
  { value: 'createdAt', label: 'Date created'  },
  { value: 'priority',  label: 'Priority'      },
  { value: 'title',     label: 'Title'         },
]

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const

function applyFilters(
  builds:    Build[],
  search:    string,
  status:    StatusFilter,
  priority:  PriorityFilter,
  genre:     string,
  sort:      string,
  favsOnly:  boolean,
): Build[] {
  let list = [...builds]
  if (favsOnly)              list = list.filter(b => b.favourite)
  if (search.trim())        list = list.filter(b => b.title.toLowerCase().includes(search.toLowerCase().trim()))
  if (status   !== 'all')   list = list.filter(b => b.status   === status)
  if (priority !== 'all')   list = list.filter(b => b.priority === priority)
  if (genre    !== 'all')   list = list.filter(b => b.genre    === genre)

  list.sort((a, b) => {
    switch (sort) {
      case 'priority': {
        const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        return diff !== 0 ? diff : b.updatedAt.localeCompare(a.updatedAt)
      }
      case 'title':     return a.title.localeCompare(b.title)
      case 'createdAt': return b.createdAt.localeCompare(a.createdAt)
      default:          return b.updatedAt.localeCompare(a.updatedAt)
    }
  })
  return list
}

// ─── Build card ───────────────────────────────────────────────────────────────

function BuildCard({ build }: { build: Build }) {
  const navigate = useNavigate()
  const pct  = build.progress
  const circ = 2 * Math.PI * 10
  const dash = (pct / 100) * circ

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`Delete "${build.title}"? This cannot be undone.`)) return
    await deleteBuild(build.id)
  }

  async function handleStar(e: React.MouseEvent) {
    e.stopPropagation()
    await toggleFavourite(build.id, !build.favourite)
  }

  return (
    <div className="bcard" role="button" tabIndex={0}
      onClick={() => navigate(`/builds/${build.id}`)}
      onKeyDown={e => e.key === 'Enter' && navigate(`/builds/${build.id}`)}>
      <div className="bcard__header">
        <div className="bcard__title">{build.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <StatusBadge status={build.status} />
          <button
            type="button"
            className={`bcard__star${build.favourite ? ' bcard__star--on' : ''}`}
            onClick={handleStar}
            aria-label={build.favourite ? 'Remove from favourites' : 'Add to favourites'}
            title={build.favourite ? 'Unfavourite' : 'Favourite'}
          >★</button>
          <button
            type="button"
            className="bcard__delete"
            onClick={handleDelete}
            aria-label="Delete build"
            title="Delete build"
          >×</button>
        </div>
      </div>

      {(build.genre || build.bpm || build.key) && (
        <div className="bcard__meta">
          {[
            build.genre?.replace(/-/g, ' '),
            build.bpm ? `${build.bpm} BPM` : '',
            build.key ?? '',
          ].filter(Boolean).join(' · ')}
        </div>
      )}

      <div className="bcard__footer">
        <PriorityBadge priority={build.priority} />

        <div className="bcard__progress">
          <svg width="28" height="28" style={{ transform: 'rotate(-90deg)' }} aria-hidden>
            <circle cx="14" cy="14" r="10" fill="none" stroke="var(--color-bg-3)" strokeWidth="2.5" />
            <circle cx="14" cy="14" r="10" fill="none"
              stroke="var(--color-accent-lime)" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`} />
          </svg>
          <span className="bcard__pct">{pct}%</span>
        </div>
      </div>

      {build.tags.length > 0 && (
        <div className="bcard__tags">
          {build.tags.slice(0, 4).map(tag => (
            <Badge key={tag} variant="default">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BuildsPage() {
  const navigate               = useNavigate()
  const { workspaceId }        = useCurrentUser()
  const builds                 = useBuilds(workspaceId)

  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState<StatusFilter>('all')
  const [priority, setPriority] = useState<PriorityFilter>('all')
  const [genre,    setGenre]    = useState('all')
  const [sort,     setSort]     = useState('updatedAt')
  const [favsOnly, setFavsOnly] = useState(false)
  const [view,     setView]     = useState<'grid' | 'list'>('grid')

  if (builds === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  const filtered = applyFilters(builds, search, status, priority, genre, sort, favsOnly)

  return (
    <div className="builds-page">
      {/* Toolbar */}
      <div className="builds-toolbar">
        <h1 className="builds-heading">Builds</h1>
        <Button variant="primary" size="sm" onClick={() => navigate('/builds/new')}>+ New build</Button>
      </div>

      {/* Filters */}
      <div className="builds-filters">
        <input
          className="builds-search"
          type="search"
          placeholder="Search builds…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search builds"
        />
        <Select value={status}   onChange={v => setStatus(v as StatusFilter)}   options={STATUS_OPTIONS}   />
        <Select value={priority} onChange={v => setPriority(v as PriorityFilter)} options={PRIORITY_OPTIONS} />
        <Select value={genre}    onChange={setGenre}    options={GENRE_OPTIONS}    />
        <Select value={sort}     onChange={setSort}     options={SORT_OPTIONS}     />

        <button
          type="button"
          className={`builds-fav-btn${favsOnly ? ' builds-fav-btn--on' : ''}`}
          onClick={() => setFavsOnly(f => !f)}
          title={favsOnly ? 'Show all builds' : 'Show favourites only'}
          aria-pressed={favsOnly}
        >★</button>

        <div className="builds-view-toggle">
          <button className={`builds-view-btn${view === 'grid' ? ' builds-view-btn--active' : ''}`}
            onClick={() => setView('grid')} aria-label="Grid view">
            <GridIcon />
          </button>
          <button className={`builds-view-btn${view === 'list' ? ' builds-view-btn--active' : ''}`}
            onClick={() => setView('list')} aria-label="List view">
            <ListIcon />
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="builds-count">
        {filtered.length} {filtered.length === 1 ? 'build' : 'builds'}
        {(search || status !== 'all' || priority !== 'all' || genre !== 'all') && ' matching filters'}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        builds.length === 0
          ? <EmptyState title="No builds yet"
              description="Create your first build to start documenting a track."
              action={<Button variant="primary" onClick={() => navigate('/builds/new')}>Create build</Button>} />
          : <EmptyState title="No results"
              description="Try adjusting your filters or search term." />
      )}

      {/* Grid / list */}
      {filtered.length > 0 && (
        view === 'grid'
          ? <div className="builds-grid">
              {filtered.map(b => <BuildCard key={b.id} build={b} />)}
            </div>
          : <div className="builds-list">
              {filtered.map(b => (
                <div key={b.id} className="blist-row" role="button" tabIndex={0}
                  onClick={() => navigate(`/builds/${b.id}`)}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/builds/${b.id}`)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="blist-title">{b.title}</div>
                    {(b.genre || b.bpm) && (
                      <div className="blist-meta">{[b.genre?.replace(/-/g, ' '), b.bpm ? `${b.bpm} BPM` : ''].filter(Boolean).join(' · ')}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <PriorityBadge priority={b.priority} />
                    <StatusBadge   status={b.status}     />
                    <span className="blist-pct">{b.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
      )}

      <style>{`
        .builds-page { max-width:1100px; margin:0 auto; padding:var(--space-6) var(--space-4); }
        .builds-toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-5); }
        .builds-heading { font-size:var(--text-2xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0; }
        .builds-filters { display:flex; flex-wrap:wrap; align-items:center; gap:var(--space-2); margin-bottom:var(--space-3); }
        .builds-search { flex:1; min-width:180px; height:34px; padding:0 var(--space-3); border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-surface); color:var(--color-text); font-size:var(--text-sm); outline:none; }
        .builds-search:focus { border-color:var(--color-accent-cyan); }
        .builds-count { font-size:var(--text-sm); color:var(--color-text-faint); margin-bottom:var(--space-4); }
        .builds-view-toggle { display:flex; border:1px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden; }
        .builds-view-btn { display:flex; align-items:center; justify-content:center; width:34px; height:34px; border:none; background:transparent; color:var(--color-text-faint); cursor:pointer; transition:background var(--transition-fast),color var(--transition-fast); }
        .builds-view-btn:hover { background:var(--color-surface-hover); color:var(--color-text); }
        .builds-view-btn--active { background:var(--color-surface); color:var(--color-text); }
        .builds-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px,1fr)); gap:var(--space-3); }
        .bcard { display:flex; flex-direction:column; gap:var(--space-2); padding:var(--space-4); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); cursor:pointer; transition:background var(--transition-fast),border-color var(--transition-fast); }
        .bcard:hover { background:var(--color-surface-hover); border-color:#333; }
        .bcard:focus-visible { outline:2px solid var(--color-accent-cyan); outline-offset:2px; }
        .bcard__header { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--space-2); }
        .bcard__title { font-size:var(--text-base); font-weight:var(--font-weight-semibold); color:var(--color-text); line-height:var(--leading-snug); word-break:break-word; }
        .bcard__meta { font-size:var(--text-sm); color:var(--color-text-faint); text-transform:capitalize; }
        .bcard__footer { display:flex; align-items:center; justify-content:space-between; }
        .bcard__progress { display:flex; align-items:center; gap:4px; }
        .bcard__pct { font-size:var(--text-xs); color:var(--color-text-faint); font-family:var(--font-mono); }
        .bcard__tags { display:flex; flex-wrap:wrap; gap:var(--space-1); }
        .bcard__delete { width:20px; height:20px; border:none; border-radius:var(--radius-sm); background:transparent; color:var(--color-text-faint); cursor:pointer; font-size:16px; line-height:1; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity var(--transition-fast),background var(--transition-fast),color var(--transition-fast); flex-shrink:0; }
        .bcard:hover .bcard__delete { opacity:1; }
        .bcard__delete:hover { background:var(--color-danger-muted); color:var(--color-danger); }
        .bcard__star { width:20px; height:20px; border:none; background:transparent; color:var(--color-text-faint); cursor:pointer; font-size:14px; line-height:1; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity var(--transition-fast),color var(--transition-fast); flex-shrink:0; padding:0; }
        .bcard:hover .bcard__star { opacity:1; }
        .bcard__star--on { opacity:1 !important; color:var(--color-accent-lime); }
        .bcard__star:hover { color:var(--color-accent-lime); }
        .builds-fav-btn { padding:0 var(--space-2); height:32px; border:1px solid var(--color-border); border-radius:var(--radius-md); background:none; color:var(--color-text-faint); cursor:pointer; font-size:14px; transition:all var(--transition-fast); }
        .builds-fav-btn:hover { border-color:var(--color-accent-lime); color:var(--color-accent-lime); }
        .builds-fav-btn--on { border-color:var(--color-accent-lime); background:rgba(200,241,53,0.08); color:var(--color-accent-lime); }
        .builds-list { border:1px solid var(--color-border); border-radius:var(--radius-lg); overflow:hidden; }
        .blist-row { display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3) var(--space-4); border-bottom:1px solid var(--color-border-subtle); cursor:pointer; transition:background var(--transition-fast); }
        .blist-row:last-child { border-bottom:none; }
        .blist-row:hover { background:var(--color-surface-hover); }
        .blist-row:focus-visible { outline:2px solid var(--color-accent-cyan); outline-offset:-2px; }
        .blist-title { font-size:var(--text-base); font-weight:var(--font-weight-medium); color:var(--color-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .blist-meta { font-size:var(--text-sm); color:var(--color-text-faint); text-transform:capitalize; }
        .blist-pct { font-size:var(--text-xs); font-family:var(--font-mono); color:var(--color-text-faint); min-width:30px; text-align:right; }
      `}</style>
    </div>
  )
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <rect x="0" y="0" width="6" height="6" rx="1" />
      <rect x="8" y="0" width="6" height="6" rx="1" />
      <rect x="0" y="8" width="6" height="6" rx="1" />
      <rect x="8" y="8" width="6" height="6" rx="1" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <rect x="0" y="1" width="14" height="2" rx="1" />
      <rect x="0" y="6" width="14" height="2" rx="1" />
      <rect x="0" y="11" width="14" height="2" rx="1" />
    </svg>
  )
}
