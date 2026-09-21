import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import {
  collectionGet,
  collectionGetAll,
  collectionWhere,
  getEventBySlug,
} from '@/lib/db/collections'
import { Event } from '@/types/event'
import { persistMissingEventSlugs, slugifyEventTitle } from '@/lib/event-slug'
import { Course } from '@/types/course'
import { SCHOOL_DIRECTORY_COLLECTION } from '@/lib/schoolDirectory'
import { PUBLIC_HOMEPAGE_ORGS_TAG } from '@/lib/public-cache-tags'
import {
  HOMEPAGE_ORGS_COLLECTION,
  mapHomepageOrgDoc,
  splitHomepageOrgs,
} from '@/lib/homepage-orgs'
import type { PublicHomepageOrgs } from '@/types/homepage-org'

const PUBLIC_EVENTS_TAG = 'public-events'
const PUBLIC_COURSES_TAG = 'public-courses'
const PUBLIC_SCHOOLS_TAG = 'public-schools'
const PUBLIC_EVENTS_MAX = 200
const PUBLIC_EVENTS_HOME_MAX = 24
const PUBLIC_COURSES_MAX = 100
const PUBLIC_HOMEPAGE_ORGS_MAX = 100

/** Fields needed for event cards / rails — omit form, payment, and long body fields. */
const LIST_OMIT_KEYS = new Set([
  'fullDescription',
  'agenda',
  'eligibility',
  'venue',
  'categories',
  'customFormFields',
  'defaultRegistrationFields',
  'paymentBkashNumber',
  'contactPersonName',
  'contactPersonDesignation',
  'contactPersonMobileOrEmail',
  'certificateTemplateId',
  'createdBy',
  'createdByName',
  'createdByEmail',
])

function toIsoString(value: unknown, fallbackNow = false): string | null {
  if (typeof value === 'object' && value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return fallbackNow ? new Date().toISOString() : null
}

function normalizeEventDate(dateValue: unknown): unknown {
  if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue && typeof (dateValue as { toDate?: unknown }).toDate === 'function') {
    return (dateValue as { toDate: () => Date }).toDate().toISOString().split('T')[0]
  }
  if (dateValue && typeof dateValue === 'object' && '_seconds' in dateValue) {
    return new Date(Number((dateValue as { _seconds: number })._seconds) * 1000).toISOString().split('T')[0]
  }
  return dateValue
}

function mapPublicEventDoc(
  eventDoc: { id: string },
  data: Record<string, unknown>,
  lean: boolean,
): Event {
  const createdAtStr = toIsoString(data.createdAt, true) as string
  const updatedAtStr = toIsoString(data.updatedAt, true) as string
  const dateValue = normalizeEventDate(data.date)

  if (!lean) {
    return {
      id: eventDoc.id,
      ...data,
      slug: typeof data.slug === 'string' && data.slug.trim() ? data.slug.trim() : undefined,
      date: dateValue,
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
    } as Event
  }

  const leanData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (LIST_OMIT_KEYS.has(key)) continue
    leanData[key] = value
  }

  return {
    id: eventDoc.id,
    ...leanData,
    title: typeof data.title === 'string' ? data.title : '',
    location: typeof data.location === 'string' ? data.location : '',
    description: typeof data.description === 'string' ? data.description : '',
    slug: typeof data.slug === 'string' && data.slug.trim() ? data.slug.trim() : undefined,
    date: dateValue,
    createdAt: createdAtStr,
    updatedAt: updatedAtStr,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
  } as Event
}

function eventMatchesPublicParam(event: Event, param: string): boolean {
  if (event.id === param) return true
  if (event.slug && event.slug === param) return true
  return slugifyEventTitle(event.title) === param
}

async function fetchPublicEventsFromDb(lean: boolean, limit: number): Promise<Event[]> {
  try {
    const docs = await collectionGetAll('events', {
      orderBy: 'createdAt',
      direction: 'desc',
      limit,
    })

    const events: Event[] = []
    for (const doc of docs) {
      events.push(mapPublicEventDoc({ id: String(doc.id) }, doc as Record<string, unknown>, lean))
    }

    events.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return events
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

const getCachedPublicEvents = unstable_cache(
  () => fetchPublicEventsFromDb(true, PUBLIC_EVENTS_MAX),
  [PUBLIC_EVENTS_TAG, 'list'],
  { tags: [PUBLIC_EVENTS_TAG], revalidate: 120 },
)

const getCachedPublicEventsHome = unstable_cache(
  () => fetchPublicEventsFromDb(true, PUBLIC_EVENTS_HOME_MAX),
  [PUBLIC_EVENTS_TAG, 'home'],
  { tags: [PUBLIC_EVENTS_TAG], revalidate: 120 },
)

export const getPublicEvents = cache(async (): Promise<Event[]> => {
  return getCachedPublicEvents()
})

/** Tighter list for homepage rails — same lean shape, fewer rows. */
export const getPublicEventsForHome = cache(async (): Promise<Event[]> => {
  return getCachedPublicEventsHome()
})

async function fetchPublicEventFromDb(param: string): Promise<Event | null> {
  const normalized = param.trim()
  if (!normalized) return null

  try {
    const bySlug = await getEventBySlug(normalized)
    if (bySlug) {
      return mapPublicEventDoc({ id: String(bySlug.id) }, bySlug as Record<string, unknown>, false)
    }
  } catch (error) {
    console.error('Error fetching event by slug:', error)
  }

  try {
    const eventDoc = await collectionGet('events', normalized)
    if (eventDoc) {
      const event = mapPublicEventDoc({ id: String(eventDoc.id) }, eventDoc as Record<string, unknown>, false)
      await persistMissingEventSlugs([event])
      return event
    }
  } catch (error) {
    console.error('Error fetching event by id:', error)
  }

  try {
    const events = await getCachedPublicEvents()
    const match = events.find((event) => eventMatchesPublicParam(event, normalized))
    if (match) {
      // List was lean — re-fetch full doc for detail
      const full = await collectionGet('events', match.id)
      if (full) {
        const event = mapPublicEventDoc({ id: String(full.id) }, full as Record<string, unknown>, false)
        await persistMissingEventSlugs([event])
        return event
      }
      await persistMissingEventSlugs([match])
      return match
    }
  } catch (error) {
    console.error('Error matching event from public list:', error)
  }

  return null
}

export const getPublicEvent = cache(async (slugOrId: string): Promise<Event | null> => {
  return fetchPublicEventFromDb(slugOrId)
})

export const getPublicEnglishMediumSchools = cache(async (): Promise<string[]> => {
  try {
    return unstable_cache(
      async (): Promise<string[]> => {
        const approved = await collectionWhere(SCHOOL_DIRECTORY_COLLECTION, 'status', '==', 'approved')
        return approved
          .filter((doc) => (typeof doc.isActive === 'boolean' ? doc.isActive : true))
          .map((doc) => (typeof doc.name === 'string' ? doc.name.trim() : ''))
          .filter((name): name is string => Boolean(name))
          .sort((a, b) => a.localeCompare(b))
      },
      [PUBLIC_SCHOOLS_TAG],
      { tags: [PUBLIC_SCHOOLS_TAG], revalidate: 3600 },
    )()
  } catch (error) {
    console.error('Error fetching schools:', error)
    return []
  }
})

async function fetchPublicCoursesFromDb(): Promise<Course[]> {
  try {
    const docs = await collectionWhere('courses', 'isArchived', '==', false, {
      limit: PUBLIC_COURSES_MAX,
    })

    const courses: Course[] = []
    for (const doc of docs) {
      const data = doc as Record<string, unknown>
      courses.push({
        id: String(doc.id),
        title: typeof data.title === 'string' ? data.title : '',
        level: typeof data.level === 'string' ? data.level : '',
        blurb: typeof data.blurb === 'string' ? data.blurb : '',
        href: typeof data.href === 'string' ? data.href : '',
        image: typeof data.image === 'string' ? data.image : '',
        isArchived: Boolean(data.isArchived),
        createdAt: toIsoString(data.createdAt, true) as string,
        updatedAt: toIsoString(data.updatedAt, true) as string,
        createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
      } as Course)
    }

    courses.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return courses
  } catch (error) {
    console.error('Error fetching public courses:', error)
    return []
  }
}

const getCachedPublicCourses = unstable_cache(fetchPublicCoursesFromDb, [PUBLIC_COURSES_TAG], {
  tags: [PUBLIC_COURSES_TAG],
  revalidate: 3600,
})

export const getPublicCourses = cache(async (): Promise<Course[]> => {
  return getCachedPublicCourses()
})

async function fetchPublicHomepageOrgsFromDb(): Promise<PublicHomepageOrgs> {
  try {
    const docs = await collectionWhere(HOMEPAGE_ORGS_COLLECTION, 'isActive', '==', true, {
      limit: PUBLIC_HOMEPAGE_ORGS_MAX,
    })

    const orgs = docs
      .map((doc) => mapHomepageOrgDoc(String(doc.id), doc as Record<string, unknown>))
      .filter((org): org is NonNullable<typeof org> => Boolean(org))

    return splitHomepageOrgs(orgs)
  } catch (error) {
    console.error('Error fetching public homepage orgs:', error)
    return { partners: [], schools: [] }
  }
}

const getCachedPublicHomepageOrgs = unstable_cache(
  fetchPublicHomepageOrgsFromDb,
  [PUBLIC_HOMEPAGE_ORGS_TAG],
  {
    tags: [PUBLIC_HOMEPAGE_ORGS_TAG],
    revalidate: 3600,
  },
)

export const getPublicHomepageOrgs = cache(async (): Promise<PublicHomepageOrgs> => {
  return getCachedPublicHomepageOrgs()
})
