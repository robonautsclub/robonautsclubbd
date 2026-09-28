import { NextRequest, NextResponse } from 'next/server'
import { canViewTab, getServerSession, hasPermission } from '@/lib/auth'
import { getRobofestContentFresh } from '@/lib/robofest-content'
import {
  generateRobofestConfirmationPdfFromData,
  getRobofestRegistrationById,
} from '@/lib/robofest-registration'
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
 * POST /api/dashboard/robofest/registrations/[id]/pdf
 * Generate confirmation PDF using fresh Firestore registration + content.
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

  const registration = await getRobofestRegistrationById(id)
  if (!registration) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
  }

  const content = await getRobofestContentFresh()

  const result = await generateRobofestConfirmationPdfFromData(
    registration,
    content,
    getBaseUrl(request),
  )

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
