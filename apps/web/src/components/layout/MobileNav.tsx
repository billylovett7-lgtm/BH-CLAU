import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard',        label: 'Home',     icon: '⌂' },
  { to: '/builds',           label: 'Builds',   icon: '◈' },
  { to: '/import',           label: 'Import',   icon: '↑' },
  { to: '/libraries/chains', label: 'Library',  icon: '≡' },
  { to: '/settings',         label: 'Settings', icon: '⚙' },
]

export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `mobile-nav__item${isActive ? ' mobile-nav__item--active' : ''}`}
        >
          <span className="mobile-nav__icon" aria-hidden="true">{item.icon}</span>
          <span className="mobile-nav__label">{item.label}</span>
        </NavLink>
      ))}

      <style>{`
        .mobile-nav {
          display: flex;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: calc(var(--mobile-nav-height) + var(--safe-area-bottom));
          padding-bottom: var(--safe-area-bottom);
          background: var(--color-bg-1);
          border-top: 1px solid var(--color-border);
          z-index: var(--z-sticky);
        }
        @media (min-width: 768px) { .mobile-nav { display: none; } }
        .mobile-nav__item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          text-decoration: none;
          color: var(--color-text-muted);
          font-size: var(--text-xs);
          transition: color var(--transition-fast);
          min-height: var(--mobile-nav-height);
          -webkit-tap-highlight-color: transparent;
        }
        .mobile-nav__item:hover,
        .mobile-nav__item--active { color: var(--color-accent-lime); }
        .mobile-nav__icon { font-size: var(--text-lg); line-height: 1; }
        .mobile-nav__label { font-weight: var(--font-weight-medium); letter-spacing: 0.03em; }
      `}</style>
    </nav>
  )
}
