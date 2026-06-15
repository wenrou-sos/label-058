import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function generateTaskNo(prefix: string): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}${date}${rand}`
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusDotColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-400',
    IN_PROGRESS: 'bg-blue-400',
    COMPLETED: 'bg-green-400',
    CANCELLED: 'bg-red-400',
  }
  return map[status] || 'bg-gray-400'
}

export function calculateNewPage(
  currentPage: number,
  currentTotal: number,
  deletedCount: number,
  pageSize: number,
): number {
  if (deletedCount <= 0) return currentPage
  const newTotal = Math.max(0, currentTotal - deletedCount)
  const newTotalPages = Math.max(1, Math.ceil(newTotal / pageSize))
  if (currentPage > newTotalPages) {
    return newTotalPages
  }
  return currentPage
}

export function getLast7Days(now: Date = new Date()): Date[] {
  const days: Date[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    d.setHours(0, 0, 0, 0)
    days.push(d)
  }
  return days
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDisplayDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export interface DailyTrendPoint {
  date: string
  inbound: number
  picking: number
  delivery: number
}

export function buildWeeklyTrend(
  now: Date,
  inboundByDate: Record<string, number>,
  pickingByDate: Record<string, number>,
  deliveryByDate: Record<string, number>,
): DailyTrendPoint[] {
  const days = getLast7Days(now)
  return days.map((d) => {
    const key = formatDateKey(d)
    return {
      date: formatDisplayDate(d),
      inbound: inboundByDate[key] || 0,
      picking: pickingByDate[key] || 0,
      delivery: deliveryByDate[key] || 0,
    }
  })
}
