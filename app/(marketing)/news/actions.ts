import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { collectionGet, collectionWhere, collectionGetAll } from '@/lib/db/collections'
import type { NewsArticle } from '@/types/news'
import { PUBLIC_NEWS_TAG } from '@/lib/public-cache-tags'

function toIso(v: unknown): string | null {
  if (v == null) return null
  if (v instanceof Date) return v.toISOString()
  if (
    typeof v === 'object' &&
    v !== null &&
    'toDate' in v &&
    typeof (v as { toDate: () => Date }).toDate === 'function'
  ) {
    return (v as { toDate: () => Date }).toDate().toISOString()
  }
  if (typeof v === 'string') return v
  return null
}

function mapNewsDoc(id: string, data: Record<string, unknown>, lean: boolean): NewsArticle {
  return {
    id,
    title: typeof data.title === 'string' ? data.title : '',
    slug: typeof data.slug === 'string' ? data.slug : '',
    body: lean ? '' : typeof data.body === 'string' ? data.body : '',
    coverImageUrl:
      typeof data.coverImageUrl === 'string' && data.coverImageUrl ? data.coverImageUrl : undefined,
    images: lean
      ? undefined
      : Array.isArray(data.images)
        ? data.images.filter((u: unknown) => typeof u === 'string')
        : undefined,
    published: Boolean(data.published),
    displayDate: toIso(data.displayDate),
    publishedAt: toIso(data.publishedAt),
    createdAt: toIso(data.createdAt) ?? '',
    updatedAt: toIso(data.updatedAt) ?? '',
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
  }
}

function newsSortTime(a: NewsArticle): number {
  const raw = a.displayDate ?? a.publishedAt ?? a.createdAt
  if (!raw) return 0
  const t = new Date(raw).getTime()
  return Number.isNaN(t) ? 0 : t
}

async function fetchPublishedNewsFromDb(): Promise<NewsArticle[]> {
  const docs = await collectionWhere('news', 'published', '==', true)
  const items = docs.map((doc) => mapNewsDoc(String(doc.id), doc as Record<string, unknown>, true))

  items.sort((a, b) => {
    const da = newsSortTime(a)
    const dbSort = newsSortTime(b)
    if (dbSort !== da) return dbSort - da
    const pa = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const pb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    if (pb !== pa) return pb - pa
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return items
}

const getCachedPublishedNews = unstable_cache(fetchPublishedNewsFromDb, [PUBLIC_NEWS_TAG], {
  tags: [PUBLIC_NEWS_TAG],
  revalidate: 3600,
})

export const getPublishedNews = cache(async (): Promise<NewsArticle[]> => {
  try {
    return await getCachedPublishedNews()
  } catch (e) {
    console.error('Error fetching published news:', e)
    return []
  }
})

export const getNewsArticleBySlug = cache(async (slug: string | null | undefined): Promise<NewsArticle | null> => {
  const normalizedSlug = typeof slug === 'string' ? slug.trim() : ''
  if (!normalizedSlug) return null

  try {
    return await unstable_cache(
      async () => {
        const matches = await collectionWhere('news', 'slug', '==', normalizedSlug, { limit: 1 })
        if (matches.length === 0) return null
        const doc = matches[0]
        if (!doc.published) return null
        return mapNewsDoc(String(doc.id), doc as Record<string, unknown>, false)
      },
      [PUBLIC_NEWS_TAG, 'by-slug', normalizedSlug],
      { tags: [PUBLIC_NEWS_TAG], revalidate: 3600 },
    )()
  } catch (e) {
    console.error('Error fetching news by slug:', e)
    return null
  }
})
