import { create } from 'zustand'
import type { TaskStatus, Priority, TaskType } from '@/types'

interface TaskFilters {
  status: TaskStatus | null
  priority: Priority | null
  type: TaskType | null
  search: string
  dateRange: [string, string] | null
}

interface TaskState {
  viewMode: 'list' | 'kanban'
  filters: TaskFilters
  sortBy: string
  sortOrder: 'asc' | 'desc'
  setViewMode: (mode: 'list' | 'kanban') => void
  setFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void
  clearFilters: () => void
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
}

const defaultFilters: TaskFilters = {
  status: null,
  priority: null,
  type: null,
  search: '',
  dateRange: null,
}

export const useTaskStore = create<TaskState>((set) => ({
  viewMode: 'list',
  filters: { ...defaultFilters },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  setViewMode: (mode) => set({ viewMode: mode }),
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  clearFilters: () => set({ filters: { ...defaultFilters } }),
  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
}))
