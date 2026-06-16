import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { cloudSyncEnabled } from '@/lib/supabaseClient'
import { Spinner } from '@/components/ui'

export function AuthGuard() {
  const { user, initialized } = useAuthStore()

  // Cloud sync off → no auth required, pass through for local-only mode
  if (!cloudSyncEnabled) return <Outlet />

  // Still resolving initial session
  if (!initialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
