'use client'

import { useMemo, useState, useTransition } from 'react'
import type { SchoolDirectoryEntry } from '@/lib/schoolDirectory'
import {
  createSchoolDirectoryEntry,
  seedEnglishMediumSchools,
  updateSchoolDirectoryEntry,
} from './actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Props = {
  schools: SchoolDirectoryEntry[]
}

type FormState = {
  name: string
  city: string
  isActive: boolean
}

const initialFormState: FormState = {
  name: '',
  city: '',
  isActive: true,
}

export default function SchoolDirectoryManager({ schools }: Props) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<FormState>(initialFormState)
  const [editId, setEditId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string>('')

  const sortedSchools = useMemo(
    () => [...schools].sort((a, b) => a.name.localeCompare(b.name)),
    [schools]
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback('')
    startTransition(async () => {
      const result = editId
        ? await updateSchoolDirectoryEntry(editId, form)
        : await createSchoolDirectoryEntry(form)

      if (!result.success) {
        setFeedback(result.error || 'Failed to save school.')
        return
      }
      setFeedback(editId ? 'School updated.' : 'School added.')
      setForm(initialFormState)
      setEditId(null)
    })
  }

  const startEdit = (school: SchoolDirectoryEntry) => {
    setFeedback('')
    setEditId(school.id)
    setForm({
      name: school.name,
      city: school.city || '',
      isActive: school.isActive,
    })
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
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="School name"
            className="px-3 py-2 border border-gray-300 rounded-lg"
            disabled={isPending}
            required
          />
          <input
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            placeholder="City (optional)"
            className="px-3 py-2 border border-gray-300 rounded-lg"
            disabled={isPending}
          />
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                disabled={isPending}
              />
              Active
            </label>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {editId ? 'Update' : 'Add'}
            </Button>
            {editId && (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setEditId(null)
                  setForm(initialFormState)
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
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
