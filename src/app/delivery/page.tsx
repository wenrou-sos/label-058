'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, UserPlus, Printer, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { formatDateTime } from '@/lib/utils'
import type { DeliveryTask, TaskStatus, Priority } from '@/types'
import { STATUS_LABELS, PRIORITY_LABELS, COURIERS } from '@/types'

export default function DeliveryPage() {
  const [tasks, setTasks] = useState<DeliveryTask[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [search, setSearch] = useState('')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null)
  const [assignForm, setAssignForm] = useState({ courierName: '', courierPhone: '' })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    if (search) params.set('search', search)
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))

    const res = await fetch(`/api/delivery?${params}`)
    const json = await res.json()
    setTasks(json.data || [])
    setTotal(json.total || 0)
    setLoading(false)
  }, [statusFilter, priorityFilter, search, page, pageSize])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [page, statusFilter, priorityFilter, search])

  const totalPages = Math.ceil(total / pageSize)

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

  const handleAssign = async (taskId: string) => {
    if (!assignForm.courierName) return
    await fetch(`/api/delivery/${taskId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignForm),
    })
    setShowAssignModal(null)
    setAssignForm({ courierName: '', courierPhone: '' })
    fetchTasks()
  }

  const handleBatchPrint = () => {
    if (selectedIds.size === 0) return
    setShowPrintDialog(true)
  }

  const executePrint = () => {
    const selectedTasks = tasks.filter((t) => selectedIds.has(t.id))
    const printContent = selectedTasks.map((t) => `
      <div style="border:1px solid #ccc;padding:16px;margin-bottom:12px;border-radius:8px;">
        <h3 style="margin:0 0 8px;">配送任务: ${t.taskNo}</h3>
        <p><strong>订单号:</strong> ${t.orderNo}</p>
        <p><strong>配送员:</strong> ${t.courierName || '未分配'}</p>
        <p><strong>配送路线:</strong> ${t.deliveryRoute}</p>
        <p><strong>预计送达:</strong> ${t.estimatedDelivery ? formatDateTime(t.estimatedDelivery) : '未设置'}</p>
        <p><strong>状态:</strong> ${STATUS_LABELS[t.status]}</p>
        <p><strong>优先级:</strong> ${PRIORITY_LABELS[t.priority]}</p>
      </div>
    `).join('')

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>批量打印配送单</title>
        <style>body{font-family:sans-serif;padding:20px;}h1{margin-bottom:16px;}</style>
        </head><body><h1>配送单</h1>${printContent}</body></html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
    setShowPrintDialog(false)
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/delivery/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      const data = await res.json()
      if (res.ok && data.data) {
        const { successCount, failCount } = data.data
        if (successCount > 0) {
          const newPage = calculateNewPage(page, total, successCount, pageSize)
          if (newPage !== page) {
            setPage(newPage)
          }
          alert(`删除成功：${successCount} 条${failCount > 0 ? `，失败：${failCount} 条` : ''}`)
        } else {
          alert(`删除失败：${failCount} 条`)
        }
        setShowDeleteConfirm(false)
        setSelectedIds(new Set())
        setTimeout(() => fetchTasks(), 0)
      } else {
        alert(data.error || '删除失败，请稍后重试')
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索任务编号/订单号/配送员"
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
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchPrint}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="h-4 w-4" />
            批量打印 ({selectedIds.size})
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            批量删除 ({selectedIds.size})
          </button>
          <Link
            href="/delivery/create"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            创建配送任务
          </Link>
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
                <th className="px-4 py-3 text-left font-medium text-slate-600">配送员</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">配送路线</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">预计送达</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">状态</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">优先级</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">创建时间</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">加载中...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">暂无配送任务</td>
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
                      <Link href={`/delivery/${task.id}`} className="hover:underline">{task.taskNo}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{task.orderNo}</td>
                    <td className="px-4 py-3 text-slate-700">{task.courierName || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{task.deliveryRoute}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {task.estimatedDelivery ? formatDateTime(task.estimatedDelivery) : '-'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(task.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/delivery/${task.id}`}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-primary-600 transition-colors hover:bg-primary-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          详情
                        </Link>
                        <button
                          onClick={() => {
                            setShowAssignModal(task.id)
                            setAssignForm({ courierName: task.courierName || '', courierPhone: task.courierPhone || '' })
                          }}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          分配
                        </button>
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

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAssignModal(null)}>
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">分配配送员</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">配送员</label>
                <select
                  value={assignForm.courierName}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, courierName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="">选择配送员</option>
                  {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">配送员电话</label>
                <input
                  type="text"
                  value={assignForm.courierPhone}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, courierPhone: e.target.value }))}
                  placeholder="联系电话"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAssignModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={() => handleAssign(showAssignModal)}
                disabled={!assignForm.courierName}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrintDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPrintDialog(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">批量打印</h2>
            <p className="mb-4 text-sm text-slate-600">
              已选择 {selectedIds.size} 个配送任务，确认打印？
            </p>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {tasks.filter((t) => selectedIds.has(t.id)).map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                  <span className="text-sm font-medium text-slate-700">{t.taskNo}</span>
                  <span className="text-sm text-slate-500">{t.orderNo}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPrintDialog(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={executePrint}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                <Printer className="h-4 w-4" />
                打印
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
              确定删除选中的 <span className="font-semibold text-red-600">{selectedIds.size}</span> 条配送任务吗？
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
              关联的状态历史和通知将一并删除，此操作不可恢复。
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
