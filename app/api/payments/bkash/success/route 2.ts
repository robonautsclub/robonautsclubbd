import { NextRequest, NextResponse } from 'next/server'
import { finalizePaidEventBooking } from '@/app/(marketing)/events/actions'
import { finalizeRobofestPaidRegistration } from '@/app/(marketing)/robofest/actions'
import { adminDb } from '@/lib/firebase-admin'

function normalizeStatus(raw: string): string {
  const value = raw.toLowerCase()
  if (value === 'failed') return 'failure'
  return value
}

async function isRobofestPending(paymentId: string): Promise<boolean> {
  if (!adminDb || !paymentId) return false
  const snap = await adminDb
    .collection('bkash_pending_registrations')
    .doc(paymentId)
    .get()
  if (!snap.exists) return false
  return snap.data()?.kind === 'robofest'
}

async function handleCallback(
  request: NextRequest,
  payload: { status?: string; paymentID?: string; paymentId?: string }
) {
  const status = normalizeStatus(payload.status || '')
  const paymentId = payload.paymentID || payload.paymentId || ''
  const baseUrl = request.nextUrl.origin
  console.info('[bkash-callback] received', {
    method: request.method,
    status,
    paymentId: paymentId || null,
    host: request.nextUrl.host,
    pathname: request.nextUrl.pathname,
  })

  if (!paymentId) {
    console.warn('[bkash-callback] missing payment id', { status })
    return NextResponse.redirect(
      `${baseUrl}/payments/bkash/fail?error=${encodeURIComponent('Missing payment id from bKash callback.')}`
    )
  }

  if (status === 'cancel') {
    console.info('[bkash-callback] canceled', { paymentId })
    return NextResponse.redirect(
      `${baseUrl}/payments/bkash/fail?error=${encodeURIComponent('Payment was canceled in bKash.')}`
    )
  }

  if (status === 'failure') {
    console.info('[bkash-callback] failure from gateway', { paymentId })
    return NextResponse.redirect(
      `${baseUrl}/payments/bkash/fail?error=${encodeURIComponent('bKash reports payment failure.')}`
    )
  }

  if (status !== 'success') {
    console.warn('[bkash-callback] unexpected status', { paymentId, status })
    return NextResponse.redirect(
      `${baseUrl}/payments/bkash/fail?error=${encodeURIComponent(`Unexpected bKash status: ${status || 'unknown'}`)}`
    )
  }

  const robofest = await isRobofestPending(paymentId)
  if (robofest) {
    const result = await finalizeRobofestPaidRegistration(paymentId)
    if (!result.success) {
      console.error('[bkash-callback] robofest finalize failed', {
        paymentId,
        error: result.error || 'unknown',
      })
      return NextResponse.redirect(
        `${baseUrl}/payments/bkash/fail?error=${encodeURIComponent(result.error || 'Unable to finalize Robofest registration after payment.')}`
      )
    }

    console.info('[bkash-callback] robofest finalize success', {
      paymentId,
      registrationDocId: result.registrationDocId || null,
      registrationId: result.registrationId || null,
      emailSent: result.emailSent === true,
    })

    const params = new URLSearchParams()
    if (result.registrationDocId) {
      params.set('registrationDocId', result.registrationDocId)
    }
    if (result.registrationId) {
      params.set('registrationId', result.registrationId)
    }
    params.set('source', 'robofest')
    params.set('emailSent', result.emailSent === true ? '1' : '0')
    if (result.warning) {
      params.set('emailWarning', result.warning.slice(0, 280))
    }
    return NextResponse.redirect(
      `${baseUrl}/payments/bkash/success?${params.toString()}`
    )
  }

  const result = await finalizePaidEventBooking(paymentId)
  if (!result.success) {
    console.error('[bkash-callback] finalize failed', {
      paymentId,
      error: result.error || 'unknown',
    })
    return NextResponse.redirect(
      `${baseUrl}/payments/bkash/fail?error=${encodeURIComponent(result.error || 'Unable to finalize registration after payment.')}`
    )
  }

  console.info('[bkash-callback] finalize success', {
    paymentId,
    bookingId: result.bookingId || null,
  })

  return NextResponse.redirect(
    `${baseUrl}/payments/bkash/success?bookingId=${encodeURIComponent(result.bookingId || '')}`
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  return handleCallback(request, {
    status: searchParams.get('status') || '',
    paymentID: searchParams.get('paymentID') || searchParams.get('paymentId') || '',
  })
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    return handleCallback(request, {
      status: String(formData.get('status') || ''),
      paymentID: String(formData.get('paymentID') || formData.get('paymentId') || ''),
    })
  }

  if (contentType.includes('application/json')) {
    const body = (await request.json()) as { status?: string; paymentID?: string; paymentId?: string }
    return handleCallback(request, body)
  }

  return handleCallback(request, {})
}
