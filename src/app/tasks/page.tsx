'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, LayoutGrid, List, PackagePlus, ShoppingCart, Truck, ExternalLink } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { formatDateTime } from '@/lib/utils'
import type { TaskType, TaskStatus, Priority } from '@/types'
import { TASK_TYPE_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '@/types'
import { useTaskStore } from '@/store/task-store'

interface TaskItem {
  id: string
  taskNo: string
  type: TaskType
  status: TaskStatus
  priority: Priority
  createdAt: string
  updatedAt: string
  displayInfo: string
  assignee: string | null
}

const TYPE_ICONS: Record<TaskType, typeof PackagePlus> = {
  INBOUND: PackagePlus,
  PICKING: ShoppingCart,
  DELIVERY: Truck,
}

const TYPE_COLORS: Record<TaskType, string> = {
  INBOUND: 'bg-blue-50 text-blue-600 border-blue-200',
  PICKING: 'bg-purple-50 text-purple-600 border-purple-200',
  DELIVERY: 'bg-green-50 text-green-600 border-green-200',
}

const KANBAN_COLUMNS: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export default function TasksPage() {
  const { viewMode, setViewMode, filters, setFilter, clearFilters } = useTaskStore()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.type) params.set('type', filters.type)
    if (filters.status) params.set('status', filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.search) params.set('search', filters.search)
    params.set('page', page.toString())
    params.set('pageSize', pageSize.toString())

    const res = await fetch(`/api/tasks?${params.toString()}`)
    const json = await res.json()
    const rawTasks: any[] = json.data || []

    const mapped: TaskItem[] = rawTasks.map((t: any) => ({
      id: t.id,
      taskNo: t.taskNo,
      type: (t.type || t.taskType) as TaskType,
      status: t.status as TaskStatus,
      priority: t.priority as Priority,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      displayInfo: t.productName || t.orderNo || t.deliveryRoute || '',
      assignee: t.assignee || t.courierName || null,
    }))

    setTasks(mapped)
    setTotal(json.total || 0)
    setLoading(false)
  }, [filters, page])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const totalPages = Math.ceil(total / pageSize)

  const hasActiveFilters = filters.type || filters.status || filters.priority || filters.search

  const renderKanbanView = () => {
    const columns = KANBAN_COLUMNS.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      tasks: tasks.filter((t) => t.status === status),
    }))

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.status} className="flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${
                  col.status === 'PENDING' ? 'bg-yellow-400' :
                  col.status === 'IN_PROGRESS' ? 'bg-blue-400' :
                  col.status === 'COMPLETED' ? 'bg-green-400' :
                  'bg-red-400'
                }`} />
                <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {col.tasks.length}
              </span>
            </div>
            <div className="flex-1 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2 min-h-[200px]">
              {col.tasks.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-xs text-slate-400">暂无任务</p>
                </div>
              ) : (
                col.tasks.map((task) => {
                  const Icon = TYPE_ICONS[task.type]
                  return (
                    <div
                      key={task.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`rounded p-1 ${TYPE_COLORS[task.type]}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs text-slate-500">{TASK_TYPE_LABELS[task.type]}</span>
                        </div>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <div className="mt-2">
                        <Link
                          href={`/${task.type.toLowerCase()}/${task.id}`}
                          className="text-sm font-medium text-primary-600 hover:underline"
                        >
                          {task.taskNo}
                        </Link>
                      </div>
                      {task.displayInfo && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{task.displayInfo}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>{task.assignee || '未分配'}</span>
                        <span>{formatDateTime(task.createdAt)}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderListView = () => (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-600">类型</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">任务编号</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">描述</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">状态</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">优先级</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">负责人</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">创建时间</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">加载中...</td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">暂无任务</td>
              </tr>
            ) : (
              tasks.map((task) => {
                const Icon = TYPE_ICONS[task.type]
                return (
                  <tr key={task.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`rounded p-1 ${TYPE_COLORS[task.type]}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-slate-700">{TASK_TYPE_LABELS[task.type]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-600">{task.taskNo}</td>
                    <td className="px-4 py-3 text-slate-700">{task.displayInfo || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3 text-slate-700">{task.assignee || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(task.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${task.type.toLowerCase()}/${task.id}`}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-primary-600 transition-colors hover:bg-primary-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        详情
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <span className="text-sm text-slate-500">
            共 {total} 条记录，第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">任务管理</h1>
          <p className="text-gray-500 mt-1">统一管理所有入库、拣货、配送任务</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="h-4 w-4" />
            列表
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'kanban' ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            看板
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索任务编号、商品名称、订单号..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <select
          value={filters.type || ''}
          onChange={(e) => setFilter('type', (e.target.value || null) as any)}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">全部类型</option>
          {(Object.entries(TASK_TYPE_LABELS) as [TaskType, string][]).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filters.status || ''}
          onChange={(e) => setFilter('status', (e.target.value || null) as any)}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">全部状态</option>
          {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filters.priority || ''}
          onChange={(e) => setFilter('priority', (e.target.value || null) as any)}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">全部优先级</option>
          {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-500 transition-colors hover:bg-slate-50"
          >
            清除筛选
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : viewMode === 'kanban' ? (
        renderKanbanView()
      ) : (
        renderListView()
      )}
    </div>
  )
}
