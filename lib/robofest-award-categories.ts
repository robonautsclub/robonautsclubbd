/**
 * Robofest certificate award categories (built-in + custom catalog helpers).
 */

export const ROBOFEST_AWARD_ACCENTS = [
  'cyan',
  'gold',
  'silver',
  'bronze',
  'slate',
] as const

export type RobofestAwardAccent = (typeof ROBOFEST_AWARD_ACCENTS)[number]

export const ROBOFEST_CERTIFICATE_TYPES = [
  'participation',
  'achievement',
  'excellence',
  'appreciation',
  'merit',
  'special',
] as const

export type RobofestCertificateType =
  (typeof ROBOFEST_CERTIFICATE_TYPES)[number]

export type RobofestAwardCategory = {
  id: string
  label: string
  certificateTitle: string
  certificateBody: string
  certificateType?: RobofestCertificateType
  accent?: RobofestAwardAccent
  isBuiltIn?: boolean
  isActive?: boolean
}

export const ROBOFEST_DEFAULT_AWARD_CATEGORY_ID = 'participant'

export const ROBOFEST_BUILTIN_AWARD_CATEGORIES: RobofestAwardCategory[] = [
  {
    id: 'participant',
    label: 'Participant',
    certificateTitle: 'CERTIFICATE OF PARTICIPATION',
    certificateBody:
      'has participated in Robofest Bangladesh as a registered competitor',
    certificateType: 'participation',
    accent: 'cyan',
    isBuiltIn: true,
    isActive: true,
  },
  {
    id: 'first',
    label: '1st Place',
    certificateTitle: 'CERTIFICATE OF ACHIEVEMENT',
    certificateBody: 'for achieving 1st Place in',
    certificateType: 'achievement',
    accent: 'gold',
    isBuiltIn: true,
    isActive: true,
  },
  {
    id: 'second',
    label: '2nd Place',
    certificateTitle: 'CERTIFICATE OF ACHIEVEMENT',
    certificateBody: 'for achieving 2nd Place in',
    certificateType: 'achievement',
    accent: 'silver',
    isBuiltIn: true,
    isActive: true,
  },
  {
    id: 'third',
    label: '3rd Place',
    certificateTitle: 'CERTIFICATE OF ACHIEVEMENT',
    certificateBody: 'for achieving 3rd Place in',
    certificateType: 'achievement',
    accent: 'bronze',
    isBuiltIn: true,
    isActive: true,
  },
  {
    id: 'excellence',
    label: 'Excellence',
    certificateTitle: 'CERTIFICATE OF EXCELLENCE',
    certificateBody: 'for outstanding excellence in',
    certificateType: 'excellence',
    accent: 'gold',
    isBuiltIn: true,
    isActive: false,
  },
  {
    id: 'appreciation',
    label: 'Appreciation',
    certificateTitle: 'CERTIFICATE OF APPRECIATION',
    certificateBody: 'in appreciation of contributions to',
    certificateType: 'appreciation',
    accent: 'slate',
    isBuiltIn: true,
    isActive: false,
  },
  {
    id: 'merit',
    label: 'Merit',
    certificateTitle: 'CERTIFICATE OF MERIT',
    certificateBody: 'for meritorious performance in',
    certificateType: 'merit',
    accent: 'cyan',
    isBuiltIn: true,
    isActive: false,
  },
  {
    id: 'special',
    label: 'Special Recognition',
    certificateTitle: 'CERTIFICATE OF SPECIAL RECOGNITION',
    certificateBody: 'for special recognition in',
    certificateType: 'special',
    accent: 'slate',
    isBuiltIn: true,
    isActive: false,
  },
]

const BUILTIN_IDS = new Set(
  ROBOFEST_BUILTIN_AWARD_CATEGORIES.map((c) => c.id),
)

const DEFAULT_CERTIFICATE_TYPE: Record<string, RobofestCertificateType> = {
  participant: 'participation',
  first: 'achievement',
  second: 'achievement',
  third: 'achievement',
  excellence: 'excellence',
  appreciation: 'appreciation',
  merit: 'merit',
  special: 'special',
}

export function isRobofestAwardAccent(
  value: unknown,
): value is RobofestAwardAccent {
  return (
    typeof value === 'string' &&
    (ROBOFEST_AWARD_ACCENTS as readonly string[]).includes(value)
  )
}

export function isRobofestCertificateType(
  value: unknown,
): value is RobofestCertificateType {
  return (
    typeof value === 'string' &&
    (ROBOFEST_CERTIFICATE_TYPES as readonly string[]).includes(value)
  )
}

export function normalizeRobofestAwardCategoryId(id: string): string {
  return id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function resolveCertificateType(
  id: string,
  raw: unknown,
  fallback?: RobofestCertificateType,
): RobofestCertificateType {
  if (isRobofestCertificateType(raw)) return raw
  if (fallback) return fallback
  return DEFAULT_CERTIFICATE_TYPE[id] || 'achievement'
}

export function mapRobofestAwardCategory(
  raw: Record<string, unknown>,
  fallback?: RobofestAwardCategory,
): RobofestAwardCategory | null {
  const id = normalizeRobofestAwardCategoryId(
    typeof raw.id === 'string' ? raw.id : fallback?.id || '',
  )
  if (!id) return null

  const label =
    (typeof raw.label === 'string' ? raw.label.trim() : '') ||
    fallback?.label ||
    id
  const certificateTitle =
    (typeof raw.certificateTitle === 'string'
      ? raw.certificateTitle.trim()
      : '') ||
    fallback?.certificateTitle ||
    label.toUpperCase()
  const certificateBody =
    (typeof raw.certificateBody === 'string'
      ? raw.certificateBody.trim()
      : '') ||
    fallback?.certificateBody ||
    'has been recognized in'

  const accent = isRobofestAwardAccent(raw.accent)
    ? raw.accent
    : fallback?.accent || (BUILTIN_IDS.has(id) ? undefined : 'slate')

  const isBuiltIn =
    typeof raw.isBuiltIn === 'boolean'
      ? raw.isBuiltIn
      : BUILTIN_IDS.has(id) || Boolean(fallback?.isBuiltIn)

  const isActive =
    typeof raw.isActive === 'boolean'
      ? raw.isActive
      : fallback?.isActive !== false

  const certificateType = resolveCertificateType(
    id,
    raw.certificateType,
    fallback?.certificateType,
  )

  return {
    id,
    label,
    certificateTitle,
    certificateBody,
    certificateType,
    accent: accent || (isBuiltIn
      ? ROBOFEST_BUILTIN_AWARD_CATEGORIES.find((c) => c.id === id)?.accent ||
        'cyan'
      : 'slate'),
    isBuiltIn,
    isActive,
  }
}

/** Merge Firestore list with built-ins so defaults always exist. */
export function mergeRobofestAwardCategories(
  rawList: unknown,
): RobofestAwardCategory[] {
  const mapped: RobofestAwardCategory[] = []
  const seen = new Set<string>()

  if (Array.isArray(rawList)) {
    for (const item of rawList) {
      if (!item || typeof item !== 'object') continue
      const cat = mapRobofestAwardCategory(item as Record<string, unknown>)
      if (!cat || seen.has(cat.id)) continue
      seen.add(cat.id)
      mapped.push(cat)
    }
  }

  const result: RobofestAwardCategory[] = []
  for (const builtin of ROBOFEST_BUILTIN_AWARD_CATEGORIES) {
    const existing = mapped.find((c) => c.id === builtin.id)
    if (existing) {
      result.push({
        ...builtin,
        ...existing,
        id: builtin.id,
        isBuiltIn: true,
        certificateType:
          existing.certificateType || builtin.certificateType || 'achievement',
        // Preserve explicit inactive seed for newly added built-ins if missing from Firestore
        isActive:
          typeof existing.isActive === 'boolean'
            ? existing.isActive
            : builtin.isActive !== false,
      })
    } else {
      result.push({ ...builtin })
    }
  }

  for (const cat of mapped) {
    if (BUILTIN_IDS.has(cat.id)) continue
    result.push({ ...cat, isBuiltIn: false })
  }

  return result
}

export function resolveRobofestAwardCategory(
  categories: RobofestAwardCategory[] | undefined,
  awardCategoryId?: string | null,
): RobofestAwardCategory {
  const id =
    normalizeRobofestAwardCategoryId(awardCategoryId || '') ||
    ROBOFEST_DEFAULT_AWARD_CATEGORY_ID
  const list =
    categories && categories.length > 0
      ? categories
      : ROBOFEST_BUILTIN_AWARD_CATEGORIES
  return (
    list.find((c) => c.id === id) ||
    list.find((c) => c.id === ROBOFEST_DEFAULT_AWARD_CATEGORY_ID) ||
    ROBOFEST_BUILTIN_AWARD_CATEGORIES[0]
  )
}

export function getActiveRobofestAwardCategories(
  categories: RobofestAwardCategory[] | undefined,
): RobofestAwardCategory[] {
  const list = mergeRobofestAwardCategories(categories)
  return list.filter((c) => c.isActive !== false)
}

export function nextCustomAwardCategoryId(
  existing: RobofestAwardCategory[],
  label: string,
): string {
  const base =
    normalizeRobofestAwardCategoryId(label) ||
    `custom-${Date.now().toString(36)}`
  let id = base.startsWith('custom-') ? base : `custom-${base}`
  const ids = new Set(existing.map((c) => c.id))
  if (!ids.has(id) && !BUILTIN_IDS.has(id)) return id
  let n = 2
  while (ids.has(`${id}-${n}`) || BUILTIN_IDS.has(`${id}-${n}`)) n += 1
  return `${id}-${n}`
}

export function sanitizeRobofestAwardCategories(
  input: RobofestAwardCategory[] | undefined,
): RobofestAwardCategory[] {
  const merged = mergeRobofestAwardCategories(input)
  return merged.map((cat) => ({
    id: cat.id,
    label: cat.label.trim() || cat.id,
    certificateTitle: cat.certificateTitle.trim() || cat.label.toUpperCase(),
    certificateBody:
      cat.certificateBody.trim() || 'has been recognized in',
    certificateType:
      cat.certificateType ||
      DEFAULT_CERTIFICATE_TYPE[cat.id] ||
      'achievement',
    accent: cat.accent || 'slate',
    isBuiltIn: Boolean(cat.isBuiltIn || BUILTIN_IDS.has(cat.id)),
    isActive: cat.isActive !== false,
  }))
}
