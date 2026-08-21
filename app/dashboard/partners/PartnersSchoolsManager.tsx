'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import type { HomepageOrg, HomepageOrgKind } from '@/types/homepage-org'
import {
  createHomepageOrg,
  deleteHomepageOrg,
  reorderHomepageOrg,
  updateHomepageOrg,
} from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Props = {
  orgs: HomepageOrg[]
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

type Tab = HomepageOrgKind

const emptyForm = {
  name: '',
  logoUrl: '',
  isActive: true,
}

export default function PartnersSchoolsManager({
  orgs,
  canCreate = false,
  canEdit = false,
  canDelete = false,
}: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState<Tab>('partner')
  const [editId, setEditId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(
    () => orgs.filter((org) => org.kind === tab),
    [orgs, tab],
  )

  const resetForm = () => {
    setEditId(null)
    setForm(emptyForm)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startEdit = (org: HomepageOrg) => {
    setFeedback('')
    setTab(org.kind)
    setEditId(org.id)
    setForm({
      name: org.name,
      logoUrl: org.logoUrl || '',
      isActive: org.isActive,
    })
  }

  const handleUpload = async (file: File | undefined) => {
    if (!file) return
    setFeedback('')
    setUploading(true)
    try {
      const body = new FormData()
      body.append('image', file)
      body.append('folder', 'partners')
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body,
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo')
      }
      setForm((prev) => ({ ...prev, logoUrl: data.secure_url as string }))
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setFeedback('')
    const name = form.name.trim()
    if (!name) {
      setFeedback('Name is required.')
      return
    }

    startTransition(async () => {
      const payload = {
        kind: tab,
        name,
        logoUrl: form.logoUrl.trim() || undefined,
        isActive: form.isActive,
      }
      const result = editId
        ? await updateHomepageOrg(editId, payload)
        : await createHomepageOrg(payload)

      if (!result.success) {
        setFeedback(result.error || 'Failed to save.')
        return
      }
      setFeedback(editId ? 'Updated.' : 'Added.')
      resetForm()
      router.refresh()
    })
  }

  const handleToggleActive = (org: HomepageOrg) => {
    if (!canEdit) return
    setFeedback('')
    startTransition(async () => {
      const result = await updateHomepageOrg(org.id, { isActive: !org.isActive })
      setFeedback(result.success ? 'Visibility updated.' : result.error || 'Failed.')
      if (result.success) router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    if (!canDelete) return
    if (!window.confirm('Delete this entry? This cannot be undone.')) return
    setFeedback('')
    startTransition(async () => {
      const result = await deleteHomepageOrg(id)
      setFeedback(result.success ? 'Deleted.' : result.error || 'Failed to delete.')
      if (result.success) {
        if (editId === id) resetForm()
        router.refresh()
      }
    })
  }

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    if (!canEdit) return
    setFeedback('')
    startTransition(async () => {
      const result = await reorderHomepageOrg(id, direction)
      if (!result.success) setFeedback(result.error || 'Failed to reorder.')
      else router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={tab === 'partner' ? 'default' : 'outline'}
          onClick={() => {
            setTab('partner')
            resetForm()
          }}
          className={tab === 'partner' ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : ''}
        >
          Partners ({orgs.filter((o) => o.kind === 'partner').length})
        </Button>
        <Button
          type="button"
          variant={tab === 'workshop_school' ? 'default' : 'outline'}
          onClick={() => {
            setTab('workshop_school')
            resetForm()
          }}
          className={
            tab === 'workshop_school' ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : ''
          }
        >
          Schools ({orgs.filter((o) => o.kind === 'workshop_school').length})
        </Button>
      </div>

      {(canCreate || (canEdit && editId)) && (
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900">
              {editId
                ? `Edit ${tab === 'partner' ? 'partner' : 'school'}`
                : `Add ${tab === 'partner' ? 'partner' : 'school'}`}
            </h3>
            {editId ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={
                      tab === 'partner' ? 'Partner organization name' : 'School name'
                    }
                    className="mt-1"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="org-active"
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, isActive: checked === true }))
                    }
                  />
                  <label htmlFor="org-active" className="text-sm text-gray-700">
                    Show on homepage
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Logo</label>
                <div className="w-28 h-28 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative">
                  {form.logoUrl ? (
                    <Image
                      src={form.logoUrl}
                      alt="Logo preview"
                      fill
                      className="object-contain p-2"
                      sizes="112px"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 px-2 text-center">No logo</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading || isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload
                  </Button>
                  {form.logoUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm((prev) => ({ ...prev, logoUrl: '' }))}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending || uploading}
              className="bg-cyan-700 hover:bg-cyan-800 text-white"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editId ? (
                <Pencil className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {editId ? 'Save changes' : 'Add to homepage'}
            </Button>
          </form>
        </Card>
      )}

      {feedback ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {feedback}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-slate-500 py-8">
                  No {tab === 'partner' ? 'partners' : 'schools'} yet.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((org, index) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="relative w-10 h-10 rounded-lg border border-slate-200 bg-white overflow-hidden">
                      {org.logoUrl ? (
                        <Image
                          src={org.logoUrl}
                          alt=""
                          fill
                          className="object-contain p-1"
                          sizes="40px"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-indigo-500">
                          {org.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((p) => p[0]?.toUpperCase() ?? '')
                            .join('')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">{org.name}</TableCell>
                  <TableCell>
                    <Badge variant={org.isActive ? 'default' : 'outline'}>
                      {org.isActive ? 'Visible' : 'Hidden'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {canEdit ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isPending || index === 0}
                            onClick={() => handleReorder(org.id, 'up')}
                            aria-label="Move up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isPending || index === filtered.length - 1}
                            onClick={() => handleReorder(org.id, 'down')}
                            aria-label="Move down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isPending}
                            onClick={() => startEdit(org)}
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleToggleActive(org)}
                          >
                            {org.isActive ? 'Hide' : 'Show'}
                          </Button>
                        </>
                      ) : null}
                      {canDelete ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          onClick={() => handleDelete(org.id)}
                          aria-label="Delete"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : null}
                    </div>
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
