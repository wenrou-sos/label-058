'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Play, MapPin, Clock, Package } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { formatDateTime } from '@/lib/utils'
import type { PickingTask, PickingItem, StatusHistory, TaskStatus } from '@/types'
import { STATUS_LABELS, ASSIGNEES } from '@/types'

interface PickingTaskDetail extends PickingTask {
  statusHistories: StatusHistory[]
}

export default function PickingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [task, setTask] = useState<PickingTaskDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusForm, setStatusForm] = useState({ toStatus: '' as TaskStatus, operator: '', remark: '' })

  const fetchTask = async () => {
    setLoading(true)
    const res = await fetch(`/api/picking/${id}`)
    if (res.ok) {
      const json = await res.json()
      setTask(json.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTask()
  }, [id])

  if (loading) {
    return <div className="py-12 text-center text-slate-400">加载中...</div>
  }

  if (!task) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-400">拣货任务不存在</p>
        <Link href="/picking" className="mt-2 inline-block text-sm text-primary-600 hover:underline">返回列表</Link>
      </div>
    )
  }

  const getNextStatuses = (currentStatus: TaskStatus): TaskStatus[] => {
    const flow: Record<TaskStatus, TaskStatus[]> = {
      PENDING: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    }
    return flow[currentStatus] || []
  }

  const handleAssign = async () => {
    if (!selectedAssignee) return
    await fetch(`/api/picking/${id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee: selectedAssignee }),
    })
    setShowAssignModal(false)
    setSelectedAssignee('')
    fetchTask()
  }

  const handleStatusChange = async () => {
    if (!statusForm.toStatus) return
    await fetch(`/api/picking/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toStatus: statusForm.toStatus,
        operator: statusForm.operator || '系统',
        remark: statusForm.remark,
      }),
    })
    setShowStatusModal(false)
    setStatusForm({ toStatus: '' as TaskStatus, operator: '', remark: '' })
    fetchTask()
  }

  const handleTogglePick = async (itemId: string) => {
    await fetch(`/api/picking/items/${itemId}`, { method: 'PATCH' })
    fetchTask()
  }

  const pickedCount = task.items.filter((i) => i.isPicked).length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/picking')} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-slate-900">拣货任务详情</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-900">任务信息</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-sm text-slate-500">任务编号</span>
                <p className="mt-0.5 font-medium text-slate-900">{task.taskNo}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">订单号</span>
                <p className="mt-0.5 font-medium text-slate-900">{task.orderNo}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">区域</span>
                <p className="mt-0.5 font-medium text-slate-900">{task.zone}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">拣货员</span>
                <p className="mt-0.5 font-medium text-slate-900">{task.assignee || '未分配'}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">状态</span>
                <div className="mt-0.5"><StatusBadge status={task.status} /></div>
              </div>
              <div>
                <span className="text-sm text-slate-500">优先级</span>
                <div className="mt-0.5"><PriorityBadge priority={task.priority} /></div>
              </div>
              <div>
                <span className="text-sm text-slate-500">创建时间</span>
                <p className="mt-0.5 text-slate-900">{formatDateTime(task.createdAt)}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">更新时间</span>
                <p className="mt-0.5 text-slate-900">{formatDateTime(task.updatedAt)}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { setShowAssignModal(true); setSelectedAssignee(task.assignee || '') }}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-1.5 text-sm text-blue-600 transition-colors hover:bg-blue-50"
              >
                <UserPlus className="h-4 w-4" />
                分配拣货员
              </button>
              {getNextStatuses(task.status).length > 0 && (
                <button
                  onClick={() => {
                    setShowStatusModal(true)
                    setStatusForm({ toStatus: getNextStatuses(task.status)[0], operator: '', remark: '' })
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-accent-200 px-3 py-1.5 text-sm text-accent-600 transition-colors hover:bg-accent-50"
                >
                  <Play className="h-4 w-4" />
                  更新状态
                </button>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">拣货商品</h3>
              <span className="text-sm text-slate-500">已拣 {pickedCount}/{task.items.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-2.5 text-left font-medium text-slate-600">商品名称</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-600">数量</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-600">存储位置</th>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-600">是否已拣</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {task.items.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-900">{item.productName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {item.storageLocation}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={item.isPicked}
                          onChange={() => handleTogglePick(item.id)}
                          disabled={task.status === 'COMPLETED' || task.status === 'CANCELLED'}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {task.optimizedPath && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900">优化路径</h3>
              <ol className="space-y-2">
                {task.optimizedPath.split('→').map((step, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-700">{step.trim()}</span>
                    {index < task.optimizedPath!.split('→').length - 1 && (
                      <span className="text-slate-300">→</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-900">状态时间线</h3>
            {task.statusHistories && task.statusHistories.length > 0 ? (
              <div className="relative space-y-0">
                {task.statusHistories.map((history, index) => (
                  <div key={history.id} className="relative flex gap-3 pb-6">
                    {index < task.statusHistories.length - 1 && (
                      <div className="absolute left-[7px] top-5 h-full w-0.5 bg-slate-200" />
                    )}
                    <div className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                      index === 0 ? 'border-primary-500 bg-primary-100' : 'border-slate-300 bg-white'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {STATUS_LABELS[history.toStatus]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {STATUS_LABELS[history.fromStatus]} → {STATUS_LABELS[history.toStatus]}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {history.operator} · {formatDateTime(history.createdAt)}
                      </p>
                      {history.remark && (
                        <p className="mt-1 text-xs text-slate-500">{history.remark}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">暂无状态记录</p>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAssignModal(false)}>
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">分配拣货员</h2>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="">选择拣货员</option>
              {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAssignModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">
                取消
              </button>
              <button onClick={handleAssign} disabled={!selectedAssignee} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50">
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowStatusModal(false)}>
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">更新状态</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">目标状态</label>
                <select
                  value={statusForm.toStatus}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, toStatus: e.target.value as TaskStatus }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  {getNextStatuses(task.status).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">操作人</label>
                <input
                  type="text"
                  value={statusForm.operator}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, operator: e.target.value }))}
                  placeholder="系统"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">备注</label>
                <input
                  type="text"
                  value={statusForm.remark}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, remark: e.target.value }))}
                  placeholder="可选"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowStatusModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">
                取消
              </button>
              <button onClick={handleStatusChange} disabled={!statusForm.toStatus} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50">
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
