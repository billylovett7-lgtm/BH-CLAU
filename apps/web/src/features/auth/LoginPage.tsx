import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, useToast } from '@/components/ui'
import { signInWithEmail, signInWithGoogle } from '@/services/authService'
import { cloudSyncEnabled } from '@/lib/supabaseClient'

export function LoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [email,   setEmail]   = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    try {
      await signInWithEmail(email.trim())
      setSent(true)
    } catch (err) {
      toast({ title: 'Failed to send link', description: String(err), variant: 'error' })
    } finally {
      setSending(false)
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle()
    } catch (err) {
      toast({ title: 'Google sign-in failed', description: String(err), variant: 'error' })
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo__dot" aria-hidden />
          <span className="login-logo__text">BUILD HUB</span>
        </div>

        <h1 className="login-title">Sign in</h1>
        <p className="login-subtitle">
          {cloudSyncEnabled
            ? 'Sign in to sync your builds to the cloud.'
            : 'Cloud sync is off — your data lives on this device.'}
        </p>

        {/* Local-mode fast-track */}
        {!cloudSyncEnabled && (
          <div className="login-local-banner">
            <span>You are in local mode. No account required.</span>
            <Button variant="primary" size="md" onClick={() => navigate('/dashboard')}>
              Enter app
            </Button>
          </div>
        )}

        {/* Auth forms — only when cloud sync is on */}
        {cloudSyncEnabled && (
          <>
            {sent ? (
              <div className="login-sent">
                <span className="login-sent__icon" aria-hidden>✉</span>
                <p>Check your email for a magic link to sign in.</p>
                <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
                  Try a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="login-form">
                <Input
                  type="email"
                  label="Email address"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={sending}
                  style={{ width: '100%' }}
                >
                  Send magic link
                </Button>
              </form>
            )}

            <div className="login-divider"><span>or</span></div>

            <Button
              variant="secondary"
              size="md"
              onClick={handleGoogle}
              style={{ width: '100%' }}
            >
              <GoogleIcon /> Continue with Google
            </Button>

            <p className="login-footer">
              No account needed for local-only use.{' '}
              <button className="login-footer__link" onClick={() => navigate('/dashboard')}>
                Continue without signing in
              </button>
            </p>
          </>
        )}
      </div>

      <style>{`
        .login-page {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg);
          padding: var(--space-4);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }
        .login-logo {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .login-logo__dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--color-accent-lime);
          box-shadow: var(--shadow-glow-lime);
        }
        .login-logo__text {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-semibold);
          letter-spacing: 0.12em;
          color: var(--color-text-muted);
        }
        .login-title {
          font-size: var(--text-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text);
          line-height: 1;
        }
        .login-subtitle {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          line-height: var(--leading-relaxed);
          margin: 0;
        }
        .login-local-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          padding: var(--space-4);
          background: rgba(200, 241, 53, 0.08);
          border: 1px solid rgba(200, 241, 53, 0.2);
          border-radius: var(--radius-lg);
          font-size: var(--text-base);
          color: var(--color-text-muted);
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .login-sent {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-6);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          text-align: center;
          color: var(--color-text-muted);
          font-size: var(--text-base);
        }
        .login-sent__icon {
          font-size: var(--text-3xl);
        }
        .login-divider {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          color: var(--color-text-faint);
          font-size: var(--text-sm);
        }
        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }
        .login-footer {
          font-size: var(--text-sm);
          color: var(--color-text-faint);
          text-align: center;
          line-height: var(--leading-relaxed);
          margin: 0;
        }
        .login-footer__link {
          background: none;
          border: none;
          color: var(--color-accent-cyan);
          cursor: pointer;
          font-size: inherit;
          text-decoration: underline;
          padding: 0;
        }
      `}</style>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M14.4 8.16c0-.52-.05-1.02-.13-1.5H8v2.84h3.6a3.07 3.07 0 0 1-1.34 2.02v1.68h2.17c1.27-1.17 2-2.89 2-4.04z" fill="#4285F4"/>
      <path d="M8 14.5c1.8 0 3.32-.6 4.43-1.62l-2.17-1.68c-.6.4-1.37.64-2.26.64-1.74 0-3.21-1.17-3.73-2.75H1.99v1.74A6.5 6.5 0 0 0 8 14.5z" fill="#34A853"/>
      <path d="M4.27 9.09A3.9 3.9 0 0 1 4.07 8c0-.38.07-.74.2-1.09V5.17H1.99A6.5 6.5 0 0 0 1.5 8c0 1.05.25 2.04.49 2.83l2.28-1.74z" fill="#FBBC05"/>
      <path d="M8 4.16c.98 0 1.86.34 2.55.99l1.91-1.91A6.46 6.46 0 0 0 8 1.5 6.5 6.5 0 0 0 1.99 5.17l2.28 1.74C4.79 5.33 6.26 4.16 8 4.16z" fill="#EA4335"/>
    </svg>
  )
}
