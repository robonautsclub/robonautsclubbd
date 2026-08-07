/**
 * Dedicated Robofest confirmation email (separate from event bookings).
 */

import * as brevo from '@getbrevo/brevo'
import type { Event } from '@/types/event'
import type { RobofestTeamMember } from '@/lib/robofest-content'
import { generateBookingConfirmationPDF } from '@/lib/pdfGenerator'
import { SITE_CONFIG } from '@/lib/site-config'
import { formatEventDates, getFirstEventDate, parseEventDates } from '@/lib/dateUtils'
import { formatAgeCategoryLabel } from '@/lib/robofest-registration-options'

export type RobofestEmailTeamMember = {
  name: string
  email: string
  phone?: string
  school?: string
  branch?: string
  grade?: string
}

export type RobofestConfirmationEmailProps = {
  recipients: string[]
  teamName: string
  competition: string
  division: string
  ageCategory: string
  teamMembers: RobofestEmailTeamMember[]
  event: Event
  registrationId: string
  bookingId: string
  school: string
  phone: string
  information: string
  amountPaid?: number
  trxId?: string
}

export type RobofestEmailResult = {
  success: boolean
  error?: string
  pdfAttached?: boolean
  pdfError?: string
  pdfBuffer?: Buffer | null
  sentCount?: number
  failedRecipients?: string[]
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function uniqueMemberEmails(
  teamMembers: RobofestTeamMember[] | RobofestEmailTeamMember[] | undefined,
  fallbackEmail?: string,
): string[] {
  const seen = new Set<string>()
  const emails: string[] = []
  for (const member of teamMembers || []) {
    const email = (member.email || '').trim().toLowerCase()
    if (!email || !emailRegex.test(email) || seen.has(email)) continue
    seen.add(email)
    emails.push(email)
  }
  if (emails.length === 0 && fallbackEmail) {
    const fallback = fallbackEmail.trim().toLowerCase()
    if (fallback && emailRegex.test(fallback)) emails.push(fallback)
  }
  return emails
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolveBaseUrl(): string {
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (!baseUrl) {
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    } else if (process.env.VERCEL_BRANCH_URL) {
      baseUrl = process.env.VERCEL_BRANCH_URL.startsWith('http')
        ? process.env.VERCEL_BRANCH_URL
        : `https://${process.env.VERCEL_BRANCH_URL}`
    } else if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:3000'
    } else {
      baseUrl = SITE_CONFIG.url
    }
  }
  baseUrl = baseUrl.replace(/\/$/, '')
  if (process.env.NODE_ENV === 'production' && baseUrl.startsWith('http://')) {
    baseUrl = baseUrl.replace('http://', 'https://')
  }
  return baseUrl
}

function buildMemberRowsHtml(members: RobofestEmailTeamMember[]): string {
  if (!members.length) {
    return `<tr><td style="padding: 10px 0; color: #64748b; font-size: 14px;">No team members listed.</td></tr>`
  }
  return members
    .map((member, index) => {
      const secondary = [member.grade, member.school, member.branch, member.phone]
        .filter(Boolean)
        .join(' · ')
      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
            <div style="color: #0f172a; font-size: 14px; font-weight: 600;">
              ${String(index + 1).padStart(2, '0')}. ${escapeHtml(member.name || 'Member')}
            </div>
            <div style="color: #0e7490; font-size: 13px; margin-top: 2px;">
              ${escapeHtml(member.email || '—')}
            </div>
            ${
              secondary
                ? `<div style="color: #64748b; font-size: 12px; margin-top: 2px;">${escapeHtml(secondary)}</div>`
                : ''
            }
          </td>
        </tr>`
    })
    .join('')
}

function buildRobofestEmailHtml({
  greetingName,
  teamName,
  competition,
  division,
  ageCategoryLabel,
  teamMembers,
  event,
  registrationId,
  verificationUrl,
  formattedDate,
  amountPaid,
  trxId,
}: {
  greetingName: string
  teamName: string
  competition: string
  division: string
  ageCategoryLabel: string
  teamMembers: RobofestEmailTeamMember[]
  event: Event
  registrationId: string
  verificationUrl: string
  formattedDate: string
  amountPaid?: number
  trxId?: string
}): string {
  const venue = event.venue || event.location || '—'
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Robofest Confirmation - ${escapeHtml(teamName)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; line-height: 1.6; color: #334155;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #0e7490 0%, #155e75 55%, #0f172a 100%); padding: 40px 32px; text-align: center;">
              <p style="margin: 0 0 8px; color: rgba(255,255,255,0.85); font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 600;">Robofest Bangladesh 2026</p>
              <h1 style="margin: 0 0 8px; color: #ffffff; font-size: 28px; font-weight: 700;">Registration Confirmed</h1>
              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 15px;">Your team is registered for the local round</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 16px; color: #334155;">
                Dear <strong style="color: #0f172a;">${escapeHtml(greetingName)}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #475569;">
                Thank you for registering for <strong style="color: #0e7490;">${escapeHtml(competition)}</strong>.
                This confirmation includes your full team roster so every member stays listed together.
              </p>

              <table role="presentation" width="100%" style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #ecfeff; padding: 14px 18px; border-bottom: 1px solid #cffafe;">
                    <h2 style="margin: 0; font-size: 16px; color: #155e75;">Competition details</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px;">
                    <p style="margin: 0 0 8px; font-size: 14px;"><span style="color:#64748b;">Event:</span> <strong>${escapeHtml(event.title)}</strong></p>
                    <p style="margin: 0 0 8px; font-size: 14px;"><span style="color:#64748b;">Competition:</span> <strong>${escapeHtml(competition)}</strong></p>
                    <p style="margin: 0 0 8px; font-size: 14px;"><span style="color:#64748b;">Division:</span> <strong>${escapeHtml(division)}</strong></p>
                    <p style="margin: 0 0 8px; font-size: 14px;"><span style="color:#64748b;">Age category:</span> <strong>${escapeHtml(ageCategoryLabel)}</strong></p>
                    <p style="margin: 0 0 8px; font-size: 14px;"><span style="color:#64748b;">Date:</span> <strong>${escapeHtml(formattedDate)}</strong></p>
                    <p style="margin: 0; font-size: 14px;"><span style="color:#64748b;">Venue:</span> <strong>${escapeHtml(venue)}</strong></p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #f8fafc; padding: 14px 18px; border-bottom: 1px solid #e2e8f0;">
                    <h2 style="margin: 0; font-size: 16px; color: #0f172a;">Team</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px;">
                    <p style="margin: 0 0 14px; font-size: 15px;">
                      <span style="color:#64748b;">Team name:</span>
                      <strong style="color:#0f172a;">${escapeHtml(teamName)}</strong>
                    </p>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">Team members</p>
                    <table role="presentation" width="100%">
                      ${buildMemberRowsHtml(teamMembers)}
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px;">
                    <p style="margin: 0 0 8px; font-size: 14px;"><span style="color:#64748b;">Registration ID:</span> <strong style="font-family: ui-monospace, monospace;">${escapeHtml(registrationId)}</strong></p>
                    ${
                      amountPaid != null
                        ? `<p style="margin: 0 0 8px; font-size: 14px;"><span style="color:#64748b;">Amount paid:</span> <strong>BDT ${escapeHtml(String(amountPaid))}</strong></p>`
                        : ''
                    }
                    ${
                      trxId
                        ? `<p style="margin: 0 0 8px; font-size: 14px;"><span style="color:#64748b;">Trx ID:</span> <strong>${escapeHtml(trxId)}</strong></p>`
                        : ''
                    }
                    <p style="margin: 12px 0 0;">
                      <a href="${escapeHtml(verificationUrl)}" style="display: inline-block; background-color: #0e7490; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600; font-size: 14px;">
                        Verify registration
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #64748b;">
                A PDF confirmation with your team roster is attached. Please keep this email for your records.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f5f9; padding: 18px 32px; text-align: center; color: #64748b; font-size: 12px;">
              ${escapeHtml(SITE_CONFIG.name)} · Robofest Bangladesh Local Round
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendRobofestConfirmationEmail(
  props: RobofestConfirmationEmailProps,
): Promise<RobofestEmailResult> {
  const {
    recipients,
    teamName,
    competition,
    division,
    ageCategory,
    teamMembers,
    event,
    registrationId,
    bookingId,
    school,
    phone,
    information,
    amountPaid,
    trxId,
  } = props

  const uniqueRecipients = Array.from(
    new Set(
      recipients
        .map((email) => email.trim().toLowerCase())
        .filter((email) => emailRegex.test(email)),
    ),
  )

  if (uniqueRecipients.length === 0) {
    return {
      success: false,
      error: 'No valid team member email addresses to notify.',
    }
  }

  if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY.trim() === '') {
    return {
      success: false,
      error:
        'Email service is not configured. Please set BREVO_API_KEY in your environment variables.',
    }
  }

  const firstDate = getFirstEventDate(event.date)
  const formattedDate = firstDate
    ? formatEventDates(parseEventDates(event.date), 'long')
    : 'TBA'
  const ageCategoryLabel = formatAgeCategoryLabel(ageCategory)
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
        name: teamName,
        teamName,
        email: uniqueRecipients[0],
        school,
        phone,
        information,
        teamMembers,
      },
      verificationUrl,
    })
  } catch (err) {
    pdfError = err instanceof Error ? err.message : 'Unknown PDF generation error'
    console.error('[robofest-email] PDF generation failed:', err)
  }

  const apiInstance = new brevo.TransactionalEmailsApi()
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY,
  )

  const fromEmail =
    process.env.BREVO_FROM_EMAIL?.trim() || SITE_CONFIG.email || 'noreply@robonautsclub.com'
  const fromName =
    process.env.BREVO_FROM_NAME?.trim() || SITE_CONFIG.name || 'Robonauts Club'

  let pdfAttached = false
  let attachment:
    | Array<{ name: string; content: string }>
    | undefined
  if (pdfBuffer && pdfBuffer.length > 0) {
    try {
      attachment = [
        {
          name: `Robofest-Confirmation-${registrationId}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ]
      pdfAttached = true
    } catch (attachErr) {
      const msg =
        attachErr instanceof Error ? attachErr.message : 'Failed to prepare PDF attachment'
      pdfError = pdfError ? `${pdfError}; ${msg}` : msg
    }
  }

  const failedRecipients: string[] = []
  let sentCount = 0

  for (const recipient of uniqueRecipients) {
    const recipientMember = teamMembers.find(
      (member) => member.email.trim().toLowerCase() === recipient,
    )
    const greetingName = recipientMember?.name?.trim() || teamName
    const html = buildRobofestEmailHtml({
      greetingName,
      teamName,
      competition,
      division,
      ageCategoryLabel,
      teamMembers,
      event,
      registrationId,
      verificationUrl,
      formattedDate,
      amountPaid,
      trxId,
    })

    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.sender = { name: fromName, email: fromEmail }
    sendSmtpEmail.to = [{ email: recipient, name: greetingName }]
    sendSmtpEmail.subject = `Robofest confirmation — ${teamName} · ${competition}`
    sendSmtpEmail.htmlContent = html
    if (attachment) sendSmtpEmail.attachment = attachment

    try {
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail)
      const body = (data as { body?: unknown } | undefined)?.body as
        | { messageId?: string; code?: string | number; message?: string }
        | undefined
      const httpStatus = (
        data as { response?: { statusCode?: number } } | undefined
      )?.response?.statusCode

      const accepted =
        (body &&
          typeof body === 'object' &&
          typeof body.messageId === 'string' &&
          body.messageId.length > 0) ||
        (typeof httpStatus === 'number' && httpStatus >= 200 && httpStatus < 300)

      if (accepted) {
        sentCount += 1
      } else {
        failedRecipients.push(recipient)
        console.error('[robofest-email] Non-success Brevo response for', recipient, body)
      }
    } catch (err) {
      failedRecipients.push(recipient)
      console.error('[robofest-email] Failed to send to', recipient, err)
    }
  }

  if (sentCount === 0) {
    return {
      success: false,
      error:
        failedRecipients.length > 0
          ? `Failed to send confirmation email to: ${failedRecipients.join(', ')}`
          : 'Failed to send Robofest confirmation emails.',
      pdfAttached,
      pdfError,
      pdfBuffer: pdfBuffer && pdfBuffer.length > 0 ? pdfBuffer : null,
      sentCount: 0,
      failedRecipients,
    }
  }

  return {
    success: true,
    pdfAttached,
    pdfError:
      failedRecipients.length > 0
        ? `Sent to ${sentCount} recipient(s); failed: ${failedRecipients.join(', ')}${
            pdfError ? ` · ${pdfError}` : ''
          }`
        : pdfError,
    pdfBuffer: pdfBuffer && pdfBuffer.length > 0 ? pdfBuffer : null,
    sentCount,
    failedRecipients,
  }
}
