/**
 * Import tmp/firebase-dump into D1 (wipe-and-reload per table; re-runnable).
 *
 * Usage:
 *   node scripts/import-d1.mjs            # local D1
 *   node scripts/import-d1.mjs --remote   # remote D1
 *
 * Passwords cannot be copied from Firebase Auth — users get an unusable hash.
 * Set Super Admin password afterwards: pnpm cf:set-admin-password
 */
import {
  existsSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
} from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { webcrypto, randomBytes } from 'node:crypto'

const DUMP_DIR = resolve(process.cwd(), 'tmp/firebase-dump')
const remote = process.argv.includes('--remote')
const DB_NAME = 'robonautsclub-app'

const TABLE_MAP = {
  events: 'events',
  bookings: 'bookings',
  courses: 'courses',
  news: 'news',
  galleryGroups: 'gallery_groups',
  notifications: 'notifications',
  robofestContent: 'robofest_content',
  robofestRegistrations: 'robofest_registrations',
  robofestCampusAmbassadors: 'robofest_campus_ambassadors',
  robofestTeamCounters: 'robofest_team_counters',
  school_directory: 'school_directory',
  homepage_orgs: 'homepage_orgs',
  certificateTemplates: 'certificate_templates',
  bkash_pending_registrations: 'bkash_pending_registrations',
  payment_gateway_tokens: 'payment_gateway_tokens',
}

function sqlEscape(value) {
  if (value == null) return 'NULL'
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? '1' : '0'
  return `'${String(value).replace(/'/g, "''")}'`
}

function toIso(v) {
  if (!v) return null
  if (typeof v === 'string') return v
  return null
}

function loadJson(name) {
  const p = resolve(DUMP_DIR, `${name}.json`)
  if (!existsSync(p)) return []
  return JSON.parse(readFileSync(p, 'utf8'))
}

async function pbkdf2Unusable() {
  const salt = randomBytes(16)
  const password = randomBytes(32)
  const key = await webcrypto.subtle.importKey('raw', password, 'PBKDF2', false, [
    'deriveBits',
  ])
  const derived = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256,
  )
  const b64 = (buf) => Buffer.from(buf).toString('base64')
  return `pbkdf2$100000$${b64(salt)}$${b64(derived)}`
}

function rowSql(collection, doc) {
  const id = doc.id
  const payload = JSON.stringify(doc)
  const createdAt = toIso(doc.createdAt)
  const updatedAt = toIso(doc.updatedAt)

  switch (collection) {
    case 'events':
      return `INSERT INTO events (id, slug, title, created_by, payload, created_at, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(doc.slug ?? null)}, ${sqlEscape(doc.title ?? '')}, ${sqlEscape(doc.createdBy ?? null)}, ${sqlEscape(payload)}, ${sqlEscape(createdAt)}, ${sqlEscape(updatedAt)});`
    case 'bookings':
      return `INSERT INTO bookings (id, event_id, registration_id, email, payload, created_at) VALUES (${sqlEscape(id)}, ${sqlEscape(String(doc.eventId ?? ''))}, ${sqlEscape(doc.registrationId ?? null)}, ${sqlEscape(doc.email ?? null)}, ${sqlEscape(payload)}, ${sqlEscape(createdAt)});`
    case 'courses':
      return `INSERT INTO courses (id, title, is_archived, payload, created_at, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(doc.title ?? '')}, ${doc.isArchived ? 1 : 0}, ${sqlEscape(payload)}, ${sqlEscape(createdAt)}, ${sqlEscape(updatedAt)});`
    case 'news':
      return `INSERT INTO news (id, slug, title, published, payload, created_at, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(doc.slug ?? null)}, ${sqlEscape(doc.title ?? '')}, ${doc.published ? 1 : 0}, ${sqlEscape(payload)}, ${sqlEscape(createdAt)}, ${sqlEscape(updatedAt)});`
    case 'galleryGroups':
      return `INSERT INTO gallery_groups (id, title, sort_order, payload, created_at, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(doc.title ?? '')}, ${Number(doc.sortOrder) || 0}, ${sqlEscape(payload)}, ${sqlEscape(createdAt)}, ${sqlEscape(updatedAt)});`
    case 'notifications':
      return `INSERT INTO notifications (id, user_id, payload, created_at) VALUES (${sqlEscape(id)}, ${sqlEscape(doc.userId ?? null)}, ${sqlEscape(payload)}, ${sqlEscape(createdAt)});`
    case 'robofestContent':
      return `INSERT INTO robofest_content (id, payload, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(payload)}, ${sqlEscape(updatedAt)});`
    case 'robofestRegistrations':
      return `INSERT INTO robofest_registrations (id, team_number, status, email, payload, created_at, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(doc.teamNumber ?? null)}, ${sqlEscape(doc.status ?? null)}, ${sqlEscape(doc.email ?? null)}, ${sqlEscape(payload)}, ${sqlEscape(createdAt)}, ${sqlEscape(updatedAt)});`
    case 'robofestCampusAmbassadors':
      return `INSERT INTO robofest_campus_ambassadors (id, name, is_active, payload, created_at, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(doc.name ?? '')}, ${doc.isActive === false ? 0 : 1}, ${sqlEscape(payload)}, ${sqlEscape(createdAt)}, ${sqlEscape(updatedAt)});`
    case 'robofestTeamCounters':
      return `INSERT INTO robofest_team_counters (id, prefix, next, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(doc.prefix ?? id)}, ${Number(doc.next) || 1}, ${sqlEscape(updatedAt)});`
    case 'school_directory':
      return `INSERT INTO school_directory (id, name, name_lower, status, is_active, payload, created_at, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(doc.name ?? '')}, ${sqlEscape(doc.nameLower ?? (typeof doc.name === 'string' ? doc.name.toLowerCase() : null))}, ${sqlEscape(doc.status ?? null)}, ${doc.isActive === false ? 0 : 1}, ${sqlEscape(payload)}, ${sqlEscape(createdAt)}, ${sqlEscape(updatedAt)});`
    case 'homepage_orgs':
      return `INSERT INTO homepage_orgs (id, kind, name, sort_order, is_active, payload, created_at, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(doc.kind ?? null)}, ${sqlEscape(doc.name ?? '')}, ${Number(doc.sortOrder) || 0}, ${doc.isActive === false ? 0 : 1}, ${sqlEscape(payload)}, ${sqlEscape(createdAt)}, ${sqlEscape(updatedAt)});`
    case 'certificateTemplates':
      return `INSERT INTO certificate_templates (id, name, is_active, payload, created_at, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(doc.name ?? '')}, ${doc.isActive === false ? 0 : 1}, ${sqlEscape(payload)}, ${sqlEscape(createdAt)}, ${sqlEscape(updatedAt)});`
    case 'bkash_pending_registrations':
      return `INSERT INTO bkash_pending_registrations (id, kind, status, event_id, payload, created_at, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(doc.kind ?? null)}, ${sqlEscape(doc.status ?? null)}, ${sqlEscape(doc.eventId ?? null)}, ${sqlEscape(payload)}, ${sqlEscape(createdAt)}, ${sqlEscape(updatedAt)});`
    case 'payment_gateway_tokens':
      return `INSERT INTO payment_gateway_tokens (id, payload, updated_at) VALUES (${sqlEscape(id)}, ${sqlEscape(payload)}, ${sqlEscape(updatedAt)});`
    default:
      throw new Error(`Unknown collection ${collection}`)
  }
}

function runSql(statements) {
  if (!statements.length) return
  const tmp = resolve(DUMP_DIR, `_import_batch_${Date.now()}.sql`)
  writeFileSync(tmp, statements.join('\n'))
  const args = [
    'wrangler',
    'd1',
    'execute',
    DB_NAME,
    ...(remote ? ['--remote'] : ['--local']),
    '--file',
    tmp,
    '--yes',
  ]
  execFileSync('npx', args, { stdio: 'inherit', cwd: process.cwd() })
  try {
    unlinkSync(tmp)
  } catch {
    /* ignore */
  }
}

async function importUsers() {
  const users = loadJson('users')
  const stmts = ['DELETE FROM users;']
  for (const u of users) {
    const hash = await pbkdf2Unusable()
    const perms = JSON.stringify(u.permissions || [])
    stmts.push(
      `INSERT INTO users (id, email, password_hash, name, role, permissions, permissions_version, disabled, email_verified, created_at, updated_at) VALUES (${sqlEscape(u.id)}, ${sqlEscape((u.email || '').toLowerCase())}, ${sqlEscape(hash)}, ${sqlEscape(u.name || '')}, ${sqlEscape(u.role || 'admin')}, ${sqlEscape(perms)}, ${Number(u.permissionsVersion) || 5}, ${u.disabled ? 1 : 0}, ${u.emailVerified ? 1 : 0}, ${sqlEscape(u.createdAt || new Date().toISOString())}, ${sqlEscape(u.updatedAt || new Date().toISOString())});`,
    )
  }
  for (let i = 0; i < stmts.length; i += 200) {
    runSql(stmts.slice(i, i + 200))
  }
  return users.length
}

async function importCollection(name) {
  const table = TABLE_MAP[name]
  const docs = loadJson(name)
  const stmts = [`DELETE FROM ${table};`]
  for (const doc of docs) {
    stmts.push(rowSql(name, doc))
  }
  for (let i = 0; i < stmts.length; i += 150) {
    runSql(stmts.slice(i, i + 150))
  }
  return docs.length
}

function countTable(table) {
  const args = [
    'wrangler',
    'd1',
    'execute',
    DB_NAME,
    ...(remote ? ['--remote'] : ['--local']),
    '--command',
    `SELECT COUNT(*) as c FROM ${table};`,
    '--json',
  ]
  try {
    const out = execFileSync('npx', args, {
      encoding: 'utf8',
      cwd: process.cwd(),
    })
    const parsed = JSON.parse(out)
    const results = parsed[0]?.results ?? parsed.results ?? []
    return Number(results[0]?.c ?? 0)
  } catch {
    return -1
  }
}

async function main() {
  if (!existsSync(resolve(DUMP_DIR, 'summary.json'))) {
    console.error('No dump found. Run: pnpm cf:dump-firebase')
    process.exit(1)
  }
  const summary = JSON.parse(
    readFileSync(resolve(DUMP_DIR, 'summary.json'), 'utf8'),
  )
  console.log(`Importing dump into D1 (${remote ? 'remote' : 'local'})…`)

  for (const name of Object.keys(TABLE_MAP)) {
    await importCollection(name)
    const table = TABLE_MAP[name]
    const d1Count = countTable(table)
    const fb = summary.collections[name]
    const ok = fb == null || fb === d1Count
    console.log(
      `  ${name}: firebase=${fb ?? 'n/a'} d1=${d1Count} ${ok ? 'OK' : 'MISMATCH'}`,
    )
  }

  const userCount = await importUsers()
  const d1Users = countTable('users')
  console.log(
    `  users: firebase=${summary.users} d1=${d1Users} ${summary.users === d1Users ? 'OK' : 'MISMATCH'}`,
  )
  console.log(`\nImported ${userCount} users with unusable password hashes.`)
  console.log(
    'Set Super Admin password: pnpm cf:set-admin-password -- --email you@example.com --password ...',
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
