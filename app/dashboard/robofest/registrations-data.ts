import { FieldPath, type Query } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import {
  ROBOFEST_REGISTRATIONS_COLLECTION,
  mapRobofestRegistrationDoc,
  type RobofestRegistration,
  type RobofestRegistrationStatus,
} from '@/lib/robofest-content'
import type {
  RobofestRegistrationCursor,
  RobofestRegistrationListFilters,
  RobofestRegistrationPage,
  RobofestRegistrationStatusCounts,
} from './registrations-types'

export type {
  RobofestRegistrationCursor,
  RobofestRegistrationListFilters,
  RobofestRegistrationPage,
  RobofestRegistrationStatusCounts,
} from './registrations-types'

export const ROBOFEST_REGISTRATIONS_PAGE_SIZE = 20

/** Soft cap for in-memory fallback while composite indexes are building. */
const FALLBACK_SCAN_LIMIT = 500

function normalizeFilters(
  filters: RobofestRegistrationListFilters,
): RobofestRegistrationListFilters {
  return {
    status: filters.status,
    category: filters.category?.trim() || undefined,
    roundCity: filters.roundCity?.trim() || undefined,
    ageCategory: filters.ageCategory?.trim() || undefined,
  }
}

function createdAtToDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function isMissingIndexError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { code?: number | string; message?: string }
  return (
    err.code === 9 ||
    err.code === 'failed-precondition' ||
    /FAILED_PRECONDITION|requires an index/i.test(String(err.message || ''))
  )
}

function buildIndexedQuery(
  filters: RobofestRegistrationListFilters,
): Query | null {
  if (!adminDb) return null
  const f = normalizeFilters(filters)
  let q: Query = adminDb.collection(ROBOFEST_REGISTRATIONS_COLLECTION)
  q = q.where('status', '==', f.status)
  if (f.category) q = q.where('category', '==', f.category)
  if (f.roundCity) q = q.where('roundCity', '==', f.roundCity)
  if (f.ageCategory) q = q.where('ageCategory', '==', f.ageCategory)
  return q
    .orderBy('createdAt', 'desc')
    .orderBy(FieldPath.documentId(), 'desc')
}

function matchesExtraFilters(
  item: RobofestRegistration,
  filters: RobofestRegistrationListFilters,
): boolean {
  const f = normalizeFilters(filters)
  if (f.category && item.category !== f.category) return false
  if (f.roundCity && item.roundCity !== f.roundCity) return false
  if (f.ageCategory && item.ageCategory !== f.ageCategory) return false
  return true
}

function compareNewestFirst(a: RobofestRegistration, b: RobofestRegistration) {
  const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
  const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
  if (tb !== ta) return tb - ta
  return b.id.localeCompare(a.id)
}

function isAfterCursor(
  item: RobofestRegistration,
  cursor: RobofestRegistrationCursor,
): boolean {
  const itemTime = item.createdAt ? new Date(item.createdAt).getTime() : 0
  const cursorTime = new Date(cursor.createdAt).getTime()
  if (itemTime < cursorTime) return true
  if (itemTime > cursorTime) return false
  return item.id < cursor.id
}

function pageFromItems(
  items: RobofestRegistration[],
  cursor: RobofestRegistrationCursor | null | undefined,
  pageSize: number,
): RobofestRegistrationPage {
  let list = items
  if (cursor?.id && cursor.createdAt) {
    list = list.filter((item) => isAfterCursor(item, cursor))
  }
  const pageItems = list.slice(0, pageSize)
  const hasMore = list.length > pageSize
  const last = pageItems[pageItems.length - 1]
  return {
    items: pageItems,
    nextCursor:
      hasMore && last?.createdAt
        ? { createdAt: last.createdAt, id: last.id }
        : null,
    hasMore,
  }
}

/**
 * Equality-only scan + in-memory sort/paginate.
 * Used when composite indexes are not ready yet.
 */
async function loadRobofestRegistrationsPageFallback(options: {
  filters: RobofestRegistrationListFilters
  cursor?: RobofestRegistrationCursor | null
  pageSize: number
}): Promise<RobofestRegistrationPage> {
  if (!adminDb) {
    return { items: [], nextCursor: null, hasMore: false }
  }

  const f = normalizeFilters(options.filters)
  const snap = await adminDb
    .collection(ROBOFEST_REGISTRATIONS_COLLECTION)
    .where('status', '==', f.status)
    .limit(FALLBACK_SCAN_LIMIT)
    .get()

  const items = snap.docs
    .map((doc) =>
      mapRobofestRegistrationDoc(doc.id, doc.data() as Record<string, unknown>),
    )
    .filter((item) => matchesExtraFilters(item, f))
    .sort(compareNewestFirst)

  return pageFromItems(items, options.cursor, options.pageSize)
}

/**
 * Paginated Robofest registrations for the dashboard.
 * Kept outside `'use server'` so it can be called from RSC and server actions.
 */
export async function loadRobofestRegistrationsPage(options: {
  filters: RobofestRegistrationListFilters
  cursor?: RobofestRegistrationCursor | null
  pageSize?: number
}): Promise<RobofestRegistrationPage> {
  if (!adminDb) {
    return { items: [], nextCursor: null, hasMore: false }
  }

  const pageSize = Math.min(
    Math.max(options.pageSize ?? ROBOFEST_REGISTRATIONS_PAGE_SIZE, 1),
    100,
  )

  try {
    let q = buildIndexedQuery(options.filters)
    if (!q) return { items: [], nextCursor: null, hasMore: false }

    const cursor = options.cursor
    if (cursor?.id && cursor.createdAt) {
      const cursorDate = createdAtToDate(cursor.createdAt)
      if (cursorDate) {
        q = q.startAfter(cursorDate, cursor.id)
      }
    }

    const snap = await q.limit(pageSize + 1).get()
    const docs = snap.docs.slice(0, pageSize)
    const items = docs.map((doc) =>
      mapRobofestRegistrationDoc(doc.id, doc.data() as Record<string, unknown>),
    )

    const hasMore = snap.docs.length > pageSize
    const last = docs[docs.length - 1]
    let nextCursor: RobofestRegistrationCursor | null = null
    if (hasMore && last) {
      const createdAt =
        createdAtToDate(last.data().createdAt)?.toISOString() ||
        items[items.length - 1]?.createdAt
      if (createdAt) {
        nextCursor = { createdAt, id: last.id }
      }
    }

    return { items, nextCursor, hasMore }
  } catch (error) {
    if (!isMissingIndexError(error)) throw error
    console.warn(
      '[robofest] Composite index missing; using status-only fallback. Create indexes via Firebase console or `firebase deploy --only firestore:indexes`.',
      error instanceof Error ? error.message : error,
    )
    return loadRobofestRegistrationsPageFallback({
      filters: options.filters,
      cursor: options.cursor,
      pageSize,
    })
  }
}

/** Load all matching registrations for export (batched). */
export async function loadRobofestRegistrationsForExport(
  filters: RobofestRegistrationListFilters,
  maxDocs = 5000,
): Promise<RobofestRegistration[]> {
  const items: RobofestRegistration[] = []
  let cursor: RobofestRegistrationCursor | null = null
  const batchSize = 200

  while (items.length < maxDocs) {
    const page = await loadRobofestRegistrationsPage({
      filters,
      cursor,
      pageSize: Math.min(batchSize, maxDocs - items.length),
    })
    items.push(...page.items)
    if (!page.hasMore || !page.nextCursor) break
    cursor = page.nextCursor
  }

  return items
}

export async function loadRobofestRegistrationStatusCounts(): Promise<RobofestRegistrationStatusCounts> {
  const empty = { pending: 0, confirmed: 0, cancelled: 0 }
  if (!adminDb) return empty

  const collection = adminDb.collection(ROBOFEST_REGISTRATIONS_COLLECTION)
  const statuses: RobofestRegistrationStatus[] = [
    'pending',
    'confirmed',
    'cancelled',
  ]

  const results = await Promise.all(
    statuses.map(async (status) => {
      const snap = await collection.where('status', '==', status).count().get()
      return [status, snap.data().count] as const
    }),
  )

  const counts = { ...empty }
  for (const [status, count] of results) {
    counts[status] = count
  }
  return counts
}
