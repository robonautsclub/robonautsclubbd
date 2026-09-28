import type { Event } from '@/types/event'
import { ROBOFEST_LOCAL } from '@/lib/robofest-local'

/** Stable synthetic id — not a Firestore document. */
export const ROBOFEST_EVENTS_LIST_CARD_ID = 'robofest-local-2026'

/**
 * Hardcoded Robofest card for the public Events list.
 * Links to /robofest; no Events booking/registration.
 * Stays Upcoming until both round dates have passed (BD calendar).
 */
export function getRobofestEventsListCard(): Event {
  const now = new Date().toISOString()
  return {
    id: ROBOFEST_EVENTS_LIST_CARD_ID,
    slug: 'robofest',
    title: ROBOFEST_LOCAL.headline,
    date: ['2026-09-11', '2026-09-18'],
    location: ROBOFEST_LOCAL.venueLabel,
    description: ROBOFEST_LOCAL.lead,
    image: '/robofest/robofest.jpg',
    tags: ['Robofest', 'Competition'],
    href: '/robofest',
    registrationDisabled: true,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
  }
}
