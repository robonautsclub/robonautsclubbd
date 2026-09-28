import type { Event } from '@/types/event'

/** Public event detail URL. Respects `href` overrides (e.g. Robofest). */
export function eventPublicHref(event: Pick<Event, 'id' | 'slug' | 'href'>): string {
  if (event.href) return event.href
  return `/events/${event.slug || event.id}`
}
