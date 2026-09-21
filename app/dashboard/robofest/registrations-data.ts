import { collectionGet } from '@/lib/db/collections'
import {
  countRobofestRegistrations,
  queryRobofestCampusAmbassadorReferralCounts,
  queryRobofestRegistrationsMatching,
  queryRobofestRegistrationsPage,
  queryRobofestRegistrationStats,
  queryRobofestRegistrationStatusCounts,
} from '@/lib/db/robofest-registrations'
import {
  ROBOFEST_REGISTRATIONS_COLLECTION,
  mapRobofestRegistrationDoc,
  type RobofestRegistration,
} from '@/lib/robofest-content'
import { registrationMatchesNameFilter } from './registration-search'
import type {
  RobofestCampusAmbassadorReferralStats,
  RobofestRegistrationCursor,
  RobofestRegistrationListFilters,
  RobofestRegistrationPage,
  RobofestRegistrationStats,
  RobofestRegistrationStatusCounts,
} from './registrations-types'
import {
  EMPTY_ROBOFEST_CAMPUS_AMBASSADOR_REFERRAL_STATS,
  EMPTY_ROBOFEST_REGISTRATION_STATS,
} from './registrations-types'

export type {
  RobofestCampusAmbassadorReferralStats,
  RobofestRegistrationCursor,
  RobofestRegistrationListFilters,
  RobofestRegistrationPage,
  RobofestRegistrationStats,
  RobofestRegistrationStatusCounts,
} from './registrations-types'
export {
  EMPTY_ROBOFEST_CAMPUS_AMBASSADOR_REFERRAL_STATS,
  EMPTY_ROBOFEST_REGISTRATION_STATS,
} from './registrations-types'

export const ROBOFEST_REGISTRATIONS_PAGE_SIZE = 10

const FALLBACK_SCAN_LIMIT = 500
const SEARCH_SCAN_LIMIT = 5000

function normalizeFilters(
  filters: RobofestRegistrationListFilters,
): RobofestRegistrationListFilters {
  return {
    status: filters.status,
    category: filters.category?.trim() || undefined,
    roundCity: filters.roundCity?.trim() || undefined,
    ageCategory: filters.ageCategory?.trim() || undefined,
    search: filters.search?.trim() || undefined,
  }
}

function toSqlFilters(filters: RobofestRegistrationListFilters) {
  const f = normalizeFilters(filters)
  return {
    status: f.status,
    category: f.category,
    roundCity: f.roundCity,
    ageCategory: f.ageCategory,
  }
}

function matchesExtraFilters(
  item: RobofestRegistration,
  filters: RobofestRegistrationListFilters,
): boolean {
  const f = normalizeFilters(filters)
  if (f.category && item.category !== f.category) return false
  if (f.roundCity && item.roundCity !== f.roundCity) return false
  if (f.ageCategory && item.ageCategory !== f.ageCategory) return false
  if (f.search && !registrationMatchesNameFilter(item, f.search)) return false
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
      hasMore && last?.createdAt ? { createdAt: last.createdAt, id: last.id } : null,
    hasMore,
    matchedTotal: items.length,
  }
}

function mapDocs(docs: Record<string, unknown>[]): RobofestRegistration[] {
  return docs.map((doc) =>
    mapRobofestRegistrationDoc(String(doc.id), doc as Record<string, unknown>),
  )
}

/**
 * Search / complex filters: SQL narrows by indexed columns, then JS applies
 * name search + in-memory keyset paging.
 */
async function loadRobofestRegistrationsPageWithSearch(options: {
  filters: RobofestRegistrationListFilters
  cursor?: RobofestRegistrationCursor | null
  pageSize: number
  scanLimit?: number
}): Promise<RobofestRegistrationPage> {
  const f = normalizeFilters(options.filters)
  const scanLimit = options.scanLimit ?? FALLBACK_SCAN_LIMIT
  const docs = await queryRobofestRegistrationsMatching({
    filters: toSqlFilters(f),
    limit: scanLimit,
  })

  const items = mapDocs(docs)
    .filter((item) => matchesExtraFilters(item, f))
    .sort(compareNewestFirst)

  return pageFromItems(items, options.cursor, options.pageSize)
}

export async function loadRobofestRegistrationsPage(options: {
  filters: RobofestRegistrationListFilters
  cursor?: RobofestRegistrationCursor | null
  pageSize?: number
}): Promise<RobofestRegistrationPage> {
  const pageSize = Math.min(
    Math.max(options.pageSize ?? ROBOFEST_REGISTRATIONS_PAGE_SIZE, 1),
    100,
  )
  const f = normalizeFilters(options.filters)

  if (f.search) {
    return loadRobofestRegistrationsPageWithSearch({
      filters: f,
      cursor: options.cursor,
      pageSize,
      scanLimit: SEARCH_SCAN_LIMIT,
    })
  }

  const sqlFilters = toSqlFilters(f)
  const [{ rows, hasMore }, matchedTotal] = await Promise.all([
    queryRobofestRegistrationsPage({
      filters: sqlFilters,
      cursor: options.cursor,
      limit: pageSize,
    }),
    countRobofestRegistrations(sqlFilters),
  ])

  const items = mapDocs(rows)
  const last = items[items.length - 1]
  return {
    items,
    nextCursor:
      hasMore && last?.createdAt ? { createdAt: last.createdAt, id: last.id } : null,
    hasMore,
    matchedTotal,
  }
}

export async function loadRobofestRegistrationsForExport(
  filters: RobofestRegistrationListFilters,
  maxDocs = 5000,
): Promise<RobofestRegistration[]> {
  const f = normalizeFilters(filters)
  const scanLimit = Math.min(maxDocs, SEARCH_SCAN_LIMIT)

  if (f.search) {
    const page = await loadRobofestRegistrationsPageWithSearch({
      filters: f,
      pageSize: maxDocs,
      scanLimit,
    })
    return page.items
  }

  const docs = await queryRobofestRegistrationsMatching({
    filters: toSqlFilters(f),
    limit: scanLimit,
  })
  return mapDocs(docs)
}

function participantCount(r: RobofestRegistration): number {
  if (typeof r.teamSize === 'number' && r.teamSize > 0) return r.teamSize
  if (Array.isArray(r.teamMembers) && r.teamMembers.length > 0) {
    return r.teamMembers.length
  }
  return 1
}

function aggregateRegistrationStats(items: RobofestRegistration[]): RobofestRegistrationStats {
  const byCategory = new Map<string, number>()
  const byAge = new Map<string, number>()
  let paidTotal = 0
  let paidCount = 0
  let participants = 0

  for (const r of items) {
    const members = participantCount(r)
    participants += members
    byCategory.set(r.category, (byCategory.get(r.category) || 0) + members)
    if (r.ageCategory) {
      byAge.set(r.ageCategory, (byAge.get(r.ageCategory) || 0) + members)
    }
    if (r.paymentStatus === 'paid' && typeof r.amountPaid === 'number') {
      paidTotal += r.amountPaid
      paidCount += 1
    }
  }

  return {
    total: participants,
    registrations: items.length,
    byCategory: Array.from(byCategory.entries()),
    byAge: Array.from(byAge.entries()),
    paidTotal,
    paidCount,
  }
}

export async function loadRobofestRegistrationStats(
  filters: RobofestRegistrationListFilters,
): Promise<RobofestRegistrationStats> {
  const f = normalizeFilters(filters)

  if (f.search) {
    const items = await loadRobofestRegistrationsForExport(f)
    return aggregateRegistrationStats(items)
  }

  try {
    const stats = await queryRobofestRegistrationStats(toSqlFilters(f))
    return {
      total: stats.total,
      registrations: stats.registrations,
      byCategory: stats.byCategory,
      byAge: stats.byAge,
      paidTotal: stats.paidTotal,
      paidCount: stats.paidCount,
    }
  } catch (error) {
    console.error('[robofest] SQL stats failed, falling back to export path:', error)
    const items = await loadRobofestRegistrationsForExport(f)
    return aggregateRegistrationStats(items)
  }
}

export async function loadRobofestRegistrationStatusCounts(): Promise<RobofestRegistrationStatusCounts> {
  const empty: RobofestRegistrationStatusCounts = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  }

  try {
    const counts = await queryRobofestRegistrationStatusCounts()
    return {
      pending: counts.pending ?? 0,
      confirmed: counts.confirmed ?? 0,
      cancelled: counts.cancelled ?? 0,
    }
  } catch (error) {
    console.error('[robofest] SQL status counts failed:', error)
    return empty
  }
}

/**
 * One GROUP BY for all ambassadors. Optional `ambassadorIds` seeds zero entries
 * for ambassadors with no referrals yet.
 */
export async function loadRobofestCampusAmbassadorReferralCounts(
  ambassadorIds: string[] = [],
): Promise<Record<string, RobofestCampusAmbassadorReferralStats>> {
  const counts: Record<string, RobofestCampusAmbassadorReferralStats> = {}
  for (const id of ambassadorIds) {
    counts[id] = { ...EMPTY_ROBOFEST_CAMPUS_AMBASSADOR_REFERRAL_STATS }
  }

  try {
    const grouped = await queryRobofestCampusAmbassadorReferralCounts()
    for (const [id, stats] of Object.entries(grouped)) {
      counts[id] = stats
    }
  } catch (error) {
    console.error('[robofest] SQL referral counts failed:', error)
  }

  return counts
}

export async function loadRobofestRegistrationsByIds(
  ids: string[],
  maxDocs = 500,
): Promise<RobofestRegistration[]> {
  if (ids.length === 0) return []

  const unique = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean))).slice(
    0,
    maxDocs,
  )

  const results = await Promise.all(
    unique.map(async (id) => {
      const doc = await collectionGet(ROBOFEST_REGISTRATIONS_COLLECTION, id)
      if (!doc) return null
      return mapRobofestRegistrationDoc(String(doc.id), doc as Record<string, unknown>)
    }),
  )

  return results.filter((r): r is RobofestRegistration => r != null)
}
