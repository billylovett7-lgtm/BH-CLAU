export function LandingPage() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent-lime)', marginBottom: '1rem' }}>
        Codex Build Hub
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        Production operating system for underground electronic music producers.
      </p>
      <a href="/dashboard" style={{ color: 'var(--color-accent-cyan)' }}>Enter Dashboard →</a>
    </div>
  )
}
