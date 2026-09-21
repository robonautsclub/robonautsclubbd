import { CheckCircle, XCircle, Calendar, MapPin, Clock, User, Mail, Phone, School } from 'lucide-react'
import { formatEventDateLabel } from '@/lib/dateUtils'
import { generateQRCodeDataURL } from '@/lib/qrCode'
import { collectionGet, getBookingByRegistrationId as lookupBookingByRegistrationId } from '@/lib/db/collections'
import type { Booking } from '@/types/booking'
import type { Event } from '@/types/event'
import { format } from 'date-fns'
import Image from 'next/image'
import { Metadata } from 'next'
import { absoluteSiteUrl } from '@/lib/seo'
import { buildPageMetadata } from '@/lib/seo-metadata'
import { resolvePublicBaseUrl } from '@/lib/site-config'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export const dynamic = 'force-dynamic'

interface VerificationPageProps {
  params: Promise<{ registrationId: string }>
}

async function getBookingByRegistrationId(registrationId: string): Promise<{
  booking: Booking | null
  event: Event | null
}> {
  try {
    const bookingDoc = await lookupBookingByRegistrationId(registrationId)
    if (!bookingDoc) {
      return { booking: null, event: null }
    }

    const bookingData = bookingDoc as Record<string, unknown>
    const booking: Booking = {
      id: String(bookingDoc.id),
      ...bookingData,
      createdAt:
        bookingData.createdAt &&
        typeof bookingData.createdAt === 'object' &&
        'toDate' in bookingData.createdAt
          ? (bookingData.createdAt as { toDate: () => Date }).toDate()
          : bookingData.createdAt,
    } as Booking

    const eventDoc = await collectionGet('events', String(booking.eventId))
    if (!eventDoc) {
      return { booking, event: null }
    }

    const eventData = eventDoc as Record<string, unknown>
    const event: Event = {
      id: String(eventDoc.id),
      ...eventData,
      createdAt:
        eventData.createdAt &&
        typeof eventData.createdAt === 'object' &&
        'toDate' in eventData.createdAt
          ? (eventData.createdAt as { toDate: () => Date }).toDate()
          : eventData.createdAt,
      updatedAt:
        eventData.updatedAt &&
        typeof eventData.updatedAt === 'object' &&
        'toDate' in eventData.updatedAt
          ? (eventData.updatedAt as { toDate: () => Date }).toDate()
          : eventData.updatedAt,
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
    return buildPageMetadata({
      title: 'Registration Not Found',
      description:
        'The registration ID you provided could not be found. Please verify your registration number and try again.',
      path: `/verify/${registrationId}`,
      noindex: true,
    })
  }

  const title = `Registration Verified - ${event.title}`
  const description = `Your registration for ${event.title} is verified. Event date: ${formatEventDateLabel(event.date, 'long')}.`

  const ogImage =
    event.image && event.image.startsWith('http')
      ? event.image
      : absoluteSiteUrl(event.image || '/robotics-event.jpg')

  return buildPageMetadata({
    title,
    description,
    path: `/verify/${registrationId}`,
    noindex: true,
    ogImage: {
      url: ogImage,
      width: 1200,
      height: 630,
      alt: event.title,
    },
    keywords: [
      'registration verification',
      'event confirmation',
      'robotics event',
      'Robonauts',
      event.title,
    ],
  })
}

export default async function VerificationPage({ params }: VerificationPageProps) {
  const { registrationId } = await params
  const { booking, event } = await getBookingByRegistrationId(registrationId)

  const isValid = booking !== null && event !== null
  const baseUrl = resolvePublicBaseUrl()
  const verificationUrl = `${baseUrl}/verify/${registrationId}`
  const qrCodeDataURL = isValid ? await generateQRCodeDataURL(verificationUrl, 200) : null

  if (!isValid) {
    return (
      <div className="min-h-screen bg-linaer-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-2 border-red-200">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Registration</h1>
            <Alert variant="destructive" className="mb-3 text-left">
              <AlertTitle>Registration ID not found</AlertTitle>
              <AlertDescription>
                The registration ID <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{registrationId}</code> could not be found.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-500">
              Please check the registration ID and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formattedDate = formatEventDateLabel(event!.date, 'long')
  const bookingDate = booking!.createdAt instanceof Date 
    ? booking!.createdAt 
    : new Date(booking!.createdAt)

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="shadow-xl border-2 border-green-200 overflow-hidden mb-6 p-0">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Registration Verified</h1>
            <p className="text-green-50">This registration is valid and confirmed</p>
            <Badge className="mt-3 bg-white/20 hover:bg-white/30 text-white border-0">Valid Registration</Badge>
          </div>

          <CardContent className="p-8">
            {/* Registration ID */}
            <Card className="bg-indigo-50 border-2 border-indigo-200 mb-6">
              <CardContent className="p-6">
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
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Event Details */}
              <Card className="bg-gray-50">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    Event Details
                  </h2>
                  <Separator className="mb-4" />
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
                </CardContent>
              </Card>

              {/* Registration Details */}
              <Card className="bg-gray-50">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    Registration Details
                  </h2>
                  <Separator className="mb-4" />
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
                        {format(bookingDate, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {booking!.information && (
              <Card className="mt-6 bg-blue-50 border border-blue-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Information</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{booking!.information}</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500">
          <p>This page can be accessed by scanning the QR code on the confirmation PDF</p>
        </div>
      </div>
    </div>
  )
}

