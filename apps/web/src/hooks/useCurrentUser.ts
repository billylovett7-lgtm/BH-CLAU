import { useAuthStore } from '@/store/authStore'
import { getLocalIdentity } from '@/lib/localIdentity'
import { cloudSyncEnabled } from '@/lib/supabaseClient'

export interface CurrentUser {
  userId:          string
  workspaceId:     string
  email:           string | undefined
  displayName:     string | undefined
  isAuthenticated: boolean
}

export function useCurrentUser(): CurrentUser {
  const user  = useAuthStore(s => s.user)
  const local = getLocalIdentity()

  if (cloudSyncEnabled && user) {
    return {
      userId:          user.id,
      workspaceId:     local.workspaceId,  // merged with cloud WS in Stage 13
      email:           user.email ?? undefined,
      displayName:     user.user_metadata?.['full_name'] as string | undefined,
      isAuthenticated: true,
    }
  }

  return {
    userId:          local.userId,
    workspaceId:     local.workspaceId,
    email:           undefined,
    displayName:     undefined,
    isAuthenticated: false,
  }
}
