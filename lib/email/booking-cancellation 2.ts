import { formatEventDates, getFirstEventDate, parseEventDates } from '@/lib/dateUtils'
import type { BookingCancellationEmailProps } from './types'
import {
  validateAndNormalizeEmail,
  requireBrevoApiKey,
  resolveSender,
  createBrevoClient,
  createSendSmtpEmail,
} from './shared'
import { buildBookingCancellationEmailHtml } from './booking-cancellation-html'

/**
 * Send booking cancellation email with event details
 */
export async function sendBookingCancellationEmail({
  to,
  name,
  event,
  registrationId,
}: BookingCancellationEmailProps): Promise<{ success: boolean; error?: string }> {
  try {
    const emailCheck = validateAndNormalizeEmail(to)
    if (!emailCheck.ok) {
      return {
        success: false,
        error: emailCheck.error,
      }
    }
    const normalizedEmail = emailCheck.email

    const apiKeyCheck = requireBrevoApiKey(false)
    if (!apiKeyCheck.ok) {
      return {
        success: false,
        error: apiKeyCheck.error,
      }
    }

    // Format event date(s)
    const firstDate = getFirstEventDate(event.date)
    const formattedDate = firstDate ? formatEventDates(parseEventDates(event.date), 'long') : 'TBA'

    const emailHtml = buildBookingCancellationEmailHtml({
      name,
      event,
      formattedDate,
      registrationId,
    })

    const { senderEmail, senderName } = resolveSender()
    const apiInstance = createBrevoClient()
    const sendSmtpEmail = createSendSmtpEmail({
      senderEmail,
      senderName,
      toEmail: normalizedEmail,
      toName: name,
      subject: `Registration Cancelled: ${event.title} - ${registrationId}`,
      htmlContent: emailHtml,
    })


    try {
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail)
      
      // Log the response for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('Brevo API response (cancellation):', JSON.stringify(data, null, 2))
      }
      
      // Check if Brevo returned a valid response
      if (data === null || data === undefined) {
        return {
          success: false,
          error: 'Email service returned no response. Please check your Brevo API configuration.',
        }
      }
      
      // Handle string responses (messageId as string) - check this first
      if (typeof data === 'string') {
        return {
          success: true,
        }
      }
      
      // Check for error indicators first
      if (typeof data === 'object' && data !== null) {
        const responseData = data as Record<string, unknown>
        
        // Check for explicit error fields
        if ('error' in responseData || 'code' in responseData) {
          const errorCode = responseData.code
          const errorMsg = 
            (responseData.error as string) || 
            (responseData.message as string) ||
            (errorCode ? String(errorCode) : null) ||
            'Email service returned an error response'
          
          // Check if it's actually an error code (4xx, 5xx) or just a status code
          if (errorCode && typeof errorCode === 'number' && errorCode >= 400) {
            return {
              success: false,
              error: String(errorMsg),
            }
          }
          
          // If error field exists but code is not an error code, might be a status field
          // Check the actual error message content
          const errorString = String(errorMsg).toLowerCase()
          if (errorString.includes('error') || errorString.includes('invalid') || errorString.includes('failed')) {
            return {
              success: false,
              error: String(errorMsg),
            }
          }
        }
        
        // Check for success indicators
        if ('messageId' in responseData) {
          return {
            success: true,
          }
        }
        
        // Empty object from Brevo usually means success
        if (Object.keys(responseData).length === 0) {
          return {
            success: true,
          }
        }
        
        // If we have an object response with no error indicators, consider it success
        return {
          success: true,
        }
      }
      
      // Unexpected response format
      console.error('Unexpected Brevo response format (cancellation):', typeof data, data)
      return {
        success: false,
        error: `Email service returned an unexpected response format. Response type: ${typeof data}. Please check your Brevo API configuration and try again.`,
      }
    } catch (error: unknown) {
      const errorObj = error as { response?: { status?: number; body?: unknown; data?: unknown }; statusCode?: number; message?: string }
      
      if (errorObj.response) {
        const statusCode = errorObj.response.status || errorObj.statusCode
        const errorBody = (errorObj.response.body || errorObj.response.data || {}) as { message?: string }
        const errorMessage = errorBody.message || errorObj.message || 'Unknown error'
        
        // Check for invalid email address errors
        if (statusCode === 422 || 
            errorMessage.toLowerCase().includes('invalid email') || 
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
          error: errorMessage || `Failed to send cancellation email (Status: ${statusCode || 'Unknown'}). Please check your email address and try again.`,
        }
      }
      
      const errorMessage = errorObj.message || 'An unexpected error occurred while sending the email'
      return {
        success: false,
        error: errorMessage,
      }
    }
  } catch {
    return {
      success: false,
      error: 'An unexpected error occurred while sending the cancellation email',
    }
  }
}
