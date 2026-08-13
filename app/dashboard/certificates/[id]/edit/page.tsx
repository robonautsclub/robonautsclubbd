import { notFound } from 'next/navigation'
import { requireCreateOrEdit, hasPermission } from '@/lib/auth'
import { getCertificateTemplate } from '@/app/dashboard/certificates/actions'
import CertificateTemplateEditor from '@/app/dashboard/certificates/CertificateTemplateEditor'

export const dynamic = 'force-dynamic'

export default async function EditCertificateTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireCreateOrEdit('certificates')
  const { id } = await params
  const template = await getCertificateTemplate(id)
  if (!template) notFound()

  return (
    <div className="w-full min-w-0 max-w-[1400px] mx-auto">
      <CertificateTemplateEditor
        template={template}
        canDownload={hasPermission(session, 'exports.pdf')}
      />
    </div>
  )
}
