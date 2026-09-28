import { NextRequest, NextResponse } from 'next/server'
import { canViewTab, getServerSession, hasPermission } from '@/lib/auth'
import { getRobofestContentFresh } from '@/lib/robofest-content'
import { getRobofestRegistrationById } from '@/lib/robofest-registration'
import { generateRobofestParticipationCertificatesPDF } from '@/lib/robofest-certificate-pdf'
import { SITE_CONFIG } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

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
 * POST /api/dashboard/robofest/registrations/[id]/certificate
 * Generate participation certificate PDF for one member (memberIndex) or all members.
 */
export async function POST(request: NextRequest, context: RouteContext) {
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

  const { id } = await context.params

  let body: { memberIndex?: number } = {}
  try {
    const raw = await request.text()
    if (raw.trim()) body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const registration = await getRobofestRegistrationById(id)
  if (!registration) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
  }

  const content = await getRobofestContentFresh()

  const memberIndex =
    typeof body.memberIndex === 'number' && Number.isInteger(body.memberIndex)
      ? body.memberIndex
      : undefined

  if (memberIndex !== undefined && memberIndex < 0) {
    return NextResponse.json({ error: 'Invalid memberIndex' }, { status: 400 })
  }

  const result = await generateRobofestParticipationCertificatesPDF({
    registration,
    content,
    memberIndex,
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
