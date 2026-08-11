import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { requireSuperAdmin } from '@/lib/auth'
import {
  getDefaultPermissionsForRole,
  isDashboardRole,
  normalizePermissionGrants,
  sanitizePermissions,
  PERMISSIONS_VERSION,
  type DashboardPermission,
  type DashboardRole,
} from '@/lib/dashboard-permissions'

function resolveUserRoleAndPerms(user: {
  customClaims?: Record<string, unknown> | null
}): { role: DashboardRole; permissions: DashboardPermission[] } {
  const role = (isDashboardRole(user.customClaims?.role)
    ? user.customClaims!.role
    : 'admin') as DashboardRole
  const version = user.customClaims?.permissionsVersion
  const sanitized = sanitizePermissions(user.customClaims?.permissions, {
    permissionsVersion: version,
  })
  const permissions =
    role === 'superAdmin'
      ? getDefaultPermissionsForRole('superAdmin')
      : sanitized.length > 0
        ? sanitized
        : getDefaultPermissionsForRole(role)
  return { role, permissions }
}

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
    const { role, permissions } = resolveUserRoleAndPerms(user)

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        emailVerified: user.emailVerified,
        role,
        permissions,
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
    const { displayName, password, disabled, role: rawRole, permissions: rawPerms } =
      body

    if (!uid) {
      return NextResponse.json(
        { error: 'User UID is required' },
        { status: 400 },
      )
    }

    // Prevent Super Admins from editing any Super Admin account via this endpoint.
    const superAdminEmailsEnv = process.env.SUPER_ADMIN_EMAILS || ''
    const superAdminEmails = superAdminEmailsEnv
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0)

    if (body.email !== undefined) {
      return NextResponse.json(
        {
          error:
            'Email address cannot be changed. Email addresses are permanent for security reasons.',
        },
        { status: 400 },
      )
    }

    const updateData: {
      displayName?: string
      password?: string
      disabled?: boolean
    } = {}

    if (displayName !== undefined) {
      updateData.displayName = displayName
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 },
        )
      }
      updateData.password = password
    }

    if (disabled !== undefined) {
      updateData.disabled = disabled
    }

    const currentUser = await adminAuth.getUser(uid)
    const { role: currentRole, permissions: currentPermissions } =
      resolveUserRoleAndPerms(currentUser)
    const currentEmail = (currentUser.email || '').toLowerCase()
    const isProtectedSuperAdmin =
      currentRole === 'superAdmin' ||
      (currentEmail && superAdminEmails.includes(currentEmail))

    if (isProtectedSuperAdmin) {
      return NextResponse.json(
        {
          error:
            'Super Admin accounts cannot be edited via user management.',
        },
        { status: 403 },
      )
    }

    const changes: string[] = []
    if (
      updateData.displayName &&
      updateData.displayName !== currentUser.displayName
    ) {
      changes.push('display name')
    }
    if (updateData.password) changes.push('password')
    if (
      updateData.disabled !== undefined &&
      updateData.disabled !== currentUser.disabled
    ) {
      changes.push(updateData.disabled ? 'disabled' : 'enabled')
    }

    const nextRole: DashboardRole =
      rawRole === 'moderator' || rawRole === 'admin' ? rawRole : currentRole
    const nextPermissions = normalizePermissionGrants(
      Array.isArray(rawPerms)
        ? sanitizePermissions(rawPerms, {
            permissionsVersion: PERMISSIONS_VERSION,
          })
        : currentPermissions,
    )

    if (nextRole !== currentRole) changes.push(`role:${nextRole}`)
    const permsChanged =
      nextPermissions.length !== currentPermissions.length ||
      nextPermissions.some((p) => !currentPermissions.includes(p))
    if (permsChanged) changes.push('permissions')

    if (Object.keys(updateData).length > 0) {
      await adminAuth.updateUser(uid, updateData)
    }

    if (nextRole !== currentRole || permsChanged) {
      await adminAuth.setCustomUserClaims(uid, {
        role: nextRole,
        permissions: nextPermissions,
        permissionsVersion: PERMISSIONS_VERSION,
      })
      await adminAuth.revokeRefreshTokens(uid)
    }

    const user = await adminAuth.getUser(uid)
    const { role, permissions } = resolveUserRoleAndPerms(user)

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
      } catch {
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
        permissions,
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

      // Prevent Super Admins from deleting any Super Admin account.
      const superAdminEmailsEnv = process.env.SUPER_ADMIN_EMAILS || ''
      const superAdminEmails = superAdminEmailsEnv
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0)

      const targetRole = isDashboardRole(user.customClaims?.role)
        ? user.customClaims!.role
        : 'admin'
      const targetEmail = (user.email || '').toLowerCase()
      const isProtectedSuperAdmin =
        targetRole === 'superAdmin' ||
        (targetEmail && superAdminEmails.includes(targetEmail))

      if (isProtectedSuperAdmin) {
        return NextResponse.json(
          { error: 'Super Admin accounts cannot be deleted.' },
          { status: 403 }
        )
      }
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
