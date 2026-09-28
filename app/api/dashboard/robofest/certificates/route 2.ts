import { NextRequest, NextResponse } from 'next/server'
import { canViewTab, getServerSession, hasPermission } from '@/lib/auth'
import { getRobofestContentFresh } from '@/lib/robofest-content'
import { generateRobofestBulkParticipationCertificatesPDF } from '@/lib/robofest-certificate-pdf'
import { SITE_CONFIG } from '@/lib/site-config'
import { loadRobofestRegistrationsByIds } from '@/app/dashboard/robofest/registrations-data'

export const dynamic = 'force-dynamic'

const MAX_BULK_CERTIFICATE_IDS = 500

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
 * Bulk participation certificates by Firestore registration document ids.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(session, 'exports.pdf')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!canViewTab(session, 'robofest')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: {
    registrationIds?: string[]
    statusLabel?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const registrationIds = body.registrationIds

  if (!Array.isArray(registrationIds)) {
    return NextResponse.json(
      { error: 'registrationIds are required' },
      { status: 400 },
    )
  }

  if (registrationIds.length === 0) {
    return NextResponse.json(
      { error: 'No registrations to export.' },
      { status: 400 },
    )
  }

  const loaded = await loadRobofestRegistrationsByIds(
    registrationIds,
    MAX_BULK_CERTIFICATE_IDS,
  )

  const registrations = loaded.filter((r) => r.status !== 'cancelled')

  if (registrations.length === 0) {
    return NextResponse.json(
      { error: 'No eligible registrations found for certificates.' },
      { status: 400 },
    )
  }

  const content = await getRobofestContentFresh()

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
