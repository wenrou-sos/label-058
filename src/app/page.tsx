'use client'

import { useEffect, useState, useCallback } from 'react'
import { LayoutDashboard, PackagePlus, ShoppingCart, Truck, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { DashboardStats, TASK_TYPE_LABELS, STATUS_LABELS } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { formatDateTime } from '@/lib/utils'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadStats = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch('/api/stats')
      const json = await res.json()
      setStats(json.data)
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadStats()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [loadStats])

  useEffect(() => {
    const interval = setInterval(() => {
      loadStats()
    }, 60000)
    return () => clearInterval(interval)
  }, [loadStats])

  const handleRefresh = () => {
    loadStats(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: '入库任务',
      count: stats.inboundCount,
      subtitle: `待处理: ${stats.inboundPending}`,
      icon: PackagePlus,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      title: '拣货任务',
      count: stats.pickingCount,
      subtitle: `进行中: ${stats.pickingInProgress}`,
      icon: ShoppingCart,
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
    },
    {
      title: '配送任务',
      count: stats.deliveryCount,
      subtitle: `配送中: ${stats.deliveringCount}`,
      icon: Truck,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
    },
    {
      title: '已完成任务',
      count: stats.completedCount,
      subtitle: '全部类型合计',
      icon: LayoutDashboard,
      color: 'bg-orange-50 text-orange-600',
      iconBg: 'bg-orange-100',
    },
  ]

  const chartData = stats.statusDistribution.map((item) => ({
    status: STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status,
    count: item.count,
  }))

  const trendData = stats.weeklyTrend

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500">仓库物流管理概览</p>
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                · 最后更新：{formatDateTime(lastUpdated)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '刷新中...' : '刷新数据'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold mt-1">{card.count}</p>
                <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.iconBg}`}>
                <card.icon className={`w-6 h-6 ${card.color.split(' ')[1]}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">近 7 天任务趋势</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="inbound" name="入库" stroke="#4c6ef5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="picking" name="拣货" stroke="#9775fa" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="delivery" name="配送" stroke="#40c057" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">任务状态分布</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#4c6ef5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近任务</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500">任务编号</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">类型</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">优先级</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTasks.map((task) => (
                <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-primary-600">{task.taskNo}</td>
                  <td className="py-3 px-4">{TASK_TYPE_LABELS[task.type]}</td>
                  <td className="py-3 px-4"><StatusBadge status={task.status} /></td>
                  <td className="py-3 px-4"><PriorityBadge priority={task.priority} /></td>
                  <td className="py-3 px-4 text-gray-500">{formatDateTime(task.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
