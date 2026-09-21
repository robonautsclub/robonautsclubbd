import { NextRequest, NextResponse } from 'next/server'
import { collectionAdd, collectionGetAll } from '@/lib/db/collections'
import { requireAuth } from '@/lib/auth'

function toIso(value: unknown): string | undefined {
  if (value == null) return undefined
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
  return undefined
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const docs = await collectionGetAll('notifications', {
      orderBy: 'createdAt',
      direction: 'desc',
      limit,
    })

    const allNotifications = docs.map((doc) => {
      const readBy = Array.isArray(doc.readBy) ? doc.readBy : []
      const isRead = readBy.includes(session.uid)
      return {
        id: String(doc.id),
        type: doc.type,
        message: doc.message,
        userId: doc.userId,
        userName: doc.userName,
        userEmail: doc.userEmail,
        changes: doc.changes || [],
        readBy,
        isRead,
        createdAt: toIso(doc.createdAt),
      }
    })

    const unreadCount = allNotifications.filter((n) => !n.isRead).length
    const filteredNotifications = unreadOnly
      ? allNotifications.filter((n) => !n.isRead)
      : allNotifications

    return NextResponse.json({
      success: true,
      notifications: filteredNotifications,
      unreadCount,
      total: filteredNotifications.length,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { type, message, userId, userName, userEmail, changes } = body

    if (!type || !message) {
      return NextResponse.json({ error: 'Type and message are required' }, { status: 400 })
    }

    const notification = {
      type,
      message,
      userId: userId || session.uid,
      userName: userName || session.name,
      userEmail: userEmail || session.email,
      changes: changes || [],
      readBy: [],
      createdAt: new Date().toISOString(),
    }

    const notificationId = await collectionAdd('notifications', notification)

    return NextResponse.json({
      success: true,
      notificationId,
      notification,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
