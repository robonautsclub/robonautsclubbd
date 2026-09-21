/**
 * READ-ONLY dump of Firestore collections + Firebase Auth users.
 * Does not write, delete, or modify Firebase production data.
 *
 * Usage: node scripts/dump-firebase.mjs
 * Output: tmp/firebase-dump/{collection}.json + users.json + summary.json
 *
 * Loads credentials from .env.local / .env / .cf-secrets.env (never committed dump).
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const admin = require('firebase-admin')

const DUMP_DIR = resolve(process.cwd(), 'tmp/firebase-dump')

const COLLECTIONS = [
  'events',
  'bookings',
  'courses',
  'news',
  'galleryGroups',
  'notifications',
  'robofestContent',
  'robofestRegistrations',
  'robofestCampusAmbassadors',
  'robofestTeamCounters',
  'school_directory',
  'homepage_orgs',
  'certificateTemplates',
  'bkash_pending_registrations',
  'payment_gateway_tokens',
]

function loadEnvFile(name) {
  const p = resolve(process.cwd(), name)
  if (!existsSync(p)) return
  const content = readFileSync(p, 'utf8').replace(/^\uFEFF/, '')
  const lines = content.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line || line.trim().startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1)
    // Multiline unquoted PEM
    if (
      key.includes('PRIVATE_KEY') &&
      value.includes('BEGIN') &&
      !value.includes('END')
    ) {
      const parts = [value]
      for (let j = i + 1; j < lines.length; j++) {
        parts.push(lines[j])
        i = j
        if (lines[j].includes('END PRIVATE KEY') || lines[j].includes('END RSA PRIVATE KEY')) {
          break
        }
      }
      value = parts.join('\n')
    }
    value = value.trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    value = value.replace(/\\n/g, '\n')
    if (!process.env[key]) process.env[key] = value
  }
}

for (const f of ['.env.local', '.env', '.cf-secrets.env']) loadEnvFile(f)

function serialize(value) {
  if (value == null) return value
  if (Array.isArray(value)) return value.map(serialize)
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      try {
        return value.toDate().toISOString()
      } catch {
        /* fall through */
      }
    }
    if (typeof value._seconds === 'number' || typeof value.seconds === 'number') {
      const s = value._seconds ?? value.seconds
      const n = value._nanoseconds ?? value.nanoseconds ?? 0
      return new Date(s * 1000 + n / 1e6).toISOString()
    }
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v)
    return out
  }
  return value
}

function initAdmin() {
  if (admin.apps.length) return admin.app()
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  const b64 = process.env.FIREBASE_ADMIN_PRIVATE_KEY_B64
  if (b64) {
    privateKey = Buffer.from(b64, 'base64').toString('utf8')
  }
  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      'Missing FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY. Load from .env.local for dump only.',
    )
    process.exit(1)
  }
  privateKey = privateKey.replace(/\\n/g, '\n')
  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  })
}

async function dumpCollection(db, name) {
  const snap = await db.collection(name).get()
  const docs = []
  for (const doc of snap.docs) {
    docs.push({ id: doc.id, ...serialize(doc.data()) })
  }
  writeFileSync(resolve(DUMP_DIR, `${name}.json`), JSON.stringify(docs, null, 2))
  return docs.length
}

async function dumpUsers(auth) {
  const users = []
  let pageToken
  do {
    const result = await auth.listUsers(1000, pageToken)
    for (const u of result.users) {
      users.push({
        id: u.uid,
        email: u.email || '',
        name: u.displayName || '',
        emailVerified: Boolean(u.emailVerified),
        disabled: Boolean(u.disabled),
        role: u.customClaims?.role || 'admin',
        permissions: u.customClaims?.permissions || [],
        permissionsVersion: u.customClaims?.permissionsVersion ?? 5,
        createdAt: u.metadata?.creationTime
          ? new Date(u.metadata.creationTime).toISOString()
          : new Date().toISOString(),
        updatedAt: u.metadata?.lastSignInTime
          ? new Date(u.metadata.lastSignInTime).toISOString()
          : new Date().toISOString(),
      })
    }
    pageToken = result.pageToken
  } while (pageToken)
  writeFileSync(resolve(DUMP_DIR, 'users.json'), JSON.stringify(users, null, 2))
  return users.length
}

async function main() {
  mkdirSync(DUMP_DIR, { recursive: true })
  initAdmin()
  const db = admin.firestore()
  const auth = admin.auth()

  console.log('READ-ONLY Firebase dump →', DUMP_DIR)
  const summary = { collections: {}, users: 0, dumpedAt: new Date().toISOString() }

  for (const name of COLLECTIONS) {
    try {
      const count = await dumpCollection(db, name)
      summary.collections[name] = count
      console.log(`  ${name}: ${count}`)
    } catch (err) {
      console.warn(`  ${name}: SKIP (${err.message})`)
      summary.collections[name] = null
      writeFileSync(resolve(DUMP_DIR, `${name}.json`), '[]')
    }
  }

  summary.users = await dumpUsers(auth)
  console.log(`  users (Auth): ${summary.users}`)
  writeFileSync(resolve(DUMP_DIR, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log('Done. Dump is local-only; do not commit tmp/firebase-dump/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
