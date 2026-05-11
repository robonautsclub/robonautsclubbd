'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { User, Mail, Save, Loader2, CheckCircle2, Lock } from 'lucide-react'
import type { Session } from '@/lib/auth'
import { profileFormSchema, type ProfileFormValues } from '@/lib/validation/profile'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface ProfileFormProps {
  session: Session
}

export default function ProfileForm({ session }: ProfileFormProps) {
  const router = useRouter()
  const [success, setSuccess] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: standardSchemaResolver(profileFormSchema),
    defaultValues: {
      displayName: session.name || '',
      password: '',
    },
  })

  const [apiError, setApiError] = useState('')

  const onSubmit = async (values: ProfileFormValues) => {
    setApiError('')
    setSuccess(false)
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName: values.displayName.trim(),
          password: values.password || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setSuccess(true)
      form.setValue('password', '')
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to update profile. Please try again.')
    }
  }

  const loading = form.formState.isSubmitting

  return (
    <Card className="shadow-sm overflow-hidden p-0">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-linear-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Profile Information</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Update your account details</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-6">
          {apiError && (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <AlertDescription className="text-green-800">
                Profile updated successfully! Refreshing...
              </AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User className="w-4 h-4 text-indigo-600" />
                  Display Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your display name"
                    disabled={loading}
                    className="border-2 border-gray-200 rounded-xl py-3 h-auto"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Mail className="w-4 h-4 text-indigo-600" />
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={session.email}
              disabled
              placeholder="your.email@example.com"
              className="border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed opacity-100"
            />
            <p className="text-xs text-gray-500">
              Email address cannot be changed. Contact a Super Admin if you need to update your email.
            </p>
          </div>

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
                    id="password"
                    type="password"
                    placeholder="Enter new password (minimum 6 characters)"
                    disabled={loading}
                    className="border-2 border-gray-200 rounded-xl py-3 h-auto"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-gray-500">
                  Only enter a new password if you want to change it. Leave blank to keep your current password.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2 flex items-center gap-2">
              <strong>Role:</strong>{' '}
              <Badge
                variant="secondary"
                className={
                  session.role === 'superAdmin'
                    ? 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                }
              >
                {session.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
              </Badge>
            </p>
            <p className="text-xs text-gray-500">Your role is managed by the system and cannot be changed here.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
                  Update Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}
