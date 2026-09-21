import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'
import {
  getDefaultPermissionsForRole,
  isDashboardRole,
  sanitizePermissions,
  type DashboardPermission,
  type DashboardRole,
} from '@/lib/dashboard-permissions'

export type DbUser = {
  id: string
  email: string
  passwordHash: string
  name: string
  role: DashboardRole
  permissions: DashboardPermission[]
  permissionsVersion: number
  disabled: boolean
  emailVerified: boolean
}

function mapUser(row: typeof users.$inferSelect): DbUser {
  const role = isDashboardRole(row.role) ? row.role : 'admin'
  const permissions = sanitizePermissions(JSON.parse(row.permissions || '[]'), {
    permissionsVersion: row.permissionsVersion,
  })
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    name: row.name || row.email,
    role,
    permissions:
      permissions.length > 0
        ? permissions
        : getDefaultPermissionsForRole(role),
    permissionsVersion: row.permissionsVersion,
    disabled: Boolean(row.disabled),
    emailVerified: Boolean(row.emailVerified),
  }
}

export function resolveRoleForEmail(
  email: string,
  storedRole: DashboardRole,
): DashboardRole {
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (superAdminEmails.includes(email.toLowerCase())) return 'superAdmin'
  if (storedRole === 'superAdmin') return 'admin'
  return storedRole
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const db = await getDb()
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1)
  return rows[0] ? mapUser(rows[0]) : null
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const db = await getDb()
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return rows[0] ? mapUser(rows[0]) : null
}

export async function listUsers(): Promise<Omit<DbUser, 'passwordHash'>[]> {
  const db = await getDb()
  const rows = await db.select().from(users)
  return rows.map((r) => {
    const u = mapUser(r)
    const { passwordHash: _, ...rest } = u
    return rest
  })
}

export async function createUser(input: {
  email: string
  passwordHash: string
  name: string
  role: DashboardRole
  permissions: DashboardPermission[]
  permissionsVersion: number
}): Promise<DbUser> {
  const db = await getDb()
  const id = crypto.randomUUID().replace(/-/g, '')
  const now = new Date().toISOString()
  await db.insert(users).values({
    id,
    email: input.email.trim().toLowerCase(),
    passwordHash: input.passwordHash,
    name: input.name,
    role: input.role,
    permissions: JSON.stringify(input.permissions),
    permissionsVersion: input.permissionsVersion,
    disabled: false,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  })
  const created = await findUserById(id)
  if (!created) throw new Error('Failed to create user')
  return created
}

export async function updateUser(
  id: string,
  patch: Partial<{
    name: string
    passwordHash: string
    role: DashboardRole
    permissions: DashboardPermission[]
    permissionsVersion: number
    disabled: boolean
    emailVerified: boolean
  }>,
): Promise<void> {
  const db = await getDb()
  const values: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  }
  if (patch.name !== undefined) values.name = patch.name
  if (patch.passwordHash !== undefined) values.passwordHash = patch.passwordHash
  if (patch.role !== undefined) values.role = patch.role
  if (patch.permissions !== undefined)
    values.permissions = JSON.stringify(patch.permissions)
  if (patch.permissionsVersion !== undefined)
    values.permissionsVersion = patch.permissionsVersion
  if (patch.disabled !== undefined) values.disabled = patch.disabled
  if (patch.emailVerified !== undefined) values.emailVerified = patch.emailVerified
  await db.update(users).set(values).where(eq(users.id, id))
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(users).where(eq(users.id, id))
}
