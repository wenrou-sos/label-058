import { create } from 'zustand'
import type { DashboardStats } from '@/types'

interface StatsState {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
  lastFetched: number | null
  fetchStats: (force?: boolean) => Promise<void>
  invalidateStats: () => void
}

const STALE_TIME = 30 * 1000

export const useStatsStore = create<StatsState>((set, get) => ({
  stats: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetchStats: async (force = false) => {
    const { loading, lastFetched } = get()
    if (loading) return
    if (!force && lastFetched && Date.now() - lastFetched < STALE_TIME) return

    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/stats', { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`)
      const json = await res.json()
      set({
        stats: json.data,
        loading: false,
        lastFetched: Date.now(),
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        loading: false,
      })
    }
  },

  invalidateStats: () => {
    set({ lastFetched: null })
  },
}))
