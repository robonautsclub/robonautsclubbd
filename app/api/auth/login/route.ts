import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, resolveRoleForEmail } from '@/lib/db/users'
import { verifyPassword } from '@/lib/auth/password'
import { signSessionToken } from '@/lib/auth/jwt'
import { SESSION_DURATION_SECONDS } from '@/lib/session'
import {
  getDefaultPermissionsForRole,
  type DashboardRole,
} from '@/lib/dashboard-permissions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      )
    }

    const user = await findUserByEmail(email)
    if (!user || user.disabled) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      )
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      )
    }

    const role: DashboardRole = resolveRoleForEmail(user.email, user.role)
    const permissions =
      role === 'superAdmin'
        ? getDefaultPermissionsForRole('superAdmin')
        : user.permissions.length > 0
          ? user.permissions
          : getDefaultPermissionsForRole(role)

    const token = await signSessionToken({
      uid: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      role,
      permissions,
    })

    const response = NextResponse.json({
      ok: true,
      user: {
        uid: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        role,
        permissions,
      },
    })

    const secure = process.env.NODE_ENV === 'production'
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    })
    response.cookies.set('session-start', String(Date.now()), {
      httpOnly: false,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    })
    // Keep a non-sensitive mirror for client UI (role badges); server trusts JWT only.
    response.cookies.set(
      'user-info',
      JSON.stringify({
        uid: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        role,
        permissions,
      }),
      {
        httpOnly: false,
        sameSite: 'lax',
        secure,
        path: '/',
        maxAge: SESSION_DURATION_SECONDS,
      },
    )

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to sign in. Please try again.' },
      { status: 500 },
    )
  }
}
