import { requirePermission } from '@/lib/auth'
import {
  getDefaultPermissionsForRole,
  isDashboardRole,
  sanitizePermissions,
  type DashboardPermission,
  type DashboardRole,
} from '@/lib/dashboard-permissions'
import { Users, UserCheck, UserX } from 'lucide-react'
import CreateUserForm from './CreateUserForm'
import UserActions from './UserActions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'

type User = {
  uid: string
  email: string
  displayName: string
  emailVerified: boolean
  role: DashboardRole
  permissions: DashboardPermission[]
  createdAt: string
  lastSignIn: string | null
  disabled: boolean
}

async function getUsers(): Promise<User[]> {
  try {
    const { adminAuth } = await import('@/lib/firebase-admin')

    if (!adminAuth) {
      return []
    }

    const listUsersResult = await adminAuth.listUsers(1000)

    return listUsersResult.users.map((user) => {
      const role = (isDashboardRole(user.customClaims?.role)
        ? user.customClaims!.role
        : 'admin') as DashboardRole
      const version = user.customClaims?.permissionsVersion
      const sanitized = sanitizePermissions(user.customClaims?.permissions, {
        permissionsVersion: version,
      })
      const permissions =
        role === 'superAdmin'
          ? getDefaultPermissionsForRole('superAdmin')
          : sanitized.length > 0
            ? sanitized
            : getDefaultPermissionsForRole(role)

      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        emailVerified: user.emailVerified,
        role,
        permissions,
        createdAt: user.metadata.creationTime || '',
        lastSignIn: user.metadata.lastSignInTime || null,
        disabled: user.disabled,
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

function roleLabel(role: DashboardRole) {
  if (role === 'superAdmin') return 'Super Admin'
  if (role === 'moderator') return 'Moderator'
  return 'Admin'
}

export default async function MembersPage() {
  const session = await requirePermission('tab:members')
  const users = await getUsers()

  const superAdmins = users.filter((u) => u.role === 'superAdmin')
  const admins = users.filter((u) => u.role === 'admin')
  const moderators = users.filter((u) => u.role === 'moderator')
  const activeUsers = users.filter((u) => !u.disabled)

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 min-w-0">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            User Management
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Manage staff roles and per-area access
          </p>
        </div>
        <div className="shrink-0">
          <CreateUserForm />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 min-w-0">
        <Card className="shadow-sm border-slate-200 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Total</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {users.length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Super Admins</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-600 tabular-nums">
              {superAdmins.length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Admins</p>
            <p className="text-xl sm:text-2xl font-bold text-cyan-700 tabular-nums">
              {admins.length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Moderators</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-700 tabular-nums">
              {moderators.length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Active</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 tabular-nums">
              {activeUsers.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm overflow-hidden p-0 border-slate-200 min-w-0 w-full">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 bg-linear-to-r from-cyan-50 to-slate-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                All Users
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {users.length} {users.length === 1 ? 'user' : 'users'}
              </p>
            </div>
          </div>
        </div>
        {users.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <CreateUserForm />
          </div>
        ) : (
          <Table className="min-w-[640px] w-full">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {users.map((user) => (
                <TableRow key={user.uid} className="hover:bg-slate-50/80">
                  <TableCell className="min-w-0 max-w-[16rem]">
                    <div className="flex items-center min-w-0 gap-3">
                      <Avatar className="h-10 w-10 bg-cyan-100 shrink-0">
                        <AvatarFallback className="bg-cyan-100 text-cyan-700 font-semibold text-sm">
                          {user.displayName?.[0]?.toUpperCase() ||
                            user.email[0]?.toUpperCase() ||
                            'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {user.displayName || 'No name'}
                        </div>
                        <div className="text-sm text-slate-500 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        user.role === 'superAdmin'
                          ? 'bg-slate-100 text-slate-800'
                          : user.role === 'moderator'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-cyan-50 text-cyan-800'
                      }
                    >
                      {roleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        user.disabled
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }
                    >
                      {user.disabled ? (
                        <>
                          <UserX className="w-3 h-3" /> Disabled
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3" /> Active
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActions user={user} currentUserUid={session.uid} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
