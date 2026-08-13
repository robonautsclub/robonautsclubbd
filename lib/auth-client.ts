/**
 * Client-side auth utilities
 * Helper functions for checking roles / permissions in client components
 */

import {
  allDashboardPermissions,
  canCreateArea as canCreateAreaPerm,
  canDeleteArea as canDeleteAreaPerm,
  canDeleteResource as canDeleteResourcePerm,
  canEditArea as canEditAreaPerm,
  canEditOthersArea as canEditOthersAreaPerm,
  canEditResource as canEditResourcePerm,
  canViewTab as canViewTabPerm,
  getDefaultAdminPermissions,
  isDashboardRole,
  sanitizePermissions,
  sessionHasPermission,
  type DashboardArea,
  type DashboardPermission,
  type DashboardRole,
  type PermissionSession,
} from '@/lib/dashboard-permissions'

export type ClientAuthInfo = {
  role: DashboardRole
  permissions: DashboardPermission[]
  uid?: string
}

function parseUserInfoCookie(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null
  try {
    const userInfoCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('user-info='))
      ?.split('=')[1]

    if (!userInfoCookie) return null
    return JSON.parse(decodeURIComponent(userInfoCookie)) as Record<
      string,
      unknown
    >
  } catch (error) {
    console.error('Error parsing user info cookie:', error)
    return null
  }
}

export function getClientAuthInfo(): ClientAuthInfo | null {
  const userInfo = parseUserInfoCookie()
  if (!userInfo) return null
  const role = isDashboardRole(userInfo.role) ? userInfo.role : 'admin'
  let permissions = sanitizePermissions(userInfo.permissions, {
    permissionsVersion: userInfo.permissionsVersion,
  })
  if (role === 'superAdmin') {
    permissions = allDashboardPermissions()
  } else if (permissions.length === 0 && role === 'admin') {
    permissions = getDefaultAdminPermissions()
  }
  return {
    role,
    permissions,
    uid: typeof userInfo.uid === 'string' ? userInfo.uid : undefined,
  }
}

export function getClientRole(): DashboardRole | null {
  return getClientAuthInfo()?.role ?? null
}

export function getClientPermissions(): DashboardPermission[] {
  return getClientAuthInfo()?.permissions ?? []
}

export function isClientSuperAdmin(): boolean {
  return getClientRole() === 'superAdmin'
}

export function isClientAdmin(): boolean {
  const role = getClientRole()
  return role === 'admin' || role === 'superAdmin' || role === 'moderator'
}

export function clientHasPermission(
  permission: DashboardPermission,
): boolean {
  const info = getClientAuthInfo()
  return sessionHasPermission(info as PermissionSession | null, permission)
}

export function clientCanViewTab(area: DashboardArea): boolean {
  const info = getClientAuthInfo()
  return canViewTabPerm(info as PermissionSession | null, area)
}

export function clientCanCreateArea(area: DashboardArea): boolean {
  const info = getClientAuthInfo()
  return canCreateAreaPerm(info as PermissionSession | null, area)
}

export function clientCanEditOthersArea(area: DashboardArea): boolean {
  const info = getClientAuthInfo()
  return canEditOthersAreaPerm(info as PermissionSession | null, area)
}

export function clientCanEditArea(area: DashboardArea): boolean {
  const info = getClientAuthInfo()
  return canEditAreaPerm(info as PermissionSession | null, area)
}

export function clientCanDeleteArea(area: DashboardArea): boolean {
  const info = getClientAuthInfo()
  return canDeleteAreaPerm(info as PermissionSession | null, area)
}

export function clientCanEditResource(
  area: DashboardArea,
  createdBy: string | null | undefined,
): boolean {
  const info = getClientAuthInfo()
  return canEditResourcePerm(info as PermissionSession | null, area, createdBy)
}

export function clientCanDeleteResource(
  area: DashboardArea,
  createdBy: string | null | undefined,
): boolean {
  const info = getClientAuthInfo()
  return canDeleteResourcePerm(
    info as PermissionSession | null,
    area,
    createdBy,
  )
}
