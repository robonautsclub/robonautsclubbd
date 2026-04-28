'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
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

function handleRealtimeError(source: string, error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : ''
  if (code === 'permission-denied') {
    // Keep bootstrap data and avoid uncaught listener errors in console.
    console.warn(`Realtime listener disabled for ${source}: insufficient Firestore permissions.`)
    return
  }
  console.error(`Realtime listener error for ${source}:`, error)
}

function toDateLike(value: unknown): Date | string {
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  if (typeof value === 'string') return value
  return ''
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  if (typeof value === 'string') return value
  return ''
}

interface DashboardDataProviderProps {
  initialData: DashboardBootstrapData
  userId: string
  children: React.ReactNode
}

export default function DashboardDataProvider({ initialData, userId, children }: DashboardDataProviderProps) {
  const [events, setEvents] = useState<DashboardEventRealtime[]>(initialData.events)
  const [courses, setCourses] = useState<Course[]>(initialData.courses)
  const [news, setNews] = useState<NewsArticle[]>(initialData.news)
  const [galleryGroups, setGalleryGroups] = useState<GalleryGroup[]>(initialData.galleryGroups)
  const [notifications, setNotifications] = useState<DashboardNotification[]>(initialData.notifications)
  const [members] = useState<DashboardMember[]>(initialData.members)
  const [isNotificationOpen, setNotificationOpen] = useState(false)

  useEffect(() => {
    if (!db) return

    const unsubscribers: Array<() => void> = []

    unsubscribers.push(
      onSnapshot(
        collection(db, 'events'),
        (snapshot) => {
          const next = snapshot.docs.map((item) => {
            const data = item.data()
            return {
              id: item.id,
              ...data,
              createdAt: toDateLike(data.createdAt),
              updatedAt: toDateLike(data.updatedAt),
            } as DashboardEventRealtime
          })
          next.sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())
          setEvents(next)
        },
        (error) => handleRealtimeError('events', error)
      )
    )

    unsubscribers.push(
      onSnapshot(
        collection(db, 'courses'),
        (snapshot) => {
          const next = snapshot.docs.map((item) => {
            const data = item.data()
            return {
              id: item.id,
              ...data,
              createdAt: toDateLike(data.createdAt),
              updatedAt: toDateLike(data.updatedAt),
            } as Course
          })
          next.sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())
          setCourses(next)
        },
        (error) => handleRealtimeError('courses', error)
      )
    )

    unsubscribers.push(
      onSnapshot(
        collection(db, 'news'),
        (snapshot) => {
          const next = snapshot.docs.map((item) => {
            const data = item.data()
            return {
              id: item.id,
              title: String(data.title ?? ''),
              slug: String(data.slug ?? ''),
              body: String(data.body ?? ''),
              coverImageUrl: data.coverImageUrl ? String(data.coverImageUrl) : undefined,
              images: Array.isArray(data.images) ? data.images.filter((v): v is string => typeof v === 'string') : undefined,
              published: Boolean(data.published),
              displayDate: toIso(data.displayDate) || null,
              publishedAt: toIso(data.publishedAt) || null,
              createdAt: toIso(data.createdAt),
              updatedAt: toIso(data.updatedAt),
              createdBy: String(data.createdBy ?? ''),
            } satisfies NewsArticle
          })
          next.sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())
          setNews(next)
        },
        (error) => handleRealtimeError('news', error)
      )
    )

    unsubscribers.push(
      onSnapshot(
        collection(db, 'galleryGroups'),
        (snapshot) => {
          const next = snapshot.docs.map((item) => {
            const data = item.data()
            return {
              id: item.id,
              title: String(data.title ?? ''),
              location: String(data.location ?? ''),
              images: Array.isArray(data.images)
                ? data.images
                    .map((entry) => {
                      if (typeof entry === 'string') return { url: entry }
                      if (entry && typeof entry === 'object' && 'url' in entry && typeof (entry as { url: unknown }).url === 'string') {
                        return { url: (entry as { url: string }).url }
                      }
                      return null
                    })
                    .filter((entry): entry is { url: string } => entry !== null)
                : [],
              sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 0,
              displayDate: toIso(data.displayDate) || null,
              createdAt: toIso(data.createdAt),
              updatedAt: toIso(data.updatedAt),
              createdBy: String(data.createdBy ?? ''),
            } satisfies GalleryGroup
          })
          next.sort((a, b) => (a.sortOrder - b.sortOrder) || (new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()))
          setGalleryGroups(next)
        },
        (error) => handleRealtimeError('galleryGroups', error)
      )
    )

    const notificationsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
    unsubscribers.push(
      onSnapshot(
        notificationsQuery,
        (snapshot) => {
          const next = snapshot.docs.slice(0, 10).map((item) => {
            const data = item.data()
            const readBy = Array.isArray(data.readBy) ? data.readBy : []
            return {
              id: item.id,
              type: String(data.type ?? ''),
              message: String(data.message ?? ''),
              userId: String(data.userId ?? ''),
              userName: String(data.userName ?? ''),
              userEmail: String(data.userEmail ?? ''),
              changes: Array.isArray(data.changes) ? data.changes.filter((v): v is string => typeof v === 'string') : [],
              readBy,
              isRead: readBy.includes(userId),
              createdAt: toIso(data.createdAt),
            } satisfies DashboardNotification
          })
          setNotifications(next)
        },
        (error) => handleRealtimeError('notifications', error)
      )
    )

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [userId])

  const markNotificationAsRead = async (id: string) => {
    if (!db) return
    await fetch(`/api/notifications/${id}`, { method: 'PUT', credentials: 'include' })
  }

  const markAllNotificationsAsRead = async () => {
    if (!db) return
    await fetch('/api/notifications/mark-all-read', { method: 'POST', credentials: 'include' })
  }

  useEffect(() => {
    if (!isNotificationOpen) return
    const hasUnread = notifications.some((notification) => !notification.isRead)
    if (hasUnread) {
      void markAllNotificationsAsRead()
    }
  }, [isNotificationOpen, notifications])

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
