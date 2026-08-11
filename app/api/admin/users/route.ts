import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { requireSuperAdmin } from '@/lib/auth'
import {
  getDefaultPermissionsForRole,
  isDashboardRole,
  normalizePermissionGrants,
  PERMISSIONS_VERSION,
  sanitizePermissions,
  type DashboardRole,
} from '@/lib/dashboard-permissions'

function mapUserRecord(user: {
  uid: string
  email?: string
  displayName?: string
  emailVerified: boolean
  disabled: boolean
  customClaims?: Record<string, unknown> | null
  metadata: { creationTime?: string; lastSignInTime?: string }
}) {
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

  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    emailVerified: user.emailVerified,
    role,
    permissions,
    createdAt: user.metadata.creationTime || '',
    lastSignIn: user.metadata.lastSignInTime || null,
    disabled: user.disabled,
  }
}

/**
 * GET /api/admin/users
 */
export async function GET() {
  try {
    await requireSuperAdmin()

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK is not configured' },
        { status: 500 },
      )
    }

    const listUsersResult = await adminAuth.listUsers(1000)
    const users = listUsersResult.users.map((user) => mapUserRecord(user))

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    })
  } catch (error) {
    console.error('Error listing users:', error)

    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Unauthorized: Super Admin access required' },
        { status: 403 },
      )
    }

    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/admin/users
 * Create admin or moderator with permissions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdmin()

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK is not configured' },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { email, password, displayName, role: rawRole, permissions: rawPerms } =
      body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 },
      )
    }

    const role: DashboardRole =
      rawRole === 'moderator' ? 'moderator' : 'admin'
    const incoming = sanitizePermissions(rawPerms, {
      permissionsVersion: PERMISSIONS_VERSION,
    })
    const permissions = normalizePermissionGrants(
      incoming.length > 0 ? incoming : getDefaultPermissionsForRole(role),
    )

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || '',
      emailVerified: false,
    })

    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role,
      permissions,
      permissionsVersion: PERMISSIONS_VERSION,
    })

    if (adminDb) {
      try {
        await adminDb.collection('notifications').add({
          type: 'user_created',
          message: `${session.name} created a new ${role} user: ${email}`,
          userId: session.uid,
          userName: session.name,
          userEmail: session.email,
          changes: ['user created', `role:${role}`],
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
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || '',
        emailVerified: userRecord.emailVerified,
        role,
        permissions,
      },
      message: 'User created successfully',
    })
  } catch (error: unknown) {
    console.error('Error creating user:', error)

    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Unauthorized: Super Admin access required' },
        { status: 403 },
      )
    }

    const firebaseError = error as { code?: string; message?: string }
    if (firebaseError.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 },
    )
  }
}
