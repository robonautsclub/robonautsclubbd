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

  if (!paymentId) {
    return NextResponse.redirect(
      `${baseUrl}/payments/bkash/fail?error=${encodeURIComponent('Missing payment id from bKash callback.')}`
    )
  }

  if (status === 'cancel') {
    return NextResponse.redirect(`${baseUrl}/payments/bkash/cancel`)
  }

  if (status === 'failure') {
    return NextResponse.redirect(
      `${baseUrl}/payments/bkash/fail?error=${encodeURIComponent('bKash reports payment failure.')}`
    )
  }

  if (status !== 'success') {
    return NextResponse.redirect(
      `${baseUrl}/payments/bkash/fail?error=${encodeURIComponent(`Unexpected bKash status: ${status || 'unknown'}`)}`
    )
  }

  const result = await finalizePaidEventBooking(paymentId)
  if (!result.success) {
    return NextResponse.redirect(
      `${baseUrl}/payments/bkash/fail?error=${encodeURIComponent(result.error || 'Unable to finalize registration after payment.')}`
    )
  }

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
