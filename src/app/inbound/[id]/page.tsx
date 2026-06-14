'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { InboundTask, StatusHistory, STATUS_LABELS, PRIORITY_LABELS } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { formatDateTime } from '@/lib/utils'

export default function InboundDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [task, setTask] = useState<InboundTask & { statusHistories: StatusHistory[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/inbound/${id}`)
      .then((res) => res.json())
      .then((res) => setTask(res.data))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (toStatus: string) => {
    if (!task) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/inbound/${task.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus, operator: '管理员', remark: '' }),
      })
      if (res.ok) {
        const updated = await res.json()
        setTask({ ...task, ...updated.data, statusHistories: task.statusHistories })
        const fresh = await fetch(`/api/inbound/${id}`)
        const freshData = await fresh.json()
        setTask(freshData.data)
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">任务不存在</div>
      </div>
    )
  }

  const infoItems = [
    { label: '任务编号', value: task.taskNo },
    { label: '商品名称', value: task.productName },
    { label: '数量', value: task.quantity },
    { label: '批次号', value: task.batchNo },
    { label: '存储位置', value: task.storageLocation },
    { label: '状态', value: <StatusBadge status={task.status} /> },
    { label: '优先级', value: <PriorityBadge priority={task.priority} /> },
    { label: '负责人', value: task.assignee || '-' },
    { label: '创建时间', value: formatDateTime(task.createdAt) },
    { label: '更新时间', value: formatDateTime(task.updatedAt) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/inbound')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">入库任务详情</h1>
          <p className="text-gray-500 mt-1">{task.taskNo}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoItems.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <span className="text-sm text-gray-500 w-20 shrink-0">{item.label}</span>
              <span className="text-sm text-gray-900">
                {typeof item.value === 'string' || typeof item.value === 'number' ? item.value : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">状态变更记录</h2>
        {task.statusHistories.length === 0 ? (
          <p className="text-sm text-gray-400">暂无状态变更记录</p>
        ) : (
          <div className="space-y-0">
            {task.statusHistories.map((history, index) => (
              <div key={history.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary-500 mt-1" />
                  {index < task.statusHistories.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200" />
                  )}
                </div>
                <div className="pb-6">
                  <p className="text-sm text-gray-900">
                    {STATUS_LABELS[history.fromStatus]} → {STATUS_LABELS[history.toStatus]}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    操作人: {history.operator} · {formatDateTime(history.createdAt)}
                  </p>
                  {history.remark && (
                    <p className="text-xs text-gray-400 mt-1">备注: {history.remark}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {task.status === 'PENDING' && (
          <button
            onClick={() => handleStatusChange('IN_PROGRESS')}
            disabled={actionLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {actionLoading ? '处理中...' : '审核确认'}
          </button>
        )}
        {task.status === 'IN_PROGRESS' && (
          <button
            onClick={() => handleStatusChange('COMPLETED')}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {actionLoading ? '处理中...' : '开始入库'}
          </button>
        )}
        <button
          onClick={() => router.push('/inbound')}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          返回列表
        </button>
      </div>
    </div>
  )
}
