'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { RobofestCampusAmbassador } from '@/lib/robofest-campus-ambassadors'
import {
  campusAmbassadorFormSchema,
  type CampusAmbassadorFormValues,
} from '@/lib/validation/campusAmbassadors'
import {
  createRobofestCampusAmbassador,
  deleteRobofestCampusAmbassador,
  seedRobofestCampusAmbassadors,
  updateRobofestCampusAmbassador,
} from './actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  ambassadors: RobofestCampusAmbassador[]
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

const emptyDefaults: CampusAmbassadorFormValues = {
  name: '',
  school: '',
  phone: '',
  email: '',
  isActive: true,
}

export default function CampusAmbassadorsManager({
  ambassadors,
  canCreate = false,
  canEdit = false,
  canDelete = false,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editId, setEditId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [search, setSearch] = useState('')

  const form = useForm<CampusAmbassadorFormValues>({
    resolver: standardSchemaResolver(campusAmbassadorFormSchema),
    defaultValues: emptyDefaults,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ambassadors
    return ambassadors.filter((a) => {
      const haystack = [
        a.id,
        a.name,
        a.school,
        a.phone || '',
        a.email || '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [ambassadors, search])

  const onSubmit = (values: CampusAmbassadorFormValues) => {
    setFeedback('')
    startTransition(async () => {
      const result = editId
        ? await updateRobofestCampusAmbassador(editId, values)
        : await createRobofestCampusAmbassador(values)

      if (!result.success) {
        setFeedback(result.error || 'Failed to save ambassador.')
        return
      }
      setFeedback(editId ? 'Ambassador updated.' : 'Ambassador added.')
      form.reset(emptyDefaults)
      setEditId(null)
      router.refresh()
    })
  }

  const startEdit = (ambassador: RobofestCampusAmbassador) => {
    setFeedback('')
    setEditId(ambassador.id)
    form.reset({
      name: ambassador.name,
      school: ambassador.school,
      phone: ambassador.phone || '',
      email: ambassador.email || '',
      isActive: ambassador.isActive,
    })
  }

  const handleCancel = () => {
    setEditId(null)
    form.reset(emptyDefaults)
  }

  const handleSeed = () => {
    setFeedback('')
    startTransition(async () => {
      const result = await seedRobofestCampusAmbassadors()
      setFeedback(result.message)
      router.refresh()
    })
  }

  const handleToggleActive = (ambassador: RobofestCampusAmbassador) => {
    setFeedback('')
    startTransition(async () => {
      const result = await updateRobofestCampusAmbassador(ambassador.id, {
        name: ambassador.name,
        school: ambassador.school,
        phone: ambassador.phone,
        email: ambassador.email,
        isActive: !ambassador.isActive,
      })
      setFeedback(
        result.success
          ? ambassador.isActive
            ? 'Ambassador marked inactive.'
            : 'Ambassador marked active.'
          : result.error || 'Failed to update status.',
      )
      if (result.success) router.refresh()
    })
  }

  const handleDelete = (ambassador: RobofestCampusAmbassador) => {
    if (
      !confirm(
        `Delete ${ambassador.name}? This cannot be undone. Prefer marking inactive if they already appear on registrations.`,
      )
    ) {
      return
    }
    setFeedback('')
    startTransition(async () => {
      const result = await deleteRobofestCampusAmbassador(ambassador.id)
      setFeedback(
        result.success
          ? 'Ambassador deleted.'
          : result.error || 'Failed to delete.',
      )
      if (result.success) {
        if (editId === ambassador.id) handleCancel()
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {canCreate || canEdit ? (
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {editId ? `Edit Ambassador (${editId})` : 'Add Ambassador'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inactive ambassadors are hidden from public registration forms.
            </p>
          </div>
          {canCreate ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleSeed}
            disabled={isPending}
            className="bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
          >
            Seed / Sync Roster
          </Button>
          ) : null}
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Full name"
                      disabled={isPending}
                      autoComplete="name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">School</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="School / college"
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Phone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Phone (admin only)"
                      disabled={isPending}
                      autoComplete="tel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Email (admin only)"
                      disabled={isPending}
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-1">
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
                    <FormLabel className="text-sm font-normal text-gray-700">
                      Active
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isPending}
                className="bg-cyan-700 hover:bg-cyan-800 text-white"
              >
                {editId ? 'Update' : 'Add'}
              </Button>
              {editId ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Form>
        {feedback ? (
          <p className="mt-3 text-sm text-gray-700">{feedback}</p>
        ) : null}
      </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Campus Ambassadors ({filtered.length}
            {search.trim() ? ` of ${ambassadors.length}` : ''})
          </h3>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, school, phone…"
            className="sm:max-w-xs"
          />
        </div>
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase w-14">
                ID
              </TableHead>
              <TableHead className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                Name
              </TableHead>
              <TableHead className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                School
              </TableHead>
              <TableHead className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">
                Contact
              </TableHead>
              <TableHead className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                Status
              </TableHead>
              <TableHead className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No ambassadors found. Use Seed / Sync Roster to load the
                  default list.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ambassador) => (
                <TableRow key={ambassador.id}>
                  <TableCell className="px-4 py-2 text-sm font-mono text-slate-600">
                    {ambassador.id}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-sm text-slate-900">
                    {ambassador.name}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-sm text-slate-600">
                    {ambassador.school}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-sm text-slate-600 hidden lg:table-cell">
                    <div>{ambassador.phone || '—'}</div>
                    <div className="text-xs text-slate-500">
                      {ambassador.email || ''}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge
                      variant="secondary"
                      className={
                        ambassador.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                      }
                    >
                      {ambassador.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right space-x-1 whitespace-nowrap">
                    {canEdit ? (
                      <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => startEdit(ambassador)}
                      className="text-cyan-700 hover:text-cyan-800"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleToggleActive(ambassador)}
                      className="text-slate-700"
                    >
                      {ambassador.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                      </>
                    ) : null}
                    {canDelete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDelete(ambassador)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
