import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, hasPermission } from '@/lib/auth'
import { generateBookingConfirmationPDF } from '@/lib/pdfGenerator'
import { SITE_CONFIG } from '@/lib/site-config'
import type { Booking } from '@/types/booking'
import type { Event } from '@/types/event'

export const dynamic = 'force-dynamic'

/**
 * POST /api/dashboard/registrations/[bookingId]/pdf
 * Generate registration confirmation PDF from posted booking + event (no Firestore/Cloudinary).
 * Auth: dashboard admin only.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(session, 'exports.pdf')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { bookingId } = await context.params
  if (!bookingId) {
    return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 })
  }

  let body: { booking?: Booking; event?: Event }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { booking, event } = body
  if (!booking || !event) {
    return NextResponse.json(
      { error: 'booking and event are required' },
      { status: 400 },
    )
  }

  if (booking.id && booking.id !== bookingId) {
    return NextResponse.json({ error: 'Booking id mismatch' }, { status: 400 })
  }

  let baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.nextUrl.origin
  if (!baseUrl) {
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    } else if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000'
    } else {
      baseUrl = SITE_CONFIG.url
    }
  }
  baseUrl = baseUrl.replace(/\/$/, '')

  const registrationId = booking.registrationId || ''
  const verificationUrl = `${baseUrl}/verify-booking?registrationId=${encodeURIComponent(registrationId)}`

  const pdfBuffer = await generateBookingConfirmationPDF({
    registrationId,
    bookingId: booking.id || bookingId,
    event,
    bookingDetails: {
      name: booking.name || '',
      school: booking.school || '',
      email: booking.email || '',
      phone: booking.phone || '',
      bkashNumber: booking.bkashNumber || '',
      information: booking.information || '',
    },
    verificationUrl,
  })

  const filename = `Registration-Confirmation-${registrationId || bookingId}.pdf`
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
      'Cache-Control': 'no-store',
    },
  })
}
