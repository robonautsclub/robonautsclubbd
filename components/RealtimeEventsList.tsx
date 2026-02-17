'use client'

import { useMemo, memo, useState } from 'react'
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents'
import { parseEventDates, formatEventDates, isEventUpcoming, hasEventPassed, getFirstEventDate } from '@/lib/dateUtils'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react'
import { Event } from '@/types/event'
import { SITE_CONFIG } from '@/lib/site-config'
import { differenceInDays, differenceInHours } from 'date-fns'

/**
 * Get current time in Bangladesh Standard Time (BST = UTC+6)
 */
function getBSTTime(): Date {
  const now = new Date()
  // Convert to BST (UTC+6)
  // Get UTC timestamp
  const utcTimestamp = now.getTime() + (now.getTimezoneOffset() * 60000)
  // Add 6 hours for BST (UTC+6)
  const bstTimestamp = utcTimestamp + (6 * 3600000)
  return new Date(bstTimestamp)
}

/**
 * Convert event date string to Date object in BST
 * Event dates are stored as 'YYYY-MM-DD' and should be treated as BST midnight
 */
function getEventDateInBST(dateString: string): Date {
  // Parse the date string (YYYY-MM-DD)
  const [year, month, day] = dateString.split('-').map(Number)
  // Create date at midnight BST (UTC+6)
  // We create it as UTC midnight, then add 6 hours to get BST midnight
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  // Convert to BST by adding 6 hours
  const bstDate = new Date(utcDate.getTime() + (6 * 3600000))
  return bstDate
}

/**
 * Check if an event is currently going on
 * Returns true if current date/time is within the event's date and time
 */
function isEventGoingOn(event: Event): boolean {
  const bstNow = getBSTTime()
  const eventDates = parseEventDates(event.date)
  
  if (eventDates.length === 0) return false
  
  // Check if today is within the event date range
  const sortedDates = [...eventDates].sort()
  const firstEventDate = getEventDateInBST(sortedDates[0])
  const lastEventDate = getEventDateInBST(sortedDates[sortedDates.length - 1])
  
  const daysFromStart = differenceInDays(bstNow, firstEventDate)
  const daysFromEnd = differenceInDays(bstNow, lastEventDate)
  
  // Check if today is within the event date range (inclusive)
  const isWithinRange = daysFromStart >= 0 && daysFromEnd <= 0
  
  if (!isWithinRange) return false
  
  // Find which event date matches today
  let matchedEventDate: string | null = null
  for (const eventDateStr of sortedDates) {
    const eventDateBST = getEventDateInBST(eventDateStr)
    const daysDiff = differenceInDays(eventDateBST, bstNow)
    if (daysDiff === 0) {
      matchedEventDate = eventDateStr
      break
    }
  }
  
  // If no exact match but we're within range, use the first date
  if (!matchedEventDate) {
    matchedEventDate = sortedDates[0]
  }
  
  // If event has a time, check if current time is past the event start time
  if (event.time && matchedEventDate) {
    try {
      // Parse time string (e.g., "10:00 AM", "2:30 PM", "14:00")
      const timeStr = event.time.trim()
      
      // Handle formats like "10:00 AM" or "2:30 PM"
      const is12Hour = /AM|PM/i.test(timeStr)
      let eventHours = 0
      let eventMinutes = 0
      
      if (is12Hour) {
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
        if (match) {
          let hours = parseInt(match[1])
          const minutes = parseInt(match[2])
          const period = match[3].toUpperCase()
          
          if (period === 'PM' && hours !== 12) hours += 12
          if (period === 'AM' && hours === 12) hours = 0
          
          eventHours = hours
          eventMinutes = minutes
        } else {
          // If parsing fails, assume event is going on if it's today
          return true
        }
      } else {
        // Handle 24-hour format (e.g., "14:00", "09:30")
        const match = timeStr.match(/(\d+):(\d+)/)
        if (match) {
          eventHours = parseInt(match[1])
          eventMinutes = parseInt(match[2])
        } else {
          // If parsing fails, assume event is going on if it's today
          return true
        }
      }
      
      // Get the matched event date in BST and create datetime
      const eventDateBST = getEventDateInBST(matchedEventDate)
      const eventDateTime = new Date(eventDateBST)
      eventDateTime.setHours(eventHours, eventMinutes, 0, 0)
      
      // Check if current time is past or equal to event start time
      // Assume event runs for 8 hours (full day event) - adjust as needed
      const eventEndTime = new Date(eventDateTime)
      eventEndTime.setHours(eventEndTime.getHours() + 8)
      
      return bstNow >= eventDateTime && bstNow <= eventEndTime
    } catch (error) {
      // If time parsing fails, assume event is going on if it's today
      return true
    }
  }
  
  // If no time specified, assume event is going on all day if it's today
  return true
}

interface RealtimeEventsListProps {
  initialEvents?: Event[]
}

const FALLBACK_IMAGE = '/robot.gif'

// Event Card Component (same as in events/page.tsx but for client component)
// Memoized to prevent unnecessary re-renders
const EventCard = memo(({ event }: { event: Event }) => {
  const [imageError, setImageError] = useState(false)
  const eventDates = parseEventDates(event.date)
  const firstDate = getFirstEventDate(event.date)
  const isUpcoming = isEventUpcoming(event.date)
  const status = isUpcoming ? 'Upcoming' : 'Completed'
  const imageSrc = event.image && !imageError ? event.image : FALLBACK_IMAGE
  
  // Calculate time until event in Bangladesh Standard Time
  let timeDisplay: string | null = null
  if (firstDate && isUpcoming) {
    // First check if event is currently going on
    if (isEventGoingOn(event)) {
      timeDisplay = 'Event going on'
    } else {
      const bstNow = getBSTTime()
      // Parse the event date string and convert to BST
      const eventDateStr = Array.isArray(event.date) 
        ? event.date[0] 
        : typeof event.date === 'string' && event.date.includes(',')
        ? event.date.split(',')[0].trim()
        : event.date || ''
      
      if (eventDateStr) {
        const eventDateBST = getEventDateInBST(eventDateStr)
        const hoursUntil = differenceInHours(eventDateBST, bstNow)
        const daysUntil = differenceInDays(eventDateBST, bstNow)
        
        if (daysUntil === 0) {
          // Same day but event hasn't started yet
          if (hoursUntil >= 0) {
            timeDisplay = 'Starting soon'
          } else {
            // Past today, might be multi-day event still going
            timeDisplay = 'Event going on'
          }
        } else if (hoursUntil < 24 && hoursUntil >= 0) {
          // Less than 24 hours - show "Starting soon"
          timeDisplay = 'Starting soon'
        } else if (hoursUntil >= 24 && hoursUntil < 48) {
          // Between 24-48 hours - show "Tomorrow"
          timeDisplay = 'Tomorrow'
        } else if (daysUntil > 0) {
          // More than 48 hours - show days count
          timeDisplay = `${daysUntil} days away`
        }
      }
    }
  }

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
          <Image
            src={imageSrc}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
          {isUpcoming && timeDisplay && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg z-10">
              <span className="text-sm font-bold text-indigo-700">
                {timeDisplay}
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
            {event.time && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                <span>{event.time}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
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
})

EventCard.displayName = 'EventCard'

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
          <span className="text-base sm:text-lg font-bold text-indigo-700">{count}</span>
          <span className="text-xs sm:text-sm text-indigo-700">Events</span>
        </div>
      )}
    </div>
  </div>
)

export default function RealtimeEventsList({ initialEvents = [] }: RealtimeEventsListProps) {
  const { events, loading, error } = useRealtimeEvents(true)

  // Use real-time events if available, otherwise fall back to initial events
  const displayEvents = useMemo(() => {
    return events.length > 0 ? events : initialEvents
  }, [events, initialEvents])

  // Sort events: upcoming first, then past events
  // Memoize to prevent unnecessary re-sorting
  const sortedEvents = useMemo(() => {
    return [...displayEvents].sort((a, b) => {
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
  }, [displayEvents])

  const upcomingEvents = useMemo(() => {
    return sortedEvents.filter((event) => isEventUpcoming(event.date))
  }, [sortedEvents])

  const pastEvents = useMemo(() => {
    return sortedEvents.filter((event) => hasEventPassed(event.date))
  }, [sortedEvents])

  if (error && displayEvents.length === 0) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg">
        <p className="text-sm font-medium">Error loading events: {error}</p>
      </div>
    )
  }

  return (
    <>
      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 ? (
        <section className="mb-12 sm:mb-16 md:mb-20">
          <SectionHeader
            title="Upcoming Events"
            subtitle="Don't miss out on these exciting opportunities to learn and compete"
            count={upcomingEvents.length}
          />
          {loading && displayEvents.length === 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 p-6 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-xl mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      ) : !loading ? (
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
              href={`mailto:${SITE_CONFIG.email}`}
              className="inline-block py-2 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
            >
              Contact Us
            </a>
          </div>
        </section>
      ) : null}

      {/* Past Events Section */}
      {pastEvents.length > 0 && (
        <section>
          <SectionHeader
            title="Past Events"
            subtitle="Browse our previous events and workshops"
            count={pastEvents.length}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

