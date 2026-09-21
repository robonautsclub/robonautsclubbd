import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { hashPassword } from '@/lib/auth/password'
import { findUserById, updateUser } from '@/lib/db/users'
import { getDb } from '@/lib/db'
import { addDoc } from '@/lib/db/documents'

/**
 * Profile Update API Route — D1 users table (Cloudflare Worker).
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { displayName, password } = body

    if (!displayName) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 },
      )
    }

    if (password !== undefined && password !== null && password !== '') {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 },
        )
      }
    }

    const currentUser = await findUserById(session.uid)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const changes: string[] = []
    const patch: Parameters<typeof updateUser>[1] = {}

    if (currentUser.name !== displayName.trim()) {
      patch.name = displayName.trim()
      changes.push('display name')
    }
    if (password && password.length > 0) {
      patch.passwordHash = await hashPassword(password)
      changes.push('password')
    }

    if (Object.keys(patch).length > 0) {
      await updateUser(session.uid, patch)
      if (changes.length > 0) {
        try {
          const db = await getDb()
          await addDoc(db, 'notifications', {
            type: 'profile_update',
            message: `${session.name || session.email} updated their ${changes.join(' and ')}`,
            userId: session.uid,
            userName: session.name,
            userEmail: session.email,
            changes,
            readBy: [],
            createdAt: new Date().toISOString(),
          })
        } catch {
          /* ignore */
        }
      }
    }

    const updatedUser = await findUserById(session.uid)
    return NextResponse.json({
      success: true,
      user: {
        uid: updatedUser?.id,
        email: updatedUser?.email,
        displayName: updatedUser?.name,
      },
      message: 'Profile updated successfully',
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    )
  }
}
