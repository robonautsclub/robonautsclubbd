import { NextRequest, NextResponse } from 'next/server'
import { finalizePaidEventBooking } from '@/app/events/actions'

function normalizeStatus(raw: string): string {
  const value = raw.toLowerCase()
  if (value === 'failed') return 'failure'
  return value
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
