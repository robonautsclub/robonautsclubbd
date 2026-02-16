import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

/**
 * Role Assignment API Route
 * Server-side only endpoint that assigns roles via Firebase Custom Claims
 *
 * This endpoint:
 * - Verifies the user's ID token
 * - Checks if email is in SUPER_ADMIN_EMAILS environment variable
 * - Sets custom claim: role = 'superAdmin' or 'admin'
 * - Returns success/error
 *
 * Must be called after login and on token refresh
 */
export async function POST(request: NextRequest) {
  try {
    // Get the ID token from the request
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      )
    }

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK is not configured' },
        { status: 500 }
      )
    }

    // Verify the ID token
    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const uid = decodedToken.uid
    const userEmail = decodedToken.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found in token' },
        { status: 400 }
      )
    }

    // Get Super Admin emails from environment variable
    const superAdminEmailsEnv = process.env.SUPER_ADMIN_EMAILS || ''
    const superAdminEmails = superAdminEmailsEnv
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0)

    // Warn if no super admin emails configured (development only)
    if (superAdminEmails.length === 0 && process.env.NODE_ENV === 'development') {
      console.warn('WARNING: SUPER_ADMIN_EMAILS environment variable is not set or empty. All users will be assigned admin role.')
    }

    // Determine role based on email
    const normalizedEmail = userEmail.toLowerCase()
    const isSuperAdmin = superAdminEmails.includes(normalizedEmail)
    const role = isSuperAdmin ? 'superAdmin' : 'admin'

    // Get current user to check existing claims
    const user = await adminAuth.getUser(uid)
    const currentRole = user.customClaims?.role as string | undefined

    // Always update claims to ensure they're set (even if same, to handle edge cases)
    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, {
      role,
    })

    // Only revoke tokens if role changed for an existing user
    // During initial login (currentRole is undefined), we don't revoke tokens
    // to avoid breaking the login flow. The token will be refreshed naturally.
    if (currentRole !== undefined && currentRole !== role) {
      // Role changed for existing user - revoke tokens to force refresh
      await adminAuth.revokeRefreshTokens(uid)
    }

    return NextResponse.json({
      success: true,
      role,
      message: `Role assigned: ${role}`,
    })
  } catch (error) {
    console.error('Error assigning role:', error)
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    )
  }
}
