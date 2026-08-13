import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import {
  getDefaultAdminPermissions,
  getDefaultPermissionsForRole,
  isDashboardRole,
  PERMISSIONS_VERSION,
  sanitizePermissions,
  type DashboardRole,
} from '@/lib/dashboard-permissions'

/**
 * Role Assignment API Route
 * - SUPER_ADMIN_EMAILS → superAdmin + full permissions
 * - Otherwise preserve existing admin/moderator role + permissions
 * - New users with no claims → admin + default admin permissions
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token =
      authHeader?.replace('Bearer ', '') ||
      request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 },
      )
    }

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK is not configured' },
        { status: 500 },
      )
    }

    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(token)
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 },
      )
    }

    const uid = decodedToken.uid
    const userEmail = decodedToken.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found in token' },
        { status: 400 },
      )
    }

    const superAdminEmailsEnv = process.env.SUPER_ADMIN_EMAILS || ''
    const superAdminEmails = superAdminEmailsEnv
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0)

    if (
      superAdminEmails.length === 0 &&
      process.env.NODE_ENV === 'development'
    ) {
      console.warn(
        'WARNING: SUPER_ADMIN_EMAILS environment variable is not set or empty.',
      )
    }

    const normalizedEmail = userEmail.toLowerCase()
    const isEnvSuperAdmin = superAdminEmails.includes(normalizedEmail)

    const user = await adminAuth.getUser(uid)
    const existingRole = isDashboardRole(user.customClaims?.role)
      ? (user.customClaims!.role as DashboardRole)
      : undefined
    const existingVersion = user.customClaims?.permissionsVersion
    const existingPermissions = sanitizePermissions(
      user.customClaims?.permissions,
      { permissionsVersion: existingVersion },
    )

    let role: DashboardRole
    let permissions: string[]

    if (isEnvSuperAdmin) {
      role = 'superAdmin'
      permissions = getDefaultPermissionsForRole('superAdmin')
    } else if (existingRole === 'admin' || existingRole === 'moderator') {
      role = existingRole
      permissions =
        existingPermissions.length > 0
          ? existingPermissions
          : getDefaultPermissionsForRole(role)
    } else if (existingRole === 'superAdmin' && !isEnvSuperAdmin) {
      role = 'admin'
      permissions = getDefaultAdminPermissions()
    } else {
      role = 'admin'
      permissions = getDefaultAdminPermissions()
    }

    const currentRole = existingRole
    const currentPerms = existingPermissions
    const currentVersion =
      typeof existingVersion === 'number' ? existingVersion : 0
    const permsChanged =
      currentPerms.length !== permissions.length ||
      permissions.some((p) => !currentPerms.includes(p as never))
    const versionChanged = currentVersion < PERMISSIONS_VERSION

    if (currentRole !== role || permsChanged || versionChanged) {
      await adminAuth.setCustomUserClaims(uid, {
        role,
        permissions,
        permissionsVersion: PERMISSIONS_VERSION,
      })
    }

    if (
      currentRole !== undefined &&
      (currentRole !== role || permsChanged || versionChanged)
    ) {
      await adminAuth.revokeRefreshTokens(uid)
    }

    return NextResponse.json({
      success: true,
      role,
      permissions,
      permissionsVersion: PERMISSIONS_VERSION,
      message: `Role assigned: ${role}`,
    })
  } catch (error) {
    console.error('Error assigning role:', error)
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 },
    )
  }
}
