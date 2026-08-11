import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, hasPermission } from '@/lib/auth'
import { getCertificateTemplate } from '@/app/dashboard/certificates/actions'
import { generateSampleCertificatePdf } from '@/lib/certificate-template-pdf'
import { SITE_CONFIG } from '@/lib/site-config'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(session, 'exports.pdf')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await context.params
  const template = await getCertificateTemplate(id)
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const baseUrl =
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    SITE_CONFIG.url

  const result = await generateSampleCertificatePdf(template, baseUrl)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    },
  })
}
