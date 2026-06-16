import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user:        User | null
  session:     Session | null
  loading:     boolean
  initialized: boolean
  guestMode:   boolean

  setUser:      (user: User | null) => void
  setSession:   (session: Session | null) => void
  setInit:      () => void
  setGuestMode: (on: boolean) => void
}

export const useAuthStore = create<AuthState>(set => ({
  user:        null,
  session:     null,
  loading:     true,
  initialized: false,
  guestMode:   false,

  setUser:      user    => set({ user }),
  setSession:   session => set({ session }),
  setInit:      ()      => set({ initialized: true, loading: false }),
  setGuestMode: on      => set({ guestMode: on }),
}))
