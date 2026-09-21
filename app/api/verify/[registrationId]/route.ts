import { NextResponse } from 'next/server'
import { collectionGet, getBookingByRegistrationId } from '@/lib/db/collections'
import type { Booking } from '@/types/booking'
import type { Event } from '@/types/event'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ registrationId: string }>
}

function parseCreatedAt(value: unknown): unknown {
  if (value == null) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate()
    } catch {
      return value
    }
  }
  return value
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { registrationId } = await params

    if (!registrationId || registrationId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Registration ID is required' },
        { status: 400 },
      )
    }

    const bookingDoc = await getBookingByRegistrationId(registrationId)
    if (!bookingDoc) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Registration ID not found' },
        { status: 404 },
      )
    }

    const booking: Booking = {
      id: String(bookingDoc.id),
      ...(bookingDoc as Record<string, unknown>),
      createdAt: parseCreatedAt(bookingDoc.createdAt),
    } as Booking

    const eventDoc = await collectionGet('events', String(booking.eventId))

    if (!eventDoc) {
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
        { status: 200 },
      )
    }

    const event: Event = {
      id: String(eventDoc.id),
      ...(eventDoc as Record<string, unknown>),
      createdAt: parseCreatedAt(eventDoc.createdAt),
      updatedAt: parseCreatedAt(eventDoc.updatedAt),
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
      { status: 200 },
    )
  } catch (error) {
    console.error('Error verifying registration:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred while verifying the registration' },
      { status: 500 },
    )
  }
}
