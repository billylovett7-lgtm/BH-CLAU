import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { cloudSyncEnabled } from '@/lib/supabaseClient'

interface PublicGuardProps {
  children: ReactNode
}

export function PublicGuard({ children }: PublicGuardProps) {
  const { user, initialized } = useAuthStore()

  // With cloud sync enabled, redirect authenticated users away from login/landing
  if (cloudSyncEnabled && initialized && user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
