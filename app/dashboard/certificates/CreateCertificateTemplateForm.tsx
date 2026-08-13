'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCertificateTemplate } from '@/app/dashboard/certificates/actions'
import { getStandardCertificateFields } from '@/lib/certificate-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

export default function CreateCertificateTemplateForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [layout, setLayout] = useState<'landscape' | 'portrait'>('landscape')
  const [backgroundUrl, setBackgroundUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const uploadBackground = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', 'certificates')
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }
      setBackgroundUrl(data.secure_url as string)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const submit = () => {
    setError('')
    startTransition(async () => {
      const result = await createCertificateTemplate({
        name,
        description,
        backgroundUrl,
        page: { size: 'A4', layout },
        fields: getStandardCertificateFields(layout),
        isActive: true,
      })
      if (!result.success || !result.id) {
        setError(result.error || 'Failed to create template.')
        return
      }
      router.push(`/dashboard/certificates/${result.id}/edit`)
    })
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4 max-w-xl">
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        ) : null}
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Template name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Robotics Workshop 2026"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Description (optional)</label>
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Page layout</label>
          <select
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={layout}
            onChange={(e) =>
              setLayout(e.target.value === 'portrait' ? 'portrait' : 'landscape')
            }
          >
            <option value="landscape">A4 Landscape</option>
            <option value="portrait">A4 Portrait</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Background image</label>
          <p className="text-xs text-slate-400">
            Upload a full-page certificate artwork (PNG/JPG). Text will be placed on top.
          </p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={uploading || pending}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void uploadBackground(file)
            }}
          />
          {uploading ? (
            <p className="text-xs text-cyan-700">Uploading…</p>
          ) : null}
          {backgroundUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={backgroundUrl}
              alt="Background preview"
              className="mt-2 max-h-48 rounded border border-slate-200 object-contain bg-slate-50"
            />
          ) : null}
        </div>
        <Button
          type="button"
          className="bg-cyan-700 hover:bg-cyan-800 text-white"
          disabled={pending || uploading || !name.trim() || !backgroundUrl}
          onClick={submit}
        >
          {pending ? 'Creating…' : 'Create & open editor'}
        </Button>
      </CardContent>
    </Card>
  )
}
