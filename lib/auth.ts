import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { verifySessionToken } from '@/lib/auth/jwt'
import { SESSION_DURATION_SECONDS } from './session'
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
  if (role === 'admin') return getDefaultAdminPermissions()
  return getDefaultPermissionsForRole(role)
}

/**
 * Session from signed HttpOnly JWT cookie (D1-backed dashboard auth).
 * No Firebase Auth on the Cloudflare Worker.
 */
export const getServerSession = cache(async (): Promise<Session | null> => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return null

    const claims = await verifySessionToken(token)
    if (!claims) return null

    const role = normalizeRole(claims.role) ?? 'admin'
    return {
      uid: claims.uid,
      email: claims.email,
      name: claims.name || claims.email || 'Admin',
      emailVerified: claims.emailVerified,
      role,
      permissions: resolvePermissions(role, claims.permissions),
    }
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
})

export async function requireAuth() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  return session
}

export function setAuthToken(token: string) {
  document.cookie = `auth-token=${token}; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`
}

export function clearAuthToken() {
  document.cookie = 'auth-token=; path=/; max-age=0'
}

export function isSuperAdmin(session: Session | null): boolean {
  return session?.role === 'superAdmin'
}

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
  if (session.role !== 'superAdmin') redirect('/dashboard')
  return session
}

export async function requirePermission(permission: DashboardPermission) {
  const session = await requireAuth()
  if (!hasPermission(session, permission)) redirect('/dashboard')
  return session
}

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
