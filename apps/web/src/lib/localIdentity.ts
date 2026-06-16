// Stable anonymous identity for local-first (offline) mode.
// When cloud sync is enabled and the user logs in, ownerId/workspaceId
// get replaced by the authenticated Supabase user/workspace IDs.

const USER_KEY = 'codex:local-user-id'
const WS_KEY   = 'codex:local-workspace-id'

export interface LocalIdentity {
  userId:      string
  workspaceId: string
}

export function getLocalIdentity(): LocalIdentity {
  let userId      = localStorage.getItem(USER_KEY)
  let workspaceId = localStorage.getItem(WS_KEY)

  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem(USER_KEY, userId)
  }
  if (!workspaceId) {
    workspaceId = crypto.randomUUID()
    localStorage.setItem(WS_KEY, workspaceId)
  }

  return { userId, workspaceId }
}

export function clearLocalIdentity(): void {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(WS_KEY)
}
