import type { BuildStatus } from '@codex/shared'
import { Badge } from './Badge'

const LABELS: Record<BuildStatus, string> = {
  'idea':        'Idea',
  'in-progress': 'In Progress',
  'mixing':      'Mixing',
  'mastering':   'Mastering',
  'done':        'Done',
  'shelved':     'Shelved',
}

const VARIANTS = {
  'idea':        'default',
  'in-progress': 'lime',
  'mixing':      'cyan',
  'mastering':   'blue',
  'done':        'success',
  'shelved':     'default',
} as const

interface StatusBadgeProps {
  status: BuildStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>
}
