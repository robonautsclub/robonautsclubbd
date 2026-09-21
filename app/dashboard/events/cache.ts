import { unstable_cache } from 'next/cache'
import { collectionGet, collectionGetAll } from '@/lib/db/collections'
import { Event } from '@/types/event'
import { persistMissingEventSlugs } from '@/lib/event-slug'

export type DashboardEventSummary = Pick<Event, 'id' | 'date' | 'createdAt' | 'title' | 'description'>
export const DASHBOARD_EVENTS_SUMMARY_TAG = 'dashboard-events-summary'
export const DASHBOARD_EVENTS_LIST_TAG = 'dashboard-events-list'

export const PUBLIC_EVENTS_TAG = 'public-events'
export const DASHBOARD_EVENT_DETAIL_TAG_PREFIX = 'dashboard-event'
export const DASHBOARD_EVENT_BOOKINGS_TAG_PREFIX = 'dashboard-event-bookings'

export function getEventDetailTag(eventId: string): string {
  return `${DASHBOARD_EVENT_DETAIL_TAG_PREFIX}-${eventId}`
}

export function getEventBookingsTag(eventId: string): string {
  return `${DASHBOARD_EVENT_BOOKINGS_TAG_PREFIX}-${eventId}`
}

function parseCreatedAt(value: unknown): Date | string {
  if (value instanceof Date) return value
  if (typeof value === 'string' && value) return value
  if (value && typeof value === 'object') {
    const v = value as { toDate?: () => Date; _seconds?: number; seconds?: number }
    if (typeof v.toDate === 'function') {
      try {
        return v.toDate()
      } catch {
        /* fall through */
      }
    }
    const seconds = v._seconds ?? v.seconds
    if (typeof seconds === 'number') return new Date(seconds * 1000)
  }
  return new Date(0).toISOString()
}

export function normalizeEventCategories(
  categories: Array<{ name: string; amount?: number }> | undefined,
  isPaid: boolean,
): Array<{ name: string; amount?: number }> {
  if (!Array.isArray(categories)) return []

  const normalized = categories
    .map((category) => {
      const name = category.name?.trim() || ''
      const numeric = Number(category.amount)
      const includeAmount =
        isPaid && category.amount != null && Number.isFinite(numeric) && numeric > 0

      return includeAmount ? { name, amount: numeric } : { name }
    })
    .filter((category) => category.name.length > 0)

  const uniqueByName = new Map<string, { name: string; amount?: number }>()
  for (const category of normalized) {
    if (!uniqueByName.has(category.name.toLowerCase())) {
      uniqueByName.set(category.name.toLowerCase(), category)
    }
  }

  return Array.from(uniqueByName.values())
}

function sortEventsByCreatedAt<T extends { createdAt?: unknown }>(events: T[]): T[] {
  return events.sort((a, b) => {
    if (!a.createdAt && !b.createdAt) return 0
    if (!a.createdAt) return 1
    if (!b.createdAt) return -1

    const dateA = parseCreatedAt(a.createdAt)
    const dateB = parseCreatedAt(b.createdAt)
    const tA = dateA instanceof Date ? dateA.getTime() : new Date(String(dateA)).getTime()
    const tB = dateB instanceof Date ? dateB.getTime() : new Date(String(dateB)).getTime()
    return tB - tA
  })
}

async function fetchDashboardEventsSummaryFromDb(): Promise<DashboardEventSummary[]> {
  const docs = await collectionGetAll('events')
  const events: DashboardEventSummary[] = docs.map((doc) => ({
    id: String(doc.id),
    date: doc.date as DashboardEventSummary['date'],
    title: String(doc.title ?? ''),
    description: String(doc.description ?? ''),
    createdAt: parseCreatedAt(doc.createdAt),
  }))

  return sortEventsByCreatedAt(events)
}

export const getCachedDashboardEventsSummary = unstable_cache(
  fetchDashboardEventsSummaryFromDb,
  [DASHBOARD_EVENTS_SUMMARY_TAG],
  {
    tags: [DASHBOARD_EVENTS_SUMMARY_TAG],
    revalidate: 600,
  },
)

async function fetchDashboardEventsListFromDb(): Promise<Event[]> {
  const docs = await collectionGetAll('events')
  const events: Event[] = docs.map((doc) => ({
    id: String(doc.id),
    ...doc,
    slug: typeof doc.slug === 'string' && doc.slug.trim() ? doc.slug.trim() : undefined,
    createdAt: parseCreatedAt(doc.createdAt),
    updatedAt: parseCreatedAt(doc.updatedAt),
  })) as Event[]

  await persistMissingEventSlugs(events)

  return sortEventsByCreatedAt(events)
}

export const getCachedEventsList = unstable_cache(fetchDashboardEventsListFromDb, [DASHBOARD_EVENTS_LIST_TAG], {
  tags: [DASHBOARD_EVENTS_LIST_TAG],
  revalidate: 900,
})

export async function fetchDashboardEventByIdFromDb(id: string): Promise<Event | null> {
  const doc = await collectionGet('events', id)
  if (!doc) return null

  const event = {
    id: String(doc.id),
    ...doc,
    slug: typeof doc.slug === 'string' && doc.slug.trim() ? doc.slug.trim() : undefined,
    createdAt: parseCreatedAt(doc.createdAt),
    updatedAt: parseCreatedAt(doc.updatedAt),
  } as Event
  await persistMissingEventSlugs([event])
  return event
}
