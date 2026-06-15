'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, UserPlus, Play, CheckCircle, XCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { formatDateTime } from '@/lib/utils'
import type { PickingTask, TaskStatus, Priority } from '@/types'
import { STATUS_LABELS, PRIORITY_LABELS, ZONES, ASSIGNEES } from '@/types'

export default function PickingPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<PickingTask[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [search, setSearch] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [showStatusModal, setShowStatusModal] = useState<string | null>(null)
  const [statusForm, setStatusForm] = useState({ toStatus: '' as TaskStatus, operator: '', remark: '' })

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    if (zoneFilter) params.set('zone', zoneFilter)
    if (search) params.set('search', search)
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))

    const res = await fetch(`/api/picking?${params}`)
    const json = await res.json()
    setTasks(json.data || [])
    setTotal(json.total || 0)
    setLoading(false)
  }, [statusFilter, priorityFilter, zoneFilter, search, page, pageSize])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [page, statusFilter, priorityFilter, zoneFilter, search])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === tasks.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(tasks.map((t) => t.id)))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/picking/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      const data = await res.json()
      if (res.ok && data.data) {
        const { successCount, failCount } = data.data
        if (successCount > 0) {
          alert(`删除成功：${successCount} 条${failCount > 0 ? `，失败：${failCount} 条` : ''}`)
        } else {
          alert(`删除失败：${failCount} 条`)
        }
        setShowDeleteConfirm(false)
        setSelectedIds(new Set())
        fetchTasks()
      } else {
        alert(data.error || '删除失败，请稍后重试')
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  const handleAssign = async (taskId: string) => {
    if (!selectedAssignee) return
    await fetch(`/api/picking/${taskId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee: selectedAssignee }),
    })
    setShowAssignModal(null)
    setSelectedAssignee('')
    fetchTasks()
  }

  const handleStatusChange = async (taskId: string) => {
    if (!statusForm.toStatus) return
    await fetch(`/api/picking/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toStatus: statusForm.toStatus,
        operator: statusForm.operator || '系统',
        remark: statusForm.remark,
      }),
    })
    setShowStatusModal(null)
    setStatusForm({ toStatus: '' as TaskStatus, operator: '', remark: '' })
    fetchTasks()
  }

  const [createForm, setCreateForm] = useState({
    orderNo: '',
    zone: 'A区',
    priority: 'MEDIUM' as Priority,
    assignee: '',
    items: [{ productName: '', quantity: 1, storageLocation: '' }],
  })

  const handleCreate = async () => {
    await fetch('/api/picking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    })
    setShowCreateModal(false)
    setCreateForm({
      orderNo: '',
      zone: 'A区',
      priority: 'MEDIUM' as Priority,
      assignee: '',
      items: [{ productName: '', quantity: 1, storageLocation: '' }],
    })
    fetchTasks()
  }

  const addCreateItem = () => {
    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: 1, storageLocation: '' }],
    }))
  }

  const removeCreateItem = (index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateCreateItem = (index: number, field: string, value: string | number) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索任务编号/订单号/区域"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 w-64 rounded-lg border border-slate-200 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">全部状态</option>
            {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">全部优先级</option>
            {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={zoneFilter}
            onChange={(e) => { setZoneFilter(e.target.value); setPage(1) }}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">全部区域</option>
            {ZONES.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            批量删除 ({selectedIds.size})
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            生成拣货任务
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={tasks.length > 0 && selectedIds.size === tasks.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">任务编号</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">订单号</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">区域</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">商品数</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">状态</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">优先级</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">拣货员</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">优化路径</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">创建时间</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400">加载中...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400">暂无拣货任务</td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-600">
                      <Link href={`/picking/${task.id}`} className="hover:underline">{task.taskNo}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{task.orderNo}</td>
                    <td className="px-4 py-3 text-slate-700">{task.zone}</td>
                    <td className="px-4 py-3 text-slate-700">{task.items?.length ?? 0}</td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3 text-slate-700">{task.assignee || '-'}</td>
                    <td className="px-4 py-3">
                      {task.optimizedPath ? (
                        <span className="text-primary-600">{task.optimizedPath}</span>
                      ) : (
                        <span className="text-slate-400">未生成</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(task.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/picking/${task.id}`}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-primary-600 transition-colors hover:bg-primary-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          详情
                        </Link>
                        <button
                          onClick={() => { setShowAssignModal(task.id); setSelectedAssignee(task.assignee || '') }}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          分配
                        </button>
                        {getNextStatuses(task.status).length > 0 && (
                          <button
                            onClick={() => {
                              setShowStatusModal(task.id)
                              setStatusForm({ toStatus: getNextStatuses(task.status)[0], operator: '', remark: '' })
                            }}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-accent-600 transition-colors hover:bg-accent-50"
                          >
                            <Play className="h-3.5 w-3.5" />
                            状态
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">生成拣货任务</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">订单号</label>
                <input
                  type="text"
                  value={createForm.orderNo}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, orderNo: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">区域</label>
                  <select
                    value={createForm.zone}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, zone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">优先级</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, priority: e.target.value as Priority }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">拣货员</label>
                <select
                  value={createForm.assignee}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, assignee: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="">未分配</option>
                  {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">商品列表</label>
                  <button onClick={addCreateItem} className="text-xs text-primary-600 hover:text-primary-700">+ 添加商品</button>
                </div>
                <div className="space-y-2">
                  {createForm.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="商品名称"
                        value={item.productName}
                        onChange={(e) => updateCreateItem(index, 'productName', e.target.value)}
                        className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="数量"
                        value={item.quantity}
                        onChange={(e) => updateCreateItem(index, 'quantity', Number(e.target.value))}
                        className="w-20 rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="存储位置"
                        value={item.storageLocation}
                        onChange={(e) => updateCreateItem(index, 'storageLocation', e.target.value)}
                        className="w-28 rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                      />
                      {createForm.items.length > 1 && (
                        <button onClick={() => removeCreateItem(index)} className="text-red-400 hover:text-red-600">
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!createForm.orderNo || createForm.items.some((i) => !i.productName || !i.storageLocation)}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAssignModal(null)}>
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
              <button
                onClick={() => setShowAssignModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={() => handleAssign(showAssignModal)}
                disabled={!selectedAssignee}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowStatusModal(null)}>
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
                  {getNextStatuses(
                    tasks.find((t) => t.id === showStatusModal)?.status || 'PENDING'
                  ).map((s) => (
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
              <button
                onClick={() => setShowStatusModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={() => handleStatusChange(showStatusModal)}
                disabled={!statusForm.toStatus}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !deleteLoading && setShowDeleteConfirm(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">确认删除</h2>
            <p className="mb-4 text-sm text-slate-600">
              确定删除选中的 <span className="font-semibold text-red-600">{selectedIds.size}</span> 条拣货任务吗？
            </p>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {tasks.filter((t) => selectedIds.has(t.id)).map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                  <span className="text-sm font-medium text-slate-700">{t.taskNo}</span>
                  <span className="text-sm text-slate-500">{t.orderNo}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              关联的拣货明细、状态历史和通知将一并删除，此操作不可恢复。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? '删除中...' : `删除 ${selectedIds.size} 条`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
