'use client'

import { useMemo, useState, useTransition } from 'react'
import type { SchoolDirectoryEntry } from '@/lib/schoolDirectory'
import {
  createSchoolDirectoryEntry,
  seedEnglishMediumSchools,
  updateSchoolDirectoryEntry,
} from './actions'

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
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{editId ? 'Edit School' : 'Add School'}</h3>
          <button
            type="button"
            onClick={handleSeed}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 disabled:opacity-60"
          >
            Seed Major Schools
          </button>
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
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {editId ? 'Update' : 'Add'}
            </button>
            {editId && (
              <button
                type="button"
                disabled={isPending}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                onClick={() => {
                  setEditId(null)
                  setForm(initialFormState)
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        {feedback && <p className="mt-3 text-sm text-gray-700">{feedback}</p>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">School Directory ({sortedSchools.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">School</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">City</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedSchools.map((school) => (
                <tr key={school.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">{school.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{school.city || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{school.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(school)}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
