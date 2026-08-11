import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, hasPermission } from '@/lib/auth'
import type { RobofestContent, RobofestRegistration } from '@/lib/robofest-content'
import { generateRobofestConfirmationPdfFromData } from '@/lib/robofest-registration'
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
 * Generate confirmation PDF from posted registration + content (no Firestore/Cloudinary).
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(session, 'exports.pdf')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await context.params

  let body: {
    registration?: RobofestRegistration
    content?: RobofestContent
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const registration = body.registration
  const content = body.content

  if (!registration || !content) {
    return NextResponse.json(
      { error: 'registration and content are required' },
      { status: 400 },
    )
  }

  if (registration.id && registration.id !== id) {
    return NextResponse.json(
      { error: 'Registration id mismatch' },
      { status: 400 },
    )
  }

  const result = await generateRobofestConfirmationPdfFromData(
    { ...registration, id: registration.id || id },
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
