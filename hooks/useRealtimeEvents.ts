'use client'

import { Event } from '@/types/event'

type RealtimeBooking = {
  id: string
  createdAt?: string | null
} & Record<string, unknown>

/** Real-time Firestore listeners are disabled; marketing pages use server-fetched data. */
export function useRealtimeEvents(_publicAccess: boolean = false) {
  return { events: [] as Event[], loading: false, error: null as string | null }
}

export function useRealtimeEvent(_eventId: string) {
  return { event: null as Event | null, loading: false, error: null as string | null }
}

export function useRealtimeBookings(_eventId: string) {
  return { bookings: [] as RealtimeBooking[], loading: false, error: null as string | null }
}
