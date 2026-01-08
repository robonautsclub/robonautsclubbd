import { requireAuth } from '@/lib/auth'
import { getEvents } from './actions'
import { User, Mail, Key, Calendar, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { isEventUpcoming, getFirstEventDate, formatEventDates, parseEventDates } from '@/lib/dateUtils'

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await requireAuth()
  const events = await getEvents()

  // Calculate stats
  const totalEvents = events.length
  const upcomingEvents = events.filter((event) => {
    return isEventUpcoming(event.date)
  }).length
  const pastEvents = totalEvents - upcomingEvents

  // Get recent events (last 5)
  const recentEvents = [...events]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 5)

  return (
    <div className="max-w-7xl space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-linear-to-r from-indigo-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {session.name.split(' ')[0]}!</h1>
        <p className="text-sm sm:text-base text-indigo-100">Here&apos;s what&apos;s happening with your events today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Events</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalEvents}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Upcoming Events</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{upcomingEvents}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Past Events</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-600">{pastEvents}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* User Information Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              Account Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1">Name</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{session.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{session.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1">User ID</p>
                  <p className="font-mono text-xs font-semibold text-gray-900 break-all">{session.uid}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                Recent Events
              </h3>
              <Link
                href="/dashboard/events"
                className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all →
              </Link>
            </div>

            {recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No events yet</p>
                <Link
                  href="/dashboard/events"
                  className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Create your first event →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => {
                  const eventDates = parseEventDates(event.date)
                  const firstDate = getFirstEventDate(event.date)
                  const createdDate = event.createdAt ? new Date(event.createdAt) : null
                  return (
                    <Link
                      key={event.id}
                      href={`/dashboard/events/${event.id}`}
                      className="block p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-1 mb-2">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {firstDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {eventDates.length === 1 
                                  ? format(firstDate, 'MMM d, yyyy')
                                  : formatEventDates(eventDates, 'short')
                                }
                              </span>
                            )}
                            {createdDate && (
                              <span>Created {format(createdDate, 'MMM d')}</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

