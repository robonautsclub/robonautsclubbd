import type { Event } from '@/types/event'

/** Suggested fee for an event (category amount, else event.amount). */
export function resolveEventSuggestedFee(event: Event, categoryName?: string): number {
  const categories = Array.isArray(event.categories) ? event.categories : []
  const selected = categoryName?.trim()
  if (selected && categories.length > 0) {
    const match = categories.find(
      (category) => category.name.trim().toLowerCase() === selected.toLowerCase()
    )
    if (match?.amount != null && Number.isFinite(match.amount) && match.amount > 0) {
      return match.amount
    }
  }
  if (event.amount != null && Number.isFinite(event.amount) && event.amount > 0) {
    return event.amount
  }
  return 0
}
