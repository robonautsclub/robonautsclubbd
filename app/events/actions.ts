'use server'

import { cache } from 'react'
import { revalidatePath, revalidateTag } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import { Event } from '@/types/event'
import { Course } from '@/types/course'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { generateRegistrationId } from '@/lib/registrationId'
import { isRegistrationOpen } from '@/lib/dateUtils'
import { bkashCreateCheckout, bkashExecutePayment, bkashQueryPayment } from '@/lib/bkash'

/**
 * Get all events from Firestore (public - no auth required)
 * Used with ISR (Incremental Static Regeneration) for fast page loads
 * Wrapped with cache() for request deduplication
 */
export const getPublicEvents = cache(async (): Promise<Event[]> => {
  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch events.')
    // Return empty array instead of throwing for public pages
    return []
  }

  try {
    // Query without orderBy to avoid requiring a composite index
    // We'll sort in memory instead
    const eventsSnapshot = await adminDb.collection('events').get()
    
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
})

/**
 * Get a single event by ID (public - no auth required)
 * Used with ISR (Incremental Static Regeneration) for fast page loads
 * Wrapped with cache() for request deduplication
 */
export const getPublicEvent = cache(async (id: string): Promise<Event | null> => {
  if (!adminDb) {
    console.error('Firebase Admin SDK not available. Cannot fetch event.')
    return null
  }

  try {
    const eventDoc = await adminDb.collection('events').doc(id).get()
    
    if (!eventDoc.exists) {
      return null
    }

    const data = eventDoc.data()!
    
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
    
    // Handle date field - convert Timestamp to string if needed
    let dateValue = data.date
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
      // It's a Firestore Timestamp
      dateValue = dateValue.toDate().toISOString().split('T')[0] // Convert to YYYY-MM-DD
    } else if (dateValue && typeof dateValue === 'object' && '_seconds' in dateValue) {
      // It's a Firestore Timestamp (alternative format)
      dateValue = new Date(dateValue._seconds * 1000).toISOString().split('T')[0]
    }
    
    return {
      id: eventDoc.id,
      ...data,
      date: dateValue,
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
    } as Event
  } catch (error) {
    console.error('Error fetching event:', error)
    return null
  }
})

type BookingInput = {
  eventId: string
  name: string
  school: string
  email: string
  phone: string
  category?: string
  bkashNumber?: string
  information: string
}

type PendingPaidRegistration = {
  paymentId: string
  eventId: string
  name: string
  school: string
  email: string
  phone: string
  category?: string
  information: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  bookingId?: string
  createdAt: Date
  updatedAt: Date
}

async function hasExistingRegistration(
  eventId: string,
  normalizedEmail: string
): Promise<boolean> {
  if (!adminDb) return false

  const existingBookings = await adminDb
    .collection('bookings')
    .where('eventId', '==', eventId)
    .where('email', '==', normalizedEmail)
    .get()

  return !existingBookings.empty
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

async function createBookingRecordAndSendEmail(
  event: Event,
  formData: BookingInput,
  paymentMeta?: {
    paymentId: string
    trxId: string
    amountPaid: number
  }
): Promise<{ success: boolean; error?: string; bookingId?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Service temporarily unavailable. Please try again later.' }
  }

  const normalizedPhone = formData.phone.trim().replace(/\s/g, '')
  const normalizedBkash = formData.bkashNumber?.trim().replace(/\s/g, '') ?? ''
  const normalizedEmail = formData.email.trim().toLowerCase()

  const alreadyExists = await hasExistingRegistration(formData.eventId, normalizedEmail)
  if (alreadyExists) {
    return {
      success: false,
      error: 'You have already registered for this event with this email address.',
    }
  }

  const registrationId = generateRegistrationId()
  const bookingRef = adminDb.collection('bookings').doc()
  const bookingId = bookingRef.id
  const now = new Date()

  const bookingData: Record<string, unknown> = {
    eventId: formData.eventId,
    registrationId,
    name: formData.name.trim(),
    school: formData.school.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    category: formData.category?.trim() || '',
    bkashNumber: normalizedBkash,
    information: formData.information ? formData.information.trim() : '',
    createdAt: now,
  }

  if (paymentMeta) {
    bookingData.paymentGateway = 'bkash'
    bookingData.paymentStatus = 'paid'
    bookingData.paymentId = paymentMeta.paymentId
    bookingData.trxId = paymentMeta.trxId
    bookingData.amountPaid = paymentMeta.amountPaid
    bookingData.paidAt = now
  }

  await bookingRef.set(bookingData)

  const emailResult = await sendBookingConfirmationEmail({
    to: normalizedEmail,
    name: formData.name.trim(),
    event,
    registrationId,
    bookingId,
    bookingDetails: {
      school: formData.school.trim(),
      phone: normalizedPhone,
      bkashNumber: normalizedBkash,
      information: formData.information ? formData.information.trim() : '',
    },
  })

  if (!emailResult.success) {
    await bookingRef.delete()
    return {
      success: false,
      error: emailResult.error || 'Failed to send confirmation email. Please try again.',
    }
  }

  revalidatePath(`/dashboard/events/${formData.eventId}`)
  revalidateTag(`dashboard-event-bookings-${formData.eventId}`, 'max')

  return { success: true, bookingId }
}

/**
 * Create a booking for an event
 * This is a public action (no auth required) as users need to book events
 * IMPORTANT: Email confirmation is sent FIRST, booking is only saved if email succeeds
 */
export async function createBooking(
  formData: BookingInput
): Promise<{ success: boolean; error?: string; bookingId?: string }> {
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

    if (!formData.eventId || !formData.name || !formData.school || !formData.email || !formData.phone?.trim()) {
      return { success: false, error: 'All required fields must be filled' }
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
    if (categories.length > 0) {
      const selectedCategory = formData.category?.trim()
      if (!selectedCategory) {
        return { success: false, error: 'Please select a category.' }
      }
      const categoryExists = categories.some(
        (category) => category.name.trim().toLowerCase() === selectedCategory.toLowerCase()
      )
      if (!categoryExists) {
        return { success: false, error: 'Selected category is not valid for this event.' }
      }
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

    if (!formData.name.trim() || !formData.school.trim() || !normalizedEmail || !normalizedPhone) {
      return { success: false, error: 'All required fields must be filled' }
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
    if (categories.length > 0) {
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
      school: formData.school.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      category: selectedCategoryName || undefined,
      information: formData.information ? formData.information.trim() : '',
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
    } catch (error) {
      // Execute can fail for already-processed payment IDs; query current state before failing.
      const queried = await bkashQueryPayment(paymentId)
      const queriedStatus = queried.transactionStatus.toLowerCase()
      if (queriedStatus !== 'completed' && queriedStatus !== 'success') {
        throw error
      }
      execution = queried
    }

    const transactionStatus = execution.transactionStatus.toLowerCase()
    if (transactionStatus !== 'completed' && transactionStatus !== 'success') {
      await pendingRef.update({ status: 'failed', updatedAt: new Date() })
      return { success: false, error: `Payment is not successful (${execution.transactionStatus}).` }
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

/**
 * Get all courses from Firestore (public - no auth required)
 * Only returns non-archived courses
 * Used by Feed component for public display
 * Wrapped with cache() for request deduplication
 */
export const getPublicCourses = cache(async (): Promise<Course[]> => {
  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch courses.')
    return []
  }

  try {
    // Query for non-archived courses only
    const coursesSnapshot = await adminDb
      .collection('courses')
      .where('isArchived', '==', false)
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
})
