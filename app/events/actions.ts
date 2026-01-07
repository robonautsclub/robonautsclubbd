'use server'

import { adminDb } from '@/lib/firebase-admin'
import { Event } from '@/types/event'

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
    const eventsSnapshot = await adminDb.collection('events').orderBy('createdAt', 'desc').get()
    
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

    // Create booking in Firestore
    const now = new Date()
    const bookingRef = await adminDb.collection('bookings').add({
      eventId: formData.eventId,
      name: formData.name.trim(),
      school: formData.school.trim(),
      email: formData.email.trim().toLowerCase(),
      information: formData.information.trim(),
      createdAt: now,
    })

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
