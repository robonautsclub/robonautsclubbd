import * as brevo from '@getbrevo/brevo'
import { SITE_CONFIG } from '@/lib/site-config'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateAndNormalizeEmail(to: string): { ok: true; email: string } | { ok: false; error: string } {
  if (!to || !to.trim() || !EMAIL_REGEX.test(to.trim())) {
    return {
      ok: false,
      error: 'Invalid email address. Please provide a valid email address.',
    }
  }
  return { ok: true, email: to.trim().toLowerCase() }
}

export function requireBrevoApiKey(detailed = false): { ok: true } | { ok: false; error: string } {
  if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY.trim() === '') {
    return {
      ok: false,
      error: detailed
        ? 'Email service is not configured. Please set BREVO_API_KEY in your environment variables. Get your API key from https://app.brevo.com/settings/keys/api'
        : 'Email service is not configured. Please set BREVO_API_KEY in your environment variables.',
    }
  }
  return { ok: true }
}

export function resolveBaseUrl(): string {
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

export function resolveSender(): { fromEmail: string; senderEmail: string; senderName: string } {
  let fromEmail = process.env.BREVO_FROM_EMAIL

  if (!fromEmail || fromEmail.trim() === '') {
    fromEmail = `${SITE_CONFIG.name} <${SITE_CONFIG.noreplyEmail}>`
  }

  let senderEmail: string = fromEmail
  let senderName: string = SITE_CONFIG.name

  const nameMatch = fromEmail.match(/^(.+?)\s*<(.+?)>$/)
  if (nameMatch) {
    senderName = nameMatch[1].trim()
    senderEmail = nameMatch[2].trim()
  }

  return { fromEmail, senderEmail, senderName }
}

export function createBrevoClient() {
  const apiInstance = new brevo.TransactionalEmailsApi()
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!)
  return apiInstance
}

export function createSendSmtpEmail(opts: {
  senderEmail: string
  senderName: string
  toEmail: string
  toName: string
  subject: string
  htmlContent: string
}) {
  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.sender = { email: opts.senderEmail, name: opts.senderName }
  sendSmtpEmail.to = [{ email: opts.toEmail, name: opts.toName }]
  sendSmtpEmail.subject = opts.subject
  sendSmtpEmail.htmlContent = opts.htmlContent
  return sendSmtpEmail
}
