import React from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react'
import { format, parse, isPast, isFuture, differenceInDays } from 'date-fns'
import { getPublicEvents } from './actions'
import { Event } from '@/types/event'

// --- Helper Components ---
const SectionHeader = ({
  title,
  subtitle,
  count,
}: {
  title: string
  subtitle?: string
  count?: number
}) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-gray-600">{subtitle}</p>
        )}
      </div>
      {count !== undefined && (
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <span className="text-lg font-bold text-indigo-700">{count}</span>
          <span className="text-sm text-indigo-700">Events</span>
        </div>
      )}
    </div>
  </div>
)

// --- Enhanced Event Card Component ---
const EventCard = ({ event }: { event: Event }) => {
  const eventDate = parse(event.date, 'yyyy-MM-dd', new Date())
  const isUpcoming =
    isFuture(eventDate) ||
    eventDate.toDateString() === new Date().toDateString()
  const status = isUpcoming ? 'Upcoming' : 'Completed'
  const daysUntil = isUpcoming
    ? differenceInDays(eventDate, new Date())
    : null

  return (
    <Link href={`/events/${event.id}`}>
      <div className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-indigo-300 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
              isUpcoming
                ? 'bg-green-500 text-white'
                : 'bg-gray-400 text-white'
            }`}
          >
            {status}
          </span>
        </div>

        {/* Image/Visual Section */}
        <div className="relative h-48 bg-gradient-to-br from-indigo-400 via-blue-400 to-purple-400 overflow-hidden">
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="w-20 h-20 text-white/80" />
          </div>
          {isUpcoming && daysUntil !== null && daysUntil >= 0 && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <span className="text-sm font-bold text-indigo-700">
                {daysUntil === 0
                  ? 'Today!'
                  : daysUntil === 1
                    ? 'Tomorrow'
                    : `${daysUntil} days away`}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-500 transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="font-medium">
                {format(eventDate, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-700 text-sm mb-4 flex-1 line-clamp-3">
            {event.description}
          </p>

          {/* CTA Button */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-indigo-500 font-semibold group-hover:text-indigo-700 transition-colors">
              <span>View Details</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// --- Main Page ---
export default async function EventsPage() {
  // Fetch events from Firestore
  const events = await getPublicEvents()

  // Sort events: upcoming first, then past events
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = parse(a.date, 'yyyy-MM-dd', new Date())
    const dateB = parse(b.date, 'yyyy-MM-dd', new Date())
    const now = new Date()

    const aIsPast =
      isPast(dateA) && dateA.toDateString() !== now.toDateString()
    const bIsPast =
      isPast(dateB) && dateB.toDateString() !== now.toDateString()

    // Upcoming events first
    if (aIsPast && !bIsPast) return 1
    if (!aIsPast && bIsPast) return -1

    // Within same group, sort by date (newest first for past, earliest first for upcoming)
    if (aIsPast) return dateB.getTime() - dateA.getTime()
    return dateA.getTime() - dateB.getTime()
  })

  const upcomingEvents = sortedEvents.filter((event) => {
    const eventDate = parse(event.date, 'yyyy-MM-dd', new Date())
    return (
      isFuture(eventDate) ||
      eventDate.toDateString() === new Date().toDateString()
    )
  })

  const pastEvents = sortedEvents.filter((event) => {
    const eventDate = parse(event.date, 'yyyy-MM-dd', new Date())
    return (
      isPast(eventDate) &&
      eventDate.toDateString() !== new Date().toDateString()
    )
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Header */}
      <section
        className="relative text-white py-24 px-6 overflow-hidden"
        style={{
          backgroundImage: "url('/robobanner.gif')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">
                {upcomingEvents.length} Upcoming Events
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
              Events & Workshops
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Join us for exciting robotics competitions, hands-on STEM
              workshops, and educational bootcamps designed to inspire the next
              generation of innovators.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-blue-200" />
                <span className="text-3xl font-bold">{upcomingEvents.length}</span>
              </div>
              <p className="text-blue-100 text-sm">Upcoming Events</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-blue-200" />
                <span className="text-3xl font-bold">{events.length}</span>
              </div>
              <p className="text-blue-100 text-sm">Total Events</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-blue-200" />
                <span className="text-3xl font-bold">{pastEvents.length}</span>
              </div>
              <p className="text-blue-100 text-sm">Past Events</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Upcoming Events Section */}
          {upcomingEvents.length > 0 ? (
            <section className="mb-20">
              <SectionHeader
                title="Upcoming Events"
                subtitle="Don't miss out on these exciting opportunities to learn and compete"
                count={upcomingEvents.length}
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ) : (
            <section className="mb-20">
              <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-gray-300 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No Upcoming Events
                </h3>
                <p className="text-gray-600 mb-6">
                  Check back soon for new events and workshops!
                </p>
                <a
                  href="mailto:info@robonautsclub.com"
                  className="inline-block py-2 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Contact Us
                </a>
              </div>
            </section>
          )}

          {/* Past Events Section */}
          {pastEvents.length > 0 && (
            <section>
              <SectionHeader
                title="Past Events"
                subtitle="A look back at events we've hosted"
                count={pastEvents.length}
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Call to action */}
          <div className="mt-20 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-3xl p-12 text-center text-white">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-indigo-200" />
            <h3 className="text-3xl font-bold mb-4">
              Want to Organize an Event?
            </h3>
            <p className="text-lg text-indigo-100 mb-6 max-w-2xl mx-auto">
              We&apos;re always open to collaborating with schools and
              communities to bring robotics education to more students.
            </p>
            <a
              href="mailto:info@robonautsclub.com"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-500 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Contact Us
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
