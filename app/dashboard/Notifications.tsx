'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, CheckCircle2, User, Clock } from 'lucide-react'

type Notification = {
  id: string
  type: string
  message: string
  userName: string
  userEmail: string
  changes: string[]
  isRead: boolean
  createdAt: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications?unreadOnly=false&limit=10')
      const data = await response.json()

      if (data.success) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch only when the panel opens — no mount/interval polling (fewer edge/API hits).
  useEffect(() => {
    if (!isOpen) return
    void loadNotifications()
  }, [isOpen, loadNotifications])

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      const markAllAsRead = async () => {
        try {
          await fetch('/api/notifications/mark-all-read', {
            method: 'POST',
            credentials: 'include',
          })

          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
          setUnreadCount(0)
        } catch {
          /* ignore */
        }
      }

      markAllAsRead()
    }
  }, [isOpen, unreadCount])

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        credentials: 'include',
      })

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      /* ignore */
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-linear-to-r from-indigo-50 to-blue-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            notification.type === 'profile_update'
                              ? 'bg-indigo-100 text-indigo-600'
                              : notification.type.startsWith('event_')
                                ? 'bg-green-100 text-green-600'
                                : notification.type.startsWith('course_')
                                  ? 'bg-blue-100 text-blue-600'
                                  : notification.type.startsWith('user_')
                                    ? 'bg-purple-100 text-purple-600'
                                    : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {notification.type === 'profile_update' ? (
                            <User className="w-5 h-5" />
                          ) : (
                            <Bell className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 mb-1">{notification.message}</p>
                          {notification.changes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {notification.changes.map((change, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700"
                                >
                                  {change}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(notification.createdAt)}</span>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => void loadNotifications()}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
