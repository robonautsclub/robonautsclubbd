const MAX_NEWS_TITLE = 300
const MAX_NEWS_BODY = 100_000
const MAX_GALLERY_TITLE = 200
const MAX_GALLERY_LOCATION = 500

/**
 * Trim, cap length, collapse excessive newlines — Unicode-safe (no ASCII stripping).
 */
export function sanitizeNewsTitle(input: string): string {
  let s = input.trim().replace(/\n{3,}/g, '\n\n')
  if (s.length > MAX_NEWS_TITLE) s = s.slice(0, MAX_NEWS_TITLE)
  return s
}

export function sanitizeNewsBody(input: string): string {
  let s = input.trim().replace(/\n{4,}/g, '\n\n\n')
  if (s.length > MAX_NEWS_BODY) s = s.slice(0, MAX_NEWS_BODY)
  return s
}

export function sanitizeGalleryTitle(input: string): string {
  let s = input.trim().replace(/\s+/g, ' ')
  if (s.length > MAX_GALLERY_TITLE) s = s.slice(0, MAX_GALLERY_TITLE)
  return s
}

export function sanitizeGalleryLocation(input: string): string {
  let s = input.trim().replace(/\n{3,}/g, '\n\n')
  if (s.length > MAX_GALLERY_LOCATION) s = s.slice(0, MAX_GALLERY_LOCATION)
  return s
}

/** URL-safe slug; allows unicode letters/numbers, collapses separators. */
export function slugifyForUrl(title: string): string {
  const t = title.trim().toLowerCase()
  const slug = t
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
  return slug || 'article'
}
