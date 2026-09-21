import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'
import { hashPassword } from '@/lib/auth/password'
import { createUser, listUsers } from '@/lib/db/users'
import { getDb } from '@/lib/db'
import { addDoc } from '@/lib/db/documents'
import {
  getDefaultPermissionsForRole,
  normalizePermissionGrants,
  PERMISSIONS_VERSION,
  sanitizePermissions,
  type DashboardRole,
} from '@/lib/dashboard-permissions'

export async function GET() {
  try {
    await requireSuperAdmin()
    const users = await listUsers()
    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        uid: u.id,
        email: u.email,
        displayName: u.name,
        emailVerified: u.emailVerified,
        role: u.role,
        permissions: u.permissions,
        createdAt: '',
        lastSignIn: null,
        disabled: u.disabled,
      })),
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
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdmin()
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
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
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

    const passwordHash = await hashPassword(password)
    const user = await createUser({
      email,
      passwordHash,
      name: displayName || '',
      role,
      permissions,
      permissionsVersion: PERMISSIONS_VERSION,
    })

    try {
      const db = await getDb()
      await addDoc(db, 'notifications', {
        type: 'user_created',
        message: `${session.name} created a new ${role} user: ${email}`,
        userId: session.uid,
        userName: session.name,
        userEmail: session.email,
        changes: ['user created', `role:${role}`],
        readBy: [],
        createdAt: new Date().toISOString(),
      })
    } catch {
      // Silently fail
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: user.id,
        email: user.email,
        displayName: user.name,
        emailVerified: user.emailVerified,
        role: user.role,
        permissions: user.permissions,
      },
      message: 'User created successfully',
    })
  } catch (error: unknown) {
    console.error('Error creating user:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('UNIQUE') || msg.toLowerCase().includes('unique')) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
