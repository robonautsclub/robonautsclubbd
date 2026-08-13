import { cookies } from 'next/headers'
import { adminAuth } from './firebase-admin'
import { redirect } from 'next/navigation'
import { SESSION_DURATION_SECONDS } from './session'
import { cache } from 'react'
import {
  canCreateArea as canCreateAreaPerm,
  canDeleteArea as canDeleteAreaPerm,
  canDeleteResource as canDeleteResourcePerm,
  canEditArea as canEditAreaPerm,
  canEditOthersArea as canEditOthersAreaPerm,
  canEditResource as canEditResourcePerm,
  canViewTab as canViewTabPerm,
  getDefaultAdminPermissions,
  getDefaultPermissionsForRole,
  isDashboardRole,
  PERMISSIONS_VERSION,
  sanitizePermissions,
  sessionHasPermission,
  type DashboardArea,
  type DashboardPermission,
  type DashboardRole,
} from './dashboard-permissions'

export type {
  DashboardArea,
  DashboardPermission,
  DashboardRole,
} from './dashboard-permissions'

export {
  DASHBOARD_AREAS,
  DASHBOARD_AREA_LABELS,
  DASHBOARD_STAFF_AREAS,
  GLOBAL_PERMISSIONS,
  GLOBAL_PERMISSION_LABELS,
  PERMISSIONS_VERSION,
  allDashboardPermissions,
  getDefaultAdminPermissions,
  getDefaultModeratorPermissions,
  getDefaultPermissionsForRole,
  normalizePermissionGrants,
  sanitizePermissions,
  summarizePermissions,
  tabPermission,
  createPermission,
  editPermission,
  deletePermission,
} from './dashboard-permissions'

/**
 * Session type with role + per-area permissions
 */
export type Session = {
  uid: string
  email: string
  name: string
  emailVerified: boolean
  role: DashboardRole
  permissions: DashboardPermission[]
}

function normalizeRole(value: unknown): DashboardRole | undefined {
  if (isDashboardRole(value)) return value
  return undefined
}

function resolvePermissions(
  role: DashboardRole,
  claimsPermissions: unknown,
  permissionsVersion?: unknown,
): DashboardPermission[] {
  if (role === 'superAdmin') {
    return getDefaultPermissionsForRole('superAdmin')
  }
  const fromClaims = sanitizePermissions(claimsPermissions, {
    permissionsVersion,
  })
  if (fromClaims.length > 0) return fromClaims
  // Legacy users with role but no permissions claim → admin defaults
  if (role === 'admin') return getDefaultAdminPermissions()
  return getDefaultPermissionsForRole(role)
}

/**
 * Get the current user session from the auth token cookie (server-side)
 * Returns the decoded token with user info, or null if not authenticated
 */
export const getServerSession = cache(async (): Promise<Session | null> => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    const userInfo = cookieStore.get('user-info')?.value

    if (!token) {
      return null
    }

    if (adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token)
        const uid = decodedToken.uid

        let role = normalizeRole(decodedToken.role)
        let permissionsVersion = decodedToken.permissionsVersion
        let rawPermissions = decodedToken.permissions
        let email = (decodedToken.email as string | undefined) ?? ''
        let name = (decodedToken.name as string | undefined) ?? ''
        let emailVerified = Boolean(decodedToken.email_verified)

        if (
          !role ||
          !email ||
          (role !== 'superAdmin' &&
            sanitizePermissions(rawPermissions, { permissionsVersion })
              .length === 0)
        ) {
          const user = await adminAuth.getUser(uid)
          if (!role) {
            role = normalizeRole(user.customClaims?.role) ?? 'admin'
          }
          if (
            sanitizePermissions(rawPermissions, { permissionsVersion })
              .length === 0
          ) {
            rawPermissions = user.customClaims?.permissions
            permissionsVersion = user.customClaims?.permissionsVersion
          }
          if (!email) {
            email = user.email ?? ''
          }
          if (!name) {
            name = user.displayName ?? email ?? 'Admin'
          }
          emailVerified = user.emailVerified
        } else {
          if (!name) {
            name = email || 'Admin'
          }
        }

        const resolvedRole = role ?? 'admin'
        return {
          uid,
          email,
          name,
          emailVerified,
          role: resolvedRole,
          permissions: resolvePermissions(
            resolvedRole,
            rawPermissions,
            permissionsVersion,
          ),
        }
      } catch (error: unknown) {
        const errorObj = error as { code?: string; message?: string }
        const errorCode = errorObj.code

        if (
          errorCode === 'auth/id-token-expired' ||
          errorCode === 'auth/argument-error' ||
          errorCode === 'auth/invalid-id-token'
        ) {
          return null
        }

        console.error('Unexpected error verifying auth token:', error)
        return null
      }
    }

    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo)
        if (parsed.uid && parsed.email) {
          const role = normalizeRole(parsed.role) ?? 'admin'
          return {
            uid: parsed.uid,
            email: parsed.email,
            name: parsed.name || parsed.email || 'Admin',
            emailVerified: parsed.emailVerified || false,
            role,
            permissions: resolvePermissions(
              role,
              parsed.permissions,
              parsed.permissionsVersion,
            ),
          }
        }
      } catch (error) {
        console.error('Error parsing user info:', error)
      }
    }

    console.warn(
      'Firebase Admin SDK not available and no user info found. Session verification failed.',
    )
    return null
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
})

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  return session
}

/**
 * Set auth token in cookie (client-side helper)
 */
export function setAuthToken(token: string) {
  document.cookie = `auth-token=${token}; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`
}

/**
 * Clear auth token cookie (client-side helper)
 */
export function clearAuthToken() {
  document.cookie = 'auth-token=; path=/; max-age=0'
}

export function isSuperAdmin(session: Session | null): boolean {
  return session?.role === 'superAdmin'
}

/** Any staff role that can enter the dashboard. */
export function isAdmin(session: Session | null): boolean {
  return (
    session?.role === 'admin' ||
    session?.role === 'superAdmin' ||
    session?.role === 'moderator'
  )
}

export function getUserRole(session: Session | null): DashboardRole | null {
  return session?.role || null
}

export function hasPermission(
  session: Session | null,
  permission: DashboardPermission,
): boolean {
  return sessionHasPermission(session, permission)
}

export function canViewTab(
  session: Session | null,
  area: DashboardArea,
): boolean {
  return canViewTabPerm(session, area)
}

export function canCreateArea(
  session: Session | null,
  area: DashboardArea,
): boolean {
  return canCreateAreaPerm(session, area)
}

export function canEditOthersArea(
  session: Session | null,
  area: DashboardArea,
): boolean {
  return canEditOthersAreaPerm(session, area)
}

export function canEditArea(
  session: Session | null,
  area: DashboardArea,
): boolean {
  return canEditAreaPerm(session, area)
}

export function canDeleteArea(
  session: Session | null,
  area: DashboardArea,
): boolean {
  return canDeleteAreaPerm(session, area)
}

export function canEditResource(
  session: Session | null,
  area: DashboardArea,
  createdBy: string | null | undefined,
): boolean {
  return canEditResourcePerm(session, area, createdBy)
}

export function canDeleteResource(
  session: Session | null,
  area: DashboardArea,
  createdBy: string | null | undefined,
): boolean {
  return canDeleteResourcePerm(session, area, createdBy)
}

export async function requireSuperAdmin() {
  const session = await requireAuth()

  if (session.role !== 'superAdmin') {
    redirect('/dashboard')
  }

  return session
}

export async function requirePermission(permission: DashboardPermission) {
  const session = await requireAuth()
  if (!hasPermission(session, permission)) {
    redirect('/dashboard')
  }
  return session
}

/** Open create/edit UI if user can create or edit-others in the area. */
export async function requireCreateOrEdit(area: DashboardArea) {
  const session = await requireAuth()
  if (!canCreateArea(session, area) && !canEditOthersArea(session, area)) {
    redirect('/dashboard')
  }
  return session
}

export async function requireTabAccess(area: DashboardArea) {
  return requirePermission(`tab:${area}`)
}
