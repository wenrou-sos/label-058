'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LOCATIONS, ASSIGNEES, PRIORITY_LABELS, Priority } from '@/types'
import { useStatsStore } from '@/store/stats-store'

export default function CreateInboundPage() {
  const router = useRouter()
  const invalidateStats = useStatsStore((s) => s.invalidateStats)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    productName: '',
    quantity: '',
    batchNo: '',
    storageLocation: '',
    priority: 'MEDIUM' as Priority,
    assignee: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productName || !form.quantity || !form.batchNo || !form.storageLocation) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/inbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.productName,
          quantity: Number(form.quantity),
          batchNo: form.batchNo,
          storageLocation: form.storageLocation,
          priority: form.priority,
          assignee: form.assignee || null,
        }),
      })

      if (res.ok) {
        invalidateStats()
        router.push('/inbound')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">创建入库任务</h1>
        <p className="text-gray-500 mt-1">填写入库任务信息</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">商品名称 <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            placeholder="请输入商品名称"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">数量 <span className="text-red-500">*</span></label>
          <input
            type="number"
            required
            min={1}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            placeholder="请输入数量"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">批次号 <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={form.batchNo}
            onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            placeholder="请输入批次号"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">存储位置 <span className="text-red-500">*</span></label>
          <select
            required
            value={form.storageLocation}
            onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">请选择存储位置</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
          <select
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">请选择负责人</option>
            {ASSIGNEES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push('/inbound')}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-accent-500 text-white rounded-lg text-sm hover:bg-accent-600 transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交'}
          </button>
        </div>
      </form>
    </div>
  )
}
