'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { SchoolDirectoryEntry } from '@/lib/schoolDirectory'
import {
  confirmPendingSchool,
  createSchoolDirectoryEntry,
  rejectPendingSchool,
  seedEnglishMediumSchools,
  updateSchoolDirectoryEntry,
} from './actions'
import { schoolDirectoryFormSchema, type SchoolDirectoryFormValues } from '@/lib/validation/schools'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

type Props = {
  schools: SchoolDirectoryEntry[]
}

type Tab = 'directory' | 'pending'

const emptyDefaults: SchoolDirectoryFormValues = {
  name: '',
  city: '',
  isActive: true,
}

export default function SchoolDirectoryManager({ schools }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editId, setEditId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string>('')
  const [tab, setTab] = useState<Tab>('directory')

  const form = useForm<SchoolDirectoryFormValues>({
    resolver: standardSchemaResolver(schoolDirectoryFormSchema),
    defaultValues: emptyDefaults,
  })

  const pendingSchools = useMemo(
    () =>
      schools
        .filter((school) => school.status === 'pending')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [schools],
  )

  const directorySchools = useMemo(
    () =>
      schools
        .filter((school) => school.status !== 'pending')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [schools],
  )

  const onSubmit = (values: SchoolDirectoryFormValues) => {
    setFeedback('')
    startTransition(async () => {
      const result = editId
        ? await updateSchoolDirectoryEntry(editId, values)
        : await createSchoolDirectoryEntry(values)

      if (!result.success) {
        setFeedback(result.error || 'Failed to save school.')
        return
      }
      setFeedback(editId ? 'School updated.' : 'School added.')
      form.reset(emptyDefaults)
      setEditId(null)
      router.refresh()
    })
  }

  const startEdit = (school: SchoolDirectoryEntry) => {
    setFeedback('')
    setEditId(school.id)
    setTab('directory')
    form.reset({
      name: school.name,
      city: school.city || '',
      isActive: school.isActive,
    })
  }

  const handleCancel = () => {
    setEditId(null)
    form.reset(emptyDefaults)
  }

  const handleSeed = () => {
    setFeedback('')
    startTransition(async () => {
      const result = await seedEnglishMediumSchools()
      setFeedback(result.message)
      router.refresh()
    })
  }

  const handleConfirm = (id: string) => {
    setFeedback('')
    startTransition(async () => {
      const result = await confirmPendingSchool(id)
      setFeedback(result.success ? 'School confirmed and added to directory.' : result.error || 'Failed to confirm.')
      if (result.success) router.refresh()
    })
  }

  const handleReject = (id: string) => {
    setFeedback('')
    startTransition(async () => {
      const result = await rejectPendingSchool(id)
      setFeedback(result.success ? 'Pending school rejected.' : result.error || 'Failed to reject.')
      if (result.success) router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={tab === 'directory' ? 'default' : 'outline'}
          onClick={() => setTab('directory')}
          className={tab === 'directory' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
        >
          Directory ({directorySchools.length})
        </Button>
        <Button
          type="button"
          variant={tab === 'pending' ? 'default' : 'outline'}
          onClick={() => setTab('pending')}
          className={tab === 'pending' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
        >
          Pending ({pendingSchools.length})
        </Button>
      </div>

      {tab === 'directory' ? (
        <>
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{editId ? 'Edit School' : 'Add School'}</h3>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSeed}
                disabled={isPending}
                className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              >
                Seed Major Schools
              </Button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">School name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="School name"
                          disabled={isPending}
                          autoComplete="organization"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">City</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="City (optional)"
                          disabled={isPending}
                          autoComplete="address-level2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(v) => field.onChange(v === true)}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal text-gray-700">Active</FormLabel>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {editId ? 'Update' : 'Add'}
                  </Button>
                  {editId && (
                    <Button type="button" variant="outline" disabled={isPending} onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
            {feedback && <p className="mt-3 text-sm text-gray-700">{feedback}</p>}
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                School Directory ({directorySchools.length})
              </h3>
            </div>
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">School</TableHead>
                  <TableHead className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">City</TableHead>
                  <TableHead className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Status</TableHead>
                  <TableHead className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directorySchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="px-4 py-2 text-sm text-gray-900">{school.name}</TableCell>
                    <TableCell className="px-4 py-2 text-sm text-gray-600">{school.city || '-'}</TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge
                        variant="secondary"
                        className={
                          school.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                        }
                      >
                        {school.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(school)}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Schools ({pendingSchools.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Custom school names from Robofest registrations awaiting confirmation.
            </p>
            {feedback && tab === 'pending' ? (
              <p className="mt-2 text-sm text-gray-700">{feedback}</p>
            ) : null}
          </div>
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">School</TableHead>
                <TableHead className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Requested by</TableHead>
                <TableHead className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Source</TableHead>
                <TableHead className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSchools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    No pending schools.
                  </TableCell>
                </TableRow>
              ) : (
                pendingSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="px-4 py-2 text-sm text-gray-900">{school.name}</TableCell>
                    <TableCell className="px-4 py-2 text-sm text-gray-600">
                      <div>{school.requestedByName || '—'}</div>
                      <div className="text-xs text-gray-500">{school.requestedByEmail || ''}</div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm text-gray-600">
                      {school.source || '—'}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleConfirm(school.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Confirm
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleReject(school.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
