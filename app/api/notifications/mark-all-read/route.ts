import { NextResponse } from 'next/server'
import { collectionGetAll, collectionSet } from '@/lib/db/collections'
import { requireAuth } from '@/lib/auth'

const MARK_ALL_READ_LIMIT = 200

export async function POST() {
  try {
    const session = await requireAuth()

    const docs = await collectionGetAll('notifications', {
      orderBy: 'createdAt',
      direction: 'desc',
      limit: MARK_ALL_READ_LIMIT,
    })

    let updatedCount = 0
    await Promise.all(
      docs.map(async (doc) => {
        const readBy: string[] = Array.isArray(doc.readBy) ? doc.readBy.filter((v): v is string => typeof v === 'string') : []
        if (readBy.includes(session.uid)) return
        updatedCount++
        await collectionSet(
          'notifications',
          String(doc.id),
          { readBy: [...readBy, session.uid] },
          { merge: true },
        )
      }),
    )

    return NextResponse.json({
      success: true,
      markedAsRead: updatedCount,
      message: `Marked ${updatedCount} notification(s) as read`,
    })
  } catch (error) {
    console.error('mark-all-read failed:', error)
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
  }
}
