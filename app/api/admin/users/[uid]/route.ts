import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { requireSuperAdmin } from '@/lib/auth'

/**
 * User Management API Routes - Individual User Operations
 * Super Admin only - Get, update, and delete users
 */

/**
 * GET /api/admin/users/[uid]
 * Get a single user by UID
 * Super Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    // Require Super Admin
    await requireSuperAdmin()

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK is not configured' },
        { status: 500 }
      )
    }

    const { uid } = await params

    if (!uid) {
      return NextResponse.json(
        { error: 'User UID is required' },
        { status: 400 }
      )
    }

    // Get user
    const user = await adminAuth.getUser(uid)
    
    // Get role from custom claims
    const role = (user.customClaims?.role as 'superAdmin' | 'admin' | undefined) || 'admin'

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        emailVerified: user.emailVerified,
        role,
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime,
        disabled: user.disabled,
      },
    })
  } catch (error: unknown) {
    // Check if it's an auth error (not Super Admin)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Unauthorized: Super Admin access required' },
        { status: 403 }
      )
    }

    // Handle Firebase Auth errors
    const firebaseError = error as { code?: string; message?: string }
    if (firebaseError.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/users/[uid]
 * Update a user
 * Super Admin only
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    // Require Super Admin
    const session = await requireSuperAdmin()

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK is not configured' },
        { status: 500 }
      )
    }

    const { uid } = await params
    const body = await request.json()
    const { displayName, password, disabled } = body

    if (!uid) {
      return NextResponse.json(
        { error: 'User UID is required' },
        { status: 400 }
      )
    }

    // Email updates are not allowed - even for Super Admin
    // This ensures email addresses remain stable and secure
    if (body.email !== undefined) {
      return NextResponse.json(
        { error: 'Email address cannot be changed. Email addresses are permanent for security reasons.' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: {
      displayName?: string
      password?: string
      disabled?: boolean
    } = {}

    if (displayName !== undefined) {
      updateData.displayName = displayName
    }

    if (password !== undefined) {
      // Validate password strength
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        )
      }
      updateData.password = password
    }

    if (disabled !== undefined) {
      updateData.disabled = disabled
    }

    // Get current user data for notification
    const currentUser = await adminAuth.getUser(uid)
    const changes: string[] = []
    if (updateData.displayName && updateData.displayName !== currentUser.displayName) changes.push('display name')
    if (updateData.password) changes.push('password')
    if (updateData.disabled !== undefined && updateData.disabled !== currentUser.disabled) {
      changes.push(updateData.disabled ? 'disabled' : 'enabled')
    }

    // Update user
    const user = await adminAuth.updateUser(uid, updateData)

    // Get role from custom claims
    const role = (user.customClaims?.role as 'superAdmin' | 'admin' | undefined) || 'admin'

    // Create notification for user update
    if (adminDb && changes.length > 0) {
      try {
        await adminDb.collection('notifications').add({
          type: 'user_updated',
          message: `${session.name} updated user ${currentUser.email || uid}: ${changes.join(', ')}`,
          userId: session.uid,
          userName: session.name,
          userEmail: session.email,
          changes,
          readBy: [],
          createdAt: new Date(),
        })
      } catch (error) {
        // Silently fail
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        emailVerified: user.emailVerified,
        role,
        disabled: user.disabled,
      },
      message: 'User updated successfully',
    })
  } catch (error: unknown) {
    // Check if it's an auth error (not Super Admin)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Unauthorized: Super Admin access required' },
        { status: 403 }
      )
    }

    // Handle Firebase Auth errors
    const firebaseError = error as { code?: string; message?: string }
    if (firebaseError.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    if (firebaseError.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[uid]
 * Delete a user
 * Super Admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    // Require Super Admin
    const session = await requireSuperAdmin()

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK is not configured' },
        { status: 500 }
      )
    }

    const { uid } = await params

    if (!uid) {
      return NextResponse.json(
        { error: 'User UID is required' },
        { status: 400 }
      )
    }

    // Get user data before deletion for notification
    let userEmail = ''
    try {
      const user = await adminAuth.getUser(uid)
      userEmail = user.email || ''
    } catch (error) {
      // User might not exist, continue with deletion
    }

    // Delete user
    await adminAuth.deleteUser(uid)

    // Create notification for user deletion
    if (adminDb) {
      try {
        await adminDb.collection('notifications').add({
          type: 'user_deleted',
          message: `${session.name} deleted user: ${userEmail || uid}`,
          userId: session.uid,
          userName: session.name,
          userEmail: session.email,
          changes: ['user deleted'],
          readBy: [],
          createdAt: new Date(),
        })
      } catch (error) {
        // Silently fail
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error: unknown) {
    // Check if it's an auth error (not Super Admin)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Unauthorized: Super Admin access required' },
        { status: 403 }
      )
    }

    // Handle Firebase Auth errors
    const firebaseError = error as { code?: string; message?: string }
    if (firebaseError.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
