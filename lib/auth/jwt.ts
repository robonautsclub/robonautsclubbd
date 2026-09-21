/**
 * Signed session JWT for Cloudflare dashboard auth (jose).
 */
import { SignJWT, jwtVerify } from 'jose'
import { SESSION_DURATION_SECONDS } from '@/lib/session'
import type { DashboardPermission, DashboardRole } from '@/lib/dashboard-permissions'

export type SessionClaims = {
  uid: string
  email: string
  name: string
  emailVerified: boolean
  role: DashboardRole
  permissions: DashboardPermission[]
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.trim().length < 16) {
    throw new Error(
      'AUTH_SECRET is missing or too short. Set it with: wrangler secret put AUTH_SECRET',
    )
  }
  return new TextEncoder().encode(secret)
}

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({
    email: claims.email,
    name: claims.name,
    emailVerified: claims.emailVerified,
    role: claims.role,
    permissions: claims.permissions,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.uid)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey())
}

export async function verifySessionToken(
  token: string,
): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    })
    const uid = typeof payload.sub === 'string' ? payload.sub : null
    const email = typeof payload.email === 'string' ? payload.email : null
    if (!uid || !email) return null
    return {
      uid,
      email,
      name: typeof payload.name === 'string' ? payload.name : email,
      emailVerified: Boolean(payload.emailVerified),
      role: (payload.role as DashboardRole) || 'admin',
      permissions: Array.isArray(payload.permissions)
        ? (payload.permissions as DashboardPermission[])
        : [],
    }
  } catch {
    return null
  }
}
