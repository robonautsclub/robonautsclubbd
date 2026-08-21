import type { Event } from '@/types/event'

export interface BookingConfirmationEmailProps {
  to: string
  name: string
  event: Event
  registrationId: string
  bookingId: string
  bookingDetails: {
    school: string
    phone: string
    bkashNumber?: string
    information: string
  }
}

export interface EmailResult {
  success: boolean
  error?: string
  pdfAttached?: boolean
  pdfError?: string
  pdfBuffer?: Buffer | null
}

export interface BookingCancellationEmailProps {
  to: string
  name: string
  event: Event
  registrationId: string
}
