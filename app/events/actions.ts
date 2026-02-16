'use server'

import { cache } from 'react'
import { adminDb } from '@/lib/firebase-admin'
import { Event } from '@/types/event'
import { Course } from '@/types/course'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { generateRegistrationId } from '@/lib/registrationId'

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
  phone?: string
  parentsPhone: string
  information: string
}): Promise<{ success: boolean; error?: string; bookingId?: string }> {
  try {
    // Validate input (information and phone are optional)
    if (!formData.eventId || !formData.name || !formData.school || !formData.email || !formData.parentsPhone) {
      return {
        success: false,
        error: 'All required fields must be filled',
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

    // Validate phone number format (11 digits starting with 01)
    // Phone number is optional, but if provided, validate format
    const normalizedPhone = formData.phone?.trim().replace(/\s/g, '') || ''
    const normalizedParentsPhone = formData.parentsPhone.trim().replace(/\s/g, '')
    
    if (normalizedPhone) {
      if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith('01')) {
        return {
          success: false,
          error: 'Phone number must be 11 digits and start with 01',
        }
      }
    }
    
    if (normalizedParentsPhone.length !== 11 || !normalizedParentsPhone.startsWith('01')) {
      return {
        success: false,
        error: 'Parent\'s phone number must be 11 digits and start with 01',
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

    // Step 3: Generate unique registration ID
    const registrationId = generateRegistrationId()

    // Step 4: Create booking document reference to get bookingId
    // We'll create the document first, then update it with pdfPath after PDF is generated
    const bookingRef = adminDb.collection('bookings').doc()
    const bookingId = bookingRef.id

    // Step 5: Create booking document initially (without pdfUrl, will update after PDF generation)
    const now = new Date()
    const bookingData: {
      eventId: string
      registrationId: string
      name: string
      school: string
      email: string
      phone: string
      parentsPhone: string
      information: string
      createdAt: Date
      pdfUrl?: string
    } = {
      eventId: formData.eventId,
      registrationId,
      name: formData.name.trim(),
      school: formData.school.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: normalizedPhone || '',
      parentsPhone: normalizedParentsPhone,
      information: formData.information ? formData.information.trim() : '',
      createdAt: now,
    }

    // Create booking document first (so we have bookingId for PDF generation)
    await bookingRef.set(bookingData)

    // Step 6: Send confirmation email with PDF attachment
    // This will generate PDF with bookingId, upload to Cloudinary, and return pdfUrl
    const emailResult = await sendBookingConfirmationEmail({
      to: formData.email.trim().toLowerCase(),
      name: formData.name.trim(),
      event,
      registrationId,
      bookingId,
      bookingDetails: {
        school: formData.school.trim(),
        phone: normalizedPhone || '',
        parentsPhone: normalizedParentsPhone,
        information: formData.information ? formData.information.trim() : '',
      },
    })

    if (!emailResult.success) {
      // If email fails, delete the booking document we just created
      await bookingRef.delete()
      console.error('Failed to send confirmation email:', emailResult.error)
      return {
        success: false,
        error: emailResult.error || 'Failed to send confirmation email. Please check your email address and try again.',
      }
    }

    // Step 7: Update booking document with pdfUrl if PDF was uploaded successfully
    if (emailResult.pdfUrl) {
      await bookingRef.update({
        pdfUrl: emailResult.pdfUrl,
      })
    }

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
