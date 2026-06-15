import { describe, it, expect } from 'vitest'
import {
  cn,
  generateTaskNo,
  formatDate,
  formatDateTime,
  getStatusDotColor,
  calculateNewPage,
  getLast7Days,
  formatDateKey,
  formatDisplayDate,
  buildWeeklyTrend,
} from '@/lib/utils'
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  TASK_TYPE_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  ZONES,
  LOCATIONS,
  ASSIGNEES,
  COURIERS,
} from '@/types'
import type { TaskStatus, Priority, TaskType } from '@/types'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('should handle undefined/null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })
})

describe('generateTaskNo', () => {
  it('should generate a task number with the given prefix', () => {
    const result = generateTaskNo('IN')
    expect(result).toMatch(/^IN\d{8}\d{4}$/)
  })

  it('should generate different task numbers', () => {
    const a = generateTaskNo('IN')
    const b = generateTaskNo('IN')
    expect(a).not.toBe(b)
  })

  it('should use the correct prefix', () => {
    expect(generateTaskNo('PK')).toMatch(/^PK/)
    expect(generateTaskNo('DL')).toMatch(/^DL/)
  })
})

describe('formatDate', () => {
  it('should format a date string', () => {
    const result = formatDate('2026-06-14T10:30:00.000Z')
    expect(result).toContain('2026')
    expect(result).toContain('06')
    expect(result).toContain('14')
  })

  it('should format a Date object', () => {
    const result = formatDate(new Date('2026-06-14T10:30:00.000Z'))
    expect(result).toContain('2026')
  })
})

describe('formatDateTime', () => {
  it('should format a date string with time', () => {
    const result = formatDateTime('2026-06-14T10:30:00.000Z')
    expect(result).toContain('2026')
  })
})

describe('getStatusDotColor', () => {
  it('should return correct dot colors for known statuses', () => {
    expect(getStatusDotColor('PENDING')).toBe('bg-yellow-400')
    expect(getStatusDotColor('IN_PROGRESS')).toBe('bg-blue-400')
    expect(getStatusDotColor('COMPLETED')).toBe('bg-green-400')
    expect(getStatusDotColor('CANCELLED')).toBe('bg-red-400')
  })

  it('should return default color for unknown status', () => {
    expect(getStatusDotColor('UNKNOWN')).toBe('bg-gray-400')
  })
})

describe('Status Labels', () => {
  it('should have labels for all statuses', () => {
    const statuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    statuses.forEach((s) => {
      expect(STATUS_LABELS[s]).toBeDefined()
      expect(typeof STATUS_LABELS[s]).toBe('string')
    })
  })
})

describe('Priority Labels', () => {
  it('should have labels for all priorities', () => {
    const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    priorities.forEach((p) => {
      expect(PRIORITY_LABELS[p]).toBeDefined()
      expect(typeof PRIORITY_LABELS[p]).toBe('string')
    })
  })
})

describe('Task Type Labels', () => {
  it('should have labels for all task types', () => {
    const types: TaskType[] = ['INBOUND', 'PICKING', 'DELIVERY']
    types.forEach((t) => {
      expect(TASK_TYPE_LABELS[t]).toBeDefined()
      expect(typeof TASK_TYPE_LABELS[t]).toBe('string')
    })
  })
})

describe('Status Colors', () => {
  it('should have colors for all statuses', () => {
    const statuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    statuses.forEach((s) => {
      expect(STATUS_COLORS[s]).toBeDefined()
      expect(typeof STATUS_COLORS[s]).toBe('string')
    })
  })
})

describe('Priority Colors', () => {
  it('should have colors for all priorities', () => {
    const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    priorities.forEach((p) => {
      expect(PRIORITY_COLORS[p]).toBeDefined()
      expect(typeof PRIORITY_COLORS[p]).toBe('string')
    })
  })
})

describe('Constants', () => {
  it('should have non-empty zones', () => {
    expect(ZONES.length).toBeGreaterThan(0)
  })

  it('should have non-empty locations', () => {
    expect(LOCATIONS.length).toBeGreaterThan(0)
  })

  it('should have non-empty assignees', () => {
    expect(ASSIGNEES.length).toBeGreaterThan(0)
  })

  it('should have non-empty couriers', () => {
    expect(COURIERS.length).toBeGreaterThan(0)
  })
})

describe('calculateNewPage', () => {
  const PAGE_SIZE = 10

  it('should return current page when nothing is deleted', () => {
    expect(calculateNewPage(2, 25, 0, PAGE_SIZE)).toBe(2)
    expect(calculateNewPage(2, 25, -5, PAGE_SIZE)).toBe(2)
  })

  it('should stay on the same page when current page still has data after deletion', () => {
    expect(calculateNewPage(1, 25, 5, PAGE_SIZE)).toBe(1)
    expect(calculateNewPage(2, 25, 5, PAGE_SIZE)).toBe(2)
  })

  it('should go back one page when last page becomes empty after deletion', () => {
    expect(calculateNewPage(3, 25, 6, PAGE_SIZE)).toBe(2)
  })

  it('should jump to the correct page when multiple pages are emptied', () => {
    expect(calculateNewPage(3, 25, 15, PAGE_SIZE)).toBe(1)
  })

  it('should go to page 1 when all records are deleted', () => {
    expect(calculateNewPage(3, 25, 25, PAGE_SIZE)).toBe(1)
    expect(calculateNewPage(1, 5, 5, PAGE_SIZE)).toBe(1)
  })

  it('should handle exact page boundary deletion', () => {
    expect(calculateNewPage(2, 20, 10, PAGE_SIZE)).toBe(1)
    expect(calculateNewPage(2, 20, 11, PAGE_SIZE)).toBe(1)
  })

  it('should handle when newTotalPages equals currentPage', () => {
    expect(calculateNewPage(2, 25, 6, PAGE_SIZE)).toBe(2)
  })
})

describe('getLast7Days', () => {
  it('should return 7 consecutive days', () => {
    const now = new Date(2026, 5, 15, 10, 30, 0)
    const days = getLast7Days(now)
    expect(days.length).toBe(7)
    expect(days[0].getDate()).toBe(9)
    expect(days[6].getDate()).toBe(15)
  })

  it('should handle month boundary correctly', () => {
    const now = new Date(2026, 5, 3, 10, 0, 0)
    const days = getLast7Days(now)
    expect(days[0].getMonth()).toBe(4)
    expect(days[0].getDate()).toBe(28)
    expect(days[6].getMonth()).toBe(5)
    expect(days[6].getDate()).toBe(3)
  })

  it('should set time to midnight', () => {
    const now = new Date(2026, 5, 15, 14, 45, 30)
    const days = getLast7Days(now)
    days.forEach((d) => {
      expect(d.getHours()).toBe(0)
      expect(d.getMinutes()).toBe(0)
      expect(d.getSeconds()).toBe(0)
      expect(d.getMilliseconds()).toBe(0)
    })
  })

  it('should use current date when no argument is provided', () => {
    const days = getLast7Days()
    expect(days.length).toBe(7)
    const today = new Date()
    expect(days[6].getDate()).toBe(today.getDate())
  })
})

describe('formatDateKey', () => {
  it('should format date as YYYY-MM-DD', () => {
    const date = new Date(2026, 5, 15)
    expect(formatDateKey(date)).toBe('2026-06-15')
  })

  it('should pad single digit month and day', () => {
    const date = new Date(2026, 0, 5)
    expect(formatDateKey(date)).toBe('2026-01-05')
  })
})

describe('formatDisplayDate', () => {
  it('should format date as M/D', () => {
    const date = new Date(2026, 5, 15)
    expect(formatDisplayDate(date)).toBe('6/15')
  })

  it('should not pad single digit month and day', () => {
    const date = new Date(2026, 0, 5)
    expect(formatDisplayDate(date)).toBe('1/5')
  })
})

describe('buildWeeklyTrend', () => {
  it('should build 7 days of trend data with correct counts', () => {
    const now = new Date(2026, 5, 15)
    const today = '2026-06-15'
    const yesterday = '2026-06-14'
    const inbound = { [today]: 5, [yesterday]: 3 }
    const picking = { [today]: 2, [yesterday]: 4 }
    const delivery = { [today]: 1, [yesterday]: 0 }

    const trend = buildWeeklyTrend(now, inbound, picking, delivery)
    expect(trend.length).toBe(7)
    expect(trend[6]).toEqual({ date: '6/15', inbound: 5, picking: 2, delivery: 1 })
    expect(trend[5]).toEqual({ date: '6/14', inbound: 3, picking: 4, delivery: 0 })
  })

  it('should default missing dates to 0', () => {
    const now = new Date(2026, 5, 15)
    const trend = buildWeeklyTrend(now, {}, {}, {})
    trend.forEach((day) => {
      expect(day.inbound).toBe(0)
      expect(day.picking).toBe(0)
      expect(day.delivery).toBe(0)
    })
  })

  it('should return dates in chronological order (oldest first)', () => {
    const now = new Date(2026, 5, 15)
    const trend = buildWeeklyTrend(now, {}, {}, {})
    expect(trend[0].date).toBe('6/9')
    expect(trend[6].date).toBe('6/15')
  })
})
