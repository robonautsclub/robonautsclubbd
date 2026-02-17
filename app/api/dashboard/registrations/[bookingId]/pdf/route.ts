import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { generateBookingConfirmationPDF } from '@/lib/pdfGenerator'
import { SITE_CONFIG } from '@/lib/site-config'
import type { Event } from '@/types/event'

/**
 * GET /api/dashboard/registrations/[bookingId]/pdf
 * Generate registration confirmation PDF on-demand (no storage).
 * Auth: dashboard admin only.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin SDK not configured' },
      { status: 500 }
    )
  }

  const { bookingId } = await context.params
  if (!bookingId) {
    return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 })
  }

  const bookingSnap = await adminDb.collection('bookings').doc(bookingId).get()
  if (!bookingSnap.exists) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
  }

  const bookingData = bookingSnap.data()!
  const eventId = bookingData.eventId as string
  const eventSnap = await adminDb.collection('events').doc(eventId).get()
  if (!eventSnap.exists) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const eventData = eventSnap.data()!
  const event: Event = {
    id: eventSnap.id,
    ...eventData,
    createdAt: eventData.createdAt?.toDate?.() ?? eventData.createdAt,
    updatedAt: eventData.updatedAt?.toDate?.() ?? eventData.updatedAt,
  } as Event

  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (!baseUrl) {
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    } else if (process.env.VERCEL_BRANCH_URL) {
      baseUrl = process.env.VERCEL_BRANCH_URL.startsWith('http')
        ? process.env.VERCEL_BRANCH_URL
        : `https://${process.env.VERCEL_BRANCH_URL}`
    } else if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000'
    } else {
      baseUrl = SITE_CONFIG.url
    }
  }
  baseUrl = baseUrl.replace(/\/$/, '')
  const registrationId = (bookingData.registrationId as string) || ''
  const verificationUrl = `${baseUrl}/verify-booking?registrationId=${encodeURIComponent(registrationId)}`

  const pdfBuffer = await generateBookingConfirmationPDF({
    registrationId,
    bookingId,
    event,
    bookingDetails: {
      name: (bookingData.name as string) || '',
      school: (bookingData.school as string) || '',
      email: (bookingData.email as string) || '',
      phone: (bookingData.phone as string) || '',
      bkashNumber: (bookingData.bkashNumber as string) || '',
      information: (bookingData.information as string) || '',
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
    },
  })
}
