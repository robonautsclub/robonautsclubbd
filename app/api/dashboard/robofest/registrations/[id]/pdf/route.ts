import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { generateBookingConfirmationPDF } from '@/lib/pdfGenerator'
import { getRobofestContentFresh } from '@/lib/robofest-content'
import {
  buildRobofestEventForPdfEmail,
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

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const registration = await getRobofestRegistrationById(id)
  if (!registration || !registration.registrationId) {
    return NextResponse.json(
      { error: 'Registration not found' },
      { status: 404 },
    )
  }

  const content = await getRobofestContentFresh()
  const event = buildRobofestEventForPdfEmail(content, {
    category: registration.category,
    name: registration.name,
    email: registration.email,
    phone: registration.phone,
    school: registration.school,
    roundCity: registration.roundCity,
    notes: registration.notes,
  })

  const baseUrl = getBaseUrl(request)
  const verificationUrl = `${baseUrl}/verify-booking?registrationId=${encodeURIComponent(registration.registrationId)}`

  const infoParts = [
    `Category: ${registration.category}`,
    `Preferred round: ${registration.roundCity}`,
  ]
  if (registration.notes) infoParts.push(`Notes: ${registration.notes}`)
  if (registration.amountPaid != null) {
    infoParts.push(`Amount paid: BDT ${registration.amountPaid}`)
  }
  if (registration.trxId) infoParts.push(`Trx ID: ${registration.trxId}`)

  const pdfBuffer = await generateBookingConfirmationPDF({
    registrationId: registration.registrationId,
    bookingId: registration.id,
    event,
    bookingDetails: {
      name: registration.name,
      email: registration.email,
      school: registration.school,
      phone: registration.phone,
      information: infoParts.join('\n'),
    },
    verificationUrl,
  })

  const filename = `Robofest-Confirmation-${registration.registrationId}.pdf`
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
