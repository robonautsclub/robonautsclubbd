import type { Event } from '@/types/event'
import { SITE_CONFIG } from '@/lib/site-config'

export function buildBookingCancellationEmailHtml(opts: {
  name: string
  event: Event
  formattedDate: string
  registrationId: string
}): string {
  const { name, event, formattedDate, registrationId } = opts
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Cancellation</title>
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
</html>`
}
