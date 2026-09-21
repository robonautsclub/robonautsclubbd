import { NextResponse } from 'next/server'

/** Legacy Firebase custom-claims flow — login now uses D1 + JWT. */
export async function POST() {
  return NextResponse.json({ error: 'This endpoint is no longer available.' }, { status: 410 })
}
