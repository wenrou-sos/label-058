'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Upload, Trash2 } from 'lucide-react'
import { InboundTask, TaskStatus, Priority, STATUS_LABELS, PRIORITY_LABELS } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { formatDateTime } from '@/lib/utils'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'PENDING', label: '待处理' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
]

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
  { value: 'URGENT', label: '紧急' },
]

export default function InboundListPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<InboundTask[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchItems, setBatchItems] = useState([
    { productName: '', quantity: 1, batchNo: '', storageLocation: '', priority: 'MEDIUM' as Priority, assignee: '' },
  ])
  const [batchSubmitting, setBatchSubmitting] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    if (search) params.set('search', search)
    params.set('page', page.toString())
    params.set('pageSize', pageSize.toString())

    const res = await fetch(`/api/inbound?${params.toString()}`)
    const data = await res.json()
    setTasks(data.data)
    setTotal(data.total)
    setLoading(false)
  }, [statusFilter, priorityFilter, search, page, pageSize])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [page, statusFilter, priorityFilter, search])

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

  const handleApprove = async (id: string) => {
    await fetch(`/api/inbound/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toStatus: 'IN_PROGRESS', operator: '管理员', remark: '审核通过' }),
    })
    fetchTasks()
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/inbound/batch-delete', {
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

  const handleBatchImport = async () => {
    const validItems = batchItems.filter((i) => i.productName && i.quantity > 0 && i.batchNo && i.storageLocation)
    if (validItems.length === 0) return

    setBatchSubmitting(true)
    try {
      const res = await fetch('/api/inbound/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: validItems.map((i) => ({
            ...i,
            assignee: i.assignee || null,
          })),
        }),
      })
      if (res.ok) {
        setShowBatchModal(false)
        setBatchItems([{ productName: '', quantity: 1, batchNo: '', storageLocation: '', priority: 'MEDIUM' as Priority, assignee: '' }])
        fetchTasks()
      }
    } finally {
      setBatchSubmitting(false)
    }
  }

  const addBatchItem = () => {
    setBatchItems((prev) => [...prev, { productName: '', quantity: 1, batchNo: '', storageLocation: '', priority: 'MEDIUM' as Priority, assignee: '' }])
  }

  const removeBatchItem = (index: number) => {
    setBatchItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateBatchItem = (index: number, field: string, value: string | number) => {
    setBatchItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">入库管理</h1>
          <p className="text-gray-500 mt-1">管理所有入库任务</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            批量删除 ({selectedIds.size})
          </button>
          <button
            onClick={() => setShowBatchModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            批量导入
          </button>
          <button
            onClick={() => router.push('/inbound/create')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建入库任务
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索任务编号、商品名称、批次号..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={tasks.length > 0 && selectedIds.size === tasks.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">任务编号</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">商品名称</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">数量</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">批次号</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">存储位置</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">优先级</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">负责人</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">创建时间</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(task.id)}
                          onChange={() => toggleSelect(task.id)}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono text-primary-600">{task.taskNo}</td>
                      <td className="py-3 px-4">{task.productName}</td>
                      <td className="py-3 px-4">{task.quantity}</td>
                      <td className="py-3 px-4 font-mono text-gray-600">{task.batchNo}</td>
                      <td className="py-3 px-4">{task.storageLocation}</td>
                      <td className="py-3 px-4"><StatusBadge status={task.status} /></td>
                      <td className="py-3 px-4"><PriorityBadge priority={task.priority} /></td>
                      <td className="py-3 px-4">{task.assignee || '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{formatDateTime(task.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/inbound/${task.id}`)}
                            className="text-primary-600 hover:text-primary-800 text-xs"
                          >
                            查看详情
                          </button>
                          {task.status === 'PENDING' && (
                            <button
                              onClick={() => handleApprove(task.id)}
                              className="text-green-600 hover:text-green-800 text-xs"
                            >
                              审核确认
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/inbound/${task.id}`)}
                            className="text-gray-600 hover:text-gray-800 text-xs"
                          >
                            编辑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-gray-400">暂无数据</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  共 {total} 条记录，第 {page}/{totalPages} 页
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !deleteLoading && setShowDeleteConfirm(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">确认删除</h2>
            <p className="mb-4 text-sm text-slate-600">
              确定删除选中的 <span className="font-semibold text-red-600">{selectedIds.size}</span> 条入库任务吗？
            </p>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {tasks.filter((t) => selectedIds.has(t.id)).map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                  <span className="text-sm font-medium text-slate-700">{t.taskNo}</span>
                  <span className="text-sm text-slate-500">{t.productName}</span>
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

      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBatchModal(false)}>
          <div className="w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">批量导入入库任务</h2>
            <div className="space-y-3">
              {batchItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
                  <span className="text-xs text-slate-400 w-6">{index + 1}</span>
                  <input
                    type="text"
                    placeholder="商品名称"
                    value={item.productName}
                    onChange={(e) => updateBatchItem(index, 'productName', e.target.value)}
                    className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="数量"
                    value={item.quantity}
                    onChange={(e) => updateBatchItem(index, 'quantity', Number(e.target.value))}
                    className="w-20 rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="批次号"
                    value={item.batchNo}
                    onChange={(e) => updateBatchItem(index, 'batchNo', e.target.value)}
                    className="w-28 rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="存储位置"
                    value={item.storageLocation}
                    onChange={(e) => updateBatchItem(index, 'storageLocation', e.target.value)}
                    className="w-24 rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                  <select
                    value={item.priority}
                    onChange={(e) => updateBatchItem(index, 'priority', e.target.value)}
                    className="w-20 rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  {batchItems.length > 1 && (
                    <button onClick={() => removeBatchItem(index)} className="text-red-400 hover:text-red-600 text-sm">删除</button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addBatchItem}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700"
            >
              + 添加一行
            </button>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowBatchModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchImport}
                disabled={batchSubmitting || batchItems.every((i) => !i.productName || !i.batchNo || !i.storageLocation)}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {batchSubmitting ? '导入中...' : `导入 ${batchItems.filter((i) => i.productName && i.batchNo && i.storageLocation).length} 条`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
