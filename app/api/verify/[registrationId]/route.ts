import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import type { Booking } from '@/types/booking'
import type { Event } from '@/types/event'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ registrationId: string }>
}

/**
 * API endpoint to verify a registration ID
 * Returns JSON with verification status and booking details
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { registrationId } = await params

    if (!registrationId || registrationId.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Registration ID is required',
        },
        { status: 400 }
      )
    }

    if (!adminDb) {
      console.error('Firebase Admin SDK not available')
      return NextResponse.json(
        {
          success: false,
          error: 'Service temporarily unavailable',
        },
        { status: 503 }
      )
    }

    // Query bookings collection by registrationId
    const bookingsSnapshot = await adminDb
      .collection('bookings')
      .where('registrationId', '==', registrationId)
      .limit(1)
      .get()

    if (bookingsSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'Registration ID not found',
        },
        { status: 404 }
      )
    }

    const bookingDoc = bookingsSnapshot.docs[0]
    const bookingData = bookingDoc.data()

    const booking: Booking = {
      id: bookingDoc.id,
      ...bookingData,
      createdAt: bookingData.createdAt?.toDate?.() || bookingData.createdAt,
    } as Booking

    // Fetch event details
    const eventDoc = await adminDb.collection('events').doc(booking.eventId).get()

    if (!eventDoc.exists) {
      return NextResponse.json(
        {
          success: true,
          valid: true,
          booking: {
            id: booking.id,
            registrationId: booking.registrationId,
            name: booking.name,
            school: booking.school,
            email: booking.email,
            phone: booking.phone,
            bkashNumber: booking.bkashNumber,
            createdAt: booking.createdAt,
          },
          event: null,
        },
        { status: 200 }
      )
    }

    const eventData = eventDoc.data()!
    const event: Event = {
      id: eventDoc.id,
      ...eventData,
      createdAt: eventData.createdAt?.toDate?.() || eventData.createdAt,
      updatedAt: eventData.updatedAt?.toDate?.() || eventData.updatedAt,
    } as Event

    return NextResponse.json(
      {
        success: true,
        valid: true,
        booking: {
          id: booking.id,
          registrationId: booking.registrationId,
          name: booking.name,
          school: booking.school,
          email: booking.email,
          phone: booking.phone,
          bkashNumber: booking.bkashNumber,
          createdAt: booking.createdAt,
        },
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          location: event.location,
          venue: event.venue,
          description: event.description,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying registration:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while verifying the registration',
      },
      { status: 500 }
    )
  }
}

