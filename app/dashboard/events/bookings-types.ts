import type { Booking } from '@/types/booking'

export const BOOKING_PAGE_SIZE_OPTIONS = [10, 20, 50] as const
export const BOOKING_DEFAULT_PAGE_SIZE = 10

export type BookingCursor = { createdAt: string; id: string }

export type BookingsPage = {
  items: Booking[]
  nextCursor: BookingCursor | null
  hasMore: boolean
  matchedTotal?: number | null
}

export type EventBookingStats = {
  total: number
  paidCount: number
  totalCollected: number
  byCategory: Array<[string, number]>
}

export const EMPTY_EVENT_BOOKING_STATS: EventBookingStats = {
  total: 0,
  paidCount: 0,
  totalCollected: 0,
  byCategory: [],
}
