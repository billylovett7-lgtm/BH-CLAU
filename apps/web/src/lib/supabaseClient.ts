import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://placeholder.supabase.co'
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || 'placeholder-anon-key'

export const supabase = createClient(url, key)

export const cloudSyncEnabled =
  (import.meta.env.VITE_ENABLE_CLOUD_SYNC as string | undefined) === 'true'
