import { formatEventDates, getFirstEventDate, parseEventDates } from '@/lib/dateUtils'
import { generateBookingConfirmationPDF } from '@/lib/pdfGenerator'
import type { BookingConfirmationEmailProps, EmailResult } from './types'
import {
  validateAndNormalizeEmail,
  requireBrevoApiKey,
  resolveBaseUrl,
  resolveSender,
  createBrevoClient,
  createSendSmtpEmail,
} from './shared'
import { buildBookingConfirmationEmailHtml } from './booking-confirmation-html'

/**
 * Send booking confirmation email with event details
 */
export async function sendBookingConfirmationEmail({
  to,
  name,
  event,
  registrationId,
  bookingId,
  bookingDetails,
}: BookingConfirmationEmailProps): Promise<EmailResult> {
  try {
    const emailCheck = validateAndNormalizeEmail(to)
    if (!emailCheck.ok) {
      return {
        success: false,
        error: emailCheck.error,
      }
    }
    const normalizedEmail = emailCheck.email

    const apiKeyCheck = requireBrevoApiKey(true)
    if (!apiKeyCheck.ok) {
      console.error('BREVO_API_KEY is not configured')
      return {
        success: false,
        error: apiKeyCheck.error,
      }
    }

    // Format event date(s)
    const firstDate = getFirstEventDate(event.date)
    const formattedDate = firstDate ? formatEventDates(parseEventDates(event.date), 'long') : 'TBA'

    // Generate PDF confirmation document FIRST (before email HTML)
    const baseUrl = resolveBaseUrl()
    const verificationUrl = `${baseUrl}/verify-booking?registrationId=${encodeURIComponent(registrationId)}`
    
    let pdfBuffer: Buffer | null = null
    let pdfError: string | undefined

    try {
      pdfBuffer = await generateBookingConfirmationPDF({
        registrationId,
        bookingId,
        event,
        bookingDetails: {
          ...bookingDetails,
          name,
          email: to,
        },
        verificationUrl,
      })
      console.log(
        `[email] PDF generated for registration ${registrationId}: ${pdfBuffer?.length ?? 0} bytes`
      )
    } catch (pdfGenError) {
      pdfError =
        pdfGenError instanceof Error ? pdfGenError.message : 'Unknown PDF generation error'
      console.error(
        `[email] Error generating PDF for registration ${registrationId}:`,
        pdfGenError instanceof Error ? pdfGenError.stack || pdfGenError.message : pdfGenError
      )
      // Continue without PDF attachment if generation fails — email is more important than the attachment.
    }

    const emailHtml = buildBookingConfirmationEmailHtml({
      to,
      name,
      event,
      formattedDate,
      bookingDetails,
    })

    const { fromEmail, senderEmail, senderName } = resolveSender()
    const apiInstance = createBrevoClient()
    const sendSmtpEmail = createSendSmtpEmail({
      senderEmail,
      senderName,
      toEmail: normalizedEmail,
      toName: name,
      subject: `Registration Confirmation: ${event.title} - ${registrationId}`,
      htmlContent: emailHtml,
    })


    // Development-only: log masked recipient to verify correct address
    if (process.env.NODE_ENV === 'development') {
      const at = normalizedEmail.indexOf('@')
      const local = at > 0 ? normalizedEmail.slice(0, at) : '?'
      const domain = at > 0 ? normalizedEmail.slice(at + 1) : '?'
      const domainSuffix = domain.includes('.') ? domain.split('.').pop() : 'com'
      const masked = `${local[0]}***@***.${domainSuffix}`
      console.log('Confirmation email sending to:', masked)
    }

    // Attach PDF if generated successfully. Brevo's SendSmtpEmail.attachment is
    // Array<{ url? | content?, name? }> where `content` must be base64-encoded.
    let pdfAttached = false
    if (pdfBuffer && pdfBuffer.length > 0) {
      try {
        const base64Content = pdfBuffer.toString('base64')
        sendSmtpEmail.attachment = [
          {
            name: `Registration-Confirmation-${registrationId}.pdf`,
            content: base64Content,
          },
        ]
        pdfAttached = true
        console.log(
          `[email] PDF attached to email for registration ${registrationId}: ${pdfBuffer.length} bytes (${base64Content.length} base64 chars)`
        )
      } catch (attachmentError) {
        const attachMsg =
          attachmentError instanceof Error ? attachmentError.message : 'Failed to prepare PDF attachment'
        pdfError = pdfError ? `${pdfError}; ${attachMsg}` : attachMsg
        console.error(
          `[email] Error preparing PDF attachment for registration ${registrationId}:`,
          attachmentError instanceof Error ? attachmentError.message : attachmentError
        )
      }
    } else {
      console.warn(
        `[email] No PDF attachment for registration ${registrationId} (buffer is ${pdfBuffer === null ? 'null' : 'empty'}). Email will be sent without attachment.`
      )
    }

    const withPdfMeta = (result: EmailResult): EmailResult => ({
      ...result,
      pdfAttached,
      pdfError,
      pdfBuffer: pdfBuffer && pdfBuffer.length > 0 ? pdfBuffer : null,
    })

    try {
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail)

      // Brevo SDK signature: Promise<{ response: http.IncomingMessage; body: CreateSmtpEmail }>
      // body.messageId is the canonical success indicator.
      const body = (data as { body?: unknown } | undefined)?.body as
        | { messageId?: string; code?: string | number; message?: string }
        | undefined
      const httpStatus = (data as { response?: { statusCode?: number } } | undefined)?.response?.statusCode

      if (body && typeof body === 'object' && typeof body.messageId === 'string' && body.messageId.length > 0) {
        console.log(
          `[email] Brevo accepted registration ${registrationId} (status ${httpStatus ?? 'unknown'}, messageId ${body.messageId})`
        )
        return withPdfMeta({ success: true })
      }

      // Some Brevo error responses come back without throwing (e.g. 2xx with code field).
      if (body && typeof body === 'object' && (body.code || body.message)) {
        const errMsg = body.message || String(body.code) || 'Email service returned an error response'
        console.error(
          `[email] Brevo returned non-success body for registration ${registrationId} (status ${httpStatus ?? 'unknown'}):`,
          body
        )
        return { success: false, error: errMsg }
      }

      // Defensive fallback: any 2xx HTTP with no error fields means Brevo queued the email.
      if (typeof httpStatus === 'number' && httpStatus >= 200 && httpStatus < 300) {
        console.warn(
          `[email] Brevo returned ${httpStatus} but no messageId for registration ${registrationId}. Treating as success but please verify in Brevo dashboard.`
        )
        return withPdfMeta({ success: true })
      }

      console.error('[email] Unexpected Brevo response shape:', {
        httpStatus,
        bodyType: typeof body,
        body,
      })
      return {
        success: false,
        error: `Email service returned an unexpected response (status ${httpStatus ?? 'unknown'}). Check server logs for details.`,
      }
    } catch (error: unknown) {
      console.error('Brevo email error:', error)
      
      // Handle Brevo API errors
      const errorObj = error as { response?: { status?: number; body?: unknown; data?: unknown }; statusCode?: number; message?: string }
      
      if (errorObj.response) {
        const statusCode = errorObj.response.status || errorObj.statusCode
        const errorBody = (errorObj.response.body || errorObj.response.data || {}) as { message?: string }
        const errorMessage = errorBody.message || errorObj.message || 'Unknown error'
        
        // Provide more specific error messages based on error type
        if (errorMessage.includes('not verified') || errorMessage.includes('domain is not verified')) {
          return {
            success: false,
            error: `Email domain not verified. Please verify your domain at https://app.brevo.com/settings/senders/domains. Current from address: ${fromEmail}`,
          }
        }
        
        if (statusCode === 403 || statusCode === 401) {
          return {
            success: false,
            error: `Email service access denied (${statusCode}). Possible causes:\n1. Invalid or expired BREVO_API_KEY - Get a new key from https://app.brevo.com/settings/keys/api\n2. Domain not verified - Verify your domain at https://app.brevo.com/settings/senders/domains\n3. API key doesn't have send permissions\n\nError: ${errorMessage}\n\nCurrent from address: ${fromEmail}`,
          }
        }
        
        if (statusCode === 422) {
          // 422 usually means invalid email address or format
          if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('address')) {
            return {
              success: false,
              error: `Invalid email address: ${normalizedEmail}. Please check the email address and try again.`,
            }
          }
          return {
            success: false,
            error: `Invalid email configuration. Please check your BREVO_FROM_EMAIL setting. Current from address: ${fromEmail}\n\nThe from address must be from a verified domain in Brevo. Verify your domain at https://app.brevo.com/settings/senders/domains.`,
          }
        }
        
        // Check for invalid email address errors
        if (errorMessage.toLowerCase().includes('invalid email') || 
            errorMessage.toLowerCase().includes('email address') ||
            errorMessage.toLowerCase().includes('recipient') ||
            errorMessage.toLowerCase().includes('does not exist')) {
          return {
            success: false,
            error: `Invalid email address: ${normalizedEmail}. Please check the email address and try again.`,
          }
        }
        
        return {
          success: false,
          error: errorMessage || `Failed to send confirmation email (Status: ${statusCode || 'Unknown'}). Please check your email address and Brevo configuration.`,
        }
      }
      
      // Handle non-API errors
      const errorMessage = errorObj.message || 'An unexpected error occurred while sending the email'
      return {
        success: false,
        error: errorMessage,
      }
    }
  } catch (error) {
    console.error('Error sending registration confirmation email:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    }
  }
}

