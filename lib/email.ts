import * as brevo from '@getbrevo/brevo'
import type { Event } from '@/types/event'
import { SITE_CONFIG } from './site-config'
import { formatEventDates, getFirstEventDate, parseEventDates } from './dateUtils'
import { generateBookingConfirmationPDF } from './pdfGenerator'
import { uploadPDFToStorage } from './pdfStorage'

interface BookingConfirmationEmailProps {
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

interface EmailResult {
  success: boolean
  error?: string
  pdfUrl?: string // Cloudinary URL for the uploaded PDF
}


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
    // Validate email format before proceeding
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!to || !to.trim() || !emailRegex.test(to.trim())) {
      return {
        success: false,
        error: 'Invalid email address. Please provide a valid email address.',
      }
    }

    // Normalize email
    const normalizedEmail = to.trim().toLowerCase()

    // Check if Brevo API key is configured
    if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY.trim() === '') {
      console.error('BREVO_API_KEY is not configured')
      return {
        success: false,
        error: 'Email service is not configured. Please set BREVO_API_KEY in your environment variables. Get your API key from https://app.brevo.com/settings/keys/api',
      }
    }

    // Format event date(s)
    const firstDate = getFirstEventDate(event.date)
    const formattedDate = firstDate ? formatEventDates(parseEventDates(event.date), 'long') : 'TBA'

    // Generate PDF confirmation document FIRST (before email HTML)
    // Get base URL from environment variables, ensuring proper HTTPS in production
    // Priority: NEXT_PUBLIC_BASE_URL > VERCEL_URL > VERCEL_BRANCH_URL > localhost (dev only)
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    
    if (!baseUrl) {
      // Try VERCEL_URL (Vercel automatically provides this)
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`
      }
      // Try VERCEL_BRANCH_URL (for preview deployments)
      else if (process.env.VERCEL_BRANCH_URL) {
        baseUrl = process.env.VERCEL_BRANCH_URL.startsWith('http') 
          ? process.env.VERCEL_BRANCH_URL 
          : `https://${process.env.VERCEL_BRANCH_URL}`
      }
      // Fallback to localhost only in development
      else if (process.env.NODE_ENV === 'development') {
        baseUrl = 'http://localhost:3000'
      }
      // Production fallback from site config
      else {
        baseUrl = SITE_CONFIG.url
      }
    }
    
    // Ensure baseUrl doesn't have trailing slash and enforce HTTPS in production
    baseUrl = baseUrl.replace(/\/$/, '')
    if (process.env.NODE_ENV === 'production' && baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.replace('http://', 'https://')
    }
    
    // Generate verification URL using registrationId (this is what users will scan/enter)
    const verificationUrl = `${baseUrl}/verify-booking?registrationId=${encodeURIComponent(registrationId)}`
    
    let pdfBuffer: Buffer | null = null
    let pdfUrl: string | null = null
    
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
      
      // Upload PDF to Cloudinary with event-based folder structure
      // PDFs are stored in: events/<event-id>/booking-<bookingId>.pdf
      // Cloudinary automatically creates the folder if it doesn't exist
      if (pdfBuffer) {
        pdfUrl = await uploadPDFToStorage(pdfBuffer, event.id, bookingId)
        if (!pdfUrl) {
          console.warn('Failed to upload PDF to Cloudinary, but continuing with email send')
        }
      }
    } catch (pdfError) {
      console.error('Error generating or storing PDF:', pdfError)
      // Continue without PDF attachment if generation fails
    }

    // Create email HTML content (after PDF is generated so we can include PDF URL if available)
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Booking Confirmation - ${event.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6; color: #374151;">
  <!-- Wrapper Table -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header with Brand -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 0;">
              <!-- Top Spacer -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding: 48px 40px 32px; text-align: center;">
                    <!-- Success Icon -->
                    <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 24px; display: inline-block; line-height: 80px; text-align: center; backdrop-filter: blur(10px);">
                      <span style="font-size: 42px; color: #ffffff;">✓</span>
                    </div>
                    <!-- Title -->
                    <h1 style="margin: 0 0 12px; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Booking Confirmed</h1>
                    <p style="margin: 0; color: rgba(255, 255, 255, 0.95); font-size: 17px; font-weight: 400;">Your registration has been successfully processed</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Greeting -->
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.7;">
                Dear <strong style="color: #111827; font-weight: 600;">${name}</strong>,
              </p>
              <p style="margin: 0 0 32px; color: #4b5563; font-size: 16px; line-height: 1.7;">
                Thank you for registering! We're thrilled to confirm your booking for <strong style="color: #6366f1; font-weight: 600;">${event.title}</strong>. Your spot has been secured and we're looking forward to having you join us.
              </p>
              
              <!-- Event Details Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(to right, #f8fafc 0%, #ffffff 100%); border: 2px solid #e2e8f0; border-radius: 12px; margin-bottom: 32px; overflow: hidden;">
                <tr>
                  <td style="padding: 0;">
                    <!-- Card Header -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="background-color: #6366f1; padding: 20px 28px;">
                          <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">📅 Event Details</h2>
                        </td>
                      </tr>
                    </table>
                    <!-- Card Body -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 28px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                    <td width="130" style="padding: 0; color: #6b7280; font-size: 14px; font-weight: 500; vertical-align: top;">Event Name:</td>
                                    <td style="padding: 0; color: #111827; font-size: 15px; font-weight: 600; vertical-align: top;">${event.title}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                    <td width="130" style="padding: 0; color: #6b7280; font-size: 14px; font-weight: 500; vertical-align: top;">📆 Date:</td>
                                    <td style="padding: 0; color: #111827; font-size: 15px; font-weight: 500; vertical-align: top;">${formattedDate}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            ${event.time ? `
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                    <td width="130" style="padding: 0; color: #6b7280; font-size: 14px; font-weight: 500; vertical-align: top;">🕐 Time:</td>
                                    <td style="padding: 0; color: #111827; font-size: 15px; font-weight: 500; vertical-align: top;">${event.time}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            ` : ''}
                            ${event.venue || event.location ? `
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                    <td width="130" style="padding: 0; color: #6b7280; font-size: 14px; font-weight: 500; vertical-align: top;">📍 Venue:</td>
                                    <td style="padding: 0; color: #111827; font-size: 15px; font-weight: 500; vertical-align: top;">${event.venue || event.location}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            ` : ''}
                            ${event.eligibility ? `
                            <tr>
                              <td style="padding: 12px 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                    <td width="130" style="padding: 0; color: #6b7280; font-size: 14px; font-weight: 500; vertical-align: top;">🎯 Eligibility:</td>
                                    <td style="padding: 0; color: #111827; font-size: 15px; font-weight: 500; vertical-align: top;">${event.eligibility}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${event.description ? `
              <!-- Event Description -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding: 0 0 12px;">
                    <h3 style="margin: 0; color: #111827; font-size: 18px; font-weight: 600; letter-spacing: -0.2px;">About the Event</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px; background-color: #f8fafc; border-left: 4px solid #6366f1; border-radius: 8px;">
                    <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                      ${event.fullDescription || event.description}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              ${event.agenda ? `
              <!-- Agenda -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding: 0 0 12px;">
                    <h3 style="margin: 0; color: #111827; font-size: 18px; font-weight: 600; letter-spacing: -0.2px;">📋 Agenda</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.8; white-space: pre-line;">${event.agenda}</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Booking Information Highlight -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #93c5fd; border-radius: 12px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 28px;">
                    <h3 style="margin: 0 0 20px; color: #1e40af; font-size: 18px; font-weight: 600; letter-spacing: -0.2px;">✉️ Your Booking Information</h3>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(147, 197, 253, 0.3);">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="120" style="padding: 0; color: #3b82f6; font-size: 14px; font-weight: 500; vertical-align: top;">Name:</td>
                              <td style="padding: 0; color: #1e40af; font-size: 15px; font-weight: 600; vertical-align: top;">${name}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(147, 197, 253, 0.3);">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="120" style="padding: 0; color: #3b82f6; font-size: 14px; font-weight: 500; vertical-align: top;">School:</td>
                              <td style="padding: 0; color: #1e40af; font-size: 15px; font-weight: 600; vertical-align: top;">${bookingDetails.school}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(147, 197, 253, 0.3);">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="120" style="padding: 0; color: #3b82f6; font-size: 14px; font-weight: 500; vertical-align: top;">Email:</td>
                              <td style="padding: 0; color: #1e40af; font-size: 15px; font-weight: 600; vertical-align: top; word-break: break-word;">${to}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid rgba(147, 197, 253, 0.3);">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="120" style="padding: 0; color: #3b82f6; font-size: 14px; font-weight: 500; vertical-align: top;">Phone:</td>
                              <td style="padding: 0; color: #1e40af; font-size: 15px; font-weight: 600; vertical-align: top;">${bookingDetails.phone}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${bookingDetails.bkashNumber ? `
                      <tr>
                        <td style="padding: 10px 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="120" style="padding: 0; color: #3b82f6; font-size: 14px; font-weight: 500; vertical-align: top;">bKash Number:</td>
                              <td style="padding: 0; color: #1e40af; font-size: 15px; font-weight: 600; vertical-align: top;">${bookingDetails.bkashNumber}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              
              <!-- Closing Message -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding: 24px; background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #10b981;">
                    <p style="margin: 0 0 12px; color: #374151; font-size: 15px; line-height: 1.7;">
                      We look forward to seeing you at the event! If you have any questions or need to make changes to your booking, please don't hesitate to reach out to us.
                    </p>
                    <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.7;">
                      Best regards,<br>
                      <strong style="color: #6366f1; font-weight: 600; font-size: 16px;">The ${SITE_CONFIG.name} Team</strong>
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 16px;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                      This is an automated confirmation email. Please save this email for your records.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 16px 0; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} ${SITE_CONFIG.name}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Determine the "from" email address
    // Priority:
    // 1. Use BREVO_FROM_EMAIL if set (must be from a verified domain)
    // 2. Fallback to default sender address
    // 3. For production, verify your domain in Brevo and use your custom domain
    let fromEmail = process.env.BREVO_FROM_EMAIL
    
    // If no custom from email is set, use the default sender
    // For production, verify your domain at https://app.brevo.com/settings/senders/domains and set BREVO_FROM_EMAIL
    if (!fromEmail || fromEmail.trim() === '') {
      fromEmail = `${SITE_CONFIG.name} <${SITE_CONFIG.noreplyEmail}>`
    }

    // Parse sender email and name
    let senderEmail: string = fromEmail
    let senderName: string = SITE_CONFIG.name
    
    // Check if fromEmail contains name in format "Name <email@domain.com>"
    const nameMatch = fromEmail.match(/^(.+?)\s*<(.+?)>$/)
    if (nameMatch) {
      senderName = nameMatch[1].trim()
      senderEmail = nameMatch[2].trim()
    }

    // Initialize Brevo client with API key
    const apiInstance = new brevo.TransactionalEmailsApi()
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!)

    // Send email using Brevo
    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.sender = { email: senderEmail, name: senderName }
    sendSmtpEmail.to = [{ email: normalizedEmail, name: name }]
    sendSmtpEmail.subject = `Booking Confirmation: ${event.title} - ${registrationId}`
    sendSmtpEmail.htmlContent = emailHtml

    // Attach PDF if generated successfully
    if (pdfBuffer && pdfBuffer.length > 0) {
      try {
        const base64Content = pdfBuffer.toString('base64')
        
        // Brevo expects attachments with name and content (base64 encoded)
        const attachment: { name: string; content: string } = {
          name: `Booking-Confirmation-${registrationId}.pdf`,
          content: base64Content,
        }
        
        // Set attachments - Brevo SDK uses 'attachment' property
        const emailWithAttachment = sendSmtpEmail as typeof sendSmtpEmail & { attachment?: Array<{ name: string; content: string }> }
        emailWithAttachment.attachment = [attachment]
      } catch (attachmentError) {
        console.error('Error preparing PDF attachment:', attachmentError)
      }
    }

    try {
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail)
      
      // Log the response for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('Brevo API response:', JSON.stringify(data, null, 2))
      }
      
      // Check if Brevo returned a valid response
      // Brevo can return different response formats:
      // 1. Object with messageId (most common)
      // 2. Object with messageId as a property
      // 3. String messageId
      // 4. Empty object or null (still considered success if no error)
      
      if (data === null || data === undefined) {
        // Null/undefined response - likely an error
        return {
          success: false,
          error: 'Email service returned no response. Please check your Brevo API configuration.',
        }
      }
      
      // Handle string responses (messageId as string) - check this first
      if (typeof data === 'string') {
        return {
          success: true,
          pdfUrl: pdfUrl || undefined,
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
          // Email was accepted by Brevo - return success
          return {
            success: true,
            pdfUrl: pdfUrl || undefined,
          }
        }
        
        // If response is an object but has no error or messageId, check if it's empty
        // Empty object from Brevo usually means success (email was queued)
        if (Object.keys(responseData).length === 0) {
          return {
            success: true,
            pdfUrl: pdfUrl || undefined,
          }
        }
        
        // If we have an object response with no error indicators, consider it success
        // Brevo might return success responses in different formats
        // Only fail if we explicitly see error indicators
        return {
          success: true,
          pdfUrl: pdfUrl || undefined,
        }
      }
      
      // If we got an unexpected response format, log it and return a more helpful error
      // Always log unexpected responses for debugging
      console.error('Unexpected Brevo response format:', {
        type: typeof data,
        data: JSON.stringify(data, null, 2),
        hasMessageId: typeof data === 'object' && data !== null ? 'messageId' in (data as Record<string, unknown>) : false,
      })
      return {
        success: false,
        error: `Email service returned an unexpected response format. Response type: ${typeof data}. Please check your Brevo API configuration. If the problem persists, check server logs for the actual response.`,
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
    console.error('Error sending booking confirmation email:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    }
  }
}

interface BookingCancellationEmailProps {
  to: string
  name: string
  event: Event
  registrationId: string
}

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
    // Validate email format before proceeding
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!to || !to.trim() || !emailRegex.test(to.trim())) {
      return {
        success: false,
        error: 'Invalid email address. Please provide a valid email address.',
      }
    }

    // Normalize email
    const normalizedEmail = to.trim().toLowerCase()

    // Check if Brevo API key is configured
    if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY.trim() === '') {
      return {
        success: false,
        error: 'Email service is not configured. Please set BREVO_API_KEY in your environment variables.',
      }
    }

    // Format event date(s)
    const firstDate = getFirstEventDate(event.date)
    const formattedDate = firstDate ? formatEventDates(parseEventDates(event.date), 'long') : 'TBA'

    // Create nicely decorated cancellation email HTML
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancellation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Red/Orange Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); padding: 40px 40px 32px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 0 20px;">
                    <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 3px solid rgba(255, 255, 255, 0.3);">
                      <span style="font-size: 40px;">⚠️</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2;">Registration Cancelled</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 12px;">
                    <p style="margin: 0; color: #fee2e2; font-size: 16px; font-weight: 500;">Your registration has been cancelled</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Greeting -->
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.7;">
                Dear <strong style="color: #111827; font-weight: 600;">${name}</strong>,
              </p>
              <p style="margin: 0 0 32px; color: #4b5563; font-size: 16px; line-height: 1.7;">
                We regret to inform you that your registration for <strong style="color: #ef4444; font-weight: 600;">${event.title}</strong> has been cancelled by our administration team. We understand this may be disappointing and apologize for any inconvenience this may cause.
              </p>
              
              <!-- Cancellation Notice Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(to right, #fef2f2 0%, #fff7ed 100%); border: 2px solid #fca5a5; border-radius: 12px; margin-bottom: 32px; overflow: hidden;">
                <tr>
                  <td style="padding: 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 0 0 20px;">
                          <h3 style="margin: 0; color: #dc2626; font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">⚠️ Cancellation Details</h3>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px; background-color: #ffffff; border-radius: 8px; border: 1px solid #fecaca;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 0 0 12px; color: #991b1b; font-size: 14px; font-weight: 600; vertical-align: top;">Registration ID:</td>
                              <td style="padding: 0 0 12px; color: #dc2626; font-size: 15px; font-weight: 700; font-family: 'Courier New', monospace; vertical-align: top;">${registrationId}</td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding: 12px 0 0; border-top: 1px solid #fee2e2;">
                                <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
                                  This registration has been permanently cancelled and cannot be restored. If you believe this was done in error, please contact us immediately.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Event Details Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(to right, #f8fafc 0%, #ffffff 100%); border: 2px solid #e2e8f0; border-radius: 12px; margin-bottom: 32px; overflow: hidden;">
                <tr>
                  <td style="padding: 0;">
                    <!-- Card Header -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="background-color: #6b7280; padding: 20px 28px;">
                          <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">📅 Event Details</h2>
                        </td>
                      </tr>
                    </table>
                    <!-- Card Body -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 28px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                    <td width="130" style="padding: 0; color: #6b7280; font-size: 14px; font-weight: 500; vertical-align: top;">Event Name:</td>
                                    <td style="padding: 0; color: #111827; font-size: 15px; font-weight: 600; vertical-align: top;">${event.title}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                    <td width="130" style="padding: 0; color: #6b7280; font-size: 14px; font-weight: 500; vertical-align: top;">📆 Date:</td>
                                    <td style="padding: 0; color: #111827; font-size: 15px; font-weight: 500; vertical-align: top;">${formattedDate}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            ${event.time ? `
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                    <td width="130" style="padding: 0; color: #6b7280; font-size: 14px; font-weight: 500; vertical-align: top;">🕐 Time:</td>
                                    <td style="padding: 0; color: #111827; font-size: 15px; font-weight: 500; vertical-align: top;">${event.time}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            ` : ''}
                            ${event.venue || event.location ? `
                            <tr>
                              <td style="padding: 12px 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                  <tr>
                                    <td width="130" style="padding: 0; color: #6b7280; font-size: 14px; font-weight: 500; vertical-align: top;">📍 Venue:</td>
                                    <td style="padding: 0; color: #111827; font-size: 15px; font-weight: 500; vertical-align: top;">${event.venue || event.location}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Next Steps Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #93c5fd; border-radius: 12px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 28px;">
                    <h3 style="margin: 0 0 20px; color: #1e40af; font-size: 18px; font-weight: 600; letter-spacing: -0.2px;">💡 What's Next?</h3>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 0 0 16px;">
                          <p style="margin: 0; color: #1e3a8a; font-size: 15px; line-height: 1.7;">
                            • If you would like to register for future events, please visit our website to explore upcoming opportunities.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 16px;">
                          <p style="margin: 0; color: #1e3a8a; font-size: 15px; line-height: 1.7;">
                            • If you believe this cancellation was made in error, please contact us immediately using the information below.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0;">
                          <p style="margin: 0; color: #1e3a8a; font-size: 15px; line-height: 1.7;">
                            • For any questions or concerns, our team is here to help.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Closing Message -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding: 24px; background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #ef4444;">
                    <p style="margin: 0 0 12px; color: #374151; font-size: 15px; line-height: 1.7;">
                      We sincerely apologize for any inconvenience this cancellation may have caused. Thank you for your interest in ${SITE_CONFIG.name}, and we hope to see you at future events.
                    </p>
                    <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.7; font-weight: 600;">
                      If you have any questions or concerns, please don't hesitate to contact us.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 0 0 20px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">${SITE_CONFIG.name}</p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding: 0 0 20px;">
                    <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                      Empowering young minds through robotics and STEM education
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding: 0;">
                    <p style="margin: 0; color: #d1d5db; font-size: 12px;">
                      This is an automated email. Please do not reply to this message.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Determine the "from" email address
    let fromEmail = process.env.BREVO_FROM_EMAIL
    
    if (!fromEmail || fromEmail.trim() === '') {
      fromEmail = `${SITE_CONFIG.name} <${SITE_CONFIG.noreplyEmail}>`
    }

    // Parse sender email and name
    let senderEmail: string = fromEmail
    let senderName: string = SITE_CONFIG.name
    
    const nameMatch = fromEmail.match(/^(.+?)\s*<(.+?)>$/)
    if (nameMatch) {
      senderName = nameMatch[1].trim()
      senderEmail = nameMatch[2].trim()
    }

    // Initialize Brevo client with API key
    const apiInstance = new brevo.TransactionalEmailsApi()
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!)

    // Send email using Brevo
    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.sender = { email: senderEmail, name: senderName }
    sendSmtpEmail.to = [{ email: normalizedEmail, name: name }]
    sendSmtpEmail.subject = `Registration Cancelled: ${event.title} - ${registrationId}`
    sendSmtpEmail.htmlContent = emailHtml

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


