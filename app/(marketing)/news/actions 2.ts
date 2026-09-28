import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import type { NewsArticle } from '@/types/news'
import { PUBLIC_NEWS_TAG } from '@/lib/public-cache-tags'

function toIso(v: unknown): string | null {
  if (v == null) return null
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate().toISOString()
  }
  if (typeof v === 'string') return v
  return null
}

function mapNewsDoc(id: string, data: Record<string, unknown>): NewsArticle {
  return {
    id,
    title: typeof data.title === 'string' ? data.title : '',
    slug: typeof data.slug === 'string' ? data.slug : '',
    body: typeof data.body === 'string' ? data.body : '',
    coverImageUrl: typeof data.coverImageUrl === 'string' && data.coverImageUrl ? data.coverImageUrl : undefined,
    images: Array.isArray(data.images) ? data.images.filter((u: unknown) => typeof u === 'string') : undefined,
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
  const db = adminDb!
  const snap = await db.collection('news').where('published', '==', true).get()
  const items: NewsArticle[] = []
  snap.forEach((doc) => {
    items.push(mapNewsDoc(doc.id, doc.data() as Record<string, unknown>))
  })

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

const getCachedPublishedNews = unstable_cache(
  fetchPublishedNewsFromDb,
  [PUBLIC_NEWS_TAG],
  { tags: [PUBLIC_NEWS_TAG], revalidate: 3600 },
)

export const getPublishedNews = cache(async (): Promise<NewsArticle[]> => {
  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch news.')
    return []
  }

  try {
    return await getCachedPublishedNews()
  } catch (e) {
    console.error('Error fetching published news:', e)
    return []
  }
})

export const getNewsArticleBySlug = cache(async (slug: string | null | undefined): Promise<NewsArticle | null> => {
  const normalizedSlug = typeof slug === 'string' ? slug.trim() : ''
  if (!adminDb || !normalizedSlug) {
    return null
  }

  try {
    return await unstable_cache(
      async () => {
        const snap = await adminDb!
          .collection('news')
          .where('slug', '==', normalizedSlug)
          .limit(1)
          .get()
        if (snap.empty) return null
        const doc = snap.docs[0]
        const data = doc.data()
        if (!data.published) return null
        return mapNewsDoc(doc.id, data)
      },
      [PUBLIC_NEWS_TAG, 'by-slug', normalizedSlug],
      { tags: [PUBLIC_NEWS_TAG], revalidate: 3600 },
    )()
  } catch (e) {
    console.error('Error fetching news by slug:', e)
    return null
  }
})
