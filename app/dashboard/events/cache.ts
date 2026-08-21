import { unstable_cache } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import { Event } from '@/types/event'

export type DashboardEventSummary = Pick<Event, 'id' | 'date' | 'createdAt' | 'title' | 'description'>
export const DASHBOARD_EVENTS_SUMMARY_TAG = 'dashboard-events-summary'
export const DASHBOARD_EVENTS_LIST_TAG = 'dashboard-events-list'

const DASHBOARD_EVENT_LIST_FIELDS = [
  'title',
  'date',
  'time',
  'location',
  'description',
  'fullDescription',
  'image',
  'eligibility',
  'venue',
  'agenda',
  'tags',
  'categories',
  'isPaid',
  'amount',
  'paymentBkashNumber',
  'contactPersonName',
  'contactPersonDesignation',
  'contactPersonMobileOrEmail',
  'registrationClosingDate',
  'registrationDisabled',
  'customFormFields',
  'defaultRegistrationFields',
  'createdAt',
  'updatedAt',
  'createdBy',
  'createdByName',
  'createdByEmail',
] as const

export const PUBLIC_EVENTS_TAG = 'public-events'
export const DASHBOARD_EVENT_DETAIL_TAG_PREFIX = 'dashboard-event'
export const DASHBOARD_EVENT_BOOKINGS_TAG_PREFIX = 'dashboard-event-bookings'

export function getEventDetailTag(eventId: string): string {
  return `${DASHBOARD_EVENT_DETAIL_TAG_PREFIX}-${eventId}`
}

export function getEventBookingsTag(eventId: string): string {
  return `${DASHBOARD_EVENT_BOOKINGS_TAG_PREFIX}-${eventId}`
}

export function normalizeEventCategories(
  categories: Array<{ name: string; amount?: number }> | undefined,
  isPaid: boolean
): Array<{ name: string; amount?: number }> {
  if (!Array.isArray(categories)) return []

  // Omit `amount` entirely when not a valid positive paid amount.
  // Firestore (admin SDK) rejects `undefined` values without `ignoreUndefinedProperties`.
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

async function fetchDashboardEventsSummaryFromDb(): Promise<DashboardEventSummary[]> {
  const db = adminDb!
  const eventsSnapshot = await db
    .collection('events')
    .select('date', 'createdAt', 'title', 'description')
    .get()

  const events: DashboardEventSummary[] = []
  eventsSnapshot.forEach((doc) => {
    const data = doc.data()
    events.push({
      id: doc.id,
      date: data.date,
      title: data.title,
      description: data.description,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
    } as DashboardEventSummary)
  })

  events.sort((a, b) => {
    if (!a.createdAt && !b.createdAt) return 0
    if (!a.createdAt) return 1
    if (!b.createdAt) return -1

    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
    return dateB - dateA
  })

  return events
}

export const getCachedDashboardEventsSummary = unstable_cache(fetchDashboardEventsSummaryFromDb, [DASHBOARD_EVENTS_SUMMARY_TAG], {
  tags: [DASHBOARD_EVENTS_SUMMARY_TAG],
  revalidate: 600,
})

async function fetchDashboardEventsListFromDb(): Promise<Event[]> {
  const db = adminDb!
  const eventsSnapshot = await db
    .collection('events')
    .select(...(DASHBOARD_EVENT_LIST_FIELDS as unknown as string[]))
    .get()

  const events: Event[] = []
  eventsSnapshot.forEach((doc) => {
    const data = doc.data()
    events.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    } as Event)
  })

  events.sort((a, b) => {
    if (!a.createdAt && !b.createdAt) return 0
    if (!a.createdAt) return 1
    if (!b.createdAt) return -1

    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
    return dateB - dateA
  })

  return events
}

export const getCachedEventsList = unstable_cache(fetchDashboardEventsListFromDb, [DASHBOARD_EVENTS_LIST_TAG], {
  tags: [DASHBOARD_EVENTS_LIST_TAG],
  revalidate: 900,
})

export async function fetchDashboardEventByIdFromDb(id: string): Promise<Event | null> {
  const db = adminDb!
  const eventDoc = await db.collection('events').doc(id).get()
  if (!eventDoc.exists) {
    return null
  }

  const data = eventDoc.data()!
  return {
    id: eventDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
  } as Event
}
