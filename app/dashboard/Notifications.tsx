'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCircle2, User, Clock, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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

  const typeBadge = (type: string) => {
    if (type === 'profile_update') return 'bg-indigo-100 text-indigo-600'
    if (type.startsWith('event_')) return 'bg-green-100 text-green-600'
    if (type.startsWith('course_')) return 'bg-blue-100 text-blue-600'
    if (type.startsWith('user_')) return 'bg-purple-100 text-purple-600'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative size-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full text-[10px] leading-none flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Notifications</TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 rounded-xl shadow-2xl border-gray-200 max-h-[600px] flex flex-col overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-gray-200 bg-linear-to-r from-indigo-50 to-blue-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[440px]">
          {loading ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="size-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-gray-50 transition-colors',
                    !notification.isRead && 'bg-blue-50/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'size-10 rounded-full flex items-center justify-center shrink-0',
                        typeBadge(notification.type)
                      )}
                    >
                      {notification.type === 'profile_update' ? (
                        <User className="size-5" />
                      ) : (
                        <Bell className="size-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {notification.message}
                      </p>
                      {notification.changes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {notification.changes.map((change, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
                            >
                              {change}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="size-3" />
                        <span>{formatTime(notification.createdAt)}</span>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                            className="size-7 text-gray-400 hover:text-green-600"
                            aria-label="Mark as read"
                          >
                            <CheckCircle2 className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Mark as read</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-2 bg-gray-50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void loadNotifications()}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
