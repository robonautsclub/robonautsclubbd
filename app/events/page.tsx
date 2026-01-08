import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { getPublicEvents } from './actions'
import { Event } from '@/types/event'
import AutoRefresh from './AutoRefresh'
import { parseEventDates, formatEventDates, getFirstEventDate, isEventUpcoming, hasEventPassed } from '@/lib/dateUtils'

export const metadata: Metadata = {
  title: "Events",
  description: "Discover upcoming robotics workshops, competitions, bootcamps, and STEM events in Bangladesh. Join hands-on training sessions, participate in Robofest, and connect with 500+ robotics enthusiasts.",
  keywords: [
    "robotics events Bangladesh",
    "STEM workshops",
    "robotics competitions",
    "Robofest",
    "robotics bootcamp",
    "STEM training events",
    "robotics workshop Dhaka",
  ],
  openGraph: {
    title: "Robotics Events | Robonauts Club",
    description: "Discover upcoming robotics workshops, competitions, bootcamps, and STEM events in Bangladesh.",
    url: "/events",
    images: [
      {
        url: "/robotics-event.jpg",
        width: 1200,
        height: 630,
        alt: "Robonauts Club Events",
      },
    ],
  },
  alternates: {
    canonical: "/events",
  },
};

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
  <div className="mb-6 sm:mb-8">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
      <div className="flex-1">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base md:text-lg text-gray-600">{subtitle}</p>
        )}
      </div>
      {count !== undefined && (
        <div className="flex sm:hidden md:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-100 rounded-full self-start sm:self-auto">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
          <span className="text-base sm:text-lg font-bold text-indigo-700">{count}</span>
          <span className="text-xs sm:text-sm text-indigo-700">Events</span>
        </div>
      )}
    </div>
  </div>
)

// --- Enhanced Event Card Component ---
const EventCard = ({ event }: { event: Event }) => {
  const eventDates = parseEventDates(event.date)
  const firstDate = getFirstEventDate(event.date)
  const isUpcoming = isEventUpcoming(event.date)
  const status = isUpcoming ? 'Upcoming' : 'Completed'
  const daysUntil = firstDate && isUpcoming
    ? differenceInDays(firstDate, new Date())
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
        <div className="relative h-40 sm:h-48 bg-linear-to-br from-indigo-400 via-blue-400 to-purple-400 overflow-hidden">
          {event.image ? (
            <>
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Calendar className="w-20 h-20 text-white/80" />
              </div>
            </>
          )}
          {isUpcoming && daysUntil !== null && daysUntil >= 0 && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg z-10">
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
        <div className="p-4 sm:p-6 flex flex-col flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-indigo-500 transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Event Details */}
          <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
              <span className="font-medium">
                {formatEventDates(eventDates)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-700 text-xs sm:text-sm mb-3 sm:mb-4 flex-1 line-clamp-3">
            {event.description}
          </p>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
              {event.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
              {event.tags.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                  +{event.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-indigo-500 font-semibold group-hover:text-indigo-700 transition-colors text-sm sm:text-base">
              <span>View Details</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
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
    const dateA = getFirstEventDate(a.date)
    const dateB = getFirstEventDate(b.date)
    
    if (!dateA && !dateB) return 0
    if (!dateA) return 1
    if (!dateB) return -1

    const aIsPast = hasEventPassed(a.date)
    const bIsPast = hasEventPassed(b.date)

    // Upcoming events first
    if (aIsPast && !bIsPast) return 1
    if (!aIsPast && bIsPast) return -1

    // Within same group, sort by date (newest first for past, earliest first for upcoming)
    if (aIsPast) return dateB.getTime() - dateA.getTime()
    return dateA.getTime() - dateB.getTime()
  })

  const upcomingEvents = sortedEvents.filter((event) => {
    return isEventUpcoming(event.date)
  })

  const pastEvents = sortedEvents.filter((event) => {
    return hasEventPassed(event.date)
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AutoRefresh />
      {/* Hero Header */}
      <section
        className="relative text-white py-16 sm:py-20 md:py-24 px-4 sm:px-6 overflow-hidden"
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
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm mb-4 sm:mb-6">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">
                {upcomingEvents.length} Upcoming Events
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 tracking-tight px-2">
              Events & Workshops
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed px-2">
              Join us for exciting robotics competitions, hands-on STEM
              workshops, and educational bootcamps designed to inspire the next
              generation of innovators.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" />
                <span className="text-2xl sm:text-3xl font-bold">{upcomingEvents.length}</span>
              </div>
              <p className="text-blue-100 text-xs sm:text-sm">Upcoming Events</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" />
                <span className="text-2xl sm:text-3xl font-bold">{events.length}</span>
              </div>
              <p className="text-blue-100 text-xs sm:text-sm">Total Events</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" />
                <span className="text-2xl sm:text-3xl font-bold">{pastEvents.length}</span>
              </div>
              <p className="text-blue-100 text-xs sm:text-sm">Past Events</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Upcoming Events Section */}
          {upcomingEvents.length > 0 ? (
            <section className="mb-12 sm:mb-16 md:mb-20">
              <SectionHeader
                title="Upcoming Events"
                subtitle="Don't miss out on these exciting opportunities to learn and compete"
                count={upcomingEvents.length}
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ) : (
            <section className="mb-12 sm:mb-16 md:mb-20">
              <div className="bg-white rounded-2xl p-8 sm:p-12 border-2 border-dashed border-gray-300 text-center">
                <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  No Upcoming Events
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  Check back soon for new events and workshops!
                </p>
                <a
                  href="mailto:info@robonautsclub.com"
                  className="inline-block py-2 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Call to action */}
          <div className="mt-12 sm:mt-16 md:mt-20 bg-linear-to-br from-indigo-400 to-blue-500 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-white">
            <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-indigo-200" />
            <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 px-2">
              Want to Organize an Event?
            </h3>
            <p className="text-base sm:text-lg text-indigo-100 mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
              We&apos;re always open to collaborating with schools and
              communities to bring robotics education to more students.
            </p>
            <a
              href="mailto:info@robonautsclub.com"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-indigo-500 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg text-sm sm:text-base"
            >
              Contact Us
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
