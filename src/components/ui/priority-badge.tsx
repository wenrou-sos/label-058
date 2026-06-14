import type { Priority } from '@/types'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/types'
import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  priority: Priority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={cn('status-badge', PRIORITY_COLORS[priority])}>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
