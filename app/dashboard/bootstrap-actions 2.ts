'use server'

import { requireAuth } from '@/lib/auth'
import { isDashboardRole } from '@/lib/dashboard-permissions'
import { adminDb } from '@/lib/firebase-admin'
import { adminAuth } from '@/lib/firebase-admin'
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
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  if (typeof value === 'string') return value
  return ''
}

async function getDashboardMembers(session: Session): Promise<DashboardMember[]> {
  if (session.role !== 'superAdmin' || !adminAuth) return []

  const listUsersResult = await adminAuth.listUsers(1000)
  return listUsersResult.users.map((user) => {
    const role = (isDashboardRole(user.customClaims?.role)
      ? user.customClaims!.role
      : 'admin') as Session['role']
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      emailVerified: user.emailVerified,
      role,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime,
      disabled: user.disabled,
    }
  })
}

async function getDashboardNotifications(session: Session): Promise<DashboardNotification[]> {
  if (!adminDb) return []

  const snapshot = await adminDb.collection('notifications').orderBy('createdAt', 'desc').limit(10).get()
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    const readBy = Array.isArray(data.readBy) ? data.readBy : []
    return {
      id: doc.id,
      type: String(data.type || ''),
      message: String(data.message || ''),
      userId: String(data.userId || ''),
      userName: String(data.userName || ''),
      userEmail: String(data.userEmail || ''),
      changes: Array.isArray(data.changes) ? data.changes.filter((v): v is string => typeof v === 'string') : [],
      readBy,
      isRead: readBy.includes(session.uid),
      createdAt: toIso(data.createdAt),
    }
  })
}

export async function getDashboardBootstrapData(sessionArg?: Session): Promise<DashboardBootstrapData> {
  const session = sessionArg ?? (await requireAuth())

  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Dashboard lists will be empty until FIREBASE_ADMIN_* is configured.')
    const [notifications, members] = await Promise.all([
      getDashboardNotifications(session),
      getDashboardMembers(session),
    ])
    return {
      events: [],
      courses: [],
      news: [],
      galleryGroups: [],
      notifications,
      members,
    }
  }

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
