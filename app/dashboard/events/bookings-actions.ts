'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
import {
  requireAuth,
  canEditArea,
  canDeleteArea,
  hasPermission,
} from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { Event } from '@/types/event'
import { Booking } from '@/types/booking'
import {
  DASHBOARD_EVENT_BOOKINGS_TAG_PREFIX,
  getEventBookingsTag,
} from './cache'

/**
 * Get bookings for a specific event
 */
async function fetchBookingsForEventFromDb(eventId: string): Promise<Booking[]> {
  const db = adminDb!
  const bookingsSnapshot = await db
    .collection('bookings')
    .where('eventId', '==', eventId)
    .get()

  const bookings: Booking[] = []
  bookingsSnapshot.forEach((doc) => {
    const data = doc.data()
    const createdAt = data.createdAt?.toDate
      ? data.createdAt.toDate().toISOString()
      : data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : data.createdAt
    const paidAt = data.paidAt?.toDate
      ? data.paidAt.toDate().toISOString()
      : data.paidAt instanceof Date
        ? data.paidAt.toISOString()
        : data.paidAt

    bookings.push({
      id: doc.id,
      ...data,
      createdAt,
      paidAt,
    } as Booking)
  })

  bookings.sort((a, b) => {
    if (!a.createdAt && !b.createdAt) return 0
    if (!a.createdAt) return 1
    if (!b.createdAt) return -1

    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })

  return bookings
}

export async function getBookings(eventId: string): Promise<Booking[]> {
  await requireAuth()

  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch bookings.')
    return []
  }

  try {
    return await unstable_cache(
      async (): Promise<Booking[]> => fetchBookingsForEventFromDb(eventId),
      [DASHBOARD_EVENT_BOOKINGS_TAG_PREFIX, eventId],
      {
        tags: [getEventBookingsTag(eventId)],
      }
    )()
  } catch (error) {
    console.error('Error fetching bookings:', error)
    throw new Error('Failed to fetch bookings')
  }
}

/**
 * Cancel/Delete a booking
 */
export async function cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  if (!canEditArea(session, 'events') && !canDeleteArea(session, 'events')) {
    return { success: false, error: 'You do not have permission to cancel bookings.' }
  }

  if (!adminDb) {
    console.error('Firebase Admin SDK not available. Cannot cancel booking.')
    return {
      success: false,
      error: 'Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.',
    }
  }

  try {
    // Check if booking exists and fetch booking details
    const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()
    if (!bookingDoc.exists) {
      return {
        success: false,
        error: 'Booking not found',
      }
    }

    const bookingData = bookingDoc.data()!
    const booking = {
      id: bookingDoc.id,
      ...bookingData,
    } as Booking

    // Fetch event details
    const eventDoc = await adminDb.collection('events').doc(booking.eventId).get()
    if (!eventDoc.exists) {
      // Event not found, still proceed with deletion but skip email
      await adminDb.collection('bookings').doc(bookingId).delete()
      return {
        success: true,
      }
    }

    const eventData = eventDoc.data()!
    const event = {
      id: eventDoc.id,
      ...eventData,
    } as Event

    // Send cancellation email before deleting the booking
    if (
      booking.email &&
      booking.registrationId &&
      hasPermission(session, 'mail.send')
    ) {
      try {
        const { sendBookingCancellationEmail } = await import('@/lib/email')
        const emailResult = await sendBookingCancellationEmail({
          to: booking.email,
          name: booking.name,
          event,
          registrationId: booking.registrationId,
        })

        // Log if email failed, but continue with deletion
        if (!emailResult.success) {
          console.error('Failed to send cancellation email:', emailResult.error)
          // Continue with deletion even if email fails
        }
      } catch (emailError) {
        console.error('Error sending cancellation email:', emailError)
        // Continue with deletion even if email fails
      }
    }

    // Delete the booking after sending email
    await adminDb.collection('bookings').doc(bookingId).delete()
    revalidateTag(getEventBookingsTag(booking.eventId), 'max')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error canceling booking:', error)
    return {
      success: false,
      error: 'Failed to cancel booking. Please try again.',
    }
  }
}
