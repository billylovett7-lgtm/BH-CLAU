import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { cloudSyncEnabled } from '@/lib/supabaseClient'

export function PublicGuard() {
  const { user, initialized } = useAuthStore()

  // With cloud sync enabled, redirect authenticated users away from login/landing
  if (cloudSyncEnabled && initialized && user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
