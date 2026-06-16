import { useLiveQuery } from 'dexie-react-hooks'
import {
  getChainRacks,
  getMidiPatterns,
  getSamples,
  getPresets,
  getGrooves,
  getArrangements,
} from '@/services/localDb'

export function useChainRacks(workspaceId: string) {
  return useLiveQuery(() => getChainRacks(workspaceId), [workspaceId])
}

export function useMidiPatterns(workspaceId: string) {
  return useLiveQuery(() => getMidiPatterns(workspaceId), [workspaceId])
}

export function useSamples(workspaceId: string) {
  return useLiveQuery(() => getSamples(workspaceId), [workspaceId])
}

export function usePresets(workspaceId: string) {
  return useLiveQuery(() => getPresets(workspaceId), [workspaceId])
}

export function useGrooves(workspaceId: string) {
  return useLiveQuery(() => getGrooves(workspaceId), [workspaceId])
}

export function useArrangements(workspaceId: string) {
  return useLiveQuery(() => getArrangements(workspaceId), [workspaceId])
}
