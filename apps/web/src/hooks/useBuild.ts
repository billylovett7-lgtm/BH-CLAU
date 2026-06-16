import { useLiveQuery } from 'dexie-react-hooks'
import { getBuild, getBuildStages, getBlocksByBuild, getBlocksByStage } from '@/services/localDb'

export function useBuild(id: string) {
  return useLiveQuery(() => getBuild(id), [id])
}

export function useBuildStages(buildId: string) {
  return useLiveQuery(() => getBuildStages(buildId), [buildId])
}

export function useBuildBlocks(buildId: string) {
  return useLiveQuery(() => getBlocksByBuild(buildId), [buildId])
}

export function useStageBlocks(buildId: string, stageKey: string) {
  return useLiveQuery(() => getBlocksByStage(buildId, stageKey), [buildId, stageKey])
}
