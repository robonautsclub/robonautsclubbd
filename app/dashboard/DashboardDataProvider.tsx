'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { Course } from '@/types/course'
import type { NewsArticle } from '@/types/news'
import type { GalleryGroup } from '@/types/gallery'
import type {
  DashboardBootstrapData,
  DashboardEventRealtime,
  DashboardMember,
  DashboardNotification,
} from './types'

type DashboardDataContextValue = DashboardBootstrapData & {
  unreadCount: number
  setNotificationOpen: (value: boolean) => void
  markNotificationAsRead: (id: string) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null)

interface DashboardDataProviderProps {
  initialData: DashboardBootstrapData
  userId: string
  children: React.ReactNode
}

export default function DashboardDataProvider({ initialData, userId: _userId, children }: DashboardDataProviderProps) {
  void _userId
  const [events] = useState<DashboardEventRealtime[]>(initialData.events)
  const [courses] = useState<Course[]>(initialData.courses)
  const [news] = useState<NewsArticle[]>(initialData.news)
  const [galleryGroups] = useState<GalleryGroup[]>(initialData.galleryGroups)
  const [notifications, setNotifications] = useState<DashboardNotification[]>(initialData.notifications)
  const [members] = useState<DashboardMember[]>(initialData.members)
  const [, setNotificationOpen] = useState(false)

  const markNotificationAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PUT', credentials: 'include' })
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    )
  }

  const markAllNotificationsAsRead = async () => {
    await fetch('/api/notifications/mark-all-read', { method: 'POST', credentials: 'include' })
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
  }

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications])

  const value = useMemo<DashboardDataContextValue>(
    () => ({
      events,
      courses,
      news,
      galleryGroups,
      notifications,
      members,
      unreadCount,
      setNotificationOpen,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    }),
    [events, courses, news, galleryGroups, notifications, members, unreadCount]
  )

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext)
  if (!context) {
    throw new Error('useDashboardData must be used inside DashboardDataProvider')
  }
  return context
}
