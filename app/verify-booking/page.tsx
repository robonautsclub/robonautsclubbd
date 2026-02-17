import { CheckCircle, XCircle, Calendar, MapPin, Clock, User, Mail, Phone, School, ShieldCheck, QrCode } from 'lucide-react'
import { formatEventDates, parseEventDates } from '@/lib/dateUtils'
import { generateQRCodeDataURL } from '@/lib/qrCode'
import { adminDb } from '@/lib/firebase-admin'
import type { Booking } from '@/types/booking'
import type { Event } from '@/types/event'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/site-config'
import CopyButton from './CopyButton'
import RetryButton from './RetryButton'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `Verify Registration | ${SITE_CONFIG.name}`,
  description: `Verify your event registration with ${SITE_CONFIG.name}. Enter your registration ID to confirm your registration and view event details.`,
  keywords: [
    'verify registration',
    'event verification',
    'robotics event registration',
    'registration confirmation',
    `${SITE_CONFIG.name} verification`,
  ],
  openGraph: {
    title: `Verify Registration | ${SITE_CONFIG.name}`,
    description: `Verify your event registration with ${SITE_CONFIG.name}. Enter your registration ID to confirm your registration.`,
    url: '/verify-booking',
    type: 'website',
    images: [
      {
        url: '/robotics-event.jpg',
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} - Verify Registration`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Verify Registration | ${SITE_CONFIG.name}`,
    description: `Verify your event registration with ${SITE_CONFIG.name}.`,
    images: ['/robotics-event.jpg'],
  },
  alternates: {
    canonical: '/verify-booking',
  },
}

interface VerificationPageProps {
  searchParams: Promise<{ registrationId?: string }>
}

async function getBookingByRegistrationId(registrationId: string): Promise<{
  booking: Booking | null
  event: Event | null
}> {
  try {
    if (!adminDb) {
      return { booking: null, event: null }
    }

    if (!registrationId || registrationId.trim() === '') {
      return { booking: null, event: null }
    }

    // Query bookings collection by registrationId
    const bookingsSnapshot = await adminDb
      .collection('bookings')
      .where('registrationId', '==', registrationId.trim())
      .limit(1)
      .get()

    if (bookingsSnapshot.empty) {
      return { booking: null, event: null }
    }

    const bookingDoc = bookingsSnapshot.docs[0]
    const bookingData = bookingDoc.data()!

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
  } catch {
    return { booking: null, event: null }
  }
}

export default async function VerifyBookingPage({ searchParams }: VerificationPageProps) {
  const params = await searchParams
  const registrationId = params.registrationId

  // Error State: No registration ID provided
  if (!registrationId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-30 transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 sm:p-10 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-br from-red-100 to-red-200 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <XCircle className="w-12 h-12 sm:w-14 sm:h-14 text-red-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Registration Number Required</h1>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Please provide a registration number to verify your registration.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
            <p className="text-sm text-blue-900 font-medium mb-2">Where to find your registration number:</p>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                In your confirmation email
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                On your PDF confirmation document
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                Format: REG-YYYYMMDD-XXXXX
              </li>
            </ul>
          </div>
          <Link
            href="/events"
            className="inline-block mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            View All Events
          </Link>
        </div>
      </div>
    )
  }

  const { booking, event } = await getBookingByRegistrationId(registrationId)
  const isValid = booking !== null && event !== null
  
  // Generate base URL for QR code display
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
  const verificationUrl = `${baseUrl}/verify-booking?registrationId=${encodeURIComponent(registrationId)}`
  const qrCodeDataURL = isValid ? await generateQRCodeDataURL(verificationUrl, 200) : null

  // Error State: Registration not found
  if (!isValid) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-200 rounded-full blur-3xl opacity-30 transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 sm:p-10 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-br from-red-100 to-orange-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <XCircle className="w-12 h-12 sm:w-14 sm:h-14 text-red-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Registration Not Found</h1>
          <p className="text-gray-600 mb-4 leading-relaxed">
            The registration number you provided could not be found in our database.
          </p>
          
          {/* Registration ID Display */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Registration Number</p>
            <p className="text-lg font-mono font-bold text-gray-900 break-all">{registrationId}</p>
          </div>

          {/* Help Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-amber-900 mb-2">Please check:</p>
            <ul className="text-sm text-amber-800 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>The registration number is correct (format: <code className="bg-amber-100 px-1 rounded font-mono">REG-YYYYMMDD-XXXXX</code>)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>There are no extra spaces or characters</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>The registration was completed successfully</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/events"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              View Events
            </Link>
            <RetryButton className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-300 transition-colors" />
          </div>
        </div>
      </div>
    )
  }

  // Success State: Registration found and verified
  const eventDates = parseEventDates(event!.date)
  const formattedDate = eventDates.length > 0 ? formatEventDates(eventDates, 'long') : 'TBA'
  const bookingDate = booking!.createdAt instanceof Date 
    ? booking!.createdAt 
    : new Date(booking!.createdAt)

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 sm:py-12 px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-10 transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Success Header Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden mb-6 sm:mb-8">
          <div className="bg-linear-to-r from-green-500 via-emerald-500 to-teal-500 px-6 sm:px-8 py-8 sm:py-10 text-center relative overflow-hidden">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
            </div>
            
            <div className="relative z-10">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl border-4 border-white/50">
                <CheckCircle className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 sm:mb-3 tracking-tight">
                Registration Verified
              </h1>
              <p className="text-base sm:text-lg text-green-50 font-medium">
                Your registration has been successfully verified and confirmed
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <ShieldCheck className="w-5 h-5 text-white" />
                <span className="text-sm font-semibold text-white">Valid Registration</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 sm:p-8 lg:p-10">
            {/* Registration ID Card - Prominent */}
            <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-lg relative overflow-hidden">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/30 rounded-bl-full blur-2xl" />
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      </div>
                      <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
                        Registration ID
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl sm:text-3xl font-bold text-indigo-900 font-mono tracking-tight">
                        {booking!.registrationId}
                      </p>
                      <CopyButton text={booking!.registrationId} label="Registration ID" />
                    </div>
                    <p className="text-xs text-indigo-700 mt-2 font-medium">
                      Save this number for your records
                    </p>
                  </div>
                  
                  {qrCodeDataURL && (
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-indigo-200 mb-3">
                        <Image
                          src={qrCodeDataURL}
                          alt="QR Code for registration verification"
                          width={144}
                          height={144}
                          className="w-32 h-32 sm:w-36 sm:h-36"
                          unoptimized
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <QrCode className="w-4 h-4" />
                        <span className="font-medium">Scan to verify</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
              {/* Event Details Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-7 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-300">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Event Details</h2>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Event Name</p>
                    <p className="text-base sm:text-lg font-bold text-gray-900 leading-relaxed">{event!.title}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</p>
                    </div>
                    <p className="text-base font-semibold text-gray-900">{formattedDate}</p>
                  </div>
                  {event!.time && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</p>
                      </div>
                      <p className="text-base font-semibold text-gray-900">{event!.time}</p>
                    </div>
                  )}
                  {(event!.venue || event!.location) && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-1.5">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Venue</p>
                      </div>
                      <p className="text-base font-semibold text-gray-900 leading-relaxed">
                        {event!.venue || event!.location}
                      </p>
                    </div>
                  )}
                  {event!.eligibility && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1.5">Eligibility</p>
                      <p className="text-sm font-medium text-blue-900">{event!.eligibility}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Registration Details Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-7 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-300">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Participant Details</h2>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <User className="w-4 h-4 text-gray-500" />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</p>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-gray-900">{booking!.name}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <School className="w-4 h-4 text-gray-500" />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">School</p>
                    </div>
                    <p className="text-base font-semibold text-gray-900">{booking!.school}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</p>
                      </div>
                      <CopyButton text={booking!.email} label="Email" />
                    </div>
                    <p className="text-base font-semibold text-gray-900 break-all">{booking!.email}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</p>
                      </div>
                      <CopyButton text={booking!.phone || ''} label="Phone" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">{booking!.phone || 'N/A'}</p>
                  </div>
                  {booking!.bkashNumber && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">bKash Number</p>
                        </div>
                        <CopyButton text={booking!.bkashNumber} label="bKash Number" />
                      </div>
                      <p className="text-base font-semibold text-gray-900">{booking!.bkashNumber}</p>
                    </div>
                  )}
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1.5">Registered On</p>
                    <p className="text-sm font-bold text-indigo-900">
                      {format(bookingDate, 'MMMM d, yyyy')} at {format(bookingDate, 'h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {booking!.information && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border-2 border-blue-200 shadow-md mb-6 sm:mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Additional Information</h3>
                </div>
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-blue-200">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{booking!.information}</p>
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  <p className="text-sm font-medium">
                    This page can be accessed by scanning the QR code on your confirmation PDF
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/events"
                    className="px-5 py-2.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors"
                  >
                    View Events
                  </Link>
                  <Link
                    href="/"
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-gray-700">Securely verified by {SITE_CONFIG.name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
