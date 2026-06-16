import { NavLink, Link } from 'react-router-dom'
import { useState } from 'react'

const libraryLinks = [
  { to: '/libraries/chains',       label: 'Chains' },
  { to: '/libraries/midi',         label: 'MIDI Patterns' },
  { to: '/libraries/samples',      label: 'Samples' },
  { to: '/libraries/presets',      label: 'Presets' },
  { to: '/libraries/grooves',      label: 'Grooves' },
  { to: '/libraries/arrangements', label: 'Arrangements' },
]

export function TopNav() {
  const [librariesOpen, setLibrariesOpen] = useState(false)

  return (
    <header className="top-nav" role="banner">
      <div className="top-nav__inner">
        <Link to="/dashboard" className="top-nav__logo" aria-label="Codex Build Hub home">
          <span className="top-nav__logo-text">BUILD HUB</span>
          <span className="top-nav__logo-dot" aria-hidden="true" />
        </Link>

        <nav className="top-nav__links" aria-label="Main navigation">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'top-nav__link top-nav__link--active' : 'top-nav__link'}>
            Dashboard
          </NavLink>
          <NavLink to="/builds" className={({ isActive }) => isActive ? 'top-nav__link top-nav__link--active' : 'top-nav__link'}>
            Builds
          </NavLink>

          <div className="top-nav__dropdown" onMouseLeave={() => setLibrariesOpen(false)}>
            <button
              className="top-nav__link top-nav__link--dropdown"
              onMouseEnter={() => setLibrariesOpen(true)}
              onClick={() => setLibrariesOpen(v => !v)}
              aria-expanded={librariesOpen}
              aria-haspopup="menu"
            >
              Libraries <span aria-hidden="true">▾</span>
            </button>
            {librariesOpen && (
              <div className="top-nav__dropdown-menu" role="menu">
                {libraryLinks.map(l => (
                  <NavLink key={l.to} to={l.to} role="menuitem" className="top-nav__dropdown-item"
                    onClick={() => setLibrariesOpen(false)}>
                    {l.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <NavLink to="/import" className={({ isActive }) => isActive ? 'top-nav__link top-nav__link--active' : 'top-nav__link'}>
            Import
          </NavLink>
        </nav>

        <div className="top-nav__actions">
          <button className="top-nav__search-btn" aria-label="Open search">
            <span aria-hidden="true">⌕</span>
          </button>
        </div>
      </div>

      <style>{`
        .top-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--nav-height);
          background: var(--color-bg-1);
          border-bottom: 1px solid var(--color-border);
          z-index: var(--z-sticky);
          padding-top: var(--safe-area-top);
        }
        .top-nav__inner {
          display: flex;
          align-items: center;
          gap: var(--space-6);
          height: 100%;
          padding: 0 var(--space-6);
          max-width: var(--content-max-width);
          margin: 0 auto;
        }
        .top-nav__logo {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          text-decoration: none;
          flex-shrink: 0;
        }
        .top-nav__logo-text {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          letter-spacing: 0.12em;
          color: var(--color-text);
        }
        .top-nav__logo-dot {
          width: 6px;
          height: 6px;
          background: var(--color-accent-lime);
          border-radius: 50%;
          box-shadow: var(--shadow-glow-lime);
        }
        .top-nav__links {
          display: none;
          align-items: center;
          gap: var(--space-1);
          flex: 1;
        }
        @media (min-width: 768px) { .top-nav__links { display: flex; } }
        .top-nav__link {
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          text-decoration: none;
          border-radius: var(--radius-md);
          background: none;
          border: none;
          cursor: pointer;
          transition: color var(--transition-fast), background var(--transition-fast);
          white-space: nowrap;
        }
        .top-nav__link:hover { color: var(--color-text); background: var(--color-surface-hover); }
        .top-nav__link--active { color: var(--color-accent-lime); }
        .top-nav__dropdown { position: relative; }
        .top-nav__dropdown-menu {
          position: absolute;
          top: calc(100% + var(--space-2));
          left: 0;
          background: var(--color-bg-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          min-width: 180px;
          padding: var(--space-2);
          z-index: var(--z-dropdown);
        }
        .top-nav__dropdown-item {
          display: block;
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: color var(--transition-fast), background var(--transition-fast);
        }
        .top-nav__dropdown-item:hover { color: var(--color-text); background: var(--color-surface-hover); }
        .top-nav__actions { margin-left: auto; display: flex; align-items: center; gap: var(--space-2); }
        .top-nav__search-btn {
          background: none;
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          border-radius: var(--radius-md);
          padding: var(--space-2) var(--space-3);
          cursor: pointer;
          font-size: var(--text-md);
          transition: color var(--transition-fast), border-color var(--transition-fast);
        }
        .top-nav__search-btn:hover { color: var(--color-text); border-color: var(--color-text-faint); }
      `}</style>
    </header>
  )
}
