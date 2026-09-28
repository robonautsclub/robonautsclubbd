import Link from 'next/link'
import { requirePermission } from '@/lib/auth'
import CreateCertificateTemplateForm from '../CreateCertificateTemplateForm'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function NewCertificateTemplatePage() {
  await requirePermission('create:certificates')

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">New certificate template</h2>
          <p className="text-sm text-slate-600 mt-1">
            Upload artwork first, then place fields in the editor.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/certificates">Back</Link>
        </Button>
      </div>
      <CreateCertificateTemplateForm />
    </div>
  )
}
