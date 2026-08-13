'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { Plus, X, Mail, User, Lock, Sparkles } from 'lucide-react'
import { createUserFormSchema, type CreateUserFormValues } from '@/lib/validation/members'
import {
  getDefaultAdminPermissions,
  getDefaultModeratorPermissions,
  type DashboardPermission,
} from '@/lib/dashboard-permissions'
import StaffPermissionsEditor from './StaffPermissionsEditor'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export default function CreateUserForm() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [apiError, setApiError] = useState('')
  const [role, setRole] = useState<'admin' | 'moderator'>('admin')
  const [permissions, setPermissions] = useState<DashboardPermission[]>(
    getDefaultAdminPermissions(),
  )

  const form = useForm<CreateUserFormValues>({
    resolver: standardSchemaResolver(createUserFormSchema),
    defaultValues: { email: '', password: '', displayName: '' },
  })

  const loading = form.formState.isSubmitting

  const onRoleChange = (next: 'admin' | 'moderator') => {
    setRole(next)
    setPermissions(
      next === 'moderator'
        ? getDefaultModeratorPermissions()
        : getDefaultAdminPermissions(),
    )
  }

  const onSubmit = async (values: CreateUserFormValues) => {
    setApiError('')
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: values.email.trim(),
          password: values.password,
          displayName: values.displayName.trim() || '',
          role,
          permissions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      form.reset({ email: '', password: '', displayName: '' })
      setRole('admin')
      setPermissions(getDefaultAdminPermissions())
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      console.error('Error creating user:', err)
      setApiError(
        err instanceof Error ? err.message : 'Failed to create user. Please try again.',
      )
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (loading) return
    setIsOpen(open)
    if (!open) {
      setApiError('')
      form.reset({ email: '', password: '', displayName: '' })
      setRole('admin')
      setPermissions(getDefaultAdminPermissions())
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="bg-cyan-500 hover:bg-cyan-700 text-white shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg p-0 gap-0 overflow-hidden flex flex-col max-h-[95vh]"
      >
        <div className="bg-linear-to-r from-cyan-500 to-blue-600 px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-white">
                Create New User
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-cyan-100">
                Add staff with role and access permissions
              </DialogDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleDialogOpenChange(false)}
            disabled={loading}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="p-4 sm:p-6 space-y-4 sm:space-y-6"
            >
              {apiError && (
                <Alert variant="destructive">
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Mail className="w-4 h-4 text-cyan-700" />
                      Email Address <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        disabled={loading}
                        className="border-2 border-gray-200 rounded-xl py-3 h-auto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Lock className="w-4 h-4 text-cyan-700" />
                      Password <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Minimum 6 characters"
                        disabled={loading}
                        className="border-2 border-gray-200 rounded-xl py-3 h-auto"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Password must be at least 6 characters long
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <User className="w-4 h-4 text-cyan-700" />
                      Display Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Optional display name"
                        disabled={loading}
                        className="border-2 border-gray-200 rounded-xl py-3 h-auto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <StaffPermissionsEditor
                role={role}
                permissions={permissions}
                onRoleChange={onRoleChange}
                onPermissionsChange={setPermissions}
                disabled={loading}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                  onClick={() => handleDialogOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Creating…' : 'Create user'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
