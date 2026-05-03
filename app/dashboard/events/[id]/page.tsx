import { requireAuth } from '@/lib/auth'
import { getEvent, getBookings } from '../../actions'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import EventHeaderActions from './EventHeaderActions'
import EventDetailsClient from './EventDetailsClient'

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  const { id } = await params
  const [event, bookings] = await Promise.all([getEvent(id), getBookings(id)])

  if (!event) {
    notFound()
  }

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
            prefetch={false}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            ← Back to Events
          </Link>
        </div>
      </div>

      <EventDetailsClient event={event} bookings={bookings} />
    </div>
  )
}

