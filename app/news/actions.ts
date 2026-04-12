'use server'

import { cache } from 'react'
import { adminDb } from '@/lib/firebase-admin'
import type { NewsArticle } from '@/types/news'

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

export const getPublishedNews = cache(async (): Promise<NewsArticle[]> => {
  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch news.')
    return []
  }

  try {
    const snap = await adminDb.collection('news').get()
    const items: NewsArticle[] = []
    snap.forEach((doc) => {
      const data = doc.data()
      if (!data.published) return
      items.push(mapNewsDoc(doc.id, data))
    })

    items.sort((a, b) => {
      const da = newsSortTime(a)
      const db = newsSortTime(b)
      if (db !== da) return db - da
      const pa = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const pb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      if (pb !== pa) return pb - pa
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return items
  } catch (e) {
    console.error('Error fetching published news:', e)
    return []
  }
})

export const getNewsArticleBySlug = cache(async (slug: string): Promise<NewsArticle | null> => {
  if (!adminDb || !slug.trim()) {
    return null
  }

  try {
    const snap = await adminDb.collection('news').where('slug', '==', slug.trim()).limit(1).get()
    if (snap.empty) return null
    const doc = snap.docs[0]
    const data = doc.data()
    if (!data.published) return null
    return mapNewsDoc(doc.id, data)
  } catch (e) {
    console.error('Error fetching news by slug:', e)
    return null
  }
})
