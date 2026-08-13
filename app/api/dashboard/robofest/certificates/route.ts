import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, hasPermission } from '@/lib/auth'
import type { RobofestContent, RobofestRegistration } from '@/lib/robofest-content'
import { generateRobofestBulkParticipationCertificatesPDF } from '@/lib/robofest-certificate-pdf'
import { SITE_CONFIG } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

function getBaseUrl(request: NextRequest): string {
  let baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.nextUrl.origin
  if (!baseUrl && process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`
  }
  if (!baseUrl) baseUrl = SITE_CONFIG.url
  return baseUrl.replace(/\/$/, '')
}

/**
 * POST /api/dashboard/robofest/certificates
 * Bulk participation certificates for a list of registrations (one page per participant).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(session, 'exports.pdf')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: {
    registrations?: RobofestRegistration[]
    content?: RobofestContent
    statusLabel?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const registrations = body.registrations
  const content = body.content

  if (!Array.isArray(registrations) || !content) {
    return NextResponse.json(
      { error: 'registrations and content are required' },
      { status: 400 },
    )
  }

  if (registrations.length === 0) {
    return NextResponse.json(
      { error: 'No registrations to export.' },
      { status: 400 },
    )
  }

  const result = await generateRobofestBulkParticipationCertificatesPDF({
    registrations,
    content,
    statusLabel: body.statusLabel,
    baseUrl: getBaseUrl(request),
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
