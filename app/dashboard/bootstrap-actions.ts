'use server'

import { requireAuth } from '@/lib/auth'
import { listUsers } from '@/lib/db/users'
import { collectionGetAll } from '@/lib/db/collections'
import type { Session } from '@/lib/auth'
import type {
  DashboardBootstrapData,
  DashboardMember,
  DashboardNotification,
} from './types'
import { getCachedEventsList } from './events/cache'
import { getCachedCoursesList } from './courses/actions'

function toIso(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  if (typeof value === 'string') return value
  return ''
}

async function getDashboardMembers(session: Session): Promise<DashboardMember[]> {
  if (session.role !== 'superAdmin') return []

  const users = await listUsers()
  return users.map((user) => ({
    uid: user.id,
    email: user.email || '',
    displayName: user.name || '',
    emailVerified: user.emailVerified,
    role: user.role,
    createdAt: '',
    lastSignIn: '',
    disabled: user.disabled,
  }))
}

async function getDashboardNotifications(session: Session): Promise<DashboardNotification[]> {
  const docs = await collectionGetAll('notifications', {
    orderBy: 'createdAt',
    direction: 'desc',
    limit: 10,
  })
  return docs.map((doc) => {
    const readBy = Array.isArray(doc.readBy) ? doc.readBy : []
    return {
      id: String(doc.id),
      type: String(doc.type || ''),
      message: String(doc.message || ''),
      userId: String(doc.userId || ''),
      userName: String(doc.userName || ''),
      userEmail: String(doc.userEmail || ''),
      changes: Array.isArray(doc.changes)
        ? doc.changes.filter((v): v is string => typeof v === 'string')
        : [],
      readBy: readBy.filter((v): v is string => typeof v === 'string'),
      isRead: readBy.includes(session.uid),
      createdAt: toIso(doc.createdAt),
    }
  })
}

export async function getDashboardBootstrapData(sessionArg?: Session): Promise<DashboardBootstrapData> {
  const session = sessionArg ?? (await requireAuth())

  const [events, courses, news, galleryGroups, notifications, members] = await Promise.all([
    getCachedEventsList(),
    getCachedCoursesList(),
    import('./news/actions').then((module) => module.getNewsArticles()),
    import('./gallery/actions').then((module) => module.getGalleryGroupsForDashboard()),
    getDashboardNotifications(session),
    getDashboardMembers(session),
  ])

  return {
    events,
    courses,
    news,
    galleryGroups,
    notifications,
    members,
  }
}
