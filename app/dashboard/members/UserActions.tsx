'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'
import EditUserForm from './EditUserForm'
import DeleteConfirmation from './DeleteConfirmation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { DashboardPermission, DashboardRole } from '@/lib/dashboard-permissions'

type User = {
  uid: string
  email: string
  displayName: string
  emailVerified: boolean
  role: DashboardRole
  permissions?: DashboardPermission[]
  disabled: boolean
}

interface UserActionsProps {
  user: User
  currentUserUid: string
}

export default function UserActions({ user, currentUserUid }: UserActionsProps) {
  const router = useRouter()
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Super Admin accounts are protected: cannot be edited/deleted from user management.
  const isProtectedSuperAdmin = user.role === 'superAdmin'
  const isSelf = user.uid === currentUserUid
  const disableActions = isProtectedSuperAdmin

  const handleDelete = async () => {
    if (disableActions) {
      alert('Super Admin accounts cannot be deleted.')
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/users/${user.uid}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }

      setShowDeleteConfirm(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="inline-flex items-center justify-end gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowEditForm(true)}
          disabled={disableActions}
          className={cn(
            'h-8 px-2 sm:px-3',
            disableActions
              ? 'text-slate-400'
              : 'text-cyan-700 hover:text-cyan-800 hover:bg-cyan-50'
          )}
          title={
            disableActions
              ? isSelf
                ? 'Use Profile page to edit your account'
                : 'Super Admin accounts cannot be edited'
              : 'Edit user'
          }
        >
          <Edit className="w-4 h-4" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={disableActions}
          className={cn(
            'h-8 px-2 sm:px-3',
            disableActions
              ? 'text-slate-400'
              : 'text-red-600 hover:text-red-700 hover:bg-red-50'
          )}
          title={disableActions ? 'Super Admin accounts cannot be deleted' : 'Delete user'}
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>

      {showEditForm && (
        <EditUserForm
          user={user}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmation
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user account."
          itemName={`${user.displayName || 'User'} (${user.email})`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}
