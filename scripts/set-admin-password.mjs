/**
 * Set a dashboard user's password in D1 (Cloudflare copy only; does not touch Firebase).
 *
 * Usage:
 *   node scripts/set-admin-password.mjs --email admin@example.com --password 'secret' [--remote]
 */
import { webcrypto, randomBytes } from 'node:crypto'
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const remote = process.argv.includes('--remote')
const DB_NAME = 'robonautsclub-app'

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1]
  return null
}

function sqlEscape(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

async function hashPassword(password) {
  const salt = randomBytes(16)
  const enc = new TextEncoder()
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derived = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const b64 = (buf) => Buffer.from(buf).toString('base64')
  return `pbkdf2$100000$${b64(salt)}$${b64(derived)}`
}

async function main() {
  const email = (arg('email') || '').trim().toLowerCase()
  const password = arg('password')
  if (!email || !password) {
    console.error(
      'Usage: node scripts/set-admin-password.mjs --email you@example.com --password secret [--remote]',
    )
    process.exit(1)
  }
  const hash = await hashPassword(password)
  const now = new Date().toISOString()
  const sql = `UPDATE users SET password_hash = ${sqlEscape(hash)}, updated_at = ${sqlEscape(now)} WHERE email = ${sqlEscape(email)};`
  const dir = resolve(process.cwd(), 'tmp/firebase-dump')
  mkdirSync(dir, { recursive: true })
  const tmp = resolve(dir, `_set_pw_${Date.now()}.sql`)
  writeFileSync(tmp, sql)
  execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      DB_NAME,
      ...(remote ? ['--remote'] : ['--local']),
      '--file',
      tmp,
      '--yes',
    ],
    { stdio: 'inherit', cwd: process.cwd() },
  )
  try {
    unlinkSync(tmp)
  } catch {
    /* ignore */
  }
  console.log(`Password updated for ${email} on ${remote ? 'remote' : 'local'} D1.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
