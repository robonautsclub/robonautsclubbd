import { collectionGet, collectionWhere } from '@/lib/db/collections'
import {
  ROBOFEST_REGISTRATIONS_COLLECTION,
  mapRobofestRegistrationDoc,
  type RobofestRegistration,
  type RobofestRegistrationStatus,
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

async function loadRobofestRegistrationsPageFallback(options: {
  filters: RobofestRegistrationListFilters
  cursor?: RobofestRegistrationCursor | null
  pageSize: number
  scanLimit?: number
}): Promise<RobofestRegistrationPage> {
  const f = normalizeFilters(options.filters)
  const scanLimit = options.scanLimit ?? FALLBACK_SCAN_LIMIT
  const docs = await collectionWhere(
    ROBOFEST_REGISTRATIONS_COLLECTION,
    'status',
    '==',
    f.status,
  )

  const items = docs
    .slice(0, scanLimit)
    .map((doc) =>
      mapRobofestRegistrationDoc(String(doc.id), doc as Record<string, unknown>),
    )
    .filter((item) => matchesExtraFilters(item, f))
    .sort(compareNewestFirst)

  return pageFromItems(items, options.cursor, options.pageSize)
}

export async function loadRobofestRegistrationsPage(options: {
  filters: RobofestRegistrationListFilters
  cursor?: RobofestRegistrationCursor | null
  pageSize?: number
}): Promise<RobofestRegistrationPage> {
  const pageSize = Math.min(Math.max(options.pageSize ?? ROBOFEST_REGISTRATIONS_PAGE_SIZE, 1), 100)
  const f = normalizeFilters(options.filters)
  const scanLimit = f.search ? SEARCH_SCAN_LIMIT : FALLBACK_SCAN_LIMIT
  return loadRobofestRegistrationsPageFallback({
    filters: f,
    cursor: options.cursor,
    pageSize,
    scanLimit,
  })
}

export async function loadRobofestRegistrationsForExport(
  filters: RobofestRegistrationListFilters,
  maxDocs = 5000,
): Promise<RobofestRegistration[]> {
  const f = normalizeFilters(filters)
  const page = await loadRobofestRegistrationsPageFallback({
    filters: f,
    pageSize: maxDocs,
    scanLimit: Math.min(maxDocs, SEARCH_SCAN_LIMIT),
  })
  return page.items
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
  const items = await loadRobofestRegistrationsForExport(filters)
  return aggregateRegistrationStats(items)
}

export async function loadRobofestRegistrationStatusCounts(): Promise<RobofestRegistrationStatusCounts> {
  const empty = { pending: 0, confirmed: 0, cancelled: 0 }
  const statuses: RobofestRegistrationStatus[] = ['pending', 'confirmed', 'cancelled']

  const results = await Promise.all(
    statuses.map(async (status) => {
      const docs = await collectionWhere(ROBOFEST_REGISTRATIONS_COLLECTION, 'status', '==', status)
      return [status, docs.length] as const
    }),
  )

  const counts = { ...empty }
  for (const [status, count] of results) {
    counts[status] = count
  }
  return counts
}

export async function loadRobofestCampusAmbassadorReferralCounts(
  ambassadorIds: string[],
): Promise<Record<string, RobofestCampusAmbassadorReferralStats>> {
  const counts: Record<string, RobofestCampusAmbassadorReferralStats> = {}
  for (const id of ambassadorIds) {
    counts[id] = { ...EMPTY_ROBOFEST_CAMPUS_AMBASSADOR_REFERRAL_STATS }
  }
  if (ambassadorIds.length === 0) return counts

  const results = await Promise.all(
    ambassadorIds.map(async (id) => {
      const docs = await collectionWhere(
        ROBOFEST_REGISTRATIONS_COLLECTION,
        'campusAmbassadorId',
        '==',
        id,
      )
      const confirmed = docs.filter((d) => d.status === 'confirmed')
      let members = 0
      for (const doc of confirmed) {
        const registration = mapRobofestRegistrationDoc(
          String(doc.id),
          doc as Record<string, unknown>,
        )
        members += participantCount(registration)
      }
      return [id, { teams: confirmed.length, members }] as const
    }),
  )

  for (const [id, stats] of results) {
    counts[id] = stats
  }
  return counts
}

export async function loadRobofestRegistrationsByIds(
  ids: string[],
  maxDocs = 500,
): Promise<RobofestRegistration[]> {
  if (ids.length === 0) return []

  const unique = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean))).slice(0, maxDocs)

  const results = await Promise.all(
    unique.map(async (id) => {
      const doc = await collectionGet(ROBOFEST_REGISTRATIONS_COLLECTION, id)
      if (!doc) return null
      return mapRobofestRegistrationDoc(String(doc.id), doc as Record<string, unknown>)
    }),
  )

  return results.filter((r): r is RobofestRegistration => r != null)
}
