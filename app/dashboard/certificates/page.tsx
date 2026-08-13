import Link from 'next/link'
import { Plus, Award } from 'lucide-react'
import { requireTabAccess, canCreateArea, canEditArea, canDeleteArea, hasPermission } from '@/lib/auth'
import { listCertificateTemplates } from '@/app/dashboard/certificates/actions'
import CertificateTemplatesList from './CertificateTemplatesList'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function CertificatesDashboardPage() {
  const session = await requireTabAccess('certificates')
  const canCreate = canCreateArea(session, 'certificates')
  const canEdit = canEditArea(session, 'certificates')
  const canDelete = canDeleteArea(session, 'certificates')
  const canDownload = hasPermission(session, 'exports.pdf')
  const templates = await listCertificateTemplates()

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-7 h-7 text-cyan-700" />
            Certificates
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Create background templates and assign them to Events or Robofest.
          </p>
        </div>
        {canCreate ? (
          <Button asChild className="bg-cyan-700 hover:bg-cyan-800 text-white shadow-sm">
            <Link href="/dashboard/certificates/new" prefetch={false}>
              <Plus className="w-4 h-4" />
              New template
            </Link>
          </Button>
        ) : null}
      </div>

      <CertificateTemplatesList
        templates={templates}
        canEdit={canEdit}
        canCreate={canCreate}
        canDelete={canDelete}
        canDownload={canDownload}
      />
    </div>
  )
}
