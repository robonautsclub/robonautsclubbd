'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, Users, Mail, User, Banknote } from 'lucide-react'
import type { Booking } from '@/types/booking'
import type { Event } from '@/types/event'
import BookingActions from './BookingActions'
import ExportBookingsButton from './ExportBookingsButton'
import { formatEventDates, parseEventDates, isEventUpcoming } from '@/lib/dateUtils'

type Props = {
  event: Event
  bookings: Booking[]
}

export default function EventDetailsClient({ event, bookings }: Props) {
  const [showDetails, setShowDetails] = useState(false)
  const [nameFilter, setNameFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const eventDates = parseEventDates(event.date)

  const categoryOptions = useMemo(() => {
    const categoriesFromEvent = (event.categories || []).map((category) => category.name.trim()).filter(Boolean)
    const categoriesFromBookings = bookings.map((booking) => booking.category?.trim() || '').filter(Boolean)
    return Array.from(new Set([...categoriesFromEvent, ...categoriesFromBookings]))
  }, [event.categories, bookings])

  const filteredBookings = useMemo(() => {
    const normalizedName = nameFilter.trim().toLowerCase()
    return bookings.filter((booking) => {
      const matchName = !normalizedName || booking.name.toLowerCase().includes(normalizedName)
      const matchCategory = !categoryFilter || (booking.category || '') === categoryFilter
      return matchName && matchCategory
    })
  }, [bookings, nameFilter, categoryFilter])

  const totalCollected = useMemo(() => {
    return bookings.reduce((sum, booking) => {
      const amount = typeof booking.amountPaid === 'number' ? booking.amountPaid : Number(booking.amountPaid || 0)
      return Number.isFinite(amount) && amount > 0 ? sum + amount : sum
    }, 0)
  }, [bookings])

  const paidCount = useMemo(() => {
    return bookings.filter((booking) => {
      const amount = typeof booking.amountPaid === 'number' ? booking.amountPaid : Number(booking.amountPaid || 0)
      return booking.paymentStatus === 'paid' || (Number.isFinite(amount) && amount > 0)
    }).length
  }, [bookings])

  const registrationsByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const booking of bookings) {
      const key = booking.category?.trim() || 'Unspecified'
      map.set(key, (map.get(key) || 0) + 1)
    }
    return Array.from(map.entries())
  }, [bookings])

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{event.title}</h3>
          {eventDates.length > 0 && (
            <span
              className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium ${
                isEventUpcoming(event.date) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isEventUpcoming(event.date) ? 'Upcoming' : 'Past'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="mb-3 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          {showDetails ? 'Hide details' : 'View details'}
        </button>

        {showDetails && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Date{eventDates.length > 1 ? 's' : ''}</p>
                <p className="font-semibold text-gray-900">{formatEventDates(eventDates, 'long')}</p>
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

            {event.createdByName && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-100">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Created By</p>
                  <p className="font-semibold text-gray-900">{event.createdByName}</p>
                  {event.createdByEmail && <p className="text-xs text-gray-500 mt-1">{event.createdByEmail}</p>}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
              <p className="text-gray-700 leading-relaxed">{event.fullDescription || event.description}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Registrations</p>
          <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Filtered Registrations</p>
          <p className="text-2xl font-bold text-gray-900">{filteredBookings.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Paid Registrations</p>
          <p className="text-2xl font-bold text-gray-900">{paidCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Money Collected</p>
          <p className="text-2xl font-bold text-green-700">BDT {totalCollected}</p>
        </div>
      </div>

      {registrationsByCategory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">Registrations by Category</p>
          <div className="flex flex-wrap gap-2">
            {registrationsByCategory.map(([category, count]) => (
              <span key={category} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-200">
                {category}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              Registrations
              <span className="text-xs sm:text-sm font-normal text-gray-500">({filteredBookings.length})</span>
            </h3>
            <ExportBookingsButton bookings={bookings} eventTitle={event.title} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Filter by participant name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
            {categoryOptions.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              >
                <option value="">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No registrations found</h4>
            <p className="text-sm sm:text-base text-gray-600">Try changing filters or wait for new registrations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Registration ID</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">School</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Phone</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Paid</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Booked At</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => {
                  let formattedDate = 'N/A'
                  if (booking.createdAt) {
                    try {
                      const bookedDate = booking.createdAt instanceof Date ? booking.createdAt : new Date(booking.createdAt)
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
                        <div className="text-xs sm:text-sm font-mono font-semibold text-indigo-600">{booking.registrationId || 'N/A'}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{booking.name}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">{booking.category || 'Unspecified'}</div>
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
                        <div className="text-xs sm:text-sm text-gray-900">{booking.phone || 'N/A'}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900 flex items-center gap-1">
                          <Banknote className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          {booking.amountPaid ? `BDT ${booking.amountPaid}` : '—'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-500">{formattedDate}</div>
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
    </>
  )
}
