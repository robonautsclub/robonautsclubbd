/**
 * Generic document helpers for D1 tables that store Firestore-shaped data
 * as indexed columns + a JSON `payload` blob.
 */
import { eq, desc, asc, sql, and, type SQL } from 'drizzle-orm'
import type { AppDb } from './index'
import {
  events,
  bookings,
  courses,
  news,
  galleryGroups,
  notifications,
  robofestContent,
  robofestRegistrations,
  robofestCampusAmbassadors,
  robofestTeamCounters,
  schoolDirectory,
  homepageOrgs,
  certificateTemplates,
  bkashPendingRegistrations,
  paymentGatewayTokens,
} from './schema'

export type JsonRecord = Record<string, unknown>

/** Convert Firestore Timestamp / Date / string to ISO string. */
export function toIso(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && value !== null) {
    const v = value as { toDate?: () => Date; _seconds?: number; seconds?: number }
    if (typeof v.toDate === 'function') {
      try {
        return v.toDate().toISOString()
      } catch {
        /* fall through */
      }
    }
    const seconds = v._seconds ?? v.seconds
    if (typeof seconds === 'number') {
      return new Date(seconds * 1000).toISOString()
    }
  }
  return null
}

/** Recursively convert Firestore Timestamps in a dumped document. */
export function serializeFirestoreValue(value: unknown): unknown {
  if (value == null) return value
  if (Array.isArray(value)) return value.map(serializeFirestoreValue)
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (
      typeof (obj as { toDate?: unknown }).toDate === 'function' ||
      typeof obj._seconds === 'number' ||
      typeof obj.seconds === 'number'
    ) {
      return toIso(value)
    }
    const out: JsonRecord = {}
    for (const [k, v] of Object.entries(obj)) {
      out[k] = serializeFirestoreValue(v)
    }
    return out
  }
  return value
}

export function parsePayload(raw: string | null | undefined): JsonRecord {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as JsonRecord)
      : {}
  } catch {
    return {}
  }
}

function mergeDoc(id: string, row: { payload?: string | null } & JsonRecord): JsonRecord {
  const payload = parsePayload(row.payload as string | undefined)
  return { ...payload, id, ...omit(row, ['payload']) }
}

function omit<T extends JsonRecord>(obj: T, keys: string[]): JsonRecord {
  const out: JsonRecord = { ...obj }
  for (const k of keys) delete out[k]
  return out
}

export function newId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20)
}

export const COLLECTION_TABLES = {
  events,
  bookings,
  courses,
  news,
  galleryGroups,
  notifications,
  robofestContent,
  robofestRegistrations,
  robofestCampusAmbassadors,
  robofestTeamCounters,
  schoolDirectory,
  homepageOrgs,
  certificateTemplates,
  bkashPendingRegistrations,
  paymentGatewayTokens,
} as const

export type CollectionName =
  | 'events'
  | 'bookings'
  | 'courses'
  | 'news'
  | 'galleryGroups'
  | 'notifications'
  | 'robofestContent'
  | 'robofestRegistrations'
  | 'robofestCampusAmbassadors'
  | 'robofestTeamCounters'
  | 'school_directory'
  | 'homepage_orgs'
  | 'certificateTemplates'
  | 'bkash_pending_registrations'
  | 'payment_gateway_tokens'

const FIRESTORE_TO_TABLE: Record<string, keyof typeof COLLECTION_TABLES> = {
  events: 'events',
  bookings: 'bookings',
  courses: 'courses',
  news: 'news',
  galleryGroups: 'galleryGroups',
  notifications: 'notifications',
  robofestContent: 'robofestContent',
  robofestRegistrations: 'robofestRegistrations',
  robofestCampusAmbassadors: 'robofestCampusAmbassadors',
  robofestTeamCounters: 'robofestTeamCounters',
  school_directory: 'schoolDirectory',
  homepage_orgs: 'homepageOrgs',
  certificateTemplates: 'certificateTemplates',
  bkash_pending_registrations: 'bkashPendingRegistrations',
  payment_gateway_tokens: 'paymentGatewayTokens',
}

function tableFor(collection: string) {
  const key = FIRESTORE_TO_TABLE[collection]
  if (!key) throw new Error(`Unknown collection: ${collection}`)
  return COLLECTION_TABLES[key]
}

function rowFromDoc(collection: string, id: string, data: JsonRecord) {
  const now = new Date().toISOString()
  const createdAt = toIso(data.createdAt) ?? now
  const updatedAt = toIso(data.updatedAt) ?? now
  const payload = JSON.stringify(serializeFirestoreValue({ ...data, id }))

  switch (collection) {
    case 'events':
      return {
        id,
        slug: typeof data.slug === 'string' ? data.slug : null,
        title: typeof data.title === 'string' ? data.title : '',
        createdBy: typeof data.createdBy === 'string' ? data.createdBy : null,
        payload,
        createdAt,
        updatedAt,
      }
    case 'bookings':
      return {
        id,
        eventId: String(data.eventId ?? ''),
        registrationId:
          typeof data.registrationId === 'string' ? data.registrationId : null,
        email: typeof data.email === 'string' ? data.email : null,
        payload,
        createdAt,
      }
    case 'courses':
      return {
        id,
        title: typeof data.title === 'string' ? data.title : '',
        isArchived: Boolean(data.isArchived),
        payload,
        createdAt,
        updatedAt,
      }
    case 'news':
      return {
        id,
        slug: typeof data.slug === 'string' ? data.slug : null,
        title: typeof data.title === 'string' ? data.title : '',
        published: Boolean(data.published),
        payload,
        createdAt,
        updatedAt,
      }
    case 'galleryGroups':
      return {
        id,
        title: typeof data.title === 'string' ? data.title : '',
        sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 0,
        payload,
        createdAt,
        updatedAt,
      }
    case 'notifications':
      return {
        id,
        userId: typeof data.userId === 'string' ? data.userId : null,
        payload,
        createdAt,
      }
    case 'robofestContent':
      return { id, payload, updatedAt }
    case 'robofestRegistrations':
      return {
        id,
        teamNumber: typeof data.teamNumber === 'string' ? data.teamNumber : null,
        status: typeof data.status === 'string' ? data.status : null,
        email: typeof data.email === 'string' ? data.email : null,
        payload,
        createdAt,
        updatedAt,
      }
    case 'robofestCampusAmbassadors':
      return {
        id,
        name: typeof data.name === 'string' ? data.name : '',
        isActive: data.isActive !== false,
        payload,
        createdAt,
        updatedAt,
      }
    case 'robofestTeamCounters':
      return {
        id,
        prefix: typeof data.prefix === 'string' ? data.prefix : id,
        next: typeof data.next === 'number' ? data.next : 1,
        updatedAt,
      }
    case 'school_directory':
      return {
        id,
        name: typeof data.name === 'string' ? data.name : '',
        nameLower:
          typeof data.nameLower === 'string'
            ? data.nameLower
            : typeof data.name === 'string'
              ? data.name.toLowerCase()
              : null,
        status: typeof data.status === 'string' ? data.status : null,
        isActive: data.isActive !== false,
        payload,
        createdAt,
        updatedAt,
      }
    case 'homepage_orgs':
      return {
        id,
        kind: typeof data.kind === 'string' ? data.kind : null,
        name: typeof data.name === 'string' ? data.name : '',
        sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 0,
        isActive: data.isActive !== false,
        payload,
        createdAt,
        updatedAt,
      }
    case 'certificateTemplates':
      return {
        id,
        name: typeof data.name === 'string' ? data.name : '',
        isActive: data.isActive !== false,
        payload,
        createdAt,
        updatedAt,
      }
    case 'bkash_pending_registrations':
      return {
        id,
        kind: typeof data.kind === 'string' ? data.kind : null,
        status: typeof data.status === 'string' ? data.status : null,
        eventId: typeof data.eventId === 'string' ? data.eventId : null,
        payload,
        createdAt,
        updatedAt,
      }
    case 'payment_gateway_tokens':
      return { id, payload, updatedAt }
    default:
      throw new Error(`Unsupported collection for row mapping: ${collection}`)
  }
}

export async function getDoc(
  db: AppDb,
  collection: string,
  id: string,
): Promise<JsonRecord | null> {
  const table = tableFor(collection)
  const rows = await db.select().from(table).where(eq(table.id, id)).limit(1)
  const row = rows[0]
  if (!row) return null
  return mergeDoc(id, row as { payload?: string | null } & JsonRecord)
}

export async function setDoc(
  db: AppDb,
  collection: string,
  id: string,
  data: JsonRecord,
  opts?: { merge?: boolean },
): Promise<void> {
  const table = tableFor(collection)
  let finalData = data
  if (opts?.merge) {
    const existing = await getDoc(db, collection, id)
    finalData = { ...(existing ?? {}), ...data, id }
  } else {
    finalData = { ...data, id }
  }
  const row = rowFromDoc(collection, id, finalData)
  await db
    .insert(table)
    .values(row as never)
    .onConflictDoUpdate({
      target: table.id,
      set: row as never,
    })
}

export async function addDoc(
  db: AppDb,
  collection: string,
  data: JsonRecord,
): Promise<string> {
  const id = newId()
  await setDoc(db, collection, id, data)
  return id
}

export async function deleteDoc(
  db: AppDb,
  collection: string,
  id: string,
): Promise<void> {
  const table = tableFor(collection)
  await db.delete(table).where(eq(table.id, id))
}

export async function listDocs(
  db: AppDb,
  collection: string,
  opts?: {
    orderBy?: { field: string; direction?: 'asc' | 'desc' }
    limit?: number
    where?: SQL
  },
): Promise<JsonRecord[]> {
  const table = tableFor(collection)
  let query = db.select().from(table).$dynamic()

  if (opts?.where) {
    query = query.where(opts.where)
  }

  if (opts?.orderBy) {
    const col =
      opts.orderBy.field === 'createdAt'
        ? (table as { createdAt?: typeof events.createdAt }).createdAt
        : opts.orderBy.field === 'updatedAt'
          ? (table as { updatedAt?: typeof events.updatedAt }).updatedAt
          : opts.orderBy.field === 'sortOrder'
            ? (table as { sortOrder?: typeof galleryGroups.sortOrder }).sortOrder
            : null
    if (col) {
      query = query.orderBy(
        opts.orderBy.direction === 'asc' ? asc(col) : desc(col),
      )
    }
  }

  if (opts?.limit) {
    query = query.limit(opts.limit)
  }

  const rows = await query
  return rows.map((row) =>
    mergeDoc(String((row as { id: string }).id), row as { payload?: string | null } & JsonRecord),
  )
}

export async function countDocs(db: AppDb, collection: string): Promise<number> {
  const table = tableFor(collection)
  const result = await db.select({ count: sql<number>`count(*)` }).from(table)
  return Number(result[0]?.count ?? 0)
}

export { eq, and, desc, asc, sql }
