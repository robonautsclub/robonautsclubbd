'use server'

import { adminDb } from '@/lib/firebase-admin'
import { Event } from '@/types/event'
import { sendBookingConfirmationEmail } from '@/lib/email'

/**
 * Get all events from Firestore (public - no auth required)
 */
export async function getPublicEvents(): Promise<Event[]> {
  if (!adminDb) {
    console.error('Firebase Admin SDK not available. Cannot fetch events.')
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
      events.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as Event)
    })

    // Sort by createdAt in descending order (newest first)
    events.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1
      
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
      return dateB - dateA // Descending order
    })

    return events
  } catch (error) {
    console.error('Error fetching events:', error)
    // Return empty array instead of throwing for public pages
    return []
  }
}

/**
 * Get a single event by ID (public - no auth required)
 */
export async function getPublicEvent(id: string): Promise<Event | null> {
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
    return {
      id: eventDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    } as Event
  } catch (error) {
    console.error('Error fetching event:', error)
    return null
  }
}

/**
 * Create a booking for an event
 * This is a public action (no auth required) as users need to book events
 * IMPORTANT: Email confirmation is sent FIRST, booking is only saved if email succeeds
 */
export async function createBooking(formData: {
  eventId: string
  name: string
  school: string
  email: string
  information: string
}): Promise<{ success: boolean; error?: string; bookingId?: string }> {
  try {
    // Validate input
    if (!formData.eventId || !formData.name || !formData.school || !formData.email || !formData.information) {
      return {
        success: false,
        error: 'All fields are required',
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return {
        success: false,
        error: 'Invalid email format',
      }
    }

    // Check if Admin SDK is available
    if (!adminDb) {
      console.error('Firebase Admin SDK not available. Cannot create booking.')
      return {
        success: false,
        error: 'Service temporarily unavailable. Please try again later.',
      }
    }

    // Step 1: Check if user has already booked this event with the same email
    const normalizedEmail = formData.email.trim().toLowerCase()
    const existingBookings = await adminDb
      .collection('bookings')
      .where('eventId', '==', formData.eventId)
      .where('email', '==', normalizedEmail)
      .get()

    if (!existingBookings.empty) {
      return {
        success: false,
        error: 'You have already registered for this event with this email address.',
      }
    }

    // Step 2: Fetch event details for the email
    const eventDoc = await adminDb.collection('events').doc(formData.eventId).get()
    
    if (!eventDoc.exists) {
      return {
        success: false,
        error: 'Event not found',
      }
    }

    const eventData = eventDoc.data()!
    const event: Event = {
      id: eventDoc.id,
      ...eventData,
      createdAt: eventData.createdAt?.toDate?.() || eventData.createdAt,
      updatedAt: eventData.updatedAt?.toDate?.() || eventData.updatedAt,
    } as Event

    // Step 3: Send confirmation email FIRST
    // Only proceed to save booking if email is sent successfully
    const emailResult = await sendBookingConfirmationEmail({
      to: formData.email.trim().toLowerCase(),
      name: formData.name.trim(),
      event,
      bookingDetails: {
        school: formData.school.trim(),
        information: formData.information.trim(),
      },
    })

    if (!emailResult.success) {
      console.error('Failed to send confirmation email:', emailResult.error)
      return {
        success: false,
        error: emailResult.error || 'Failed to send confirmation email. Please check your email address and try again.',
      }
    }

    // Step 4: Only save booking to database if email was sent successfully
    const now = new Date()
    const bookingRef = await adminDb.collection('bookings').add({
      eventId: formData.eventId,
      name: formData.name.trim(),
      school: formData.school.trim(),
      email: formData.email.trim().toLowerCase(),
      information: formData.information.trim(),
      createdAt: now,
    })

    console.log('Booking created successfully after email confirmation:', bookingRef.id)

    return {
      success: true,
      bookingId: bookingRef.id,
    }
  } catch (error) {
    console.error('Error creating booking:', error)
    return {
      success: false,
      error: 'Failed to create booking. Please try again.',
    }
  }
}
