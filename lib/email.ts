import { Resend } from 'resend'
import type { Event } from '@/types/event'
import { formatEventDates, getFirstEventDate, parseEventDates } from './dateUtils'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

interface BookingConfirmationEmailProps {
  to: string
  name: string
  event: Event
  bookingDetails: {
    school: string
    information: string
  }
}

/**
 * Send booking confirmation email with event details
 */
export async function sendBookingConfirmationEmail({
  to,
  name,
  event,
  bookingDetails,
}: BookingConfirmationEmailProps): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.trim() === '') {
      console.error('RESEND_API_KEY is not configured')
      return {
        success: false,
        error: 'Email service is not configured. Please set RESEND_API_KEY in your environment variables. Get your API key from https://resend.com/api-keys',
      }
    }

    // Format event date(s)
    const firstDate = getFirstEventDate(event.date)
    const formattedDate = firstDate ? formatEventDates(parseEventDates(event.date), 'long') : 'TBA'

    // Create email HTML content
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
                        <td style="padding: 10px 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="120" style="padding: 0; color: #3b82f6; font-size: 14px; font-weight: 500; vertical-align: top;">Email:</td>
                              <td style="padding: 0; color: #1e40af; font-size: 15px; font-weight: 600; vertical-align: top; word-break: break-word;">${to}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
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
                      <strong style="color: #6366f1; font-weight: 600; font-size: 16px;">The Robonauts Club Team</strong>
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
                      © ${new Date().getFullYear()} Robonauts Club. All rights reserved.
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
    // 1. Use RESEND_FROM_EMAIL if set (must be from a verified domain)
    // 2. Fallback to Resend's default onboarding domain (works immediately for testing)
    // 3. For production, verify your domain in Resend and use your custom domain
    let fromEmail = process.env.RESEND_FROM_EMAIL
    
    // If no custom from email is set, use Resend's default onboarding domain
    // This works immediately without domain verification for testing
    // For production, verify your domain at https://resend.com/domains and set RESEND_FROM_EMAIL
    if (!fromEmail || fromEmail.trim() === '') {
      // Use Resend's default onboarding domain which works without verification
      // Format: "Your Name <onboarding@resend.dev>"
      fromEmail = 'Robonauts Club <noreply@robonautsclub.com>'
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Booking Confirmation: ${event.title}`,
      html: emailHtml,
    })

    if (error) {
      console.error('Resend email error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Provide more specific error messages based on error type
      if (error.message?.includes('domain is not verified') || error.message?.includes('not verified')) {
        return {
          success: false,
          error: `Email domain not verified. Please verify your domain at https://resend.com/domains. Current from address: ${fromEmail}`,
        }
      }
      
      // Handle other Resend API errors
      if (error.statusCode === 403 || error.statusCode === 401) {
        const errorDetails = error.message || 'Access denied'
        return {
          success: false,
          error: `Email service access denied (${error.statusCode}). Possible causes:\n1. Invalid or expired RESEND_API_KEY - Get a new key from https://resend.com/api-keys\n2. Domain not verified - Verify your domain at https://resend.com/domains\n3. API key doesn't have send permissions\n\nError: ${errorDetails}\n\nCurrent from address: ${fromEmail}`,
        }
      }
      
      if (error.statusCode === 422) {
        return {
          success: false,
          error: `Invalid email configuration. Please check your RESEND_FROM_EMAIL setting. Current from address: ${fromEmail}\n\nThe from address must be from a verified domain in Resend. Verify your domain at https://resend.com/domains or use the default Resend domain.`,
        }
      }
      
      return {
        success: false,
        error: error.message || `Failed to send confirmation email (Status: ${error.statusCode || 'Unknown'}). Please check your Resend configuration.`,
      }
    }

    if (!data || !data.id) {
      console.error('Resend returned no data or email ID')
      return {
        success: false,
        error: 'Email service returned an unexpected response',
      }
    }

    console.log('Booking confirmation email sent successfully:', data.id)
    return {
      success: true,
    }
  } catch (error) {
    console.error('Error sending booking confirmation email:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    }
  }
}

