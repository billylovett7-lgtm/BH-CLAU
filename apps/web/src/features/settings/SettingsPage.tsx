import { useState } from 'react'
import { Input, Button, useToast } from '@/components/ui'
import { cloudSyncEnabled } from '@/lib/supabaseClient'
import { getLocalIdentity, clearLocalIdentity } from '@/lib/localIdentity'
import { signOut } from '@/services/authService'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useNavigate } from 'react-router-dom'

// ─── Section ─────────────────────────────────────────────────────────────────

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="set-section">
      <h2 className="set-section__title">{title}</h2>
      <div className="set-section__body">{children}</div>
    </div>
  )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="set-row">
      <div className="set-row__info">
        <div className="set-row__label">{label}</div>
        {description && <div className="set-row__desc">{description}</div>}
      </div>
      <div className="set-row__control">{children}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const navigate      = useNavigate()
  const { toast }     = useToast()
  const currentUser   = useCurrentUser()
  const localIdentity = getLocalIdentity()

  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      clearLocalIdentity()
      navigate('/login', { replace: true })
    } catch (err) {
      toast({ title: 'Sign out failed', description: String(err), variant: 'error' })
      setSigningOut(false)
    }
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id)
      .then(() => toast({ title: 'Copied to clipboard', variant: 'success' }))
      .catch(() => toast({ title: 'Copy failed', variant: 'error' }))
  }

  return (
    <div className="set-page">
      <h1 className="set-heading">Settings</h1>

      {/* Identity */}
      <SettingSection title="Identity">
        <SettingRow
          label="Workspace ID"
          description="Your local workspace identifier. Used for scoping all library data."
        >
          <div className="set-id-row">
            <code className="set-id">{localIdentity.workspaceId.slice(0, 18)}…</code>
            <button className="set-copy-btn" type="button" onClick={() => copyId(localIdentity.workspaceId)}>Copy</button>
          </div>
        </SettingRow>

        <SettingRow
          label="User ID"
          description="Your local anonymous user identifier."
        >
          <div className="set-id-row">
            <code className="set-id">{localIdentity.userId.slice(0, 18)}…</code>
            <button className="set-copy-btn" type="button" onClick={() => copyId(localIdentity.userId)}>Copy</button>
          </div>
        </SettingRow>

        {cloudSyncEnabled && currentUser.isAuthenticated && (
          <SettingRow label="Account" description="Signed in via Supabase.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {currentUser.email ?? 'Unknown'}
              </span>
              <Button variant="ghost" size="sm" loading={signingOut} onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </SettingRow>
        )}
      </SettingSection>

      {/* Cloud sync */}
      <SettingSection title="Cloud sync">
        <SettingRow
          label="Cloud sync status"
          description={cloudSyncEnabled
            ? 'Cloud sync is enabled. Data syncs to Supabase when signed in.'
            : 'Cloud sync is off. All data lives on this device only.'}
        >
          <span className={`set-sync-badge${cloudSyncEnabled ? ' set-sync-badge--on' : ''}`}>
            {cloudSyncEnabled ? 'On' : 'Off'}
          </span>
        </SettingRow>

        {!cloudSyncEnabled && (
          <div className="set-info-box">
            To enable cloud sync, set <code>VITE_ENABLE_CLOUD_SYNC=true</code> in your <code>.env</code> file and redeploy.
            See <code>docs/SETUP.md</code> for instructions.
          </div>
        )}
      </SettingSection>

      {/* App info */}
      <SettingSection title="App info">
        <SettingRow label="Version" description="Build Hub — Codex">
          <code className="set-id">v0.10.0</code>
        </SettingRow>
        <SettingRow label="Schema version" description="Local Dexie database schema.">
          <code className="set-id">v1</code>
        </SettingRow>
        <SettingRow label="IndexedDB" description="Storage backend for all local data.">
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)' }}>
            codex-build-hub
          </span>
        </SettingRow>
      </SettingSection>

      {/* Keyboard shortcuts */}
      <SettingSection title="Keyboard shortcuts">
        <div className="set-shortcuts">
          {[
            ['Navigate stages in workspace', '← / →'],
            ['Open command palette', 'Ctrl + K'],
            ['Go to Builds',        'G then B'],
            ['Go to Dashboard',     'G then D'],
            ['Go to Import',        'G then I'],
          ].map(([label, key]) => (
            <div key={label} className="set-shortcut">
              <span className="set-shortcut__label">{label}</span>
              <kbd className="set-shortcut__key">{key}</kbd>
            </div>
          ))}
        </div>
      </SettingSection>

      <style>{`
        .set-page { max-width:640px; margin:0 auto; padding:var(--space-6) var(--space-4); display:flex; flex-direction:column; gap:var(--space-8); }
        .set-heading { font-size:var(--text-2xl); font-weight:var(--font-weight-bold); color:var(--color-text); margin:0; }
        .set-section { display:flex; flex-direction:column; gap:var(--space-1); }
        .set-section__title { font-size:var(--text-sm); font-weight:var(--font-weight-semibold); color:var(--color-text-faint); text-transform:uppercase; letter-spacing:0.08em; margin:0 0 var(--space-2); }
        .set-section__body { border:1px solid var(--color-border); border-radius:var(--radius-lg); overflow:hidden; }
        .set-row { display:flex; align-items:center; justify-content:space-between; gap:var(--space-4); padding:var(--space-3) var(--space-4); border-bottom:1px solid var(--color-border-subtle); }
        .set-row:last-child { border-bottom:none; }
        .set-row__info { flex:1; min-width:0; }
        .set-row__label { font-size:var(--text-base); font-weight:var(--font-weight-medium); color:var(--color-text-muted); }
        .set-row__desc { font-size:var(--text-sm); color:var(--color-text-faint); margin-top:2px; line-height:var(--leading-relaxed); }
        .set-row__control { flex-shrink:0; }
        .set-id-row { display:flex; align-items:center; gap:var(--space-2); }
        .set-id { font-family:var(--font-mono); font-size:var(--text-sm); color:var(--color-text-faint); background:var(--color-bg-3); padding:2px 6px; border-radius:var(--radius-sm); }
        .set-copy-btn { background:none; border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:2px 8px; font-size:var(--text-xs); color:var(--color-text-faint); cursor:pointer; }
        .set-copy-btn:hover { color:var(--color-text); border-color:#333; }
        .set-sync-badge { display:inline-flex; padding:2px 10px; border-radius:var(--radius-sm); font-size:var(--text-sm); font-weight:var(--font-weight-medium); border:1px solid var(--color-border); color:var(--color-text-faint); }
        .set-sync-badge--on { border-color:var(--color-accent-lime); color:var(--color-accent-lime); background:rgba(200,241,53,0.08); }
        .set-info-box { margin:0 var(--space-4) var(--space-4); padding:var(--space-3); background:var(--color-bg-3); border-radius:var(--radius-md); font-size:var(--text-sm); color:var(--color-text-faint); line-height:var(--leading-relaxed); }
        .set-info-box code { font-family:var(--font-mono); color:var(--color-accent-cyan); }
        .set-shortcuts { display:flex; flex-direction:column; }
        .set-shortcut { display:flex; align-items:center; justify-content:space-between; padding:var(--space-3) var(--space-4); border-bottom:1px solid var(--color-border-subtle); }
        .set-shortcut:last-child { border-bottom:none; }
        .set-shortcut__label { font-size:var(--text-sm); color:var(--color-text-muted); }
        .set-shortcut__key { font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text); background:var(--color-bg-3); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:2px 8px; }
      `}</style>
    </div>
  )
}
