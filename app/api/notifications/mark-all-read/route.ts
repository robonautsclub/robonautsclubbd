import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/auth'

const MARK_ALL_READ_LIMIT = 200

/**
 * Mark unread notifications as read for the current user.
 * Only scans a recent window (not the entire collection).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK is not configured' },
        { status: 500 }
      )
    }

    const snapshot = await adminDb
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(MARK_ALL_READ_LIMIT)
      .get()

    const batch = adminDb.batch()
    let updatedCount = 0

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const readBy: string[] = Array.isArray(data.readBy) ? data.readBy : []

      if (!readBy.includes(session.uid)) {
        batch.update(doc.ref, {
          readBy: [...readBy, session.uid],
        })
        updatedCount++
      }
    })

    if (updatedCount > 0) {
      await batch.commit()
    }

    return NextResponse.json({
      success: true,
      markedAsRead: updatedCount,
      message: `Marked ${updatedCount} notification(s) as read`,
    })
  } catch (error) {
    console.error('mark-all-read failed:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}
