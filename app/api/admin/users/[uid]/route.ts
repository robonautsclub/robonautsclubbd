import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth'
import { hashPassword } from '@/lib/auth/password'
import {
  deleteUser,
  findUserById,
  updateUser,
} from '@/lib/db/users'
import { getDb } from '@/lib/db'
import { addDoc } from '@/lib/db/documents'
import {
  normalizePermissionGrants,
  sanitizePermissions,
  PERMISSIONS_VERSION,
  type DashboardRole,
} from '@/lib/dashboard-permissions'

function isProtectedSuperAdmin(email: string, role: DashboardRole): boolean {
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return role === 'superAdmin' || superAdminEmails.includes(email.toLowerCase())
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    await requireSuperAdmin()
    const { uid } = await params
    if (!uid) {
      return NextResponse.json({ error: 'User UID is required' }, { status: 400 })
    }
    const user = await findUserById(uid)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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
        createdAt: '',
        lastSignIn: null,
        disabled: user.disabled,
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Unauthorized: Super Admin access required' },
        { status: 403 },
      )
    }
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const session = await requireSuperAdmin()
    const { uid } = await params
    const body = await request.json()
    const { displayName, password, disabled, role: rawRole, permissions: rawPerms } =
      body

    if (!uid) {
      return NextResponse.json({ error: 'User UID is required' }, { status: 400 })
    }
    if (body.email !== undefined) {
      return NextResponse.json(
        {
          error:
            'Email address cannot be changed. Email addresses are permanent for security reasons.',
        },
        { status: 400 },
      )
    }

    const currentUser = await findUserById(uid)
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (isProtectedSuperAdmin(currentUser.email, currentUser.role)) {
      return NextResponse.json(
        { error: 'Super Admin accounts cannot be edited via user management.' },
        { status: 403 },
      )
    }

    const changes: string[] = []
    const patch: Parameters<typeof updateUser>[1] = {}

    if (displayName !== undefined && displayName !== currentUser.name) {
      patch.name = displayName
      changes.push('display name')
    }
    if (password !== undefined) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 },
        )
      }
      patch.passwordHash = await hashPassword(password)
      changes.push('password')
    }
    if (disabled !== undefined && disabled !== currentUser.disabled) {
      patch.disabled = disabled
      changes.push(disabled ? 'disabled' : 'enabled')
    }

    const nextRole: DashboardRole =
      rawRole === 'moderator' || rawRole === 'admin' ? rawRole : currentUser.role
    const nextPermissions = normalizePermissionGrants(
      Array.isArray(rawPerms)
        ? sanitizePermissions(rawPerms, {
            permissionsVersion: PERMISSIONS_VERSION,
          })
        : currentUser.permissions,
    )

    if (nextRole !== currentUser.role) {
      patch.role = nextRole
      changes.push(`role:${nextRole}`)
    }
    const permsChanged =
      nextPermissions.length !== currentUser.permissions.length ||
      nextPermissions.some((p) => !currentUser.permissions.includes(p))
    if (permsChanged) {
      patch.permissions = nextPermissions
      patch.permissionsVersion = PERMISSIONS_VERSION
      changes.push('permissions')
    }

    if (Object.keys(patch).length > 0) {
      await updateUser(uid, patch)
    }

    const user = await findUserById(uid)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (changes.length > 0) {
      try {
        const db = await getDb()
        await addDoc(db, 'notifications', {
          type: 'user_updated',
          message: `${session.name} updated user ${currentUser.email || uid}: ${changes.join(', ')}`,
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

    return NextResponse.json({
      success: true,
      user: {
        uid: user.id,
        email: user.email,
        displayName: user.name,
        emailVerified: user.emailVerified,
        role: user.role,
        permissions: user.permissions,
        disabled: user.disabled,
      },
      message: 'User updated successfully',
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Unauthorized: Super Admin access required' },
        { status: 403 },
      )
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const session = await requireSuperAdmin()
    const { uid } = await params
    if (!uid) {
      return NextResponse.json({ error: 'User UID is required' }, { status: 400 })
    }

    const user = await findUserById(uid)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (isProtectedSuperAdmin(user.email, user.role)) {
      return NextResponse.json(
        { error: 'Super Admin accounts cannot be deleted.' },
        { status: 403 },
      )
    }

    await deleteUser(uid)

    try {
      const db = await getDb()
      await addDoc(db, 'notifications', {
        type: 'user_deleted',
        message: `${session.name} deleted user: ${user.email || uid}`,
        userId: session.uid,
        userName: session.name,
        userEmail: session.email,
        changes: ['user deleted'],
        readBy: [],
        createdAt: new Date().toISOString(),
      })
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Unauthorized: Super Admin access required' },
        { status: 403 },
      )
    }
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
