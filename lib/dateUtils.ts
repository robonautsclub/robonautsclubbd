/**
 * Utility functions for handling event dates
 * Supports both single date strings and multiple dates (comma-separated or array)
 *
 * Registration closing times and calendar-day checks use Bangladesh Standard Time
 * (Asia/Dhaka, UTC+6). Stored strings stay timezone-naive; wall-clock values mean BD.
 */

export const BANGLADESH_TZ = 'Asia/Dhaka'
/** Bangladesh has no DST; fixed offset from UTC. */
export const BANGLADESH_OFFSET_MS = 6 * 60 * 60 * 1000

export type BangladeshCalendarDate = {
  year: number
  /** 0-indexed month (Date convention) */
  month: number
  day: number
}

/**
 * Convert a Bangladesh wall-clock date/time to a real UTC Date instant.
 * `month` is 0-indexed (January = 0).
 */
export function bdWallTimeToUtcDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  return new Date(
    Date.UTC(year, month, day, hour, minute, second, ms) - BANGLADESH_OFFSET_MS,
  )
}

/**
 * Current calendar date in Asia/Dhaka.
 */
export function getBangladeshCalendarDate(now: Date = new Date()): BangladeshCalendarDate {
  const shifted = new Date(now.getTime() + BANGLADESH_OFFSET_MS)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  }
}

/**
 * Current time shifted so local Date getters reflect Bangladesh wall clock
 * (same approach as the previous RealtimeEventsList BST helper).
 */
export function getBangladeshNow(now: Date = new Date()): Date {
  const utcAsLocal = now.getTime() + now.getTimezoneOffset() * 60_000
  return new Date(utcAsLocal + BANGLADESH_OFFSET_MS)
}

/**
 * YYYY-MM-DD as a Date shifted for Bangladesh calendar-day comparisons
 * with `getBangladeshNow` / date-fns differenceInDays.
 */
export function getEventDateInBangladesh(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0)
  return new Date(utcMidnight + BANGLADESH_OFFSET_MS)
}

/**
 * True UTC instant for midnight at the start of a YYYY-MM-DD day in Bangladesh.
 */
export function getEventMidnightUtcInBangladesh(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return bdWallTimeToUtcDate(year, month - 1, day, 0, 0, 0, 0)
}

function calendarDateKey({ year, month, day }: BangladeshCalendarDate): number {
  return year * 10_000 + (month + 1) * 100 + day
}

function parseIsoCalendarDate(dateString: string): BangladeshCalendarDate | null {
  const match = dateString.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  }
}

/**
 * Parse event date(s) - handles both string and array formats
 */
export function parseEventDates(date: string | string[] | undefined): string[] {
  if (!date) return []
  if (Array.isArray(date)) return date
  // Handle comma-separated string
  if (typeof date === 'string' && date.includes(',')) {
    return date.split(',').map(d => d.trim()).filter(d => d.length > 0)
  }
  // Single date string
  return [date]
}

/**
 * Format dates for display
 * Returns formatted string for single or multiple dates
 */
export function formatEventDates(dates: string[], formatType: 'short' | 'long' = 'long'): string {
  if (dates.length === 0) return 'No date set'
  if (dates.length === 1) {
    const date = new Date(dates[0])
    return formatType === 'short' 
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
  if (dates.length === 2) {
    const date1 = new Date(dates[0])
    const date2 = new Date(dates[dates.length - 1])
    return `${date1.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${date2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  const firstDate = new Date(dates[0])
  const lastDate = new Date(dates[dates.length - 1])
  return `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${dates.length} dates)`
}

/**
 * Get the first (earliest) date from event dates
 */
export function getFirstEventDate(date: string | string[] | undefined): Date | null {
  const dates = parseEventDates(date)
  if (dates.length === 0) return null
  const sortedDates = dates.sort()
  return new Date(sortedDates[0])
}

/**
 * Human-readable event date label.
 * ISO dates (YYYY-MM-DD) are formatted; free-text CMS labels are shown as stored
 * (e.g. "11 September (CTG)", "18 September (DHK)").
 */
export function formatEventDateLabel(
  date: string | string[] | undefined,
  formatType: 'short' | 'long' = 'long',
): string {
  const parts = parseEventDates(date)
  if (parts.length === 0) return 'TBA'

  const looksLikeIso = (value: string) => /^\d{4}-\d{2}-\d{2}/.test(value.trim())
  const allFreeText = parts.every((part) => !looksLikeIso(part))
  if (allFreeText) {
    if (typeof date === 'string' && date.trim()) return date.trim()
    return parts.join(' · ')
  }

  const firstDate = getFirstEventDate(date)
  if (firstDate && !Number.isNaN(firstDate.getTime())) {
    const formatted = formatEventDates(parts, formatType)
    if (formatted && !formatted.toLowerCase().includes('invalid')) {
      return formatted
    }
  }

  if (typeof date === 'string' && date.trim()) return date.trim()
  return parts.join(' · ')
}

/**
 * Get the last (latest) date from event dates
 */
export function getLastEventDate(date: string | string[] | undefined): Date | null {
  const dates = parseEventDates(date)
  if (dates.length === 0) return null
  const sortedDates = dates.sort()
  return new Date(sortedDates[sortedDates.length - 1])
}

/**
 * Check if event has passed (all dates are before today in Bangladesh).
 */
export function hasEventPassed(date: string | string[] | undefined): boolean {
  const dates = parseEventDates(date)
  if (dates.length === 0) return false
  const todayKey = calendarDateKey(getBangladeshCalendarDate())
  return dates.every((d) => {
    const parsed = parseIsoCalendarDate(d)
    if (!parsed) {
      const eventDate = new Date(d)
      if (Number.isNaN(eventDate.getTime())) return false
      return calendarDateKey(getBangladeshCalendarDate(eventDate)) < todayKey
    }
    return calendarDateKey(parsed) < todayKey
  })
}

/**
 * Check if event is upcoming (at least one date is today or in the future in Bangladesh).
 */
export function isEventUpcoming(date: string | string[] | undefined): boolean {
  const dates = parseEventDates(date)
  if (dates.length === 0) return false
  const todayKey = calendarDateKey(getBangladeshCalendarDate())
  return dates.some((d) => {
    const parsed = parseIsoCalendarDate(d)
    if (!parsed) {
      const eventDate = new Date(d)
      if (Number.isNaN(eventDate.getTime())) return false
      return calendarDateKey(getBangladeshCalendarDate(eventDate)) >= todayKey
    }
    return calendarDateKey(parsed) >= todayKey
  })
}

/**
 * Parse a registration closing value into a UTC Date instant.
 * Wall-clock values are interpreted as Bangladesh Standard Time (Asia/Dhaka).
 * Supports `YYYY-MM-DDTHH:mm[:ss]` (exact BD instant) and `YYYY-MM-DD`
 * (end of that Bangladesh calendar day).
 */
export function parseRegistrationClosingInstant(
  registrationClosingDate?: string | null,
): Date | null {
  if (!registrationClosingDate || String(registrationClosingDate).trim() === '') {
    return null
  }
  const raw = registrationClosingDate.trim()

  const dtMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  )
  if (dtMatch) {
    const [, y, mo, d, h, mi, s] = dtMatch
    return bdWallTimeToUtcDate(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(s ?? '0'),
      0,
    )
  }

  const dateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateMatch) {
    const [, y, mo, d] = dateMatch
    return bdWallTimeToUtcDate(Number(y), Number(mo) - 1, Number(d), 23, 59, 59, 999)
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Format a registration closing deadline for display in Bangladesh time.
 * Example: "Sep 1, 2026 · 11:59 PM BST"
 */
export function formatRegistrationClosingLabel(
  registrationClosingDate?: string | null,
): string {
  if (!registrationClosingDate || String(registrationClosingDate).trim() === '') {
    return ''
  }
  const raw = registrationClosingDate.trim()
  const instant = parseRegistrationClosingInstant(raw)
  if (!instant) return raw

  const hasTime = raw.includes('T')
  const datePart = instant.toLocaleDateString('en-US', {
    timeZone: BANGLADESH_TZ,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  if (!hasTime) return datePart

  const timePart = instant.toLocaleTimeString('en-US', {
    timeZone: BANGLADESH_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${datePart} · ${timePart} BST`
}

/**
 * Check if registration is closed by the optional closing date/datetime.
 * If registrationClosingDate is missing/empty, returns false (not closed by date).
 * Date-only values stay open through that Bangladesh calendar day; datetimes close at the exact BD time.
 */
export function isRegistrationClosedByDate(registrationClosingDate?: string): boolean {
  const closing = parseRegistrationClosingInstant(registrationClosingDate)
  if (!closing) return false
  return Date.now() > closing.getTime()
}

/**
 * Check if registration is open for an event.
 * Registration is open only when: event has not passed, not manually disabled, and not past closing date.
 */
export function isRegistrationOpen(event: {
  date: string | string[]
  registrationDisabled?: boolean
  registrationClosingDate?: string
}): boolean {
  if (event.registrationDisabled) return false
  if (isRegistrationClosedByDate(event.registrationClosingDate)) return false
  if (hasEventPassed(event.date)) return false
  return true
}
