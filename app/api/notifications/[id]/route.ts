import { NextRequest, NextResponse } from 'next/server'
import { collectionDelete, collectionGet, collectionSet } from '@/lib/db/collections'
import { requireAuth } from '@/lib/auth'

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    const doc = await collectionGet('notifications', id)
    if (!doc) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    const readBy: string[] = Array.isArray(doc.readBy)
      ? doc.readBy.filter((v): v is string => typeof v === 'string')
      : []

    if (!readBy.includes(session.uid)) {
      await collectionSet('notifications', id, { readBy: [...readBy, session.uid] }, { merge: true })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    await collectionDelete('notifications', id)

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
