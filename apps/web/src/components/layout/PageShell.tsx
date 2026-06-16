import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'
import { MobileNav } from './MobileNav'

export function PageShell() {
  return (
    <div className="page-shell">
      <TopNav />
      <main className="page-shell__content">
        <Outlet />
      </main>
      <MobileNav />

      <style>{`
        .page-shell {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          background: var(--color-bg);
        }
        .page-shell__content {
          flex: 1;
          padding-top: var(--nav-height);
          padding-bottom: calc(var(--mobile-nav-height) + var(--safe-area-bottom));
        }
        @media (min-width: 768px) {
          .page-shell__content {
            padding-bottom: 0;
          }
        }
      `}</style>
    </div>
  )
}
