'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { X, Mail, User, Lock, Save, Loader2 } from 'lucide-react'
import { editUserFormSchema, type EditUserFormValues } from '@/lib/validation/members'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

type AdminUser = {
  uid: string
  email: string
  displayName: string
  emailVerified: boolean
  role: 'superAdmin' | 'admin'
  disabled: boolean
}

interface EditUserFormProps {
  user: AdminUser
  onClose: () => void
}

export default function EditUserForm({ user, onClose }: EditUserFormProps) {
  const router = useRouter()
  const [apiError, setApiError] = useState('')

  const form = useForm<EditUserFormValues>({
    resolver: standardSchemaResolver(editUserFormSchema),
    defaultValues: {
      displayName: user.displayName,
      password: '',
      disabled: user.disabled,
    },
  })

  const loading = form.formState.isSubmitting

  const onSubmit = async (values: EditUserFormValues) => {
    setApiError('')
    try {
      const updateData: {
        displayName?: string
        password?: string
        disabled?: boolean
      } = {}

      if (values.displayName !== user.displayName) {
        updateData.displayName = values.displayName.trim()
      }
      if (values.password) {
        updateData.password = values.password
      }
      if (values.disabled !== user.disabled) {
        updateData.disabled = values.disabled
      }

      if (Object.keys(updateData).length === 0) {
        onClose()
        return
      }

      const response = await fetch(`/api/admin/users/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      onClose()
      router.refresh()
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to update user. Please try again.')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !loading) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col max-h-[95vh]"
      >
        <div className="bg-linear-to-r from-indigo-500 to-blue-600 px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-white">Edit User</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-indigo-100">Update user information</DialogDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={loading}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {apiError && (
                <Alert variant="destructive">
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  placeholder="user@example.com"
                  className="border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed opacity-100"
                />
                <p className="text-xs text-gray-500">Email address cannot be changed for security reasons.</p>
              </div>

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <User className="w-4 h-4 text-indigo-600" />
                      Display Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Display name"
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
                      <Lock className="w-4 h-4 text-indigo-600" />
                      New Password (leave blank to keep current)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Leave blank to keep current password"
                        disabled={loading}
                        className="border-2 border-gray-200 rounded-xl py-3 h-auto"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">Only enter a new password if you want to change it</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="disabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                        disabled={loading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Disable user account</FormLabel>
                      <p className="text-xs text-gray-500">Disabled users cannot sign in</p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <strong>Role:</strong>{' '}
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
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  User roles are managed via environment variables and cannot be changed here.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
