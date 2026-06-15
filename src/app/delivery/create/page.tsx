'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRIORITY_LABELS, Priority, COURIERS, ASSIGNEES } from '@/types'
import { useStatsStore } from '@/store/stats-store'

const DELIVERY_ROUTES = ['上海浦东仓库→杭州分拨中心', '苏州工业园→南京配送站', '无锡物流园→合肥中转站', '昆山仓储中心→宁波配送点', '上海嘉定仓→嘉兴物流站', '常州集散中心→扬州配送点']

export default function CreateDeliveryPage() {
  const router = useRouter()
  const invalidateStats = useStatsStore((s) => s.invalidateStats)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    orderNo: '',
    courierName: '',
    courierPhone: '',
    deliveryRoute: '',
    estimatedDelivery: '',
    priority: 'MEDIUM' as Priority,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.orderNo || !form.deliveryRoute) return

    setLoading(true)
    try {
      const body = {
        ...form,
        estimatedDelivery: form.estimatedDelivery ? new Date(form.estimatedDelivery).toISOString() : undefined,
      }
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        invalidateStats()
        router.push('/delivery')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">创建配送任务</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              订单号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="orderNo"
              value={form.orderNo}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">配送员</label>
            <select
              name="courierName"
              value={form.courierName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="">请选择配送员</option>
              {COURIERS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">配送员电话</label>
            <input
              type="text"
              name="courierPhone"
              value={form.courierPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              配送路线 <span className="text-red-500">*</span>
            </label>
            <select
              name="deliveryRoute"
              value={form.deliveryRoute}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="">请选择配送路线</option>
              {DELIVERY_ROUTES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预计送达时间</label>
            <input
              type="datetime-local"
              name="estimatedDelivery"
              value={form.estimatedDelivery}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/delivery')}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50"
            >
              {loading ? '提交中...' : '创建任务'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
