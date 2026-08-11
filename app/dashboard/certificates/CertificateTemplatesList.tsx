'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Pencil, Copy, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { CertificateTemplate } from '@/lib/certificate-templates'
import {
  deleteCertificateTemplate,
  duplicateCertificateTemplate,
  updateCertificateTemplate,
} from '@/app/dashboard/certificates/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function CertificateTemplatesList({
  templates,
}: {
  templates: CertificateTemplate[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const run = (fn: () => Promise<{ success: boolean; error?: string; id?: string }>, onOk?: (id?: string) => void) => {
    setError('')
    startTransition(async () => {
      const result = await fn()
      if (!result.success) {
        setError(result.error || 'Action failed.')
        return
      }
      onOk?.(result.id)
      router.refresh()
    })
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-slate-600 mb-2">No certificate templates yet.</p>
          <p className="text-sm text-slate-500 mb-6">
            Upload a background and place text fields for Events and Robofest.
          </p>
          <Button asChild className="bg-cyan-700 hover:bg-cyan-800 text-white">
            <Link href="/dashboard/certificates/new">Create the first template</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      ) : null}
      <ul className="space-y-4">
        {templates.map((t) => (
          <li key={t.id}>
            <Card className="overflow-hidden shadow-sm p-0">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-48 h-28 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  {t.backgroundUrl ? (
                    <Image
                      src={t.backgroundUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No background
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-lg truncate">
                      {t.name}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={
                        t.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }
                    >
                      {t.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      A4 {t.page.layout}
                    </Badge>
                  </div>
                  {t.description ? (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {t.description}
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-500">
                    {t.fields.length} field{t.fields.length === 1 ? '' : 's'}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/certificates/${t.id}/edit`}>
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () => duplicateCertificateTemplate(t.id),
                          (id) => {
                            if (id) router.push(`/dashboard/certificates/${id}/edit`)
                          },
                        )
                      }
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          updateCertificateTemplate(t.id, {
                            isActive: !t.isActive,
                          }),
                        )
                      }
                    >
                      {t.isActive ? (
                        <ToggleRight className="w-3.5 h-3.5" />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5" />
                      )}
                      {t.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200"
                      disabled={pending}
                      onClick={() => {
                        if (
                          !confirm(
                            `Delete template “${t.name}”? Events using it will need a new assignment.`,
                          )
                        ) {
                          return
                        }
                        run(() => deleteCertificateTemplate(t.id))
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
