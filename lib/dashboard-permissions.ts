/**
 * Client-safe dashboard roles + per-area permissions.
 * Keep free of firebase-admin / Node-only imports.
 *
 * Per area:
 * - tab:X     → view the tab
 * - create:X  → create new items + edit items you created
 * - edit:X    → edit items created by someone else
 * - delete:X  → delete (own if owner; others only with edit:X as well)
 *
 * Global:
 * - payments.view
 * - mail.send
 * - exports.csv / exports.excel / exports.pdf
 */

export const DASHBOARD_ROLES = ['superAdmin', 'admin', 'moderator'] as const
export type DashboardRole = (typeof DASHBOARD_ROLES)[number]

/** Bump when permission semantics change; used to migrate stored claims. */
export const PERMISSIONS_VERSION = 5

export const DASHBOARD_AREAS = [
  'events',
  'courses',
  'news',
  'gallery',
  'schools',
  'partners',
  'robofest',
  'certificates',
  'members',
] as const

export type DashboardArea = (typeof DASHBOARD_AREAS)[number]

export const DASHBOARD_AREA_LABELS: Record<DashboardArea, string> = {
  events: 'Events',
  courses: 'Courses',
  news: 'News',
  gallery: 'Gallery',
  schools: 'Schools',
  partners: 'Partners & Schools',
  robofest: 'Robofest',
  certificates: 'Certificates',
  members: 'Members',
}

/** Areas shown in the permission matrix (Members stays Super Admin by default). */
export const DASHBOARD_STAFF_AREAS = DASHBOARD_AREAS.filter(
  (a) => a !== 'members',
) as Exclude<DashboardArea, 'members'>[]

export type DashboardPermission =
  | `tab:${DashboardArea}`
  | `create:${DashboardArea}`
  | `edit:${DashboardArea}`
  | `delete:${DashboardArea}`
  | 'payments.view'
  | 'mail.send'
  | 'exports.csv'
  | 'exports.excel'
  | 'exports.pdf'

export const GLOBAL_PERMISSIONS = [
  'payments.view',
  'mail.send',
  'exports.csv',
  'exports.excel',
  'exports.pdf',
] as const satisfies readonly DashboardPermission[]

export const GLOBAL_PERMISSION_LABELS: Record<
  (typeof GLOBAL_PERMISSIONS)[number],
  string
> = {
  'payments.view': 'See paid amounts (Events & Robofest)',
  'mail.send': 'Send emails from the dashboard',
  'exports.csv': 'Download CSV exports',
  'exports.excel': 'Download Excel exports',
  'exports.pdf': 'Download PDFs (confirmations, certificates, sample)',
}

export function tabPermission(area: DashboardArea): DashboardPermission {
  return `tab:${area}`
}

export function createPermission(area: DashboardArea): DashboardPermission {
  return `create:${area}`
}

export function editPermission(area: DashboardArea): DashboardPermission {
  return `edit:${area}`
}

export function deletePermission(area: DashboardArea): DashboardPermission {
  return `delete:${area}`
}

export function isDashboardRole(value: unknown): value is DashboardRole {
  return (
    typeof value === 'string' &&
    (DASHBOARD_ROLES as readonly string[]).includes(value)
  )
}

export function isDashboardPermission(
  value: unknown,
): value is DashboardPermission {
  if (typeof value !== 'string') return false
  if (
    value === 'payments.view' ||
    value === 'mail.send' ||
    value === 'exports.csv' ||
    value === 'exports.excel' ||
    value === 'exports.pdf'
  ) {
    return true
  }
  const [kind, area] = value.split(':')
  if (
    (kind === 'tab' ||
      kind === 'create' ||
      kind === 'edit' ||
      kind === 'delete') &&
    (DASHBOARD_AREAS as readonly string[]).includes(area)
  ) {
    return true
  }
  return false
}

/**
 * v1 used edit:X for “create + edit own”. Convert those to create:X.
 */
export function migrateV1EditToCreate(
  permissions: DashboardPermission[],
): DashboardPermission[] {
  const set = new Set(permissions)
  for (const area of DASHBOARD_AREAS) {
    const edit = editPermission(area)
    const create = createPermission(area)
    if (set.has(edit) && !set.has(create)) {
      set.add(create)
      set.delete(edit)
    }
  }
  return Array.from(set)
}

/** Legacy exports.download → csv + excel + pdf. */
export function migrateLegacyExportsDownload(
  raw: string[],
): DashboardPermission[] {
  const set = new Set<string>(raw)
  if (set.has('exports.download')) {
    set.delete('exports.download')
    set.add('exports.csv')
    set.add('exports.excel')
    set.add('exports.pdf')
  }
  return Array.from(set).filter(isDashboardPermission)
}

export function sanitizePermissions(
  input: unknown,
  options?: { permissionsVersion?: unknown },
): DashboardPermission[] {
  if (!Array.isArray(input)) return []
  const raw: string[] = []
  const seen = new Set<string>()
  for (const item of input) {
    if (typeof item !== 'string' || seen.has(item)) continue
    seen.add(item)
    raw.push(item)
  }

  const version =
    typeof options?.permissionsVersion === 'number'
      ? options.permissionsVersion
      : 0

  // Always expand legacy download flag when present
  let perms = migrateLegacyExportsDownload(raw)

  if (version < 2) {
    perms = migrateV1EditToCreate(perms)
  }

  // v4: mail.send is a new global. Grant it to staff who already had other
  // default globals so existing admins keep email access without reconfigure.
  if (version < 4) {
    const set = new Set(perms)
    const hadPriorGlobals =
      set.has('payments.view') ||
      set.has('exports.csv') ||
      set.has('exports.excel') ||
      set.has('exports.pdf')
    if (hadPriorGlobals) set.add('mail.send')
    perms = Array.from(set).filter(isDashboardPermission)
  }
  return perms
}

/** Ensure create/edit/delete also grant view for that area. */
export function normalizePermissionGrants(
  permissions: DashboardPermission[],
): DashboardPermission[] {
  const set = new Set(permissions)
  for (const area of DASHBOARD_AREAS) {
    if (
      set.has(createPermission(area)) ||
      set.has(editPermission(area)) ||
      set.has(deletePermission(area))
    ) {
      set.add(tabPermission(area))
    }
  }
  return Array.from(set)
}

export function allDashboardPermissions(): DashboardPermission[] {
  const perms: DashboardPermission[] = [...GLOBAL_PERMISSIONS]
  for (const area of DASHBOARD_AREAS) {
    perms.push(
      tabPermission(area),
      createPermission(area),
      editPermission(area),
      deletePermission(area),
    )
  }
  return perms
}

/**
 * Default admin: view/create/delete own in staff areas + money + all exports.
 * No edit-others (matches previous owner-only edit behavior).
 */
export function getDefaultAdminPermissions(): DashboardPermission[] {
  const perms: DashboardPermission[] = [...GLOBAL_PERMISSIONS]
  for (const area of DASHBOARD_STAFF_AREAS) {
    perms.push(
      tabPermission(area),
      createPermission(area),
      deletePermission(area),
    )
  }
  return perms
}

/** Moderator starts with no grants until Super Admin configures. */
export function getDefaultModeratorPermissions(): DashboardPermission[] {
  return []
}

export function getDefaultPermissionsForRole(
  role: DashboardRole,
): DashboardPermission[] {
  if (role === 'superAdmin') return allDashboardPermissions()
  if (role === 'moderator') return getDefaultModeratorPermissions()
  return getDefaultAdminPermissions()
}

export type PermissionSession = {
  role: DashboardRole
  permissions?: DashboardPermission[] | null
  uid?: string
}

export function sessionHasPermission(
  session: PermissionSession | null | undefined,
  permission: DashboardPermission,
): boolean {
  if (!session) return false
  if (session.role === 'superAdmin') return true
  const perms = session.permissions || []
  return perms.includes(permission)
}

export function canViewTab(
  session: PermissionSession | null | undefined,
  area: DashboardArea,
): boolean {
  return sessionHasPermission(session, tabPermission(area))
}

/** Create new items in this area. */
export function canCreateArea(
  session: PermissionSession | null | undefined,
  area: DashboardArea,
): boolean {
  return sessionHasPermission(session, createPermission(area))
}

/**
 * Edit items created by someone else (or ownerless shared records).
 */
export function canEditOthersArea(
  session: PermissionSession | null | undefined,
  area: DashboardArea,
): boolean {
  return sessionHasPermission(session, editPermission(area))
}

/**
 * True if the user can edit some content in the area
 * (own via create, or others via edit).
 */
export function canEditArea(
  session: PermissionSession | null | undefined,
  area: DashboardArea,
): boolean {
  return canCreateArea(session, area) || canEditOthersArea(session, area)
}

export function canDeleteArea(
  session: PermissionSession | null | undefined,
  area: DashboardArea,
): boolean {
  return sessionHasPermission(session, deletePermission(area))
}

/**
 * Whether the user may update this specific resource.
 * - Super Admin: yes
 * - Owner: needs create:area
 * - Not owner / no owner: needs edit:area
 */
export function canEditResource(
  session: PermissionSession | null | undefined,
  area: DashboardArea,
  createdBy: string | null | undefined,
): boolean {
  if (!session) return false
  if (session.role === 'superAdmin') return true
  const isOwner = Boolean(
    createdBy && session.uid && createdBy === session.uid,
  )
  if (isOwner) return canCreateArea(session, area)
  return canEditOthersArea(session, area)
}

/**
 * Whether the user may delete this specific resource.
 * - Owner: needs delete:area
 * - Not owner: needs delete:area + edit:area
 */
export function canDeleteResource(
  session: PermissionSession | null | undefined,
  area: DashboardArea,
  createdBy: string | null | undefined,
): boolean {
  if (!session) return false
  if (session.role === 'superAdmin') return true
  if (!canDeleteArea(session, area)) return false
  const isOwner = Boolean(
    createdBy && session.uid && createdBy === session.uid,
  )
  if (isOwner) return true
  return canEditOthersArea(session, area)
}

export function canExportCsv(
  session: PermissionSession | null | undefined,
): boolean {
  return sessionHasPermission(session, 'exports.csv')
}

export function canExportExcel(
  session: PermissionSession | null | undefined,
): boolean {
  return sessionHasPermission(session, 'exports.excel')
}

export function canExportPdf(
  session: PermissionSession | null | undefined,
): boolean {
  return sessionHasPermission(session, 'exports.pdf')
}

export function canSendMail(
  session: PermissionSession | null | undefined,
): boolean {
  return sessionHasPermission(session, 'mail.send')
}

export function summarizePermissions(
  permissions: DashboardPermission[],
): string {
  const parts: string[] = []
  for (const area of DASHBOARD_STAFF_AREAS) {
    const view = permissions.includes(tabPermission(area))
    const create = permissions.includes(createPermission(area))
    const edit = permissions.includes(editPermission(area))
    const del = permissions.includes(deletePermission(area))
    if (!view && !create && !edit && !del) continue
    const bits: string[] = []
    if (view) bits.push('view')
    if (create) bits.push('create')
    if (edit) bits.push('edit')
    if (del) bits.push('delete')
    parts.push(`${DASHBOARD_AREA_LABELS[area]} ${bits.join('+')}`)
  }
  if (permissions.includes('payments.view')) parts.push('Money')
  if (permissions.includes('mail.send')) parts.push('Mail')
  const downloads: string[] = []
  if (permissions.includes('exports.csv')) downloads.push('CSV')
  if (permissions.includes('exports.excel')) downloads.push('Excel')
  if (permissions.includes('exports.pdf')) downloads.push('PDF')
  if (downloads.length) parts.push(`Downloads ${downloads.join('+')}`)
  if (permissions.includes(tabPermission('members'))) parts.push('Members')
  return parts.length ? parts.join(' · ') : 'No access configured'
}
