'use client'

import type { CertificateTemplate } from '@/lib/certificate-templates'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  name: string
  description: string
  layout: CertificateTemplate['page']['layout']
  uploadingBg: boolean
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onLayoutChange: (layout: CertificateTemplate['page']['layout']) => void
  onBackgroundFile: (file: File) => void
}

export function TemplateMetaSidebar({
  name,
  description,
  layout,
  uploadingBg,
  onNameChange,
  onDescriptionChange,
  onLayoutChange,
  onBackgroundFile,
}: Props) {
  return (
    <>
      <div className="space-y-1">
        <label className="text-xs text-slate-500">Name</label>
        <Input value={name} onChange={(e) => onNameChange(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-500">Description</label>
        <Textarea
          rows={2}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-500">Layout</label>
        <select
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          value={layout}
          onChange={(e) =>
            onLayoutChange(
              e.target.value === 'portrait' ? 'portrait' : 'landscape',
            )
          }
        >
          <option value="landscape">A4 Landscape</option>
          <option value="portrait">A4 Portrait</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-500">Background</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={uploadingBg}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) {
              onBackgroundFile(file)
            }
          }}
        />
        {uploadingBg ? (
          <p className="text-xs text-cyan-700">Uploading…</p>
        ) : null}
      </div>
    </>
  )
}
