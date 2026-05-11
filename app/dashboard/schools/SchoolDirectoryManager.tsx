'use client'

import { useMemo, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { SchoolDirectoryEntry } from '@/lib/schoolDirectory'
import {
  createSchoolDirectoryEntry,
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

const emptyDefaults: SchoolDirectoryFormValues = {
  name: '',
  city: '',
  isActive: true,
}

export default function SchoolDirectoryManager({ schools }: Props) {
  const [isPending, startTransition] = useTransition()
  const [editId, setEditId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string>('')

  const form = useForm<SchoolDirectoryFormValues>({
    resolver: standardSchemaResolver(schoolDirectoryFormSchema),
    defaultValues: emptyDefaults,
  })

  const sortedSchools = useMemo(
    () => [...schools].sort((a, b) => a.name.localeCompare(b.name)),
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
    })
  }

  const startEdit = (school: SchoolDirectoryEntry) => {
    setFeedback('')
    setEditId(school.id)
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
    })
  }

  return (
    <div className="space-y-6">
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
          <h3 className="text-lg font-semibold text-gray-900">School Directory ({sortedSchools.length})</h3>
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
            {sortedSchools.map((school) => (
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
    </div>
  )
}
