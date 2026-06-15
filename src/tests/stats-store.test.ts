import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStatsStore } from '@/store/stats-store'

const mockStatsData = {
  inboundCount: 10,
  pickingCount: 20,
  deliveryCount: 15,
  completedCount: 30,
  inboundPending: 5,
  pickingInProgress: 8,
  deliveringCount: 6,
  statusDistribution: [
    { status: 'PENDING', count: 10 },
    { status: 'IN_PROGRESS', count: 14 },
    { status: 'COMPLETED', count: 30 },
  ],
  recentTasks: [],
  weeklyTrend: [
    { date: '6/9', inbound: 2, picking: 3, delivery: 1 },
    { date: '6/10', inbound: 1, picking: 4, delivery: 2 },
    { date: '6/11', inbound: 3, picking: 2, delivery: 3 },
    { date: '6/12', inbound: 2, picking: 5, delivery: 2 },
    { date: '6/13', inbound: 4, picking: 3, delivery: 4 },
    { date: '6/14', inbound: 1, picking: 2, delivery: 1 },
    { date: '6/15', inbound: 2, picking: 1, delivery: 2 },
  ],
}

describe('useStatsStore', () => {
  beforeEach(() => {
    useStatsStore.setState({
      stats: null,
      loading: false,
      error: null,
      lastFetched: null,
    })
    vi.restoreAllMocks()
  })

  it('should initialize with default state', () => {
    const state = useStatsStore.getState()
    expect(state.stats).toBeNull()
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.lastFetched).toBeNull()
  })

  it('should fetch stats and update state', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockStatsData }),
    })

    await useStatsStore.getState().fetchStats(true)

    const state = useStatsStore.getState()
    expect(state.stats).toEqual(mockStatsData)
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.lastFetched).not.toBeNull()
    expect(fetch).toHaveBeenCalledWith('/api/stats', { cache: 'no-store' })
  })

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })

    await useStatsStore.getState().fetchStats(true)

    const state = useStatsStore.getState()
    expect(state.stats).toBeNull()
    expect(state.loading).toBe(false)
    expect(state.error).toContain('500')
  })

  it('should skip fetch if already loading', async () => {
    global.fetch = vi.fn()
    useStatsStore.setState({ loading: true })

    await useStatsStore.getState().fetchStats(true)

    expect(fetch).not.toHaveBeenCalled()
  })

  it('should skip fetch if not stale and not forced', async () => {
    global.fetch = vi.fn()
    useStatsStore.setState({ lastFetched: Date.now() })

    await useStatsStore.getState().fetchStats(false)

    expect(fetch).not.toHaveBeenCalled()
  })

  it('should fetch when forced even if not stale', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockStatsData }),
    })
    useStatsStore.setState({ lastFetched: Date.now() })

    await useStatsStore.getState().fetchStats(true)

    expect(fetch).toHaveBeenCalled()
  })

  it('should fetch when data is stale', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockStatsData }),
    })
    useStatsStore.setState({ lastFetched: Date.now() - 60 * 1000 })

    await useStatsStore.getState().fetchStats(false)

    expect(fetch).toHaveBeenCalled()
  })

  it('should invalidate stats cache', () => {
    useStatsStore.setState({ lastFetched: Date.now() })
    expect(useStatsStore.getState().lastFetched).not.toBeNull()

    useStatsStore.getState().invalidateStats()

    expect(useStatsStore.getState().lastFetched).toBeNull()
  })

  it('should contain weeklyTrend data with correct structure after fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockStatsData }),
    })

    await useStatsStore.getState().fetchStats(true)

    const state = useStatsStore.getState()
    expect(state.stats?.weeklyTrend).toBeDefined()
    expect(Array.isArray(state.stats?.weeklyTrend)).toBe(true)
    expect(state.stats?.weeklyTrend.length).toBe(7)
    state.stats?.weeklyTrend.forEach((day) => {
      expect(day).toHaveProperty('date')
      expect(day).toHaveProperty('inbound')
      expect(day).toHaveProperty('picking')
      expect(day).toHaveProperty('delivery')
    })
  })

  it('should reflect new task counts in weeklyTrend after invalidation and refetch', async () => {
    let callCount = 0
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++
      const updatedData = {
        ...mockStatsData,
        inboundCount: callCount === 1 ? 10 : 11,
        weeklyTrend: mockStatsData.weeklyTrend.map((day, idx) =>
          idx === 6 ? { ...day, inbound: callCount === 1 ? 2 : 3 } : day
        ),
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: updatedData }),
      })
    })

    await useStatsStore.getState().fetchStats(true)
    expect(useStatsStore.getState().stats?.weeklyTrend[6].inbound).toBe(2)
    expect(useStatsStore.getState().stats?.inboundCount).toBe(10)

    useStatsStore.getState().invalidateStats()
    await useStatsStore.getState().fetchStats(true)

    expect(useStatsStore.getState().stats?.weeklyTrend[6].inbound).toBe(3)
    expect(useStatsStore.getState().stats?.inboundCount).toBe(11)
  })
})
