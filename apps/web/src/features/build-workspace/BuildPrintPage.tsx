import { useParams, useNavigate } from 'react-router-dom'
import { useBuild, useBuildStages, useBuildBlocks } from '@/hooks/useBuild'
import { BlockRenderer } from '@/components/blocks'
import { Button, Spinner } from '@/components/ui'
import { STAGES } from '@codex/shared'
import type { Block } from '@codex/shared'

export function BuildPrintPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const build    = useBuild(id ?? '')
  const stages   = useBuildStages(id ?? '')
  const allBlocks = useBuildBlocks(id ?? '')

  if (build === undefined || stages === undefined || allBlocks === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!build) {
    return <div style={{ padding: '2rem' }}><h1>Build not found</h1></div>
  }

  const blocksByStage = allBlocks.reduce<Record<string, Block[]>>((acc, b) => {
    if (!acc[b.stageKey]) acc[b.stageKey] = []
    acc[b.stageKey].push(b)
    return acc
  }, {})

  const completedCount = stages.filter(s => s.completed).length

  return (
    <div className="print-page">
      {/* Screen-only toolbar */}
      <div className="print-toolbar no-print">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
        <Button variant="primary" size="sm" onClick={() => window.print()}>Print / Save PDF</Button>
      </div>

      {/* Build header */}
      <header className="print-header">
        <h1 className="print-title">{build.title}</h1>
        <div className="print-meta">
          {[
            build.genre?.replace(/-/g, ' '),
            build.bpm ? `${build.bpm} BPM` : '',
            build.key ?? '',
            build.status,
          ].filter(Boolean).join('  ·  ')}
        </div>
        <div className="print-meta">
          {completedCount}/{stages.length} stages complete · {build.progress}% done
          {build.dueDate ? `  ·  Due ${new Date(build.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
        </div>
        {build.notes && (
          <p className="print-notes">{build.notes}</p>
        )}
      </header>

      {/* Stages */}
      {STAGES.map(stageDef => {
        const dbStage = stages.find(s => s.stageKey === stageDef.key)
        const blocks  = (blocksByStage[stageDef.key] ?? []).sort((a, b) => a.order - b.order)

        return (
          <section key={stageDef.key} className="print-stage">
            <div className="print-stage__header">
              <span className="print-stage__num">{stageDef.order}</span>
              <h2 className="print-stage__title">{stageDef.title}</h2>
              {dbStage?.completed && <span className="print-stage__done">✓ Done</span>}
            </div>
            {stageDef.description && (
              <p className="print-stage__desc">{stageDef.description}</p>
            )}
            {blocks.length > 0
              ? (
                <div className="print-blocks">
                  {blocks.map(b => (
                    <BlockRenderer key={b.id} block={b} />
                  ))}
                </div>
              )
              : (
                <p className="print-empty">No content for this stage.</p>
              )
            }
          </section>
        )
      })}

      <style>{`
        .print-page { max-width:840px; margin:0 auto; padding:var(--space-6) var(--space-5); }
        .print-toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-6); }
        .print-header { border-bottom:2px solid var(--color-border); padding-bottom:var(--space-5); margin-bottom:var(--space-6); }
        .print-title { font-size:var(--text-3xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0 0 var(--space-2); }
        .print-meta { font-size:var(--text-sm); color:var(--color-text-faint); text-transform:capitalize; margin-bottom:var(--space-1); }
        .print-notes { font-size:var(--text-base); color:var(--color-text-muted); margin:var(--space-3) 0 0; font-style:italic; white-space:pre-wrap; }
        .print-stage { margin-bottom:var(--space-8); page-break-inside:avoid; }
        .print-stage__header { display:flex; align-items:center; gap:var(--space-2); margin-bottom:var(--space-2); }
        .print-stage__num { font-size:var(--text-sm); font-family:var(--font-mono); color:var(--color-text-faint); min-width:20px; }
        .print-stage__title { font-size:var(--text-xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0; }
        .print-stage__done { font-size:var(--text-xs); color:var(--color-accent-lime); font-weight:var(--font-weight-semibold); text-transform:uppercase; letter-spacing:0.06em; margin-left:auto; }
        .print-stage__desc { font-size:var(--text-sm); color:var(--color-text-faint); margin:0 0 var(--space-3); font-style:italic; }
        .print-blocks { display:flex; flex-direction:column; gap:var(--space-3); }
        .print-empty { font-size:var(--text-sm); color:var(--color-text-faint); margin:var(--space-2) 0; }

        @media print {
          .no-print { display:none !important; }
          .print-page { max-width:none; padding:0; }
          .print-stage { page-break-inside:avoid; }
          .block { border-color:#ddd !important; }
          body { background:white; color:black; }
        }
      `}</style>
    </div>
  )
}
