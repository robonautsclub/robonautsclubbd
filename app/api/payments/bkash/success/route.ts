import { NextRequest, NextResponse } from 'next/server'
import { finalizePaidEventBooking } from '@/app/events/actions'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const status = (searchParams.get('status') || '').toLowerCase()
  const paymentId = searchParams.get('paymentID') || ''
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
