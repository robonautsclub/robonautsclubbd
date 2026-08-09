import { requireSuperAdmin } from '@/lib/auth'
import { Users, Shield, UserCheck, UserX } from 'lucide-react'
import CreateUserForm from './CreateUserForm'
import UserActions from './UserActions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic'

type User = {
  uid: string
  email: string
  displayName: string
  emailVerified: boolean
  role: 'superAdmin' | 'admin'
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

    // List all users using Admin SDK directly
    const listUsersResult = await adminAuth.listUsers(1000)
    
    return listUsersResult.users.map((user) => {
      const role = (user.customClaims?.role as 'superAdmin' | 'admin' | undefined) || 'admin'
      
      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        emailVerified: user.emailVerified,
        role,
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime,
        disabled: user.disabled,
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export default async function MembersPage() {
  const session = await requireSuperAdmin()
  
  // Fetch users from API
  const users = await getUsers()

  const superAdmins = users.filter((u) => u.role === 'superAdmin')
  const admins = users.filter((u) => u.role === 'admin')
  const activeUsers = users.filter((u) => !u.disabled)

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 min-w-0">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Manage users and their roles</p>
        </div>
        <div className="shrink-0">
          <CreateUserForm />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        <Card className="shadow-sm border-slate-200 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Users</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">{users.length}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Super Admins</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-600 tabular-nums">{superAdmins.length}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Admins</p>
                <p className="text-xl sm:text-2xl font-bold text-cyan-700 tabular-nums">{admins.length}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 min-w-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Active</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 tabular-nums">{activeUsers.length}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="shadow-sm overflow-hidden p-0 border-slate-200 min-w-0 w-full">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 bg-linear-to-r from-cyan-50 to-slate-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">All Users</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{users.length} {users.length === 1 ? 'user' : 'users'}</p>
            </div>
          </div>
        </div>
        {users.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">No users yet</h3>
            <p className="text-sm sm:text-base text-slate-600 mb-6">Create your first user to get started</p>
            <CreateUserForm />
          </div>
        ) : (
          <Table className="min-w-[720px] w-full">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  User
                </TableHead>
                <TableHead className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Role
                </TableHead>
                <TableHead className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                  Email Verified
                </TableHead>
                <TableHead className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                  Last Sign In
                </TableHead>
                <TableHead className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.2)]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {users.map((user) => (
                <TableRow key={user.uid} className="hover:bg-slate-50/80">
                  <TableCell className="px-4 sm:px-6 py-4 min-w-0 max-w-[16rem] sm:max-w-[20rem]">
                    <div className="flex items-center min-w-0">
                      <Avatar className="h-10 w-10 bg-cyan-100 shrink-0">
                        <AvatarFallback className="bg-cyan-100 text-cyan-700 font-semibold text-sm">
                          {user.displayName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3 sm:ml-4 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {user.displayName || 'No name'}
                        </div>
                        <div className="text-sm text-slate-500 truncate">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 sm:px-6 py-4">
                    <Badge
                      variant="secondary"
                      className={
                        user.role === 'superAdmin'
                          ? 'bg-slate-100 text-slate-800 hover:bg-slate-100'
                          : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-50'
                      }
                    >
                      {user.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 sm:px-6 py-4">
                    <Badge
                      variant="secondary"
                      className={
                        user.disabled
                          ? 'bg-red-100 text-red-800 hover:bg-red-100'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                      }
                    >
                      {user.disabled ? (
                        <>
                          <UserX className="w-3 h-3" />
                          Disabled
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3" />
                          Active
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 sm:px-6 py-4 hidden md:table-cell">
                    <Badge
                      variant="secondary"
                      className={
                        user.emailVerified
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                      }
                    >
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 sm:px-6 py-4 text-sm text-slate-500 whitespace-nowrap hidden lg:table-cell">
                    {user.lastSignIn
                      ? new Date(user.lastSignIn).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell className="px-4 sm:px-6 py-4 text-right text-sm font-medium sticky right-0 bg-white shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.2)]">
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
