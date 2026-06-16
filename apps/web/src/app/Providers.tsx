import { useEffect, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { supabase, cloudSyncEnabled } from '@/lib/supabaseClient'
import { useAuthStore } from '@/store/authStore'
import { ToastProvider } from '@/components/ui'

function AuthListener() {
  const { setUser, setSession, setInit } = useAuthStore()

  useEffect(() => {
    // Resolve initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setInit()
    })

    // Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setInit])

  return null
}

export function Providers({ children }: { children: ReactNode }) {
  const setInit = useAuthStore(s => s.setInit)

  useEffect(() => {
    // Without cloud sync, mark auth as initialized immediately (no session to resolve)
    if (!cloudSyncEnabled) setInit()
  }, [setInit])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {cloudSyncEnabled && <AuthListener />}
        {children}
      </ToastProvider>
    </QueryClientProvider>
  )
}
