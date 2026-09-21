import { NextRequest, NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { passwordResetTokens } from '@/lib/db/schema'
import { updateUser } from '@/lib/db/users'
import { hashPassword } from '@/lib/auth/password'

async function sha256Hex(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!token || password.length < 8) {
      return NextResponse.json(
        { error: 'Valid token and password (min 8 characters) are required' },
        { status: 400 },
      )
    }

    const hash = await sha256Hex(token)
    const db = await getDb()
    const rows = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, hash),
          isNull(passwordResetTokens.usedAt),
        ),
      )
      .limit(1)

    const row = rows[0]
    if (!row) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 },
      )
    }
    if (new Date(row.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 },
      )
    }

    const passwordHash = await hashPassword(password)
    await updateUser(row.userId, { passwordHash })
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(passwordResetTokens.id, row.id))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 },
    )
  }
}
