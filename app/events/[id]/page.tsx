import Link from 'next/link'
import { Metadata } from 'next'
import Script from 'next/script'
import { Calendar, Clock, MapPin, ArrowLeft, Users, Monitor, Building2, Banknote } from 'lucide-react'
import { getPublicEvent } from '../actions'
import { Event } from '@/types/event'
import { notFound } from 'next/navigation'
import BookingForm from './BookingForm'
import EventImage from './EventImage'
import AutoRefresh from '../AutoRefresh'
import { SITE_CONFIG, getEventSchema, getBreadcrumbSchema } from '@/lib/seo'
import { parseEventDates, formatEventDates, hasEventPassed } from '@/lib/dateUtils'


// Helper function to validate and get image URL
const getEventImageUrl = (imageUrl?: string): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return '/robotics-event.jpg'
  }

  const trimmed = imageUrl.trim()
  
  // Check if it's a valid relative path (starts with /)
  if (trimmed.startsWith('/')) {
    return trimmed
  }
  
  // Check if it's a valid absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  
  // Invalid URL, use default
  return '/robot.gif'
}

// Helper function to get tags from event
const getEventTags = (event: Event) => {
  // Use stored tags if available, otherwise fall back to extracted tags
  if (event.tags && event.tags.length > 0) {
    return event.tags
  }

  // Fallback: Extract tags from content if no tags are stored
  const tags: string[] = []
  const titleLower = event.title.toLowerCase()
  const descLower = (event.fullDescription || event.description).toLowerCase()

  if (titleLower.includes('workshop') || descLower.includes('workshop')) tags.push('Workshop')
  if (titleLower.includes('competition') || titleLower.includes('olympiad') || titleLower.includes('robfest')) tags.push('Competition')
  if (titleLower.includes('bootcamp') || descLower.includes('bootcamp')) tags.push('Bootcamp')
  if (titleLower.includes('coding') || descLower.includes('programming') || descLower.includes('python')) tags.push('Programming')
  if (descLower.includes('robotics') || titleLower.includes('robot')) tags.push('Robotics')
  if (descLower.includes('stem') || descLower.includes('science')) tags.push('STEM')
  if (descLower.includes('ai') || descLower.includes('artificial intelligence')) tags.push('AI')
  if (descLower.includes('arduino') || descLower.includes('electronics')) tags.push('Electronics')

  // Default tags if none found
  if (tags.length === 0) {
    tags.push('Robotics', 'STEM', 'Education')
  }

  return tags.slice(0, 4) // Limit to 4 tags
}

// Event Passed Component
const EventPassedMessage = () => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
      <div className="text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          Event Has Passed
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          This event has already taken place. Check out our upcoming events for
          new opportunities!
        </p>
        <Link
          href="/events"
          className="inline-block py-2 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
        >
          View Upcoming Events
        </Link>
      </div>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const event = await getPublicEvent(id)

  if (!event) {
    return {
      title: 'Event Not Found',
    }
  }

  const eventUrl = `${SITE_CONFIG.url}/events/${id}`
  const eventImage = getEventImageUrl(event.image)

  return {
    title: event.title,
    description: event.fullDescription || event.description,
    keywords: event.tags || ['robotics', 'STEM', 'workshop', 'competition'],
    openGraph: {
      title: event.title,
      description: event.fullDescription || event.description,
      url: eventUrl,
      type: 'website',
      images: [
        {
          url: eventImage.startsWith('http') ? eventImage : `${SITE_CONFIG.url}${eventImage}`,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description,
      images: [eventImage.startsWith('http') ? eventImage : `${SITE_CONFIG.url}${eventImage}`],
    },
    alternates: {
      canonical: `/events/${id}`,
    },
  }
}

// ISR: Revalidate every 60 seconds to keep content fresh
// Pages are statically generated and updated on-demand when events change
export const revalidate = 60

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getPublicEvent(id)

  if (!event) {
    notFound()
  }

  const eventDates = parseEventDates(event.date)
  const hasPassed = hasEventPassed(event.date)
  const tags = getEventTags(event)
  const isOnline = event.location.toLowerCase().includes('online') || event.venue?.toLowerCase().includes('online')

  // Generate structured data
  const eventUrl = `${SITE_CONFIG.url}/events/${id}`
  // For structured data, use first date or comma-separated string
  const schemaDate = Array.isArray(event.date) 
    ? event.date.length > 0 ? event.date[0] : ''
    : typeof event.date === 'string' && event.date.includes(',')
    ? event.date.split(',')[0].trim()
    : event.date || ''

  const eventSchema = getEventSchema({
    id: event.id,
    title: event.title,
    description: event.fullDescription || event.description,
    date: schemaDate,
    time: event.time || '9:00 AM - 5:00 PM',
    location: event.location,
    venue: event.venue,
    image: getEventImageUrl(event.image),
    url: eventUrl,
  })

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Events', url: '/events' },
    { name: event.title, url: `/events/${id}` },
  ])

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50">
      <Script
        id="event-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AutoRefresh />
      {/* Compact Header Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 h-96 bg-blue-200 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 h-96 bg-indigo-200 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-indigo-600 mb-3 sm:mb-4 transition-colors group text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Events</span>
          </Link>
          
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 mb-2 sm:mb-3 leading-tight">
              {event.title}
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed">
              {event.description}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Image and Content Sections */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            {/* Main Event Image */}
            <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
              <EventImage
                src={getEventImageUrl(event.image)}
                alt={event.title}
                priority
              />
            </div>

            {/* Overview Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Overview</h3>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
                {event.fullDescription || event.description}
              </p>
            </div>

            {/* Event Details Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Event Details</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Date{eventDates.length > 1 ? 's' : ''}</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">{formatEventDates(eventDates, 'long')}</p>
                  </div>
                </div>
                {event.time && (
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Time</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{event.time}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-purple-50/50 border border-purple-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Venue</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 wrap-break-word">{event.venue || event.location}</p>
                  </div>
                </div>
                {isOnline ? (
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-cyan-50/50 border border-cyan-100">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                      <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Mode</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">Online Streaming</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-purple-50/50 border border-purple-100">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Mode</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">In-person</p>
                    </div>
                  </div>
                )}
                {event.eligibility && (
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-green-50/50 border border-green-100">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Audience</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 wrap-break-word">{event.eligibility}</p>
                    </div>
                  </div>
                )}
                {event.isPaid && event.amount != null && (
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Fee</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">BDT {event.amount}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agenda Section */}
            {event.agenda && (
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Agenda</h3>
                <div className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg whitespace-pre-line">
                  {event.agenda}
                </div>
              </div>
            )}

            {/* About the Organizer Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">About the Organizer</h3>
              <div className="space-y-3 sm:space-y-4 text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
                <p>
                  Robonauts Club is Bangladesh&apos;s first youth robotics club, dedicated to preparing students for RoboFest and global STEM challenges. We empower the next generation of robotics innovators through hands-on learning, expert mentorship, and competitive opportunities.
                </p>
                <p>
                  Our events bring together passionate students, experienced mentors, and industry leaders to share knowledge, tools, and inspiration that shape the future of robotics and technology in Bangladesh.
                </p>
              </div>
            </div>

            {/* Tags Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 shadow-lg">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs sm:text-sm font-medium border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 sm:top-6">
              {hasPassed ? (
                <EventPassedMessage />
              ) : (
                <BookingForm event={event} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

