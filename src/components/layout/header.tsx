'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Menu, Bell, User, X, CheckCheck } from 'lucide-react'
import { useUIStore } from '@/store/ui-store'
import { useNotificationStore } from '@/store/notification-store'
import { formatDateTime } from '@/lib/utils'
import type { TaskType } from '@/types'
import { TASK_TYPE_LABELS } from '@/types'

const routeTitles: Record<string, string> = {
  '/': '仪表盘',
  '/inbound': '入库管理',
  '/picking': '拣货管理',
  '/delivery': '配送管理',
  '/tracking': '状态追踪',
  '/tasks': '任务管理',
}

export function Header() {
  const pathname = usePathname()
  const { toggleSidebar } = useUIStore()
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const title =
    routeTitles[pathname] ||
    Object.entries(routeTitles).find(
      ([path]) => path !== '/' && pathname.startsWith(path)
    )?.[1] ||
    '仓储物流管理系统'

  const typeColorMap: Record<TaskType, string> = {
    INBOUND: 'bg-blue-100 text-blue-700',
    PICKING: 'bg-purple-100 text-purple-700',
    DELIVERY: 'bg-green-100 text-green-700',
  }

  return (
    <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">通知</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      全部已读
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-400">暂无通知</div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`cursor-pointer border-b border-slate-50 px-4 py-3 transition-colors hover:bg-slate-50 ${
                        !n.isRead ? 'bg-primary-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 shrink-0 rounded px-1 py-0.5 text-[10px] font-medium ${typeColorMap[n.taskType]}`}>
                          {TASK_TYPE_LABELS[n.taskType]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.isRead ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                            {n.message}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                        </div>
                        {!n.isRead && (
                          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-600">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  )
}
