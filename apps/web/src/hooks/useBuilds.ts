import { useLiveQuery } from 'dexie-react-hooks'
import {
  getBuilds,
  getActiveBuilds,
  getRecentImportJobs,
  getStorageStats,
} from '@/services/localDb'

export function useBuilds(workspaceId: string) {
  return useLiveQuery(() => getBuilds(workspaceId), [workspaceId])
}

export function useActiveBuilds(workspaceId: string) {
  return useLiveQuery(() => getActiveBuilds(workspaceId), [workspaceId])
}

export function useRecentImportJobs(ownerId: string, limit = 5) {
  return useLiveQuery(() => getRecentImportJobs(ownerId, limit), [ownerId, limit])
}

export function useStorageStats(workspaceId: string) {
  return useLiveQuery(() => getStorageStats(workspaceId), [workspaceId])
}
