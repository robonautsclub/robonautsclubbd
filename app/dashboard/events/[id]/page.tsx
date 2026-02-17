import { requireAuth } from '@/lib/auth'
import { getEvent, getBookings } from '../../actions'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, Users, Mail, Building2, ArrowLeft, User } from 'lucide-react'
import type { Booking } from '@/types/booking'
import Link from 'next/link'
import EventHeaderActions from './EventHeaderActions'
import BookingActions from './BookingActions'
import ExportBookingsButton from './ExportBookingsButton'
import { getFirstEventDate, formatEventDates, parseEventDates, isEventUpcoming, hasEventPassed } from '@/lib/dateUtils'

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  const { id } = await params
  const event = await getEvent(id)
  const bookings = await getBookings(id)

  if (!event) {
    notFound()
  }

  const eventDates = parseEventDates(event.date)
  const eventDate = getFirstEventDate(event.date)

  return (
    <div className="max-w-7xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Event Details</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">View event information and registrations</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <EventHeaderActions event={event} currentUserId={session.uid} />
          <Link
            href="/dashboard/events"
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            ← Back to Events
          </Link>
        </div>
      </div>

      {/* Event Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{event.title}</h3>
          {eventDates.length > 0 && (
            <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
              isEventUpcoming(event.date)
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isEventUpcoming(event.date) ? 'Upcoming' : 'Past'}
            </span>
          )}
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Date{eventDates.length > 1 ? 's' : ''}</p>
              <p className="font-semibold text-gray-900">
                {formatEventDates(eventDates, 'long')}
              </p>
            </div>
          </div>

          {event.time && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Time</p>
                <p className="font-semibold text-gray-900">{event.time}</p>
              </div>
            </div>
          )}

          {(event.venue || event.location) && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 border border-purple-100">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Venue</p>
                <p className="font-semibold text-gray-900">{event.venue || event.location}</p>
              </div>
            </div>
          )}

          {event.eligibility && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-100">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Eligibility</p>
                <p className="font-semibold text-gray-900">{event.eligibility}</p>
              </div>
            </div>
          )}

          {/* Created By */}
          {event.createdByName && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-100">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Created By</p>
                <p className="font-semibold text-gray-900">{event.createdByName}</p>
                {event.createdByEmail && (
                  <p className="text-xs text-gray-500 mt-1">{event.createdByEmail}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
            <p className="text-gray-700 leading-relaxed">
              {event.fullDescription || event.description}
            </p>
          </div>

          {event.agenda && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Agenda</p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.agenda}</p>
            </div>
          )}
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              Registrations
              <span className="text-xs sm:text-sm font-normal text-gray-500">({bookings.length})</span>
            </h3>
            <ExportBookingsButton bookings={bookings} eventTitle={event.title} />
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No registrations yet</h4>
            <p className="text-sm sm:text-base text-gray-600">Registrations will appear here when users register for this event</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Registration ID
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                    Phone
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                    bKash Number
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                    Information
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Booked At
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking: Booking) => {
                  // Ensure consistent date handling to avoid hydration errors
                  let formattedDate = 'N/A'
                  if (booking.createdAt) {
                    try {
                      const bookedDate = booking.createdAt instanceof Date 
                        ? booking.createdAt 
                        : new Date(booking.createdAt)
                      // Check if date is valid
                      if (!isNaN(bookedDate.getTime())) {
                        formattedDate = format(bookedDate, 'MMM d, yyyy HH:mm')
                      }
                    } catch {
                      formattedDate = 'N/A'
                    }
                  }
                  
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-mono font-semibold text-indigo-600">
                          {booking.registrationId || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{booking.name}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">{booking.school}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900 flex items-center gap-1">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          {booking.email}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-xs sm:text-sm text-gray-900">
                          {booking.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-xs sm:text-sm text-gray-900">
                          {booking.bkashNumber || '—'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                        <div className="text-xs sm:text-sm text-gray-900 max-w-md line-clamp-2">
                          {booking.information}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-500">
                          {formattedDate}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        <BookingActions booking={booking} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

