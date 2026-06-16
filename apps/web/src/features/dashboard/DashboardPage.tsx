import { useNavigate } from 'react-router-dom'
import { useActiveBuilds, useRecentImportJobs, useStorageStats } from '@/hooks/useBuilds'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Button, Badge, StatusBadge, PriorityBadge, Spinner, EmptyState } from '@/components/ui'
import type { Build, ImportJob } from '@codex/shared'

// ─── Priority sort ──────────────────────────────────────────────────────────

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const

function sortBuilds(builds: Build[]): Build[] {
  return [...builds].sort((a, b) => {
    const pdiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (pdiff !== 0) return pdiff
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

// ─── Progress ring ──────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 52 }: { pct: number; size?: number }) {
  const r    = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg-3)" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--color-accent-lime)" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} />
    </svg>
  )
}

// ─── Continue working card ──────────────────────────────────────────────────

function ContinueCard({ build }: { build: Build }) {
  const navigate = useNavigate()
  return (
    <div className="dash-continue" role="button" tabIndex={0}
      onClick={() => navigate(`/builds/${build.id}`)}
      onKeyDown={e => e.key === 'Enter' && navigate(`/builds/${build.id}`)}>
      <ProgressRing pct={build.progress} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="dash-continue__title">{build.title}</div>
        <div className="dash-continue__stage">{build.currentStage.replace(/-/g, ' ')}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-1)' }}>
        <StatusBadge status={build.status} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
          {build.progress}% done
        </span>
      </div>
    </div>
  )
}

// ─── Build row ──────────────────────────────────────────────────────────────

function BuildRow({ build }: { build: Build }) {
  const navigate = useNavigate()
  return (
    <div className="dash-build-row" role="button" tabIndex={0}
      onClick={() => navigate(`/builds/${build.id}`)}
      onKeyDown={e => e.key === 'Enter' && navigate(`/builds/${build.id}`)}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="dash-build-row__title">{build.title}</div>
        {(build.genre || build.bpm) && (
          <div className="dash-build-row__meta">
            {[build.genre, build.bpm ? `${build.bpm} BPM` : ''].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
        <PriorityBadge priority={build.priority} />
        <StatusBadge status={build.status} />
        {build.dueDate && (
          <span className="dash-build-row__due">
            {new Date(build.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Import job row ─────────────────────────────────────────────────────────

function ImportRow({ job }: { job: ImportJob }) {
  const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'cyan' | 'default'> = {
    done: 'success', error: 'danger', saving: 'warning', preview: 'cyan',
  }
  const variant = variantMap[job.status] ?? 'default'
  return (
    <div className="dash-import-row">
      <span className="dash-import-row__file">{job.fileName}</span>
      <Badge variant={variant}>{job.status}</Badge>
      <span className="dash-import-row__date">
        {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </span>
    </div>
  )
}

// ─── Section header ─────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="dash-section-header">
      <span className="dash-section-header__title">{title}</span>
      {action}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate              = useNavigate()
  const { workspaceId, userId } = useCurrentUser()

  const activeBuilds  = useActiveBuilds(workspaceId)
  const recentImports = useRecentImportJobs(userId, 5)
  const stats         = useStorageStats(workspaceId)

  if (activeBuilds === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  const sorted    = sortBuilds(activeBuilds)
  const continueB = sorted[0] ?? null
  const queue     = sorted.slice(1, 8)

  return (
    <div className="dash-page">

      <section>
        <SectionHeader title="Continue working"
          action={<Button variant="ghost" size="sm" onClick={() => navigate('/builds/new')}>+ New build</Button>} />
        {continueB
          ? <ContinueCard build={continueB} />
          : <EmptyState title="No active builds"
              description="Create your first build to start documenting a track."
              action={<Button variant="primary" size="md" onClick={() => navigate('/builds/new')}>Create build</Button>} />}
      </section>

      {queue.length > 0 && (
        <section>
          <SectionHeader title="Priority queue"
            action={<Button variant="ghost" size="sm" onClick={() => navigate('/builds')}>View all</Button>} />
          <div className="dash-list">
            {queue.map(b => <BuildRow key={b.id} build={b} />)}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="Recent imports"
          action={<Button variant="ghost" size="sm" onClick={() => navigate('/import')}>Import file</Button>} />
        {recentImports && recentImports.length > 0
          ? <div className="dash-list">{recentImports.map(j => <ImportRow key={j.id} job={j} />)}</div>
          : <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)' }}>
              No imports yet. Drop an HTML, JSON, Markdown, TXT or MIDI file to get started.
            </p>}
      </section>

      {stats && (
        <section>
          <SectionHeader title="Library" />
          <div className="dash-stats">
            {([
              ['Builds',        stats.builds],
              ['Chain Racks',   stats.chainRacks],
              ['MIDI Patterns', stats.midiPatterns],
              ['Samples',       stats.samples],
              ['Presets',       stats.presets],
              ['Grooves',       stats.grooves],
              ['Arrangements',  stats.arrangements],
            ] as [string, number][]).map(([label, count]) => (
              <div key={label} className="dash-stat">
                <span className="dash-stat__count">{count}</span>
                <span className="dash-stat__label">{label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <style>{`
        .dash-page { max-width:800px; margin:0 auto; padding:var(--space-6) var(--space-4); display:flex; flex-direction:column; gap:var(--space-8); }
        .dash-section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-3); }
        .dash-section-header__title { font-size:var(--text-sm); font-weight:var(--font-weight-semibold); color:var(--color-text-faint); text-transform:uppercase; letter-spacing:0.08em; }
        .dash-continue { display:flex; align-items:center; gap:var(--space-3); padding:var(--space-4); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); cursor:pointer; transition:background var(--transition-fast), border-color var(--transition-fast); }
        .dash-continue:hover { background:var(--color-surface-hover); border-color:#333; }
        .dash-continue:focus-visible { outline:2px solid var(--color-accent-cyan); outline-offset:2px; }
        .dash-continue__title { font-size:var(--text-md); font-weight:var(--font-weight-semibold); color:var(--color-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dash-continue__stage { font-size:var(--text-sm); color:var(--color-text-muted); margin-top:2px; text-transform:capitalize; }
        .dash-list { border:1px solid var(--color-border); border-radius:var(--radius-lg); overflow:hidden; }
        .dash-build-row { display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3) var(--space-4); border-bottom:1px solid var(--color-border-subtle); cursor:pointer; transition:background var(--transition-fast); }
        .dash-build-row:last-child { border-bottom:none; }
        .dash-build-row:hover { background:var(--color-surface-hover); }
        .dash-build-row__title { font-size:var(--text-base); font-weight:var(--font-weight-medium); color:var(--color-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dash-build-row__meta { font-size:var(--text-sm); color:var(--color-text-faint); margin-top:1px; }
        .dash-build-row__due { font-size:var(--text-xs); color:var(--color-warning); font-family:var(--font-mono); }
        .dash-import-row { display:flex; align-items:center; gap:var(--space-3); padding:var(--space-3) var(--space-4); border-bottom:1px solid var(--color-border-subtle); }
        .dash-import-row:last-child { border-bottom:none; }
        .dash-import-row__file { flex:1; font-size:var(--text-base); color:var(--color-text); font-family:var(--font-mono); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dash-import-row__date { font-size:var(--text-xs); color:var(--color-text-faint); white-space:nowrap; }
        .dash-stats { display:grid; grid-template-columns:repeat(auto-fill, minmax(100px,1fr)); gap:var(--space-2); }
        .dash-stat { display:flex; flex-direction:column; align-items:center; gap:2px; padding:var(--space-3); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md); text-align:center; }
        .dash-stat__count { font-size:var(--text-2xl); font-weight:var(--font-weight-bold); color:var(--color-text); font-family:var(--font-mono); }
        .dash-stat__label { font-size:var(--text-xs); color:var(--color-text-faint); }
      `}</style>
    </div>
  )
}
