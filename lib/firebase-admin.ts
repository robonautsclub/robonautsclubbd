import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import type { Storage } from 'firebase-admin/storage'

let adminApp: App | undefined
let adminAuth: Auth | undefined
let adminDb: Firestore | undefined
let adminStorage: Storage | undefined

type ServiceAccountFields = {
  projectId: string
  clientEmail: string
  privateKey: string
}

function normalizePrivateKey(raw: string): string {
  let k = raw.trim()
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1).trim()
  }
  return k
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
}

function looksLikePemPrivateKey(key: string): boolean {
  return key.includes('BEGIN') && key.includes('PRIVATE KEY') && key.includes('END')
}

/**
 * Dotenv only assigns the first physical line to a value when the value is unquoted multiline.
 * Read `.env.local` / `.env` ourselves and merge lines until `-----END PRIVATE KEY-----`.
 */
function parseUnquotedMultilinePrivateKeyFromDotenv(content: string, key: string): string | null {
  const prefix = `${key}=`
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.startsWith(prefix)) continue

    const parts: string[] = [line.slice(prefix.length)]

    for (let j = i + 1; j < lines.length; j++) {
      const L = lines[j]
      parts.push(L)
      if (L.includes('END PRIVATE KEY') || L.includes('END RSA PRIVATE KEY')) {
        const merged = parts.join('\n').trim()
        const pem = normalizePrivateKey(merged)
        return looksLikePemPrivateKey(pem) ? pem : null
      }
    }
  }

  return null
}

function privateKeyFromDotenvFiles(): string | null {
  for (const name of ['.env.local', '.env'] as const) {
    const p = resolve(process.cwd(), name)
    if (!existsSync(p)) continue
    try {
      const pem = parseUnquotedMultilinePrivateKeyFromDotenv(readFileSync(p, 'utf8'), 'FIREBASE_ADMIN_PRIVATE_KEY')
      if (pem) {
        console.log(`Firebase Admin SDK: loaded multiline FIREBASE_ADMIN_PRIVATE_KEY from ${name}`)
        return pem
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

/**
 * 1) FIREBASE_ADMIN_PRIVATE_KEY_B64 — one line in .env
 * 2) FIREBASE_ADMIN_PRIVATE_KEY from process.env — one line or \\n escapes
 * 3) Same key, unquoted multiline in .env / .env.local — merged by reading the file
 */
function privateKeyFromEnv(): string | null {
  const b64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64?.trim()
  if (b64) {
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf8')
      const pem = normalizePrivateKey(decoded)
      if (looksLikePemPrivateKey(pem)) {
        console.log('Firebase Admin SDK: using FIREBASE_ADMIN_PRIVATE_KEY_B64 from env')
        return pem
      }
    } catch {
      /* ignore */
    }
  }

  const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim()
  if (raw) {
    const pem = normalizePrivateKey(raw)
    if (looksLikePemPrivateKey(pem)) {
      console.log('Firebase Admin SDK: using FIREBASE_ADMIN_PRIVATE_KEY from process.env')
      return pem
    }
  }

  const fromFile = privateKeyFromDotenvFiles()
  if (fromFile) return fromFile

  if (raw?.includes('BEGIN')) {
    console.warn(
      'Firebase Admin SDK: FIREBASE_ADMIN_PRIVATE_KEY in process.env looks incomplete. Add FIREBASE_ADMIN_PRIVATE_KEY_B64, or keep the PEM in .env with multiline (no quotes) — the app will merge lines until END PRIVATE KEY when reading the file.',
    )
  }

  return null
}

function loadServiceAccountFromEnv(): ServiceAccountFields | null {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim()
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim()
  const privateKey = privateKeyFromEnv()

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey }
  }

  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !projectId) {
    console.warn(
      'Firebase Admin SDK: set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY (multiline in .env is ok). NEXT_PUBLIC_* is client-only.',
    )
  } else if (!privateKey && (projectId || clientEmail)) {
    console.warn('Firebase Admin SDK: missing or invalid FIREBASE_ADMIN_PRIVATE_KEY / _B64.')
  }

  return null
}

const serviceAccount = loadServiceAccountFromEnv()

if (serviceAccount) {
  try {
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: serviceAccount.projectId,
          clientEmail: serviceAccount.clientEmail,
          privateKey: serviceAccount.privateKey,
        }),
      })
      console.log('Firebase Admin SDK initialized successfully')
    } else {
      adminApp = getApps()[0]
    }

    adminAuth = getAuth(adminApp)
    adminDb = getFirestore(adminApp)
    adminStorage = getStorage(adminApp)
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
    adminApp = undefined
    adminAuth = undefined
    adminDb = undefined
    adminStorage = undefined
  }
}

export { adminAuth, adminDb, adminStorage }
export default adminApp
