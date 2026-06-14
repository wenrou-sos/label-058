import { create } from 'zustand'
import type { Notification } from '@/types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    const res = await fetch('/api/notifications')
    const json = await res.json()
    const data: Notification[] = json.data || []
    set({
      notifications: data,
      unreadCount: data.filter((n) => !n.isRead).length,
    })
  },

  markAsRead: async (id) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      }
    })
  },

  markAllAsRead: async () => {
    const { notifications } = get()
    await Promise.all(
      notifications
        .filter((n) => !n.isRead)
        .map((n) => fetch(`/api/notifications/${n.id}`, { method: 'PATCH' }))
    )
    set({
      notifications: notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })
  },
}))
