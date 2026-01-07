import Link from 'next/link'
import { Calendar, Clock, MapPin, ArrowLeft, Users, Monitor, Building2 } from 'lucide-react'
import { format, parse, isPast } from 'date-fns'
import { getPublicEvent } from '../actions'
import { Event } from '@/types/event'
import { notFound } from 'next/navigation'
import BookingForm from './BookingForm'
import EventImage from './EventImage'


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
  return '/robotics-event.jpg'
}

// Helper function to extract tags from event
const getEventTags = (event: Event) => {
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
    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Event Has Passed
        </h3>
        <p className="text-gray-600 mb-4">
          This event has already taken place. Check out our upcoming events for
          new opportunities!
        </p>
        <Link
          href="/events"
          className="inline-block py-2 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors"
        >
          View Upcoming Events
        </Link>
      </div>
    </div>
  )
}

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

  const eventDate = parse(event.date, 'yyyy-MM-dd', new Date())
  const hasPassed = isPast(eventDate) && eventDate.toDateString() !== new Date().toDateString()
  const tags = getEventTags(event)
  const isOnline = event.location.toLowerCase().includes('online') || event.venue?.toLowerCase().includes('online')

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      {/* Compact Header Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 h-96 bg-blue-200 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 h-96 bg-indigo-200 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-6 md:pt-8 pb-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-indigo-600 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Events</span>
          </Link>
          
          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-3 leading-tight">
              {event.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed">
              {event.description}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Image and Content Sections */}
          <div className="lg:col-span-2 space-y-5">
            {/* Main Event Image */}
            <div className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
              <EventImage
                src={getEventImageUrl(event.image)}
                alt={event.title}
                priority
              />
            </div>

            {/* Overview Section */}
            <div className="bg-white rounded-2xl p-4 md:p-8 border-2 border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Overview</h3>
              <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                {event.fullDescription || event.description}
              </p>
            </div>

            {/* Event Details Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Event Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Date</p>
                    <p className="font-semibold text-gray-900">{format(eventDate, 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                {event.time && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Time</p>
                      <p className="font-semibold text-gray-900">{event.time}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">Venue</p>
                    <p className="font-semibold text-gray-900">{event.venue || event.location}</p>
                  </div>
                </div>
                {isOnline ? (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                      <Monitor className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">Mode</p>
                      <p className="font-semibold text-gray-900">Online Streaming</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">Mode</p>
                      <p className="font-semibold text-gray-900">In-person</p>
                    </div>
                  </div>
                )}
                {event.eligibility && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50/50 border border-green-100">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">Audience</p>
                      <p className="font-semibold text-gray-900">{event.eligibility}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agenda Section */}
            {event.agenda && (
              <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-gray-200 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Agenda</h3>
                <div className="text-gray-700 leading-relaxed text-base md:text-lg whitespace-pre-line">
                  {event.agenda}
                </div>
              </div>
            )}

            {/* About the Organizer Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">About the Organizer</h3>
              <div className="space-y-4 text-gray-700 leading-relaxed text-base md:text-lg">
                <p>
                  Robonauts Club is Bangladesh&apos;s first youth robotics club, dedicated to preparing students for RoboFest and global STEM challenges. We empower the next generation of robotics innovators through hands-on learning, expert mentorship, and competitive opportunities.
                </p>
                <p>
                  Our events bring together passionate students, experienced mentors, and industry leaders to share knowledge, tools, and inspiration that shape the future of robotics and technology in Bangladesh.
                </p>
              </div>
            </div>

            {/* Tags Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-gray-200 shadow-lg">
              <div className="flex flex-wrap gap-3">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
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

