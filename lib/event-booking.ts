import { revalidatePath, revalidateTag } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import type { Event } from '@/types/event'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { generateBookingConfirmationPDF } from '@/lib/pdfGenerator'
import { generateRegistrationId } from '@/lib/registrationId'
import { normalizeCustomFormAnswers } from '@/lib/eventCustomForm'
import { getEventRegistrationFields } from '@/lib/registrationFields'
import { resolveBaseUrl } from '@/lib/email/shared'

export type BookingInput = {
  eventId: string
  name: string
  school?: string
  email: string
  phone: string
  category?: string
  bkashNumber?: string
  information?: string
  customAnswers?: Record<string, string | string[] | number | null | undefined>
}

export type BookingPaymentMeta = {
  paymentId: string
  trxId?: string
  amountPaid: number
  paymentGateway?: 'bkash' | 'manual'
}

export type CreateBookingRecordOptions = {
  sendEmail?: boolean
  /** When no paymentMeta, set this status (admin waived uses 'n/a'). */
  paymentStatusForUnpaid?: 'n/a'
}

export function normalizeSchoolValue(value: string | undefined): string {
  if (!value) return ''
  return value.trim().replace(/\s+/g, ' ')
}

export async function hasExistingRegistration(
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

/**
 * Shared booking writer used by public checkout finalize and admin manual create.
 * Not a Server Action — call only from authenticated or validated action paths.
 */
export async function createBookingRecordAndSendEmail(
  event: Event,
  formData: BookingInput,
  paymentMeta?: BookingPaymentMeta,
  options?: CreateBookingRecordOptions
): Promise<{
  success: boolean
  error?: string
  warning?: string
  bookingId?: string
  registrationId?: string
}> {
  if (!adminDb) {
    return { success: false, error: 'Service temporarily unavailable. Please try again later.' }
  }

  const sendEmail = options?.sendEmail !== false
  const normalizedPhone = formData.phone.trim().replace(/\s/g, '')
  const normalizedBkash = formData.bkashNumber?.trim().replace(/\s/g, '') ?? ''
  const normalizedEmail = formData.email.trim().toLowerCase()
  const normalizedSchool = normalizeSchoolValue(formData.school)
  const defaultRegistrationFields = getEventRegistrationFields(event)
  const trimmedName = formData.name.trim()
  const trimmedInformation = formData.information ? formData.information.trim() : ''

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
    name: trimmedName,
    school: defaultRegistrationFields.school.enabled ? normalizedSchool : '',
    email: normalizedEmail,
    phone: normalizedPhone,
    category: defaultRegistrationFields.category.enabled ? formData.category?.trim() || '' : '',
    bkashNumber: normalizedBkash,
    information: defaultRegistrationFields.information.enabled ? trimmedInformation : '',
    customAnswers: normalizeCustomFormAnswers(event.customFormFields, formData.customAnswers),
    createdAt: now,
  }

  if (paymentMeta) {
    bookingData.paymentGateway = paymentMeta.paymentGateway || 'bkash'
    bookingData.paymentStatus = 'paid'
    bookingData.paymentId = paymentMeta.paymentId
    if (paymentMeta.trxId) {
      bookingData.trxId = paymentMeta.trxId
    }
    bookingData.amountPaid = paymentMeta.amountPaid
    bookingData.paidAt = now
  } else if (options?.paymentStatusForUnpaid) {
    bookingData.paymentStatus = options.paymentStatusForUnpaid
  }

  await bookingRef.set(bookingData)

  const bookingDetails = {
    school: normalizedSchool,
    phone: normalizedPhone,
    bkashNumber: normalizedBkash,
    information: trimmedInformation,
  }

  if (!sendEmail) {
    try {
      const verificationUrl = `${resolveBaseUrl()}/verify-booking?registrationId=${encodeURIComponent(registrationId)}`
      const pdfBuffer = await generateBookingConfirmationPDF({
        registrationId,
        bookingId,
        event,
        bookingDetails: {
          ...bookingDetails,
          name: trimmedName,
          email: normalizedEmail,
        },
        verificationUrl,
      })
      if (pdfBuffer && pdfBuffer.length > 0) {
        await bookingRef.update({
          emailSent: false,
          pdfGenerated: true,
          pdfGeneratedAt: new Date(),
        })
      } else {
        await bookingRef.update({
          emailSent: false,
          pdfGenerated: false,
        })
      }
    } catch (pdfError) {
      console.error(
        `[booking] Booking ${bookingId} (${registrationId}) saved without email; PDF generation failed:`,
        pdfError
      )
      try {
        await bookingRef.update({
          emailSent: false,
          pdfGenerated: false,
          pdfError:
            pdfError instanceof Error ? pdfError.message : 'Unknown PDF generation error',
        })
      } catch (updateError) {
        console.error(
          `[booking] Failed to update PDF status for booking ${bookingId}:`,
          updateError
        )
      }
    }

    revalidatePath(`/dashboard/events/${formData.eventId}`)
    revalidateTag(`dashboard-event-bookings-${formData.eventId}`, 'max')
    return { success: true, bookingId, registrationId }
  }

  const emailResult = await sendBookingConfirmationEmail({
    to: normalizedEmail,
    name: trimmedName,
    event,
    registrationId,
    bookingId,
    bookingDetails,
  })

  // Persist email delivery state and PDF metadata on the booking.
  try {
    const pdfUpdate: Record<string, unknown> = {}

    if (emailResult.pdfBuffer && emailResult.pdfBuffer.length > 0) {
      pdfUpdate.pdfGenerated = true
      pdfUpdate.pdfGeneratedAt = new Date()
    } else {
      pdfUpdate.pdfGenerated = false
      if (emailResult.pdfError) {
        pdfUpdate.pdfError = emailResult.pdfError
      }
    }

    if (emailResult.success) {
      await bookingRef.update({
        emailSent: true,
        emailSentAt: new Date(),
        ...pdfUpdate,
      })
    } else {
      console.error(
        `[booking] Booking ${bookingId} (${registrationId}) saved but confirmation email FAILED:`,
        emailResult.error
      )
      await bookingRef.update({
        emailSent: false,
        emailError: emailResult.error || 'Unknown email service error',
        emailFailedAt: new Date(),
        ...pdfUpdate,
      })
    }
  } catch (updateError) {
    console.error(`[booking] Failed to update email/PDF status for booking ${bookingId}:`, updateError)
  }

  revalidatePath(`/dashboard/events/${formData.eventId}`)
  revalidateTag(`dashboard-event-bookings-${formData.eventId}`, 'max')

  if (!emailResult.success) {
    return {
      success: true,
      bookingId,
      registrationId,
      warning: `Your registration was saved (ID: ${registrationId}), but we couldn't send the confirmation email. Please contact support — our team has been notified. Details: ${emailResult.error || 'Unknown error'}`,
    }
  }

  if (!emailResult.pdfAttached) {
    return {
      success: true,
      bookingId,
      registrationId,
      warning: `Your registration was confirmed (ID: ${registrationId}), but we couldn't generate the confirmation PDF. Please contact support if you need your registration document.`,
    }
  }

  return { success: true, bookingId, registrationId }
}
