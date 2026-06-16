import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { AuthGuard } from './guards/AuthGuard'
import { PublicGuard } from './guards/PublicGuard'
import { Spinner } from '@/components/ui'

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner size="md" />
    </div>
  )
}

function wrap(Component: React.LazyExoticComponent<() => JSX.Element>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

const LandingPage        = lazy(() => import('@/features/marketing/LandingPage').then(m => ({ default: m.LandingPage })))
const LoginPage          = lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage      = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const BuildsPage         = lazy(() => import('@/features/builds/BuildsPage').then(m => ({ default: m.BuildsPage })))
const NewBuildPage       = lazy(() => import('@/features/builds/NewBuildPage').then(m => ({ default: m.NewBuildPage })))
const BuildWorkspacePage = lazy(() => import('@/features/build-workspace/BuildWorkspacePage').then(m => ({ default: m.BuildWorkspacePage })))
const BuildPrintPage     = lazy(() => import('@/features/build-workspace/BuildPrintPage').then(m => ({ default: m.BuildPrintPage })))
const ImportPage         = lazy(() => import('@/features/import-center/ImportPage').then(m => ({ default: m.ImportPage })))
const ChainsPage         = lazy(() => import('@/features/libraries/chains/ChainsPage').then(m => ({ default: m.ChainsPage })))
const MidiPage           = lazy(() => import('@/features/libraries/midi/MidiPage').then(m => ({ default: m.MidiPage })))
const MidiPatternDetail  = lazy(() => import('@/features/libraries/midi/MidiPatternDetail').then(m => ({ default: m.MidiPatternDetail })))
const SamplesPage        = lazy(() => import('@/features/libraries/samples/SamplesPage').then(m => ({ default: m.SamplesPage })))
const PresetsPage        = lazy(() => import('@/features/libraries/presets/PresetsPage').then(m => ({ default: m.PresetsPage })))
const GroovesPage        = lazy(() => import('@/features/libraries/grooves/GroovesPage').then(m => ({ default: m.GroovesPage })))
const ArrangementsPage   = lazy(() => import('@/features/libraries/arrangements/ArrangementsPage').then(m => ({ default: m.ArrangementsPage })))
const ArrangementDetail  = lazy(() => import('@/features/libraries/arrangements/ArrangementDetail').then(m => ({ default: m.ArrangementDetail })))
const ComparePage        = lazy(() => import('@/features/compare/ComparePage').then(m => ({ default: m.ComparePage })))
const QaPage             = lazy(() => import('@/features/qa/QaPage').then(m => ({ default: m.QaPage })))
const StoragePage        = lazy(() => import('@/features/storage/StoragePage').then(m => ({ default: m.StoragePage })))
const SettingsPage       = lazy(() => import('@/features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const PublicBuildPage    = lazy(() => import('@/features/public-share/PublicBuildPage').then(m => ({ default: m.PublicBuildPage })))
const DocsPage           = lazy(() => import('@/features/marketing/DocsPage').then(m => ({ default: m.DocsPage })))

export const router = createBrowserRouter([
  // Public — no shell, no auth required
  {
    element: <PublicGuard />,
    children: [
      { path: '/',     element: wrap(LandingPage) },
      { path: '/login', element: wrap(LoginPage) },
    ],
  },
  { path: '/public/:shareSlug', element: wrap(PublicBuildPage) },
  { path: '/docs',              element: wrap(DocsPage) },
  { path: '/builds/:buildId/print', element: wrap(BuildPrintPage) },

  // Authenticated app — AuthGuard → PageShell → route content
  {
    element: <AuthGuard />,
    children: [{
      element: <PageShell />,
      children: [
        { path: '/dashboard',                              element: wrap(DashboardPage) },
        { path: '/builds',                                 element: wrap(BuildsPage) },
        { path: '/builds/new',                             element: wrap(NewBuildPage) },
        { path: '/builds/:buildId',                        element: wrap(BuildWorkspacePage) },
        { path: '/import',                                 element: wrap(ImportPage) },
        { path: '/libraries/chains',                       element: wrap(ChainsPage) },
        { path: '/libraries/midi',                         element: wrap(MidiPage) },
        { path: '/libraries/midi/:patternId',              element: wrap(MidiPatternDetail) },
        { path: '/libraries/samples',                      element: wrap(SamplesPage) },
        { path: '/libraries/presets',                      element: wrap(PresetsPage) },
        { path: '/libraries/grooves',                      element: wrap(GroovesPage) },
        { path: '/libraries/arrangements',                 element: wrap(ArrangementsPage) },
        { path: '/libraries/arrangements/:arrangementId',  element: wrap(ArrangementDetail) },
        { path: '/compare',                                element: wrap(ComparePage) },
        { path: '/qa',                                     element: wrap(QaPage) },
        { path: '/storage',                                element: wrap(StoragePage) },
        { path: '/settings',                               element: wrap(SettingsPage) },
      ],
    }],
  },

  { path: '*', element: <Navigate to="/" replace /> },
])
