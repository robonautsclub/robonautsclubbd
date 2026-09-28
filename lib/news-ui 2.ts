import type { NewsArticle } from '@/types/news'

function toValidDate(iso: string | Date | null | undefined): Date | null {
  if (iso == null) return null
  try {
    const d = iso instanceof Date ? iso : new Date(iso)
    return Number.isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

/** ISO string for `<time dateTime>` when the raw value is valid. */
export function newsDateTimeAttr(iso: string | Date | null | undefined): string | undefined {
  const d = toValidDate(iso)
  return d ? d.toISOString() : undefined
}

/** Understated public date: `18 Aug 2026` */
export function formatNewsDate(iso: string | Date | null | undefined): string {
  const d = toValidDate(iso)
  if (!d) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** Plain-text excerpt for cards; collapses whitespace. */
export function excerptBody(body: string, maxLen = 160): string {
  const cleaned = body.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  if (cleaned.length <= maxLen) return cleaned
  const cut = cleaned.slice(0, maxLen)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

/** Cover + gallery URLs, deduped, empty strings removed. */
export function collectArticleImageUrls(article: {
  coverImageUrl?: string
  images?: string[]
}): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const push = (raw: string | undefined) => {
    if (typeof raw !== 'string') return
    const u = raw.trim()
    if (!u || seen.has(u)) return
    seen.add(u)
    out.push(u)
  }
  push(article.coverImageUrl)
  for (const u of article.images ?? []) push(u)
  return out
}

export function newsArticleHref(article: Pick<NewsArticle, 'slug'>): string {
  return `/news/${article.slug}`
}
