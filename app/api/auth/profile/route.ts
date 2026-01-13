import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/auth'

/**
 * Profile Update API Route
 * Allows users to update their own profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { displayName, password } = body

    // Validate input
    if (!displayName) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }

    // Validate password if provided
    if (password !== undefined && password !== null && password !== '') {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        )
      }
    }

    // Get current user data to check what changed
    const currentUser = await adminAuth.getUser(session.uid)
    const changes: string[] = []

    if (currentUser.displayName !== displayName.trim()) {
      changes.push('display name')
    }
    if (password && password.length > 0) {
      changes.push('password')
    }

    // Update user - only displayName and password can be updated
    // Email cannot be changed by users
    const updateData: {
      displayName?: string
      password?: string
    } = {}

    if (displayName.trim() !== currentUser.displayName) {
      updateData.displayName = displayName.trim()
    }
    if (password && password.length > 0) {
      updateData.password = password
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      await adminAuth.updateUser(session.uid, updateData)

      // Create notification for profile update
      if (changes.length > 0) {
        try {
          const { adminDb } = await import('@/lib/firebase-admin')
          if (adminDb) {
            await adminDb.collection('notifications').add({
              type: 'profile_update',
              message: `${session.name || session.email} updated their ${changes.join(' and ')}`,
              userId: session.uid,
              userName: session.name,
              userEmail: session.email,
              changes: changes,
              readBy: [],
              createdAt: new Date(),
            })
          }
        } catch (notifError) {
          // Don't fail the profile update if notification fails
        }
      }
    }

    // Get updated user
    const updatedUser = await adminAuth.getUser(session.uid)

    return NextResponse.json({
      success: true,
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
      },
      message: 'Profile updated successfully',
    })
  } catch (error: unknown) {
    // Handle Firebase Auth errors
    const firebaseError = error as { code?: string; message?: string }
    
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
