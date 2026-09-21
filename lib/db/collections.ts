/**
 * D1-backed collection API used by the Cloudflare Worker instead of Firestore.
 * Keeps document shapes (with `id`) so existing mappers mostly keep working.
 */
import { eq, and, desc, asc, sql, like, type SQL } from 'drizzle-orm'
import { getDb, type AppDb } from './index'
import {
  addDoc,
  deleteDoc,
  getDoc,
  listDocs,
  newId,
  parsePayload,
  setDoc,
  type JsonRecord,
} from './documents'
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

export { newId }

const COLLECTION_ALIASES: Record<string, string> = {
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
  school_directory: 'school_directory',
  homepage_orgs: 'homepage_orgs',
  certificateTemplates: 'certificateTemplates',
  bkash_pending_registrations: 'bkash_pending_registrations',
  payment_gateway_tokens: 'payment_gateway_tokens',
}

export async function db(): Promise<AppDb> {
  return getDb()
}

export async function collectionGetAll(
  name: string,
  opts?: { orderBy?: string; direction?: 'asc' | 'desc'; limit?: number },
): Promise<JsonRecord[]> {
  const database = await getDb()
  return listDocs(database, COLLECTION_ALIASES[name] || name, {
    orderBy: opts?.orderBy
      ? { field: opts.orderBy, direction: opts.direction || 'desc' }
      : undefined,
    limit: opts?.limit,
  })
}

export async function collectionGet(
  name: string,
  id: string,
): Promise<JsonRecord | null> {
  const database = await getDb()
  return getDoc(database, COLLECTION_ALIASES[name] || name, id)
}

export async function collectionSet(
  name: string,
  id: string,
  data: JsonRecord,
  opts?: { merge?: boolean },
): Promise<void> {
  const database = await getDb()
  await setDoc(database, COLLECTION_ALIASES[name] || name, id, data, opts)
}

export async function collectionAdd(
  name: string,
  data: JsonRecord,
): Promise<string> {
  const database = await getDb()
  return addDoc(database, COLLECTION_ALIASES[name] || name, data)
}

export async function collectionDelete(name: string, id: string): Promise<void> {
  const database = await getDb()
  await deleteDoc(database, COLLECTION_ALIASES[name] || name, id)
}

export async function collectionWhere(
  name: string,
  field: string,
  op: '==' | '!=' | '>' | '>=' | '<' | '<=',
  value: unknown,
  opts?: { limit?: number; orderBy?: string; direction?: 'asc' | 'desc' },
): Promise<JsonRecord[]> {
  const database = await getDb()
  const all = await listDocs(database, COLLECTION_ALIASES[name] || name, {
    orderBy: opts?.orderBy
      ? { field: opts.orderBy, direction: opts.direction || 'desc' }
      : undefined,
  })
  const filtered = all.filter((doc) => {
    const v = doc[field]
    switch (op) {
      case '==':
        return v === value
      case '!=':
        return v !== value
      case '>':
        return (v as number | string) > (value as number | string)
      case '>=':
        return (v as number | string) >= (value as number | string)
      case '<':
        return (v as number | string) < (value as number | string)
      case '<=':
        return (v as number | string) <= (value as number | string)
      default:
        return false
    }
  })
  return opts?.limit ? filtered.slice(0, opts.limit) : filtered
}

/** Indexed helpers for hot paths */
export async function getEventBySlug(slug: string): Promise<JsonRecord | null> {
  const database = await getDb()
  const rows = await database
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1)
  if (!rows[0]) return null
  return { ...parsePayload(rows[0].payload), id: rows[0].id }
}

export async function getBookingsByEventId(
  eventId: string,
): Promise<JsonRecord[]> {
  const database = await getDb()
  const rows = await database
    .select()
    .from(bookings)
    .where(eq(bookings.eventId, eventId))
  return rows.map((r) => ({ ...parsePayload(r.payload), id: r.id }))
}

export async function getBookingByRegistrationId(
  registrationId: string,
): Promise<JsonRecord | null> {
  const database = await getDb()
  const rows = await database
    .select()
    .from(bookings)
    .where(eq(bookings.registrationId, registrationId))
    .limit(1)
  if (!rows[0]) return null
  return { ...parsePayload(rows[0].payload), id: rows[0].id }
}

export async function allocateTeamNumber(prefix: string): Promise<number> {
  const database = await getDb()
  const rows = await database
    .select()
    .from(robofestTeamCounters)
    .where(eq(robofestTeamCounters.id, prefix))
    .limit(1)
  const current = rows[0]?.next ?? 1
  const next = current + 1
  const now = new Date().toISOString()
  await database
    .insert(robofestTeamCounters)
    .values({ id: prefix, prefix, next, updatedAt: now })
    .onConflictDoUpdate({
      target: robofestTeamCounters.id,
      set: { next, updatedAt: now },
    })
  return current
}

export async function getRobofestSettings(): Promise<JsonRecord | null> {
  return collectionGet('robofestContent', 'settings')
}

export async function setRobofestSettings(data: JsonRecord): Promise<void> {
  await collectionSet('robofestContent', 'settings', data, { merge: true })
}

export {
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
  eq,
  and,
  desc,
  asc,
  sql,
  like,
  type SQL,
  type JsonRecord,
}
