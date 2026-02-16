import { CheckCircle, XCircle, Calendar, MapPin, Clock, User, Mail, Phone, School } from 'lucide-react'
import { formatEventDates, parseEventDates } from '@/lib/dateUtils'
import { generateQRCodeDataURL } from '@/lib/qrCode'
import { adminDb } from '@/lib/firebase-admin'
import type { Booking } from '@/types/booking'
import type { Event } from '@/types/event'
import { format } from 'date-fns'
import Image from 'next/image'
import { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export const dynamic = 'force-dynamic'

interface VerificationPageProps {
  params: Promise<{ registrationId: string }>
}

async function getBookingByRegistrationId(registrationId: string): Promise<{
  booking: Booking | null
  event: Event | null
}> {
  try {
    if (!adminDb) {
      console.error('Firebase Admin SDK not available')
      return { booking: null, event: null }
    }

    // Query bookings collection by registrationId
    const bookingsSnapshot = await adminDb
      .collection('bookings')
      .where('registrationId', '==', registrationId)
      .limit(1)
      .get()

    if (bookingsSnapshot.empty) {
      return { booking: null, event: null }
    }

    const bookingDoc = bookingsSnapshot.docs[0]
    const bookingData = bookingDoc.data()

    const booking: Booking = {
      id: bookingDoc.id,
      ...bookingData,
      createdAt: bookingData.createdAt?.toDate?.() || bookingData.createdAt,
    } as Booking

    // Fetch event details
    const eventDoc = await adminDb.collection('events').doc(booking.eventId).get()

    if (!eventDoc.exists) {
      return { booking, event: null }
    }

    const eventData = eventDoc.data()!
    const event: Event = {
      id: eventDoc.id,
      ...eventData,
      createdAt: eventData.createdAt?.toDate?.() || eventData.createdAt,
      updatedAt: eventData.updatedAt?.toDate?.() || eventData.updatedAt,
    } as Event

    return { booking, event }
  } catch (error) {
    console.error('Error fetching booking:', error)
    return { booking: null, event: null }
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ registrationId: string }>
}): Promise<Metadata> {
  const { registrationId } = await params
  const { booking, event } = await getBookingByRegistrationId(registrationId)

  if (!booking || !event) {
    return {
      title: 'Registration Not Found | Robonauts Club',
      description: 'The registration ID you provided could not be found. Please verify your registration number and try again.',
      alternates: {
        canonical: `/verify/${registrationId}`,
      },
    }
  }

  const title = `Registration Verified - ${event.title} | Robonauts Club`
  const description = `Verified registration for ${event.title}. Registration ID: ${booking.registrationId}. Event date: ${formatEventDates(parseEventDates(event.date), 'long')}.`

  return {
    title,
    description,
    keywords: [
      'registration verification',
      'event confirmation',
      'robotics event',
      'Robonauts Club',
      event.title,
    ],
    openGraph: {
      title,
      description,
      url: `/verify/${registrationId}`,
      type: 'website',
      images: [
        {
          url: event.image && event.image.startsWith('http')
            ? event.image
            : `${SITE_CONFIG.url}${event.image || '/robotics-event.jpg'}`,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        event.image && event.image.startsWith('http')
          ? event.image
          : `${SITE_CONFIG.url}${event.image || '/robotics-event.jpg'}`,
      ],
    },
    alternates: {
      canonical: `/verify/${registrationId}`,
    },
  }
}

export default async function VerificationPage({ params }: VerificationPageProps) {
  const { registrationId } = await params
  const { booking, event } = await getBookingByRegistrationId(registrationId)

  const isValid = booking !== null && event !== null
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/verify/${registrationId}`
  const qrCodeDataURL = isValid ? await generateQRCodeDataURL(verificationUrl, 200) : null

  if (!isValid) {
    return (
      <div className="min-h-screen bg-linaer-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border-2 border-red-200 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Registration</h1>
          <p className="text-gray-600 mb-4">
            The registration ID <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{registrationId}</code> could not be found.
          </p>
          <p className="text-sm text-gray-500">
            Please check the registration ID and try again.
          </p>
        </div>
      </div>
    )
  }

  const eventDates = parseEventDates(event!.date)
  const formattedDate = eventDates.length > 0 ? formatEventDates(eventDates, 'long') : 'TBA'
  const bookingDate = booking!.createdAt instanceof Date 
    ? booking!.createdAt 
    : new Date(booking!.createdAt)

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Registration Verified</h1>
            <p className="text-green-50">This registration is valid and confirmed</p>
          </div>

          <div className="p-8">
            {/* Registration ID */}
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm font-medium text-indigo-600 mb-1">Registration ID</p>
                  <p className="text-2xl font-bold text-indigo-900 font-mono">{booking!.registrationId}</p>
                </div>
                {qrCodeDataURL && (
                  <div className="flex-shrink-0">
                    <Image
                      src={qrCodeDataURL}
                      alt="QR Code"
                      width={128}
                      height={128}
                      className="w-32 h-32 border-2 border-indigo-200 rounded-lg"
                      unoptimized
                    />
                    <p className="text-xs text-center text-gray-500 mt-2">Scan to verify</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Event Details */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Event Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Event Name</p>
                    <p className="text-base font-semibold text-gray-900">{event!.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Date</p>
                    <p className="text-base text-gray-900">{formattedDate}</p>
                  </div>
                  {event!.time && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Time
                      </p>
                      <p className="text-base text-gray-900">{event!.time}</p>
                    </div>
                  )}
                  {(event!.venue || event!.location) && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Venue
                      </p>
                      <p className="text-base text-gray-900">{event!.venue || event!.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Registration Details */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Registration Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Name
                    </p>
                    <p className="text-base font-semibold text-gray-900">{booking!.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <School className="w-4 h-4" />
                      School
                    </p>
                    <p className="text-base text-gray-900">{booking!.school}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </p>
                    <p className="text-base text-gray-900 break-all">{booking!.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Phone
                    </p>
                    <p className="text-base text-gray-900">{booking!.phone || 'N/A'}</p>
                  </div>
                  {booking!.bkashNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        bKash Number
                      </p>
                      <p className="text-base text-gray-900">{booking!.bkashNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Registered On</p>
                    <p className="text-base text-gray-900">
                      {format(bookingDate, 'MMMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {booking!.information && (
              <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Information</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{booking!.information}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500">
          <p>This page can be accessed by scanning the QR code on the confirmation PDF</p>
        </div>
      </div>
    </div>
  )
}

