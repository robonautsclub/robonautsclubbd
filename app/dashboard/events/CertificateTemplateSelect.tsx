'use client'

import { useEffect, useState } from 'react'
import { listActiveCertificateTemplates } from '@/app/dashboard/certificates/actions'
import type { CertificateTemplate } from '@/lib/certificate-templates'
import Link from 'next/link'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function CertificateTemplateSelect({
  value,
  onChange,
  disabled,
}: Props) {
  const [templates, setTemplates] = useState<
    Pick<CertificateTemplate, 'id' | 'name'>[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await listActiveCertificateTemplates()
        if (!cancelled) {
          setTemplates(list.map((t) => ({ id: t.id, name: t.name })))
        }
      } catch {
        if (!cancelled) setTemplates([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700">
        Certificate template
      </label>
      <select
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
        value={value || ''}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">None — no certificates for this event</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-500">
        Manage templates in{' '}
        <Link
          href="/dashboard/certificates"
          className="text-cyan-700 hover:underline"
        >
          Certificates
        </Link>
        .
      </p>
    </div>
  )
}
