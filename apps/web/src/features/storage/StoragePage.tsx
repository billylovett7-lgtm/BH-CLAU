import { useState } from 'react'
import { useStorageStats } from '@/hooks/useBuilds'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Button, Spinner, useToast } from '@/components/ui'
import { exportBackup, downloadBackup, importBackupFromFile } from '@/services/backup'
import { purgeWorkspace } from '@/services/localDb'

// ─── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="stor-stat-row">
      <span className="stor-stat-label">{label}</span>
      <span className="stor-stat-value">{value.toLocaleString()}</span>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="stor-card">
      <h2 className="stor-card__title">{title}</h2>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function StoragePage() {
  const { workspaceId }  = useCurrentUser()
  const stats            = useStorageStats(workspaceId)
  const { toast }        = useToast()

  const [exportBusy,  setExportBusy]  = useState(false)
  const [importBusy,  setImportBusy]  = useState(false)
  const [purgeBusy,   setPurgeBusy]   = useState(false)
  const [confirmText, setConfirmText] = useState('')

  async function handleExport() {
    setExportBusy(true)
    try {
      const payload = await exportBackup(workspaceId)
      downloadBackup(payload)
      toast({ title: 'Backup downloaded', variant: 'success' })
    } catch (err) {
      toast({ title: 'Export failed', description: String(err), variant: 'error' })
    } finally {
      setExportBusy(false)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportBusy(true)
    try {
      await importBackupFromFile(file)
      toast({ title: 'Backup restored successfully', variant: 'success' })
    } catch (err) {
      toast({ title: 'Import failed', description: String(err), variant: 'error' })
    } finally {
      setImportBusy(false)
      e.target.value = ''
    }
  }

  async function handlePurge() {
    if (confirmText !== 'DELETE') return
    setPurgeBusy(true)
    try {
      await purgeWorkspace(workspaceId)
      toast({ title: 'Workspace data deleted', variant: 'success' })
      setConfirmText('')
    } catch (err) {
      toast({ title: 'Purge failed', description: String(err), variant: 'error' })
    } finally {
      setPurgeBusy(false)
    }
  }

  return (
    <div className="stor-page">
      <h1 className="stor-heading">Storage</h1>

      {/* Stats */}
      <SectionCard title="Library counts">
        {stats === undefined
          ? <Spinner size="sm" />
          : (
            <div className="stor-stats">
              <StatRow label="Builds"        value={stats.builds}        />
              <StatRow label="Blocks"        value={stats.blocks}        />
              <StatRow label="Chain Racks"   value={stats.chainRacks}    />
              <StatRow label="MIDI Patterns" value={stats.midiPatterns}  />
              <StatRow label="Samples"       value={stats.samples}       />
              <StatRow label="Presets"       value={stats.presets}       />
              <StatRow label="Grooves"       value={stats.grooves}       />
              <StatRow label="Arrangements"  value={stats.arrangements}  />
              <StatRow label="Assets"        value={stats.assets}        />
              <StatRow label="Asset blobs"   value={stats.blobs}         />
            </div>
          )
        }
      </SectionCard>

      {/* Backup */}
      <SectionCard title="Backup & restore">
        <p className="stor-desc">
          Export all your builds, library entries, and blocks as a single JSON file.
          You can restore from this file at any time.
        </p>
        <div className="stor-actions">
          <Button variant="secondary" size="md" loading={exportBusy} onClick={handleExport}>
            Export backup
          </Button>

          <label className={`stor-import-btn${importBusy ? ' stor-import-btn--loading' : ''}`}>
            {importBusy ? 'Restoring…' : 'Restore from backup'}
            <input type="file" accept=".json" onChange={handleImport} hidden disabled={importBusy} />
          </label>
        </div>
        <p className="stor-hint">
          Restoring a backup merges data using <code>bulkPut</code> — existing records are overwritten if IDs match.
        </p>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Danger zone">
        <div className="stor-danger">
          <p className="stor-danger__desc">
            Permanently delete all workspace data from this device. This cannot be undone.
            Export a backup first.
          </p>
          <div className="stor-danger__confirm">
            <label className="stor-danger__label">Type DELETE to confirm</label>
            <input
              className="stor-danger__input"
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
            <Button
              variant="danger"
              size="md"
              loading={purgeBusy}
              disabled={confirmText !== 'DELETE'}
              onClick={handlePurge}
            >
              Purge workspace
            </Button>
          </div>
        </div>
      </SectionCard>

      <style>{`
        .stor-page { max-width:640px; margin:0 auto; padding:var(--space-6) var(--space-4); display:flex; flex-direction:column; gap:var(--space-6); }
        .stor-heading { font-size:var(--text-2xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0; }
        .stor-card { padding:var(--space-5); background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); display:flex; flex-direction:column; gap:var(--space-4); }
        .stor-card__title { font-size:var(--text-base); font-weight:var(--font-weight-semibold); color:var(--color-text-muted); margin:0; }
        .stor-stats { display:flex; flex-direction:column; gap:0; border:1px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden; }
        .stor-stat-row { display:flex; align-items:center; justify-content:space-between; padding:var(--space-2) var(--space-3); border-bottom:1px solid var(--color-border-subtle); font-size:var(--text-sm); }
        .stor-stat-row:last-child { border-bottom:none; }
        .stor-stat-label { color:var(--color-text-muted); }
        .stor-stat-value { font-family:var(--font-mono); font-weight:var(--font-weight-semibold); color:var(--color-text); }
        .stor-desc { font-size:var(--text-sm); color:var(--color-text-muted); line-height:var(--leading-relaxed); margin:0; }
        .stor-hint { font-size:var(--text-xs); color:var(--color-text-faint); margin:0; }
        .stor-hint code { font-family:var(--font-mono); color:var(--color-accent-cyan); }
        .stor-actions { display:flex; gap:var(--space-3); flex-wrap:wrap; align-items:center; }
        .stor-import-btn { display:inline-flex; align-items:center; height:36px; padding:0 var(--space-4); border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:var(--text-sm); font-weight:var(--font-weight-medium); color:var(--color-text-muted); cursor:pointer; transition:background var(--transition-fast),border-color var(--transition-fast); }
        .stor-import-btn:hover { background:var(--color-surface-hover); border-color:#333; }
        .stor-import-btn--loading { opacity:0.6; pointer-events:none; }
        .stor-danger { display:flex; flex-direction:column; gap:var(--space-4); }
        .stor-danger__desc { font-size:var(--text-sm); color:var(--color-danger); margin:0; }
        .stor-danger__confirm { display:flex; flex-direction:column; gap:var(--space-2); }
        .stor-danger__label { font-size:var(--text-sm); color:var(--color-text-faint); }
        .stor-danger__input { height:36px; padding:0 var(--space-3); border:1px solid var(--color-danger-muted,#3d1f1f); border-radius:var(--radius-md); background:var(--color-surface); color:var(--color-text); font-family:var(--font-mono); font-size:var(--text-sm); outline:none; }
        .stor-danger__input:focus { border-color:var(--color-danger); }
      `}</style>
    </div>
  )
}
