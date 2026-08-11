import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'
import { getServerSession } from '@/lib/auth'
import { getCertificateTemplateForIssue } from '@/app/dashboard/certificates/actions'
import {
  buildEventCertificateId,
  formatEventDateLabel,
  generateCertificatesFromTemplate,
} from '@/lib/certificate-template-pdf'
import { resolveCertificateAwardFields } from '@/lib/certificate-templates'
import { SITE_CONFIG } from '@/lib/site-config'
import type { Booking } from '@/types/booking'
import type { Event } from '@/types/event'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId } = await context.params
  let body: { bookings?: Booking[]; event?: Event }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const event = body.event
  const bookings = body.bookings || []
  if (!event || event.id !== eventId) {
    return NextResponse.json({ error: 'Event required' }, { status: 400 })
  }
  if (bookings.length === 0) {
    return NextResponse.json({ error: 'No bookings provided' }, { status: 400 })
  }

  const templateId = event.certificateTemplateId?.trim()
  if (!templateId) {
    return NextResponse.json(
      { error: 'No certificate template assigned to this event.' },
      { status: 400 },
    )
  }

  const template = await getCertificateTemplateForIssue(templateId)
  if (!template) {
    return NextResponse.json(
      { error: 'Certificate template not found or inactive.' },
      { status: 404 },
    )
  }

  const baseUrl = (
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    SITE_CONFIG.url ||
    ''
  ).replace(/\/$/, '')

  const awardFields = resolveCertificateAwardFields(null)
  const pages = bookings.map((booking) => {
    const registrationId = booking.registrationId || booking.id
    return {
      recipientName: booking.name,
      school: booking.school || '',
      category: booking.category || '',
      eventTitle: event.title,
      eventDate: formatEventDateLabel(event.date),
      venue: event.venue || event.location || '',
      certificateTitle: awardFields.certificateTitle,
      certificateBody: awardFields.certificateBody,
      awardLabel: awardFields.awardLabel,
      registrationId,
      certificateId: buildEventCertificateId(registrationId),
      issueDate: format(new Date(), 'dd MMMM yyyy'),
      verificationUrl: `${baseUrl}/verify-booking?registrationId=${encodeURIComponent(registrationId)}`,
    }
  })

  const result = await generateCertificatesFromTemplate({
    template,
    pages,
    filename: `Certificates-${eventId}-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
  })

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
