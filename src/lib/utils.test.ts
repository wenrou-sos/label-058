import { describe, it, expect } from 'vitest'
import {
  cn,
  generateTaskNo,
  formatDate,
  formatDateTime,
  getStatusDotColor,
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
