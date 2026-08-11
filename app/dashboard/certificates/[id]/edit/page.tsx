import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getCertificateTemplate } from '@/app/dashboard/certificates/actions'
import CertificateTemplateEditor from '@/app/dashboard/certificates/CertificateTemplateEditor'

export const dynamic = 'force-dynamic'

export default async function EditCertificateTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params
  const template = await getCertificateTemplate(id)
  if (!template) notFound()

  return (
    <div className="w-full min-w-0 max-w-[1400px] mx-auto">
      <CertificateTemplateEditor template={template} />
    </div>
  )
}
