import type { BuildPriority } from '@codex/shared'
import { Badge } from './Badge'

const LABELS: Record<BuildPriority, string> = {
  high:   'High',
  medium: 'Medium',
  low:    'Low',
}

const VARIANTS = {
  high:   'danger',
  medium: 'warning',
  low:    'default',
} as const

interface PriorityBadgeProps {
  priority: BuildPriority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return <Badge variant={VARIANTS[priority]}>{LABELS[priority]}</Badge>
}
