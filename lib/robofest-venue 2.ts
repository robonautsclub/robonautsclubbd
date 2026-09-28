/**
 * Client-safe Robofest venue/date helpers (no Firebase Admin / Node APIs).
 */

export type RobofestVenueRound = {
  city: string
  title: string
  dates: string
  venueLabel: string
  image: string
  /** YYYY-MM-DDTHH:mm (Asia/Dhaka). Null = fall back to global content deadline. */
  registrationClosingDate?: string | null
}

export type RobofestVenueContent = {
  venueLabel: string
  venueDetail: string
  venueLines: string[]
  rounds: RobofestVenueRound[]
  dateLabel?: string
  dateLines?: string[]
}

/** Look up a local-round entry by division/city name (case-insensitive). */
export function getRobofestRoundForCity(
  content: RobofestVenueContent,
  city: string,
): RobofestVenueRound | undefined {
  const normalized = city.trim().toLowerCase()
  if (!normalized) return undefined
  return (content.rounds || []).find(
    (round) => round.city.trim().toLowerCase() === normalized,
  )
}

function cityDateNeedle(city: string): string | null {
  const normalized = city.trim().toLowerCase()
  if (normalized.startsWith('chit') || normalized.includes('ctg')) return 'CTG'
  if (normalized.startsWith('dha') || normalized.includes('dhk')) return 'DHK'
  return null
}

function cityVenueNeedles(city: string): string[] {
  const normalized = city.trim().toLowerCase()
  if (!normalized) return []
  if (
    normalized.startsWith('chit') ||
    normalized.includes('ctg') ||
    normalized.includes('chattogram')
  ) {
    return ['chittagong', 'chattogram', 'ctg']
  }
  if (normalized.startsWith('dha') || normalized.includes('dhk')) {
    return ['dhaka', 'dhk']
  }
  return [normalized]
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Prefer "City - Venue" prefix; fall back to a whole-token city match. */
function lineMatchesCity(line: string, city: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  const lower = trimmed.toLowerCase()
  const needles = cityVenueNeedles(city)
  if (
    needles.some(
      (needle) =>
        lower.startsWith(`${needle} - `) || lower.startsWith(`${needle} – `),
    )
  ) {
    return true
  }
  // Avoid substring false positives (e.g. city name inside a school name).
  return needles.some((needle) => {
    const re = new RegExp(
      `(^|[\\s,;/|])${escapeRegExp(needle)}(?=[\\s,;/|]|-|–|$)`,
      'i',
    )
    return re.test(trimmed)
  })
}

function namesMultipleRoundCities(label: string): boolean {
  const lower = label.toLowerCase()
  const hasDhaka = lower.includes('dhaka') || /\bdhk\b/.test(lower)
  const hasCtg =
    lower.includes('chittagong') ||
    lower.includes('chattogram') ||
    /\bctg\b/.test(lower)
  return hasDhaka && hasCtg
}

/** Division date for PDF/email/verify — prefers CTG/DHK labels from content. */
export function resolveRobofestRoundDateLabel(
  content: RobofestVenueContent,
  city: string,
): string {
  const round = getRobofestRoundForCity(content, city)
  const fromRound = round?.dates?.trim() || ''
  if (/\((CTG|DHK)\)/i.test(fromRound)) return fromRound

  const needle = cityDateNeedle(city)
  if (needle && content.dateLines?.length) {
    const fromLines = content.dateLines.find((line) =>
      line.toUpperCase().includes(needle),
    )
    if (fromLines?.trim()) return fromLines.trim()
  }

  if (fromRound) return fromRound
  return content.dateLabel || 'TBA'
}

/** Strip leading "City - " from a venue line for display. */
export function formatRobofestVenueDisplay(line: string): string {
  const trimmed = line.trim()
  if (!trimmed) return ''
  const separator = trimmed.indexOf(' - ')
  if (separator > 0) return trimmed.slice(separator + 3).trim()
  return trimmed
}

export function findVenueLineForCity(
  content: RobofestVenueContent,
  city: string,
): string | undefined {
  if (!city.trim() || !content.venueLines?.length) return undefined
  const needles = cityVenueNeedles(city)
  const prefixHit = content.venueLines.find((line) => {
    const lower = line.trim().toLowerCase()
    return needles.some(
      (needle) =>
        lower.startsWith(`${needle} - `) || lower.startsWith(`${needle} – `),
    )
  })
  if (prefixHit) return prefixHit.trim()
  return content.venueLines.find((line) => lineMatchesCity(line, city))?.trim()
}

/** Keep round venue labels aligned with venue lines (school name only). */
export function syncRobofestVenueFields<T extends RobofestVenueContent>(
  content: T,
): T {
  const rounds = (content.rounds || []).map((round) => {
    const line = findVenueLineForCity(content, round.city)
    if (!line) return round
    return {
      ...round,
      venueLabel: formatRobofestVenueDisplay(line),
    }
  })
  const schoolNames = (content.venueLines || [])
    .map((line) => formatRobofestVenueDisplay(line))
    .filter(Boolean)
  const combinedVenue =
    schoolNames.length > 0 ? schoolNames.join(' · ') : content.venueLabel
  return {
    ...content,
    rounds,
    venueLabel: combinedVenue,
    venueDetail: combinedVenue,
  }
}

export function validateRobofestVenueConsistency(
  content: RobofestVenueContent,
): { ok: true } | { ok: false; error: string } {
  for (const round of content.rounds || []) {
    const city = round.city.trim()
    if (!city) continue
    if (!findVenueLineForCity(content, city)) {
      return {
        ok: false,
        error: `Venue lines must include an entry for the ${city} division (e.g. "${city} - Venue name").`,
      }
    }
  }
  return { ok: true }
}

/** Division venue for PDF/email/verify. Prefers public venue lines over round labels. */
export function resolveRobofestRoundVenueLabel(
  content: RobofestVenueContent,
  city: string,
): string {
  const line = findVenueLineForCity(content, city)
  if (line) return formatRobofestVenueDisplay(line)

  const round = getRobofestRoundForCity(content, city)
  const fromRound = round?.venueLabel?.trim() || ''
  if (fromRound && !namesMultipleRoundCities(fromRound)) return fromRound

  return 'TBA'
}
