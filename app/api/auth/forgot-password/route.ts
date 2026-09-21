import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { passwordResetTokens } from '@/lib/db/schema'
import { findUserByEmail } from '@/lib/db/users'
import {
  resolveBaseUrl,
  createBrevoClient,
  createSendSmtpEmail,
  resolveSender,
  requireBrevoApiKey,
  validateAndNormalizeEmail,
} from '@/lib/email/shared'

async function sha256Hex(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(request: NextRequest) {
  const generic = NextResponse.json({
    ok: true,
    message: 'If an account exists, a reset email has been sent.',
  })

  try {
    const body = await request.json()
    const emailCheck = validateAndNormalizeEmail(
      typeof body.email === 'string' ? body.email : '',
    )
    if (!emailCheck.ok) return generic

    const user = await findUserByEmail(emailCheck.email)
    if (!user || user.disabled) return generic

    const brevo = requireBrevoApiKey()
    if (!brevo.ok) {
      console.error('Forgot password: Brevo not configured')
      return generic
    }

    const raw = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const hash = await sha256Hex(raw)
    const now = new Date()
    const expires = new Date(now.getTime() + 60 * 60 * 1000)

    const db = await getDb()
    await db.insert(passwordResetTokens).values({
      id: crypto.randomUUID().replace(/-/g, ''),
      userId: user.id,
      tokenHash: hash,
      expiresAt: expires.toISOString(),
      usedAt: null,
      createdAt: now.toISOString(),
    })

    const resetUrl = `${resolveBaseUrl()}/login/reset-password?token=${raw}`
    const { senderEmail, senderName } = resolveSender()
    const api = createBrevoClient()
    const email = createSendSmtpEmail({
      senderEmail,
      senderName,
      toEmail: user.email,
      toName: user.name || user.email,
      subject: 'Reset your Robonauts dashboard password',
      htmlContent: `<p>Hello ${user.name || 'there'},</p>
<p>Use this link to reset your Cloudflare dashboard password (valid 1 hour):</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>If you did not request this, you can ignore this email.</p>`,
    })
    await api.sendTransacEmail(email)

    return generic
  } catch (error) {
    console.error('Forgot password error:', error)
    return generic
  }
}
