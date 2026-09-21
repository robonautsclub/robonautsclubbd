/**
 * Password hashing for D1 dashboard auth (Web Crypto PBKDF2).
 * Safe for Cloudflare Workers (no Node crypto required).
 */
const ITERATIONS = 100_000
const SALT_BYTES = 16
const KEY_BITS = 256

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_BITS,
  )
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(derived)}`
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
  const iterations = Number(parts[1])
  const salt = fromBase64(parts[2]!)
  const expected = fromBase64(parts[3]!)
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derived = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      KEY_BITS,
    ),
  )
  if (derived.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < derived.length; i++) diff |= derived[i]! ^ expected[i]!
  return diff === 0
}

/** Unusable hash for imported Firebase users (passwords cannot be migrated). */
export async function unusablePasswordHash(): Promise<string> {
  const random = toBase64(crypto.getRandomValues(new Uint8Array(32)))
  return hashPassword(`unusable:${random}`)
}
