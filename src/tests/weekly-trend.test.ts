import { describe, it, expect } from 'vitest'

function getLast7Days(): Date[] {
  const days: Date[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    d.setHours(0, 0, 0, 0)
    days.push(d)
  }
  return days
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function buildWeeklyTrend(
  days: Date[],
  inboundByDate: Record<string, number>,
  pickingByDate: Record<string, number>,
  deliveryByDate: Record<string, number>
) {
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

describe('weekly trend date helpers', () => {
  it('should generate exactly 7 days', () => {
    const days = getLast7Days()
    expect(days.length).toBe(7)
  })

  it('should generate days in chronological order (oldest first)', () => {
    const days = getLast7Days()
    for (let i = 1; i < days.length; i++) {
      expect(days[i].getTime()).toBeGreaterThan(days[i - 1].getTime())
    }
  })

  it('should set time to midnight for all days', () => {
    const days = getLast7Days()
    days.forEach((d) => {
      expect(d.getHours()).toBe(0)
      expect(d.getMinutes()).toBe(0)
      expect(d.getSeconds()).toBe(0)
      expect(d.getMilliseconds()).toBe(0)
    })
  })

  it('should have the last day as today', () => {
    const days = getLast7Days()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expect(days[6].toDateString()).toBe(today.toDateString())
  })

  it('should have the first day as 6 days ago', () => {
    const days = getLast7Days()
    const sixDaysAgo = new Date()
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)
    sixDaysAgo.setHours(0, 0, 0, 0)
    expect(days[0].toDateString()).toBe(sixDaysAgo.toDateString())
  })
})

describe('formatDateKey', () => {
  it('should format date as YYYY-MM-DD', () => {
    const d = new Date(2026, 5, 15)
    expect(formatDateKey(d)).toBe('2026-06-15')
  })

  it('should pad single digit month and day with leading zero', () => {
    const d = new Date(2026, 0, 5)
    expect(formatDateKey(d)).toBe('2026-01-05')
  })
})

describe('formatDisplayDate', () => {
  it('should format date as M/D', () => {
    const d = new Date(2026, 5, 15)
    expect(formatDisplayDate(d)).toBe('6/15')
  })

  it('should not pad single digit month and day', () => {
    const d = new Date(2026, 0, 5)
    expect(formatDisplayDate(d)).toBe('1/5')
  })
})

describe('buildWeeklyTrend', () => {
  it('should build trend with correct date labels', () => {
    const days = getLast7Days()
    const trend = buildWeeklyTrend(days, {}, {}, {})

    expect(trend.length).toBe(7)
    trend.forEach((item, i) => {
      expect(item.date).toBe(formatDisplayDate(days[i]))
    })
  })

  it('should default counts to 0 when no data exists for a date', () => {
    const days = getLast7Days()
    const trend = buildWeeklyTrend(days, {}, {}, {})

    trend.forEach((item) => {
      expect(item.inbound).toBe(0)
      expect(item.picking).toBe(0)
      expect(item.delivery).toBe(0)
    })
  })

  it('should correctly map counts to their respective dates', () => {
    const days = getLast7Days()
    const todayKey = formatDateKey(days[6])
    const yesterdayKey = formatDateKey(days[5])

    const inboundByDate = { [todayKey]: 5, [yesterdayKey]: 3 }
    const pickingByDate = { [todayKey]: 2 }
    const deliveryByDate = { [yesterdayKey]: 4 }

    const trend = buildWeeklyTrend(days, inboundByDate, pickingByDate, deliveryByDate)

    expect(trend[6].inbound).toBe(5)
    expect(trend[6].picking).toBe(2)
    expect(trend[6].delivery).toBe(0)

    expect(trend[5].inbound).toBe(3)
    expect(trend[5].picking).toBe(0)
    expect(trend[5].delivery).toBe(4)
  })

  it('should reflect newly added tasks in the trend', () => {
    const days = getLast7Days()
    const todayKey = formatDateKey(days[6])

    const initialTrend = buildWeeklyTrend(days, {}, {}, {})
    expect(initialTrend[6].inbound).toBe(0)

    const updatedInbound = { [todayKey]: 1 }
    const updatedTrend = buildWeeklyTrend(days, updatedInbound, {}, {})
    expect(updatedTrend[6].inbound).toBe(1)

    const finalInbound = { [todayKey]: 3 }
    const finalTrend = buildWeeklyTrend(days, finalInbound, {}, {})
    expect(finalTrend[6].inbound).toBe(3)
  })

  it('should accumulate multiple task types on the same day', () => {
    const days = getLast7Days()
    const key = formatDateKey(days[3])

    const trend = buildWeeklyTrend(
      days,
      { [key]: 2 },
      { [key]: 5 },
      { [key]: 3 }
    )

    expect(trend[3].inbound).toBe(2)
    expect(trend[3].picking).toBe(5)
    expect(trend[3].delivery).toBe(3)
  })
})
