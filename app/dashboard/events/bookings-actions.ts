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
import { getEventRegistrationFields } from '@/lib/registrationFields'
import { validateCustomFormAnswers } from '@/lib/eventCustomForm'
import {
  createBookingRecordAndSendEmail,
  type BookingInput,
  type BookingPaymentMeta,
} from '@/lib/event-booking'
import { resolveEventSuggestedFee } from '@/lib/event-fee'
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

export type CreateBookingManualInput = BookingInput & {
  paymentMode?: 'paid_offline' | 'waived'
  amountPaid?: number
  trxId?: string
  sendEmail?: boolean
}

/**
 * Admin-only: create a booking without bKash checkout.
 * Bypasses public registration-open checks. Supports paid offline / waived for paid events.
 */
export async function createBookingManual(
  input: CreateBookingManualInput
): Promise<{
  success: boolean
  error?: string
  warning?: string
  bookingId?: string
  registrationId?: string
}> {
  const session = await requireAuth()
  if (!canEditArea(session, 'events')) {
    return { success: false, error: 'You do not have permission to add registrations.' }
  }

  if (!adminDb) {
    return {
      success: false,
      error: 'Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.',
    }
  }

  try {
    const eventDoc = await adminDb.collection('events').doc(input.eventId).get()
    if (!eventDoc.exists) {
      return { success: false, error: 'Event not found' }
    }

    const eventData = eventDoc.data()!
    const event: Event = {
      id: eventDoc.id,
      ...eventData,
      createdAt: eventData.createdAt?.toDate?.() || eventData.createdAt,
      updatedAt: eventData.updatedAt?.toDate?.() || eventData.updatedAt,
    } as Event

    const defaultRegistrationFields = getEventRegistrationFields(event)

    if (!input.eventId || !input.name?.trim() || !input.email?.trim() || !input.phone?.trim()) {
      return { success: false, error: 'All required fields must be filled' }
    }

    const school = (input.school || '').trim()
    if (
      defaultRegistrationFields.school.enabled &&
      defaultRegistrationFields.school.required &&
      !school
    ) {
      return { success: false, error: 'School is required.' }
    }
    if (
      defaultRegistrationFields.information.enabled &&
      defaultRegistrationFields.information.required &&
      !input.information?.trim()
    ) {
      return { success: false, error: 'Other information is required.' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input.email)) {
      return { success: false, error: 'Invalid email format' }
    }

    const normalizedPhone = input.phone.trim().replace(/\s/g, '')
    if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith('01')) {
      return { success: false, error: 'Phone number must be 11 digits and start with 01' }
    }

    const categories = Array.isArray(event.categories) ? event.categories : []
    if (defaultRegistrationFields.category.enabled && categories.length > 0) {
      const selectedCategory = input.category?.trim()
      if (defaultRegistrationFields.category.required && !selectedCategory) {
        return { success: false, error: 'Please select a category.' }
      }
      if (selectedCategory) {
        const categoryExists = categories.some(
          (category) => category.name.trim().toLowerCase() === selectedCategory.toLowerCase()
        )
        if (!categoryExists) {
          return { success: false, error: 'Selected category is not valid for this event.' }
        }
      }
    }

    const customAnswerError = validateCustomFormAnswers(event.customFormFields, input.customAnswers)
    if (customAnswerError) {
      return { success: false, error: customAnswerError }
    }

    const formData: BookingInput = {
      eventId: input.eventId,
      name: input.name,
      school: input.school,
      email: input.email,
      phone: normalizedPhone,
      category: input.category,
      information: input.information,
      customAnswers: input.customAnswers,
    }

    let paymentMeta: BookingPaymentMeta | undefined
    let paymentStatusForUnpaid: 'n/a' | undefined

    if (event.isPaid) {
      const paymentMode = input.paymentMode || 'waived'
      if (paymentMode === 'paid_offline') {
        if (!hasPermission(session, 'payments.view')) {
          return {
            success: false,
            error: 'You do not have permission to set paid amounts.',
          }
        }
        const suggested = resolveEventSuggestedFee(event, input.category)
        const amountPaid =
          typeof input.amountPaid === 'number' && Number.isFinite(input.amountPaid)
            ? input.amountPaid
            : suggested
        if (!(amountPaid > 0)) {
          return {
            success: false,
            error: 'Paid offline amount must be greater than 0. Use Waived if no fee applies.',
          }
        }
        paymentMeta = {
          paymentId: `admin-manual-${Date.now()}`,
          trxId: input.trxId?.trim() || undefined,
          amountPaid,
          paymentGateway: 'manual',
        }
      } else {
        paymentStatusForUnpaid = 'n/a'
      }
    }

    return await createBookingRecordAndSendEmail(event, formData, paymentMeta, {
      sendEmail: input.sendEmail !== false && hasPermission(session, 'mail.send'),
      paymentStatusForUnpaid,
    })
  } catch (error) {
    console.error('Admin manual event registration failed:', error)
    return {
      success: false,
      error: 'Failed to create registration. Please try again.',
    }
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
