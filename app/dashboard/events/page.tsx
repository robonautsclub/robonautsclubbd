import { requireAuth } from '@/lib/auth'
import { getEvents } from '../actions'
import { Calendar, Plus, MapPin, Clock, Users, User } from 'lucide-react'
import { format, isFuture, isPast } from 'date-fns'
import CreateEventForm from './CreateEventForm'
import EventActions from './EventActions'

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const session = await requireAuth()
  const events = await getEvents()

  // Separate upcoming and past events
  const upcomingEvents = events.filter((event) => {
    if (!event.date) return false
    const eventDate = new Date(event.date)
    return isFuture(eventDate) || eventDate.toDateString() === new Date().toDateString()
  })

  const pastEvents = events.filter((event) => {
    if (!event.date) return false
    const eventDate = new Date(event.date)
    return isPast(eventDate) && eventDate.toDateString() !== new Date().toDateString()
  })

  return (
    <div className="max-w-7xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Events Management</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage and view all your events</p>
        </div>
        <CreateEventForm />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Events</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{events.length}</p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Upcoming</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{upcomingEvents.length}</p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Past Events</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-600">{pastEvents.length}</p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Create your first event to get started</p>
          <CreateEventForm />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">All Events</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                    Created By
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => {
                  const eventDate = event.date ? new Date(event.date) : null
                  const isUpcoming = eventDate && (isFuture(eventDate) || eventDate.toDateString() === new Date().toDateString())
                  return (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">{event.title}</div>
                        <div className="text-xs sm:text-sm text-gray-500 line-clamp-1 max-w-md">{event.description}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        {eventDate ? (
                          <div className="space-y-1">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {format(eventDate, 'MMM d, yyyy')}
                            </div>
                            {event.time && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.time}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-400">No date</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        {event.location ? (
                          <div className="text-xs sm:text-sm text-gray-900 flex items-center gap-1 max-w-xs">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                        {event.createdByName ? (
                          <div className="text-xs sm:text-sm text-gray-900">
                            <div className="flex items-center gap-1.5 mb-1">
                              <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                              <span className="font-medium">{event.createdByName}</span>
                            </div>
                            {event.createdByEmail && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {event.createdByEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-400">Unknown</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        {isUpcoming ? (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Upcoming
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Past
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                        <EventActions event={event} currentUserId={session.uid} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

