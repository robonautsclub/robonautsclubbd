'use server'

import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import { Event } from '@/types/event'
import { persistMissingEventSlugs, slugifyEventTitle } from '@/lib/event-slug'
import { Course } from '@/types/course'
import { isRegistrationOpen } from '@/lib/dateUtils'
import {
  BkashApiError,
  bkashCreateCheckout,
  bkashExecutePayment,
  bkashQueryPayment,
  bkashRefundPayment,
} from '@/lib/bkash'
import { normalizeCustomFormAnswers, validateCustomFormAnswers } from '@/lib/eventCustomForm'
import { getEventRegistrationFields } from '@/lib/registrationFields'
import { SCHOOL_DIRECTORY_COLLECTION } from '@/lib/schoolDirectory'
import { PUBLIC_HOMEPAGE_ORGS_TAG } from '@/lib/public-cache-tags'
import {
  HOMEPAGE_ORGS_COLLECTION,
  mapHomepageOrgDoc,
  splitHomepageOrgs,
} from '@/lib/homepage-orgs'
import type { PublicHomepageOrgs } from '@/types/homepage-org'
import {
  createBookingRecordAndSendEmail,
  hasExistingRegistration,
  normalizeSchoolValue,
  type BookingInput,
} from '@/lib/event-booking'

const PUBLIC_EVENTS_TAG = 'public-events'
const PUBLIC_COURSES_TAG = 'public-courses'
const PUBLIC_SCHOOLS_TAG = 'public-schools'
const PUBLIC_EVENTS_MAX = 200
const PUBLIC_COURSES_MAX = 100
const PUBLIC_HOMEPAGE_ORGS_MAX = 100

/**
 * Firestore fetch for public events. Only call when `adminDb` is initialized.
 * Cached via unstable_cache — never cache the empty "no admin" path or builds without credentials poison the cache.
 */
async function fetchPublicEventsFromFirestore(): Promise<Event[]> {
  const db = adminDb!
  try {
    const eventsSnapshot = await db
      .collection('events')
      .orderBy('createdAt', 'desc')
      .limit(PUBLIC_EVENTS_MAX)
      .get()

    const events: Event[] = []
    eventsSnapshot.forEach((doc) => {
      const data = doc.data()

      // Convert Firestore Timestamps to ISO strings for serialization
      const createdAt = data.createdAt?.toDate?.() || data.createdAt
      const updatedAt = data.updatedAt?.toDate?.() || data.updatedAt

      // Convert Date objects to ISO strings for Next.js serialization
      const createdAtStr = createdAt instanceof Date
        ? createdAt.toISOString()
        : typeof createdAt === 'string'
        ? createdAt
        : null

      const updatedAtStr = updatedAt instanceof Date
        ? updatedAt.toISOString()
        : typeof updatedAt === 'string'
        ? updatedAt
        : null

      // Handle date field - convert Timestamp to string if needed
      let dateValue = data.date
      if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
        // It's a Firestore Timestamp
        dateValue = dateValue.toDate().toISOString().split('T')[0] // Convert to YYYY-MM-DD
      } else if (dateValue && typeof dateValue === 'object' && '_seconds' in dateValue) {
        // It's a Firestore Timestamp (alternative format)
        dateValue = new Date(dateValue._seconds * 1000).toISOString().split('T')[0]
      }

      events.push({
        id: doc.id,
        ...data,
        slug: typeof data.slug === 'string' && data.slug.trim() ? data.slug.trim() : undefined,
        date: dateValue,
        createdAt: createdAtStr || new Date().toISOString(),
        updatedAt: updatedAtStr || new Date().toISOString(),
      } as Event)
    })

    // Sort by createdAt in descending order (newest first)
    events.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1

      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA // Descending order
    })

    return events
  } catch (error) {
    console.error('Error fetching events:', error)
    // Return empty array instead of throwing for public pages
    return []
  }
}

const getCachedPublicEvents = unstable_cache(fetchPublicEventsFromFirestore, [PUBLIC_EVENTS_TAG], {
  tags: [PUBLIC_EVENTS_TAG],
  revalidate: 3600,
})

export const getPublicEvents = cache(async (): Promise<Event[]> => {
  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch events.')
    return []
  }
  return getCachedPublicEvents()
})

function mapPublicEventDoc(
  eventDoc: { id: string },
  data: Record<string, unknown> & {
    createdAt?: { toDate?: () => Date }
    updatedAt?: { toDate?: () => Date }
    date?: unknown
    slug?: unknown
  },
): Event {
  const createdAt = data.createdAt?.toDate?.() || data.createdAt
  const updatedAt = data.updatedAt?.toDate?.() || data.updatedAt

  const createdAtStr = createdAt instanceof Date
    ? createdAt.toISOString()
    : typeof createdAt === 'string'
      ? createdAt
      : new Date().toISOString()

  const updatedAtStr = updatedAt instanceof Date
    ? updatedAt.toISOString()
    : typeof updatedAt === 'string'
      ? updatedAt
      : new Date().toISOString()

  let dateValue = data.date
  if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
    const withToDate = dateValue as { toDate: () => Date }
    dateValue = withToDate.toDate().toISOString().split('T')[0]
  } else if (dateValue && typeof dateValue === 'object' && '_seconds' in dateValue) {
    const withSeconds = dateValue as { _seconds: number }
    dateValue = new Date(withSeconds._seconds * 1000).toISOString().split('T')[0]
  }

  return {
    id: eventDoc.id,
    ...data,
    slug: typeof data.slug === 'string' && data.slug.trim() ? data.slug.trim() : undefined,
    date: dateValue,
    createdAt: createdAtStr,
    updatedAt: updatedAtStr,
  } as Event
}

function eventMatchesPublicParam(event: Event, param: string): boolean {
  if (event.id === param) return true
  if (event.slug && event.slug === param) return true
  return slugifyEventTitle(event.title) === param
}

/**
 * Get a single event by slug or Firestore document ID (public - no auth required).
 * Slug query, ID lookup, and title-slug fallback are isolated so one miss cannot 404 the page.
 */
async function fetchPublicEventFromFirestore(param: string): Promise<Event | null> {
  const db = adminDb!
  const normalized = param.trim()
  if (!normalized) return null

  try {
    const bySlug = await db.collection('events').where('slug', '==', normalized).limit(1).get()
    if (!bySlug.empty) {
      return mapPublicEventDoc(bySlug.docs[0], bySlug.docs[0].data() as Parameters<typeof mapPublicEventDoc>[1])
    }
  } catch (error) {
    console.error('Error fetching event by slug:', error)
  }

  try {
    const eventDoc = await db.collection('events').doc(normalized).get()
    if (eventDoc.exists) {
      const event = mapPublicEventDoc(eventDoc, eventDoc.data()! as Parameters<typeof mapPublicEventDoc>[1])
      await persistMissingEventSlugs([event])
      return event
    }
  } catch (error) {
    console.error('Error fetching event by id:', error)
  }

  try {
    const events = await getCachedPublicEvents()
    const match = events.find((event) => eventMatchesPublicParam(event, normalized))
    if (match) {
      await persistMissingEventSlugs([match])
      return match
    }
  } catch (error) {
    console.error('Error matching event from public list:', error)
  }

  return null
}

export const getPublicEvent = cache(async (slugOrId: string): Promise<Event | null> => {
  if (!adminDb) {
    console.error('Firebase Admin SDK not available. Cannot fetch event.')
    return null
  }
  return fetchPublicEventFromFirestore(slugOrId)
})

export const getPublicEnglishMediumSchools = cache(async (): Promise<string[]> => {
  const db = adminDb
  if (!db) return []
  try {
    return unstable_cache(
      async (): Promise<string[]> => {
        try {
          const snapshot = await db
            .collection(SCHOOL_DIRECTORY_COLLECTION)
            .where('status', '==', 'approved')
            .where('isActive', '==', true)
            .select('name')
            .get()
          return snapshot.docs
            .map((doc) => {
              const name =
                typeof doc.data().name === 'string' ? doc.data().name.trim() : ''
              return name
            })
            .filter((name): name is string => Boolean(name))
            .sort((a, b) => a.localeCompare(b))
        } catch (queryError) {
          // Missing composite index or legacy docs without status → fall back once.
          console.warn(
            'Filtered school query failed; falling back to full scan:',
            queryError,
          )
          const snapshot = await db.collection(SCHOOL_DIRECTORY_COLLECTION).get()
          return snapshot.docs
            .map((doc) => {
              const data = doc.data()
              const name = typeof data.name === 'string' ? data.name.trim() : ''
              const isActive =
                typeof data.isActive === 'boolean' ? data.isActive : true
              const status = data.status === 'pending' ? 'pending' : 'approved'
              if (!name || !isActive || status !== 'approved') return ''
              return name
            })
            .filter((name): name is string => Boolean(name))
            .sort((a, b) => a.localeCompare(b))
        }
      },
      [PUBLIC_SCHOOLS_TAG],
      { tags: [PUBLIC_SCHOOLS_TAG], revalidate: 3600 }
    )()
  } catch (error) {
    console.error('Error fetching schools:', error)
    return []
  }
})

export type { BookingInput } from '@/lib/event-booking'

type PendingPaidRegistration = {
  paymentId: string
  eventId: string
  name: string
  school?: string
  email: string
  phone: string
  category?: string
  information?: string
  customAnswers?: Record<string, string | string[] | number>
  amount: number
  status: 'pending' | 'completed' | 'failed'
  bookingId?: string
  createdAt: Date
  updatedAt: Date
}

function getBaseUrl(): string {
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (!baseUrl) {
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    } else if (process.env.VERCEL_BRANCH_URL) {
      baseUrl = process.env.VERCEL_BRANCH_URL.startsWith('http')
        ? process.env.VERCEL_BRANCH_URL
        : `https://${process.env.VERCEL_BRANCH_URL}`
    } else if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000'
    } else {
      baseUrl = 'https://robonautsclub.com'
    }
  }
  return baseUrl.replace(/\/$/, '')
}

/**
 * Create a booking for an event
 * This is a public action (no auth required) as users need to book events
 * IMPORTANT: Email confirmation is sent FIRST, booking is only saved if email succeeds
 */
export async function createBooking(
  formData: BookingInput
): Promise<{ success: boolean; error?: string; warning?: string; bookingId?: string }> {
  try {
    if (!adminDb) {
      return {
        success: false,
        error: 'Service temporarily unavailable. Please try again later.',
      }
    }

    const eventDoc = await adminDb.collection('events').doc(formData.eventId).get()
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

    if (!isRegistrationOpen(event)) {
      return { success: false, error: 'Registration for this event is closed.' }
    }

    const defaultRegistrationFields = getEventRegistrationFields(event)

    if (!formData.eventId || !formData.name || !formData.email || !formData.phone?.trim()) {
      return { success: false, error: 'All required fields must be filled' }
    }
    const normalizedSchool = normalizeSchoolValue(formData.school)
    if (defaultRegistrationFields.school.enabled && defaultRegistrationFields.school.required && !normalizedSchool) {
      return { success: false, error: 'School is required.' }
    }
    if (defaultRegistrationFields.information.enabled && defaultRegistrationFields.information.required && !formData.information?.trim()) {
      return { success: false, error: 'Other information is required.' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return { success: false, error: 'Invalid email format' }
    }

    const normalizedPhone = formData.phone.trim().replace(/\s/g, '')
    if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith('01')) {
      return { success: false, error: 'Phone number must be 11 digits and start with 01' }
    }

    if (event.isPaid) {
      return {
        success: false,
        error: 'Paid event registration requires bKash checkout flow.',
      }
    }

    const categories = Array.isArray(event.categories) ? event.categories : []
    if (defaultRegistrationFields.category.enabled && categories.length > 0) {
      const selectedCategory = formData.category?.trim()
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

    const customAnswerError = validateCustomFormAnswers(event.customFormFields, formData.customAnswers)
    if (customAnswerError) {
      return { success: false, error: customAnswerError }
    }

    return await createBookingRecordAndSendEmail(event, formData)
  } catch (error) {
    console.error('Error creating booking:', error)
    return {
      success: false,
      error: 'Failed to create registration. Please try again.',
    };
  }
}

export async function initiatePaidEventCheckout(
  formData: BookingInput
): Promise<{ success: boolean; error?: string; checkoutUrl?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Service temporarily unavailable. Please try again later.' }
    }

    const eventDoc = await adminDb.collection('events').doc(formData.eventId).get()
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

    if (!event.isPaid) {
      return { success: false, error: 'This event does not require payment.' }
    }
    if (!isRegistrationOpen(event)) {
      return { success: false, error: 'Registration for this event is closed.' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const normalizedPhone = formData.phone.trim().replace(/\s/g, '')
    const normalizedEmail = formData.email.trim().toLowerCase()
    const normalizedSchool = normalizeSchoolValue(formData.school)
    const defaultRegistrationFields = getEventRegistrationFields(event)

    if (!formData.name.trim() || !normalizedEmail || !normalizedPhone) {
      return { success: false, error: 'All required fields must be filled' }
    }
    if (defaultRegistrationFields.school.enabled && defaultRegistrationFields.school.required && !normalizedSchool) {
      return { success: false, error: 'School is required.' }
    }
    if (defaultRegistrationFields.information.enabled && defaultRegistrationFields.information.required && !formData.information?.trim()) {
      return { success: false, error: 'Other information is required.' }
    }
    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, error: 'Invalid email format' }
    }
    if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith('01')) {
      return { success: false, error: 'Phone number must be 11 digits and start with 01' }
    }

    const categories = Array.isArray(event.categories) ? event.categories : []
    let amountToPay = Number(event.amount || 0)
    let selectedCategoryName = formData.category?.trim() || ''
    if (defaultRegistrationFields.category.enabled && categories.length > 0) {
      if (!selectedCategoryName) {
        return { success: false, error: 'Please select a category.' }
      }
      const selectedCategory = categories.find(
        (category) => category.name.trim().toLowerCase() === selectedCategoryName.toLowerCase()
      )
      if (!selectedCategory) {
        return { success: false, error: 'Selected category is not valid for this event.' }
      }
      selectedCategoryName = selectedCategory.name.trim()
      if (selectedCategory.amount == null || selectedCategory.amount <= 0) {
        return { success: false, error: 'Selected category does not have a valid fee configured.' }
      }
      amountToPay = Number(selectedCategory.amount)
    } else if (!amountToPay || amountToPay <= 0) {
      return { success: false, error: 'Paid event amount is not configured properly.' }
    }

    const customAnswerError = validateCustomFormAnswers(event.customFormFields, formData.customAnswers)
    if (customAnswerError) {
      return { success: false, error: customAnswerError }
    }

    const duplicate = await hasExistingRegistration(formData.eventId, normalizedEmail)
    if (duplicate) {
      return {
        success: false,
        error: 'You have already registered for this event with this email address.',
      }
    }

    const callbackUrl = `${getBaseUrl()}/api/payments/bkash/success`
    const checkout = await bkashCreateCheckout({
      amount: amountToPay,
      payerReference: normalizedPhone,
      callbackUrl,
      merchantInvoiceNumber: `${event.id}-${Date.now()}`.slice(0, 40),
    })

    const now = new Date()
    const pending: PendingPaidRegistration = {
      paymentId: checkout.paymentId,
      eventId: formData.eventId,
      name: formData.name.trim(),
      school: defaultRegistrationFields.school.enabled ? normalizedSchool : '',
      email: normalizedEmail,
      phone: normalizedPhone,
      category: defaultRegistrationFields.category.enabled ? selectedCategoryName || undefined : undefined,
      information: defaultRegistrationFields.information.enabled ? (formData.information ? formData.information.trim() : '') : '',
      customAnswers: normalizeCustomFormAnswers(event.customFormFields, formData.customAnswers),
      amount: amountToPay,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }

    await adminDb.collection('bkash_pending_registrations').doc(checkout.paymentId).set(pending)
    return { success: true, checkoutUrl: checkout.checkoutUrl }
  } catch (error) {
    console.error('Error initiating bKash checkout:', error)
    return { success: false, error: 'Failed to initiate bKash payment. Please try again.' }
  }
}

export async function finalizePaidEventBooking(paymentId: string): Promise<{
  success: boolean
  error?: string
  warning?: string
  bookingId?: string
}> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Service temporarily unavailable. Please try again later.' }
    }

    const pendingRef = adminDb.collection('bkash_pending_registrations').doc(paymentId)
    const pendingSnap = await pendingRef.get()
    if (!pendingSnap.exists) {
      return { success: false, error: 'Payment session not found or expired.' }
    }

    const pending = pendingSnap.data() as PendingPaidRegistration
    if (pending.status === 'completed' && pending.bookingId) {
      return { success: true, bookingId: pending.bookingId }
    }

    let execution
    try {
      execution = await bkashExecutePayment(paymentId)
    } catch (executeError) {
      const isNoResponseFromExecute =
        executeError instanceof BkashApiError
          ? executeError.noResponse
          : false

      if (!isNoResponseFromExecute) {
        await pendingRef.update({ status: 'failed', updatedAt: new Date() })
        return {
          success: false,
          error:
            executeError instanceof BkashApiError
              ? executeError.statusMessage || executeError.message
              : 'Failed to execute payment with bKash.',
        }
      }

      // Query API is only used when execute returned no response (timeout/unknown).
      try {
        const queried = await bkashQueryPayment(paymentId)
        const queriedStatus = queried.transactionStatus.toLowerCase()
        if (queriedStatus !== 'completed') {
          await pendingRef.update({ status: 'failed', updatedAt: new Date() })
          return {
            success: false,
            error: queried.statusMessage || `Payment is not successful (${queried.transactionStatus}).`,
          }
        }
        execution = queried
      } catch (queryError) {
        console.error('bKash execute timeout and query failed', {
          paymentId,
          executeError: executeError instanceof Error ? executeError.message : String(executeError),
          queryError: queryError instanceof Error ? queryError.message : String(queryError),
        })
        await pendingRef.update({ status: 'failed', updatedAt: new Date() })
        return {
          success: false,
          error:
            queryError instanceof BkashApiError
              ? queryError.statusMessage || queryError.message
              : 'Failed to verify payment status with bKash. Please contact support.',
        }
      }
    }

    const transactionStatus = execution.transactionStatus.toLowerCase()
    if (transactionStatus !== 'completed' ) {
      await pendingRef.update({ status: 'failed', updatedAt: new Date() })
      return {
        success: false,
        error: execution.statusMessage || `Payment is not successful (${execution.transactionStatus}).`,
      }
    }

    const eventDoc = await adminDb.collection('events').doc(pending.eventId).get()
    if (!eventDoc.exists) {
      await pendingRef.update({ status: 'failed', updatedAt: new Date() })
      return { success: false, error: 'Event no longer exists.' }
    }

    const eventData = eventDoc.data()!
    const event: Event = {
      id: eventDoc.id,
      ...eventData,
      createdAt: eventData.createdAt?.toDate?.() || eventData.createdAt,
      updatedAt: eventData.updatedAt?.toDate?.() || eventData.updatedAt,
    } as Event

    if (!isRegistrationOpen(event)) {
      await pendingRef.update({ status: 'failed', updatedAt: new Date() })
      return { success: false, error: 'Registration for this event is closed.' }
    }

    const result = await createBookingRecordAndSendEmail(
      event,
      {
        eventId: pending.eventId,
        name: pending.name,
        school: pending.school,
        email: pending.email,
        phone: pending.phone,
        category: pending.category,
        information: pending.information,
        customAnswers: pending.customAnswers,
      },
      {
        paymentId: execution.paymentId,
        trxId: execution.trxId,
        amountPaid: execution.amount || pending.amount,
      }
    )

    if (!result.success) {
      await pendingRef.update({ status: 'failed', updatedAt: new Date() })
      return result
    }

    await pendingRef.update({
      status: 'completed',
      bookingId: result.bookingId,
      updatedAt: new Date(),
      trxId: execution.trxId,
    })

    return result
  } catch (error) {
    console.error('Error finalizing paid booking:', error)
    return { success: false, error: 'Failed to finalize payment. Please contact support.' }
  }
}

export async function refundPaidEventPayment(input: {
  paymentId: string
  trxId: string
  amount: number
  reason: string
  sku?: string
}): Promise<{ success: boolean; error?: string; refundTrxId?: string }> {
  try {
    const result = await bkashRefundPayment({
      paymentId: input.paymentId,
      trxId: input.trxId,
      amount: input.amount,
      reason: input.reason,
      sku: input.sku,
    })

    return { success: true, refundTrxId: result.refundTrxId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof BkashApiError ? error.statusMessage || error.message : 'Failed to refund payment.',
    }
  }
}

/**
 * Get all courses from Firestore (public - no auth required)
 * Only returns non-archived courses
 * Used by Feed component for public display
 * Wrapped with cache() for request deduplication
 */
async function fetchPublicCoursesFromFirestore(): Promise<Course[]> {
  const db = adminDb!
  try {
    // Query for non-archived courses only
    const coursesSnapshot = await db
      .collection('courses')
      .where('isArchived', '==', false)
      .limit(PUBLIC_COURSES_MAX)
      .get()

    const courses: Course[] = []
    coursesSnapshot.forEach((doc) => {
      const data = doc.data()

      // Convert Firestore Timestamps to ISO strings for serialization
      const createdAt = data.createdAt?.toDate?.() || data.createdAt
      const updatedAt = data.updatedAt?.toDate?.() || data.updatedAt

      // Convert Date objects to ISO strings for Next.js serialization
      const createdAtStr = createdAt instanceof Date
        ? createdAt.toISOString()
        : typeof createdAt === 'string'
        ? createdAt
        : new Date().toISOString()

      const updatedAtStr = updatedAt instanceof Date
        ? updatedAt.toISOString()
        : typeof updatedAt === 'string'
        ? updatedAt
        : new Date().toISOString()

      courses.push({
        id: doc.id,
        ...data,
        createdAt: createdAtStr,
        updatedAt: updatedAtStr,
      } as Course)
    })

    // Sort by createdAt in descending order (newest first)
    courses.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1

      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA // Descending order
    })

    return courses
  } catch (error) {
    console.error('Error fetching public courses:', error)
    return []
  }
}

const getCachedPublicCourses = unstable_cache(fetchPublicCoursesFromFirestore, [PUBLIC_COURSES_TAG], {
  tags: [PUBLIC_COURSES_TAG],
  revalidate: 3600,
})

export const getPublicCourses = cache(async (): Promise<Course[]> => {
  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch courses.')
    return []
  }
  return getCachedPublicCourses()
})

async function fetchPublicHomepageOrgsFromFirestore(): Promise<PublicHomepageOrgs> {
  const db = adminDb!
  try {
    const snapshot = await db
      .collection(HOMEPAGE_ORGS_COLLECTION)
      .where('isActive', '==', true)
      .limit(PUBLIC_HOMEPAGE_ORGS_MAX)
      .get()

    const orgs = snapshot.docs
      .map((doc) => mapHomepageOrgDoc(doc.id, doc.data() as Record<string, unknown>))
      .filter((org): org is NonNullable<typeof org> => Boolean(org))

    return splitHomepageOrgs(orgs)
  } catch (error) {
    console.error('Error fetching public homepage orgs:', error)
    return { partners: [], schools: [] }
  }
}

const getCachedPublicHomepageOrgs = unstable_cache(
  fetchPublicHomepageOrgsFromFirestore,
  [PUBLIC_HOMEPAGE_ORGS_TAG],
  {
    tags: [PUBLIC_HOMEPAGE_ORGS_TAG],
    revalidate: 3600,
  },
)

export const getPublicHomepageOrgs = cache(async (): Promise<PublicHomepageOrgs> => {
  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch homepage orgs.')
    return { partners: [], schools: [] }
  }
  return getCachedPublicHomepageOrgs()
})
