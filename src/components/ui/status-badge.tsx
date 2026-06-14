import type { TaskStatus } from '@/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: TaskStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn('status-badge', STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}
