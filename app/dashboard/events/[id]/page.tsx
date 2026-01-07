import { requireAuth } from '@/lib/auth'
import { getEvent, getBookings } from '../../actions'
import { notFound } from 'next/navigation'
import { format, isFuture } from 'date-fns'
import { Calendar, Clock, MapPin, Users, Mail, Building2, ArrowLeft } from 'lucide-react'
import type { Booking } from '@/types/booking'
import Link from 'next/link'
import EventHeaderActions from './EventHeaderActions'
import BookingActions from './BookingActions'
import ExportBookingsButton from './ExportBookingsButton'

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params
  const event = await getEvent(id)
  const bookings = await getBookings(id)

  if (!event) {
    notFound()
  }

  const eventDate = event.date ? new Date(event.date) : null

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Event Details</h2>
          <p className="text-gray-600 mt-1">View event information and bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <EventHeaderActions event={event} />
          <Link
            href="/dashboard/events"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Events
          </Link>
        </div>
      </div>

      {/* Event Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{event.title}</h3>
          {eventDate && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              isFuture(eventDate) || eventDate.toDateString() === new Date().toDateString()
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isFuture(eventDate) || eventDate.toDateString() === new Date().toDateString() ? 'Upcoming' : 'Past'}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Date</p>
              <p className="font-semibold text-gray-900">
                {eventDate ? format(eventDate, 'MMMM d, yyyy') : 'No date set'}
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

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Bookings
              <span className="text-sm font-normal text-gray-500">({bookings.length})</span>
            </h3>
            <ExportBookingsButton bookings={bookings} eventTitle={event.title} />
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h4>
            <p className="text-gray-600">Bookings will appear here when users register for this event</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Booked At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.school}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {booking.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md line-clamp-2">
                          {booking.information}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formattedDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
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

