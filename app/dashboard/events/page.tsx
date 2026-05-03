import { requireAuth } from '@/lib/auth'
import { getEvents } from '../actions'
import { Calendar, Plus, MapPin, Clock, Users, User, Archive } from 'lucide-react'
import CreateEventForm from './CreateEventForm'
import EventActions from './EventActions'
import { parseEventDates, formatEventDates, isEventUpcoming, hasEventPassed } from '@/lib/dateUtils'
import Link from 'next/link'

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const session = await requireAuth()
  const events = await getEvents()

  // Separate upcoming and past events
  const upcomingEvents = events.filter((event) => {
    return isEventUpcoming(event.date)
  })

  const pastEvents = events.filter((event) => {
    return hasEventPassed(event.date)
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
        <div className="space-y-6 sm:space-y-8">
          {/* Upcoming Events Section */}
          {upcomingEvents.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Upcoming Events</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{upcomingEvents.length} active {upcomingEvents.length === 1 ? 'event' : 'events'}</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Event Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        Created By
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upcomingEvents.map((event) => {
                      const eventDates = parseEventDates(event.date)
                      return (
                        <tr key={event.id} className="hover:bg-green-50/50 transition-colors">
                          <td className="px-3 sm:px-6 py-4">
                            <Link
                              href={`/dashboard/events/${event.id}`}
                              prefetch={false}
                              className="text-sm font-semibold text-gray-900 mb-1 hover:text-indigo-600 transition-colors"
                            >
                              {event.title}
                            </Link>
                            <div className="text-xs text-gray-500 line-clamp-1 max-w-md">{event.description}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            {eventDates.length > 0 ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatEventDates(eventDates, 'short')}
                                </div>
                                {event.time && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {event.time}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No date</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            {event.location ? (
                              <div className="text-sm text-gray-900 flex items-center gap-1 max-w-xs">
                                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                            {event.createdByName ? (
                              <div className="text-sm text-gray-900">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">{event.createdByName}</span>
                                </div>
                                {event.createdByEmail && (
                                  <div className="text-xs text-gray-500 truncate max-w-xs">
                                    {event.createdByEmail}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Unknown</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                              Upcoming
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-right">
                            <EventActions event={event} currentUserId={session.uid} userRole={session.role} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Archive Section for Past Events */}
          {pastEvents.length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl shadow-sm border border-gray-300 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-300 bg-gradient-to-r from-slate-100 to-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center">
                    <Archive className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">Archive</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{pastEvents.length} past {pastEvents.length === 1 ? 'event' : 'events'}</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto bg-white/50">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-slate-100/80 border-b border-gray-300">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Event Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        Created By
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/30 divide-y divide-gray-300">
                    {pastEvents.map((event) => {
                      const eventDates = parseEventDates(event.date)
                      return (
                        <tr key={event.id} className="hover:bg-slate-100/50 transition-colors opacity-90">
                          <td className="px-3 sm:px-6 py-4">
                            <Link
                              href={`/dashboard/events/${event.id}`}
                              prefetch={false}
                              className="text-sm font-semibold text-gray-700 mb-1 hover:text-indigo-600 transition-colors"
                            >
                              {event.title}
                            </Link>
                            <div className="text-xs text-gray-500 line-clamp-1 max-w-md">{event.description}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            {eventDates.length > 0 ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-700">
                                  {formatEventDates(eventDates, 'short')}
                                </div>
                                {event.time && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {event.time}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No date</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            {event.location ? (
                              <div className="text-sm text-gray-700 flex items-center gap-1 max-w-xs">
                                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                            {event.createdByName ? (
                              <div className="text-sm text-gray-700">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">{event.createdByName}</span>
                                </div>
                                {event.createdByEmail && (
                                  <div className="text-xs text-gray-500 truncate max-w-xs">
                                    {event.createdByEmail}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Unknown</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 border border-slate-300">
                              Past
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-right">
                            <EventActions event={event} currentUserId={session.uid} userRole={session.role} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state if no events in both sections */}
          {upcomingEvents.length === 0 && pastEvents.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">Create your first event to get started</p>
              <CreateEventForm />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

