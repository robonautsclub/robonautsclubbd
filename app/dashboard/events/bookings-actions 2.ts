'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
import { FieldPath } from 'firebase-admin/firestore'
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
  resendBookingConfirmationEmail,
  type BookingInput,
  type BookingPaymentMeta,
} from '@/lib/event-booking'
import { resolveEventSuggestedFee } from '@/lib/event-fee'
import {
  DASHBOARD_EVENT_BOOKINGS_TAG_PREFIX,
  getEventBookingsTag,
} from './cache'
import {
  BOOKING_DEFAULT_PAGE_SIZE,
  EMPTY_EVENT_BOOKING_STATS,
  type BookingCursor,
  type BookingsPage,
  type EventBookingStats,
} from './bookings-types'

/** Convert Firestore Timestamp / Date to an ISO string for RSC client props. */
function toIsoString(value: unknown): string | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'string') return value
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString()
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate()
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
  }
  // Firestore Timestamp-like plain shape from some serializers
  if (
    typeof value === 'object' &&
    value !== null &&
    '_seconds' in value &&
    typeof (value as { _seconds: unknown })._seconds === 'number'
  ) {
    const seconds = (value as { _seconds: number; _nanoseconds?: number })._seconds
    const nanos = (value as { _nanoseconds?: number })._nanoseconds ?? 0
    const date = new Date(seconds * 1000 + Math.floor(nanos / 1e6))
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
  }
  return undefined
}

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

    bookings.push({
      id: doc.id,
      ...data,
      createdAt: toIsoString(data.createdAt) ?? '',
      paidAt: toIsoString(data.paidAt),
      pdfGeneratedAt: toIsoString(data.pdfGeneratedAt),
      emailSentAt: toIsoString(data.emailSentAt),
      emailFailedAt: toIsoString(data.emailFailedAt),
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

function mapBookingDoc(
  id: string,
  data: Record<string, unknown>,
): Booking {
  return {
    id,
    ...data,
    createdAt: toIsoString(data.createdAt) ?? '',
    paidAt: toIsoString(data.paidAt),
    pdfGeneratedAt: toIsoString(data.pdfGeneratedAt),
    emailSentAt: toIsoString(data.emailSentAt),
    emailFailedAt: toIsoString(data.emailFailedAt),
  } as Booking
}

function createdAtToDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate()
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function isMissingIndexError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { code?: number | string; message?: string }
  return (
    err.code === 9 ||
    err.code === 'failed-precondition' ||
    /FAILED_PRECONDITION|requires an index/i.test(String(err.message || ''))
  )
}

function isBookingAfterCursor(item: Booking, cursor: BookingCursor): boolean {
  const itemTime = item.createdAt ? new Date(item.createdAt).getTime() : 0
  const cursorTime = new Date(cursor.createdAt).getTime()
  if (itemTime < cursorTime) return true
  if (itemTime > cursorTime) return false
  return item.id < cursor.id
}

function pageBookingsFromItems(
  items: Booking[],
  cursor: BookingCursor | null | undefined,
  pageSize: number,
): BookingsPage {
  let list = items
  if (cursor?.id && cursor.createdAt) {
    list = list.filter((item) => isBookingAfterCursor(item, cursor))
  }
  const pageItems = list.slice(0, pageSize)
  const hasMore = list.length > pageSize
  const last = pageItems[pageItems.length - 1]
  return {
    items: pageItems,
    nextCursor:
      hasMore && last?.createdAt
        ? { createdAt: String(last.createdAt), id: last.id }
        : null,
    hasMore,
    matchedTotal: items.length,
  }
}

function computeStatsFromBookings(bookings: Booking[]): EventBookingStats {
  let paidCount = 0
  let totalCollected = 0
  const categoryMap = new Map<string, number>()

  for (const booking of bookings) {
    const amount =
      typeof booking.amountPaid === 'number'
        ? booking.amountPaid
        : Number(booking.amountPaid || 0)
    if (Number.isFinite(amount) && amount > 0) {
      totalCollected += amount
    }
    if (booking.paymentStatus === 'n/a') {
      // waived — not paid
    } else if (
      booking.paymentStatus === 'paid' ||
      (Number.isFinite(amount) && amount > 0)
    ) {
      paidCount += 1
    }
    const key = booking.category?.trim() || 'Unspecified'
    categoryMap.set(key, (categoryMap.get(key) || 0) + 1)
  }

  return {
    total: bookings.length,
    paidCount,
    totalCollected,
    byCategory: Array.from(categoryMap.entries()),
  }
}

/**
 * Aggregate stats for an event's bookings (full scan; not returned as list props).
 */
export async function getEventBookingStats(
  eventId: string,
): Promise<EventBookingStats> {
  await requireAuth()
  if (!adminDb) {
    return { ...EMPTY_EVENT_BOOKING_STATS }
  }
  try {
    const bookings = await fetchBookingsForEventFromDb(eventId)
    return computeStatsFromBookings(bookings)
  } catch (error) {
    console.error('Error fetching booking stats:', error)
    return { ...EMPTY_EVENT_BOOKING_STATS }
  }
}

/**
 * Cursor-paginated bookings for the event detail dashboard.
 */
export async function getBookingsPage(
  eventId: string,
  options: {
    pageSize?: number
    cursor?: BookingCursor | null
    nameFilter?: string
    categoryFilter?: string
  } = {},
): Promise<BookingsPage> {
  await requireAuth()

  if (!adminDb) {
    return { items: [], nextCursor: null, hasMore: false, matchedTotal: 0 }
  }

  const pageSize = Math.min(
    Math.max(options.pageSize ?? BOOKING_DEFAULT_PAGE_SIZE, 1),
    100,
  )
  const nameFilter = options.nameFilter?.trim().toLowerCase() || ''
  const categoryFilter = options.categoryFilter?.trim() || ''

  // Name substring search is not indexable — filter + paginate in memory.
  if (nameFilter) {
    const all = await fetchBookingsForEventFromDb(eventId)
    const filtered = all.filter((booking) => {
      const matchName = booking.name.toLowerCase().includes(nameFilter)
      const matchCategory =
        !categoryFilter || (booking.category || '') === categoryFilter
      return matchName && matchCategory
    })
    return pageBookingsFromItems(filtered, options.cursor, pageSize)
  }

  try {
    let q = adminDb
      .collection('bookings')
      .where('eventId', '==', eventId)

    if (categoryFilter) {
      q = q.where('category', '==', categoryFilter)
    }

    q = q
      .orderBy('createdAt', 'desc')
      .orderBy(FieldPath.documentId(), 'desc')

    const cursor = options.cursor
    if (cursor?.id && cursor.createdAt) {
      const cursorDate = createdAtToDate(cursor.createdAt)
      if (cursorDate) {
        q = q.startAfter(cursorDate, cursor.id)
      }
    }

    const countPromise = categoryFilter
      ? adminDb
          .collection('bookings')
          .where('eventId', '==', eventId)
          .where('category', '==', categoryFilter)
          .count()
          .get()
          .then((snap) => snap.data().count)
          .catch(() => null)
      : Promise.resolve(null)

    const [snap, matchedTotal] = await Promise.all([
      q.limit(pageSize + 1).get(),
      countPromise,
    ])

    const docs = snap.docs.slice(0, pageSize)
    const items = docs.map((doc) => mapBookingDoc(doc.id, doc.data() as Record<string, unknown>))
    const hasMore = snap.docs.length > pageSize
    const last = docs[docs.length - 1]

    let nextCursor: BookingCursor | null = null
    if (hasMore && last) {
      const createdAt =
        createdAtToDate(last.data().createdAt)?.toISOString() ||
        String(items[items.length - 1]?.createdAt || '')
      if (createdAt) {
        nextCursor = { createdAt, id: last.id }
      }
    }

    return {
      items,
      nextCursor,
      hasMore,
      matchedTotal: typeof matchedTotal === 'number' ? matchedTotal : null,
    }
  } catch (error) {
    if (!isMissingIndexError(error)) {
      console.error('Error fetching bookings page:', error)
      throw new Error('Failed to fetch bookings page')
    }
    console.warn(
      '[events] Composite index missing for bookings pagination; using in-memory fallback.',
      error instanceof Error ? error.message : error,
    )
    const all = await fetchBookingsForEventFromDb(eventId)
    const filtered = categoryFilter
      ? all.filter((b) => (b.category || '') === categoryFilter)
      : all
    return pageBookingsFromItems(filtered, options.cursor, pageSize)
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
 * Resend confirmation email for an existing booking (admin dashboard).
 */
export async function resendBookingEmail(bookingId: string): Promise<{
  success: boolean
  error?: string
  warning?: string
  emailSendCount?: number
}> {
  const session = await requireAuth()
  if (!hasPermission(session, 'mail.send')) {
    return {
      success: false,
      error: 'You do not have permission to send emails from the dashboard.',
    }
  }

  if (!adminDb) {
    return { success: false, error: 'Database unavailable.' }
  }

  try {
    const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()
    if (!bookingDoc.exists) {
      return { success: false, error: 'Booking not found.' }
    }

    const bookingData = bookingDoc.data()!
    const booking = {
      id: bookingDoc.id,
      ...bookingData,
      createdAt: toIsoString(bookingData.createdAt) ?? '',
      paidAt: toIsoString(bookingData.paidAt),
      pdfGeneratedAt: toIsoString(bookingData.pdfGeneratedAt),
      emailSentAt: toIsoString(bookingData.emailSentAt),
      emailFailedAt: toIsoString(bookingData.emailFailedAt),
    } as Booking

    const eventDoc = await adminDb.collection('events').doc(booking.eventId).get()
    if (!eventDoc.exists) {
      return { success: false, error: 'Event not found.' }
    }

    const eventData = eventDoc.data()!
    const event = {
      id: eventDoc.id,
      ...eventData,
      createdAt: eventData.createdAt?.toDate?.() || eventData.createdAt,
      updatedAt: eventData.updatedAt?.toDate?.() || eventData.updatedAt,
    } as Event

    return await resendBookingConfirmationEmail(booking, event)
  } catch (error) {
    console.error('Resend booking email failed:', error)
    return { success: false, error: 'Failed to send confirmation email. Please try again.' }
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
