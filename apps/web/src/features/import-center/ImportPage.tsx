import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Button, Input, Select, Spinner, useToast } from '@/components/ui'
import { BlockRenderer } from '@/components/blocks'
import { createImportJob, findDuplicateJob, markJobDone, detectFileType } from '@/services/importService'
import { createBuild, addTextBlock } from '@/services/buildService'
import { useBuilds } from '@/hooks/useBuilds'
import type { ImportJob, ImportResult, Block } from '@codex/shared'
import { GENRES } from '@codex/shared'

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED = '.html,.htm,.json,.md,.markdown,.txt,.mid,.midi'

const GENRE_OPTIONS = [
  { value: '', label: 'Auto-detected / none' },
  ...GENRES.map(g => ({ value: g.value, label: g.label })),
]

// ─── Drop zone ────────────────────────────────────────────────────────────────

function DropZone({ onFile, loading }: { onFile: (f: File) => void; loading: boolean }) {
  const [over, setOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function prevent(e: React.DragEvent) { e.preventDefault(); e.stopPropagation() }

  const handleDrop = useCallback((e: React.DragEvent) => {
    prevent(e)
    setOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  return (
    <div
      className={`drop-zone${over ? ' drop-zone--over' : ''}`}
      onDragEnter={e => { prevent(e); setOver(true)  }}
      onDragOver={e  => { prevent(e); setOver(true)  }}
      onDragLeave={e => { prevent(e); setOver(false) }}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Drop file here or click to browse"
      onClick={() => !loading && inputRef.current?.click()}
      onKeyDown={e => e.key === 'Enter' && !loading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="drop-zone__input"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
        aria-hidden
        tabIndex={-1}
      />

      {loading
        ? <><Spinner size="lg" /><p className="drop-zone__label">Parsing file…</p></>
        : (
          <>
            <UploadIcon />
            <p className="drop-zone__label">
              {over ? 'Drop to import' : 'Drop a file here, or click to browse'}
            </p>
            <p className="drop-zone__hint">HTML · JSON · Markdown · TXT · MIDI</p>
          </>
        )
      }
    </div>
  )
}

// ─── Metadata form ────────────────────────────────────────────────────────────

interface MetaFields {
  title:    string
  genre:    string
  bpm:      string
  key:      string
  linkTo:   'new' | 'existing'
  buildId:  string
}

function MetadataMapper({
  detected,
  fields,
  builds,
  onChange,
}: {
  detected:  ImportResult['detectedMetadata']
  fields:    MetaFields
  builds:    Array<{ id: string; title: string }>
  onChange:  (f: MetaFields) => void
}) {
  const buildOptions = [
    { value: '',    label: 'Create a new build'    },
    ...builds.map(b => ({ value: b.id, label: b.title })),
  ]

  function set(key: keyof MetaFields, value: string) {
    onChange({ ...fields, [key]: value })
  }

  return (
    <div className="meta-mapper">
      <h2 className="import-section-title">Detected metadata</h2>
      <div className="meta-fields">
        <Input
          label="Title"
          value={fields.title}
          onChange={e => set('title', e.target.value)}
          hint={detected?.title ? `Detected: "${detected.title}"` : undefined}
        />

        <div className="meta-row">
          <div style={{ flex: 1 }}>
            <label className="field__label">Genre</label>
            <Select value={fields.genre} onChange={v => set('genre', v)} options={GENRE_OPTIONS} />
            {detected?.genre && (
              <span className="meta-hint">Detected: {detected.genre}</span>
            )}
          </div>
          <div style={{ width: 110 }}>
            <Input
              label="BPM"
              type="number"
              value={fields.bpm}
              onChange={e => set('bpm', e.target.value)}
              hint={detected?.bpm ? `Detected: ${detected.bpm}` : undefined}
              min={60} max={250}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label="Key"
              value={fields.key}
              onChange={e => set('key', e.target.value)}
              hint={detected?.key ? `Detected: ${detected.key}` : undefined}
            />
          </div>
        </div>

        <div>
          <label className="field__label">Link to build</label>
          <Select
            value={fields.buildId}
            onChange={v => set('buildId', v)}
            options={buildOptions}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Block preview ────────────────────────────────────────────────────────────

function PreviewPanel({ blocks }: { blocks: Block[] }) {
  if (!blocks.length) return (
    <p className="preview-empty">No preview available for this file type.</p>
  )
  return (
    <div className="preview-blocks">
      {blocks.slice(0, 12).map((block, i) => (
        <BlockRenderer key={block.id ?? i} block={block} />
      ))}
      {blocks.length > 12 && (
        <p className="preview-more">+ {blocks.length - 12} more blocks (saved with build)</p>
      )}
    </div>
  )
}



// ─── Page ─────────────────────────────────────────────────────────────────────

type ImportPhase = 'idle' | 'parsing' | 'preview' | 'saving' | 'done' | 'error'

export function ImportPage() {
  const navigate              = useNavigate()
  const { toast }             = useToast()
  const { userId, workspaceId } = useCurrentUser()

  const builds = useBuilds(workspaceId)

  const [phase,     setPhase]     = useState<ImportPhase>('idle')
  const [job,       setJob]       = useState<ImportJob | null>(null)
  const [result,    setResult]    = useState<ImportResult | null>(null)
  const [dupJob,    setDupJob]    = useState<ImportJob | null>(null)
  const [fields,    setFields]    = useState<MetaFields>({
    title: '', genre: '', bpm: '', key: '', linkTo: 'new', buildId: '',
  })

  async function handleFile(file: File) {
    const fileType = detectFileType(file.name)
    if (!fileType) {
      toast({ title: 'Unsupported file', description: `${file.name} is not a supported format.`, variant: 'error' })
      return
    }

    setPhase('parsing')
    setJob(null)
    setResult(null)
    setDupJob(null)

    // duplicate check
    const dup = await findDuplicateJob(file.name, userId)
    if (dup) setDupJob(dup)

    const { job: newJob, result: parsed } = await createImportJob(file, userId)
    setJob(newJob)
    setResult(parsed)

    if (newJob.status === 'error') {
      setPhase('error')
      toast({ title: 'Parse failed', description: newJob.errors[0]?.message ?? 'Unknown error', variant: 'error' })
      return
    }

    // pre-fill metadata form from detected values
    const meta = newJob.detectedMetadata
    setFields({
      title:   meta?.title ?? file.name.replace(/\.[^.]+$/, ''),
      genre:   meta?.genre ?? '',
      bpm:     meta?.bpm   ? String(meta.bpm) : '',
      key:     meta?.key   ?? '',
      linkTo:  'new',
      buildId: '',
    })
    setPhase('preview')
  }

  async function handleSave() {
    if (!job || !result) return
    setPhase('saving')

    try {
      let buildId = fields.buildId

      if (!buildId) {
        // create new build
        buildId = await createBuild(
          {
            title:  fields.title.trim() || job.fileName,
            genre:  fields.genre  || undefined,
            bpm:    fields.bpm    ? parseFloat(fields.bpm) : null,
            key:    fields.key    || null,
          },
          userId,
          workspaceId,
        )
      }

      // attach source blocks to the 'source' stage
      const sourceBlocks = result.previewBlocks.filter(b => b.type === 'source')
      const otherBlocks  = result.previewBlocks.filter(b => b.type !== 'source')

      for (let i = 0; i < sourceBlocks.length; i++) {
        const b = sourceBlocks[i] as Block & { data: { content: string } }
        await addTextBlock(buildId, 'source', b.data.content, i + 1)
      }
      // text/card blocks into overview stage
      let order = 1
      for (const b of otherBlocks) {
        if (b.type === 'text') {
          const tb = b as Block & { data: { content: string } }
          await addTextBlock(buildId, 'overview', tb.data.content, order++)
        }
      }

      await markJobDone(job.id, job)
      setPhase('done')
      toast({ title: 'Import saved', variant: 'success' })
      navigate(`/builds/${buildId}`)
    } catch (err) {
      toast({ title: 'Save failed', description: String(err), variant: 'error' })
      setPhase('preview')
    }
  }

  function handleReset() {
    setPhase('idle')
    setJob(null)
    setResult(null)
    setDupJob(null)
  }

  const buildList = (builds ?? []).map(b => ({ id: b.id, title: b.title }))

  return (
    <div className="import-page">
      <div className="import-header">
        <h1 className="import-heading">Import</h1>
        {phase !== 'idle' && (
          <Button variant="ghost" size="sm" onClick={handleReset}>Import another</Button>
        )}
      </div>

      {/* Drop zone — always visible when idle or error */}
      {(phase === 'idle' || phase === 'error') && (
        <DropZone onFile={handleFile} loading={false} />
      )}

      {phase === 'parsing' && (
        <DropZone onFile={handleFile} loading={true} />
      )}

      {/* Duplicate warning */}
      {dupJob && (
        <div className="import-dup-warning">
          <span>A file named <strong>{dupJob.fileName}</strong> was already imported.</span>
          <Button variant="ghost" size="sm" onClick={() => setDupJob(null)}>Dismiss</Button>
        </div>
      )}

      {/* Error details */}
      {phase === 'error' && job && job.errors.length > 0 && (
        <div className="import-error-box">
          <strong>Parse errors:</strong>
          <ul>
            {job.errors.map((e, i) => <li key={i}>{e.field}: {e.message}</li>)}
          </ul>
        </div>
      )}

      {/* Preview + metadata */}
      {(phase === 'preview' || phase === 'saving') && result && (
        <div className="import-preview-layout">
          <div className="import-col-meta">
            <MetadataMapper
              detected={result.detectedMetadata}
              fields={fields}
              builds={buildList}
              onChange={setFields}
            />
            <div className="import-save-row">
              <Button
                variant="primary"
                size="md"
                loading={phase === 'saving'}
                onClick={handleSave}
              >
                Save to build
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>Cancel</Button>
            </div>
          </div>

          <div className="import-col-preview">
            <h2 className="import-section-title">
              Preview
              {result.previewBlocks.length > 0 && (
                <span className="import-section-count">{result.previewBlocks.length} blocks</span>
              )}
            </h2>
            <PreviewPanel blocks={result.previewBlocks} />
          </div>
        </div>
      )}

      <style>{`
        .import-page { max-width:1000px; margin:0 auto; padding:var(--space-6) var(--space-4); display:flex; flex-direction:column; gap:var(--space-6); }
        .import-header { display:flex; align-items:center; justify-content:space-between; }
        .import-heading { font-size:var(--text-2xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0; }
        /* drop zone */
        .drop-zone { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:var(--space-3); padding:var(--space-10) var(--space-4); border:2px dashed var(--color-border); border-radius:var(--radius-xl); background:var(--color-surface); cursor:pointer; transition:border-color var(--transition-fast),background var(--transition-fast); text-align:center; min-height:220px; }
        .drop-zone:hover,.drop-zone--over { border-color:var(--color-accent-cyan); background:rgba(0,229,255,0.04); }
        .drop-zone:focus-visible { outline:2px solid var(--color-accent-cyan); outline-offset:2px; }
        .drop-zone__input { display:none; }
        .drop-zone__label { font-size:var(--text-lg); font-weight:var(--font-weight-medium); color:var(--color-text-muted); margin:0; }
        .drop-zone__hint { font-size:var(--text-sm); color:var(--color-text-faint); margin:0; }
        /* duplicate warning */
        .import-dup-warning { display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); padding:var(--space-3) var(--space-4); background:rgba(255,170,0,0.08); border:1px solid rgba(255,170,0,0.25); border-radius:var(--radius-md); font-size:var(--text-sm); color:var(--color-text-muted); }
        /* error box */
        .import-error-box { padding:var(--space-4); background:rgba(255,59,59,0.08); border:1px solid rgba(255,59,59,0.25); border-radius:var(--radius-md); font-size:var(--text-sm); color:var(--color-danger); }
        .import-error-box ul { margin:var(--space-2) 0 0 var(--space-4); padding:0; }
        /* preview layout */
        .import-preview-layout { display:grid; grid-template-columns:360px 1fr; gap:var(--space-6); align-items:start; }
        @media(max-width:720px){ .import-preview-layout { grid-template-columns:1fr; } }
        .import-col-meta { display:flex; flex-direction:column; gap:var(--space-5); position:sticky; top:var(--space-4); }
        .import-col-preview { min-width:0; }
        .import-section-title { font-size:var(--text-sm); font-weight:var(--font-weight-semibold); color:var(--color-text-faint); text-transform:uppercase; letter-spacing:0.08em; margin:0 0 var(--space-4); display:flex; align-items:center; gap:var(--space-2); }
        .import-section-count { font-size:var(--text-xs); font-family:var(--font-mono); color:var(--color-text-faint); background:var(--color-bg-3); border-radius:var(--radius-sm); padding:1px 6px; }
        .import-save-row { display:flex; gap:var(--space-2); align-items:center; }
        /* metadata mapper */
        .meta-mapper { display:flex; flex-direction:column; gap:var(--space-4); }
        .meta-fields { display:flex; flex-direction:column; gap:var(--space-3); }
        .meta-row { display:flex; gap:var(--space-3); flex-wrap:wrap; }
        .meta-hint { font-size:var(--text-xs); color:var(--color-text-faint); margin-top:2px; display:block; }
        .field__label { display:block; font-size:var(--text-sm); font-weight:var(--font-weight-medium); color:var(--color-text-muted); margin-bottom:var(--space-1); }
        /* preview */
        .preview-empty { font-size:var(--text-sm); color:var(--color-text-faint); text-align:center; padding:var(--space-6) 0; }
        .preview-blocks { display:flex; flex-direction:column; gap:var(--space-3); }
        .preview-more { font-size:var(--text-xs); color:var(--color-text-faint); text-align:center; padding:var(--space-2); }
      `}</style>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="20" fill="var(--color-bg-3)" />
      <path d="M20 28V20M20 20l-4 4M20 20l4 4" stroke="var(--color-text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 16a5 5 0 0 1 12 0" stroke="var(--color-text-faint)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
