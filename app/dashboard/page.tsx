import { requireAuth } from '@/lib/auth'
import { getDashboardEventsSummary } from './actions'
import { User, Mail, Key, Calendar, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { isEventUpcoming, getFirstEventDate, formatEventDates, parseEventDates } from '@/lib/dateUtils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [session, events] = await Promise.all([requireAuth(), getDashboardEventsSummary()])

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
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <Card className="bg-linear-to-r from-cyan-700 via-teal-700 to-slate-800 shadow-md text-white border-0">
        <CardContent className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">
            Welcome back, {session.name.split(' ')[0]}!
          </h1>
          <p className="text-sm sm:text-base text-cyan-100/90">
            Here&apos;s what&apos;s happening with your events today.
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                  Total Events
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                  {totalEvents}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-cyan-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                  Upcoming Events
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
                  {upcomingEvents}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                  Past Events
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-600 tabular-nums">
                  {pastEvents}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* User Information Card */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-700" />
                Account Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-50/80 border border-cyan-100">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-cyan-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500 mb-1">Name</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{session.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500 mb-1">Email</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{session.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Key className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500 mb-1">User ID</p>
                    <p className="font-mono text-xs font-semibold text-slate-900 break-all">{session.uid}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-700" />
                  Recent Events
                </h3>
                <Button asChild variant="link" className="text-cyan-700 hover:text-cyan-800 h-auto p-0 text-xs sm:text-sm">
                  <Link href="/dashboard/events" prefetch={false}>
                    View all →
                  </Link>
                </Button>
              </div>

              {recentEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">No events yet</p>
                  <Button asChild variant="link" className="mt-4 text-cyan-700 hover:text-cyan-800">
                    <Link href="/dashboard/events" prefetch={false}>
                      Create your first event →
                    </Link>
                  </Button>
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
                        prefetch={false}
                        className="block p-4 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/60 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 group-hover:text-cyan-800 transition-colors mb-1">
                              {event.title}
                            </h4>
                            <p className="text-xs text-slate-600 line-clamp-1 mb-2">
                              {event.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
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
                            <div className="w-2 h-2 rounded-full bg-cyan-600 group-hover:bg-cyan-700 transition-colors" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
