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
  const disabledUsers = users.filter((u) => u.disabled)

  return (
    <div className="max-w-7xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage users and their roles</p>
        </div>
        <CreateUserForm />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Super Admins</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{superAdmins.length}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Admins</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{admins.length}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Active</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{activeUsers.length}</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="shadow-sm overflow-hidden p-0">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-linear-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">All Users</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{users.length} {users.length === 1 ? 'user' : 'users'}</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {users.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No users yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">Create your first user to get started</p>
              <CreateUserForm />
            </div>
          ) : (
            <Table className="min-w-[800px]">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    User
                  </TableHead>
                  <TableHead className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Role
                  </TableHead>
                  <TableHead className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Email Verified
                  </TableHead>
                  <TableHead className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Last Sign In
                  </TableHead>
                  <TableHead className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {users.map((user) => (
                  <TableRow key={user.uid} className="hover:bg-gray-50">
                    <TableCell className="px-4 sm:px-6 py-4">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 bg-indigo-100">
                          <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold text-sm">
                            {user.displayName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={
                          user.role === 'superAdmin'
                            ? 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
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
                            : 'bg-green-100 text-green-800 hover:bg-green-100'
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
                    <TableCell className="px-4 sm:px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={
                          user.emailVerified
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                        }
                      >
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                      {user.lastSignIn
                        ? new Date(user.lastSignIn).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="px-4 sm:px-6 py-4 text-right text-sm font-medium">
                      <UserActions user={user} currentUserUid={session.uid} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}
