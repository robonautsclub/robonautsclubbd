import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  for (const name of ['auth-token', 'user-info', 'session-start'] as const) {
    response.cookies.set(name, '', {
      httpOnly: name === 'auth-token',
      path: '/',
      maxAge: 0,
    })
  }
  return response
}
