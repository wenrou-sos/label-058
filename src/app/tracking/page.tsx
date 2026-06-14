'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Activity, PackagePlus, ShoppingCart, Truck, RefreshCw, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { formatDateTime, getStatusDotColor } from '@/lib/utils'
import type { TaskType, TaskStatus } from '@/types'
import { TASK_TYPE_LABELS, STATUS_LABELS } from '@/types'

interface TrackingTask {
  id: string
  taskNo: string
  taskType: TaskType
  status: TaskStatus
  priority: string
  createdAt: string
  updatedAt: string
  displayInfo: string
  assignee: string | null
}

export default function TrackingPage() {
  const [tasks, setTasks] = useState<TrackingTask[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TrackingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTask, setSelectedTask] = useState<TrackingTask | null>(null)
  const [statusHistory, setStatusHistory] = useState<Array<{
    id: string
    fromStatus: string
    toStatus: string
    operator: string
    remark: string | null
    createdAt: string
  }>>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter) params.set('taskType', typeFilter)
    if (statusFilter) params.set('status', statusFilter)

    const res = await fetch(`/api/tracking?${params.toString()}`)
    const json = await res.json()
    setTasks(json.data || [])
    setLoading(false)
  }, [typeFilter, statusFilter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    let result = tasks
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.taskNo.toLowerCase().includes(q) ||
          t.displayInfo.toLowerCase().includes(q) ||
          (t.assignee && t.assignee.toLowerCase().includes(q))
      )
    }
    setFilteredTasks(result)
  }, [tasks, search])

  const fetchHistory = async (task: TrackingTask) => {
    setSelectedTask(task)
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/tracking/${task.id}/history?taskType=${task.taskType}`)
      const json = await res.json()
      setStatusHistory(json.data || [])
    } catch {
      setStatusHistory([])
    }
    setHistoryLoading(false)
  }

  const getTypeIcon = (type: TaskType) => {
    switch (type) {
      case 'INBOUND': return PackagePlus
      case 'PICKING': return ShoppingCart
      case 'DELIVERY': return Truck
    }
  }

  const getStatusTimeline = (status: TaskStatus) => {
    const steps: { key: TaskStatus; label: string }[] = [
      { key: 'PENDING', label: '待处理' },
      { key: 'IN_PROGRESS', label: '进行中' },
      { key: 'COMPLETED', label: '已完成' },
    ]
    const statusOrder: Record<TaskStatus, number> = {
      PENDING: 0,
      IN_PROGRESS: 1,
      COMPLETED: 2,
      CANCELLED: -1,
    }
    const currentIdx = statusOrder[status]

    return (
      <div className="flex items-center gap-1">
        {steps.map((step, idx) => {
          const isCompleted = currentIdx >= idx
          const isCurrent = status === step.key
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isCompleted
                      ? isCurrent
                        ? 'bg-primary-500 ring-2 ring-primary-200'
                        : 'bg-green-500'
                      : 'bg-slate-200'
                  }`}
                />
                <span className={`text-xs ${isCurrent ? 'font-medium text-primary-600' : isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`mx-1 h-0.5 w-6 ${currentIdx > idx ? 'bg-green-400' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
        {status === 'CANCELLED' && (
          <span className="ml-2 text-xs font-medium text-red-500">已取消</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">状态实时追踪</h1>
          <p className="text-gray-500 mt-1">实时查看所有任务的状态变更和进度</p>
        </div>
        <button
          onClick={fetchTasks}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索任务编号、商品、负责人..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">全部类型</option>
          {(Object.entries(TASK_TYPE_LABELS) as [TaskType, string][]).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">全部状态</option>
          {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">暂无追踪记录</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const Icon = getTypeIcon(task.taskType)
              return (
                <div
                  key={task.id}
                  onClick={() => fetchHistory(task)}
                  className={`cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                    selectedTask?.id === task.id ? 'border-primary-300 ring-1 ring-primary-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-lg p-2 ${
                        task.taskType === 'INBOUND' ? 'bg-blue-50 text-blue-600' :
                        task.taskType === 'PICKING' ? 'bg-purple-50 text-purple-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-primary-600">{task.taskNo}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                            {TASK_TYPE_LABELS[task.taskType]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{task.displayInfo}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                          <span>负责人: {task.assignee || '未分配'}</span>
                          <span>更新: {formatDateTime(task.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority as any} />
                    </div>
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    {getStatusTimeline(task.status)}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="space-y-4">
          {selectedTask ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">任务详情</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">任务编号</span>
                    <span className="text-sm font-medium text-primary-600">{selectedTask.taskNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">任务类型</span>
                    <span className="text-sm text-slate-700">{TASK_TYPE_LABELS[selectedTask.taskType]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">当前状态</span>
                    <StatusBadge status={selectedTask.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">描述</span>
                    <span className="text-sm text-slate-700">{selectedTask.displayInfo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">负责人</span>
                    <span className="text-sm text-slate-700">{selectedTask.assignee || '未分配'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">创建时间</span>
                    <span className="text-sm text-slate-700">{formatDateTime(selectedTask.createdAt)}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/${selectedTask.taskType.toLowerCase()}/${selectedTask.id}`}
                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    查看完整详情
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">状态变更历史</h3>
                {historyLoading ? (
                  <div className="mt-4 text-sm text-slate-400">加载中...</div>
                ) : statusHistory.length === 0 ? (
                  <div className="mt-4 text-sm text-slate-400">暂无状态变更记录</div>
                ) : (
                  <div className="mt-4 space-y-0">
                    {statusHistory.map((h, idx) => (
                      <div key={h.id} className="relative flex gap-3 pb-5">
                        {idx < statusHistory.length - 1 && (
                          <div className="absolute left-[7px] top-5 h-full w-0.5 bg-slate-200" />
                        )}
                        <div className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                          idx === 0 ? 'border-primary-500 bg-primary-100' : 'border-slate-300 bg-white'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {STATUS_LABELS[h.toStatus as TaskStatus] || h.toStatus}
                          </p>
                          <p className="text-xs text-slate-500">
                            {STATUS_LABELS[h.fromStatus as TaskStatus] || h.fromStatus} → {STATUS_LABELS[h.toStatus as TaskStatus] || h.toStatus}
                          </p>
                          <p className="text-xs text-slate-400">
                            {h.operator} · {formatDateTime(h.createdAt)}
                          </p>
                          {h.remark && (
                            <p className="mt-1 text-xs text-slate-500">{h.remark}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm text-center">
              <Activity className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">点击左侧任务查看详细追踪信息</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
