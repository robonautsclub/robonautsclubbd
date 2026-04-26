'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { requireAuth } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import type { NewsArticle } from '@/types/news'
import {
  sanitizeNewsBody,
  sanitizeNewsTitle,
  slugifyForUrl,
} from '@/lib/multilingualText'
import { parseDateInputToTimestamp, timestampUtcNoonToday } from '@/lib/dateInput'

const DASHBOARD_NEWS_LIST_TAG = 'dashboard-news-list'

const getCachedNewsArticles = unstable_cache(
  async (): Promise<NewsArticle[]> => {
    if (!adminDb) throw new Error('Firebase Admin SDK is not configured.')

    const snap = await adminDb.collection('news').get()
    const items: NewsArticle[] = []
    snap.forEach((doc) => {
      items.push(mapNewsDoc(doc.id, doc.data() as Record<string, unknown>))
    })
    items.sort((a, b) => {
      const ca = new Date(a.createdAt).getTime()
      const cb = new Date(b.createdAt).getTime()
      return cb - ca
    })
    return items
  },
  [DASHBOARD_NEWS_LIST_TAG],
  {
    tags: [DASHBOARD_NEWS_LIST_TAG],
  }
)

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
    title: String(data.title ?? ''),
    slug: String(data.slug ?? ''),
    body: String(data.body ?? ''),
    coverImageUrl: data.coverImageUrl ? String(data.coverImageUrl) : undefined,
    images: Array.isArray(data.images) ? data.images.filter((u): u is string => typeof u === 'string') : undefined,
    published: Boolean(data.published),
    displayDate: toIso(data.displayDate),
    publishedAt: toIso(data.publishedAt),
    createdAt: toIso(data.createdAt) ?? '',
    updatedAt: toIso(data.updatedAt) ?? '',
    createdBy: String(data.createdBy ?? ''),
  }
}

function resolveNewsDisplayDate(ymd: string | undefined, published: boolean) {
  const parsed = parseDateInputToTimestamp(ymd)
  if (parsed) return parsed
  if (published) return timestampUtcNoonToday()
  return null
}

async function ensureUniqueSlug(baseSlug: string, excludeDocId?: string): Promise<string> {
  if (!adminDb) throw new Error('Database not configured')
  let slug = baseSlug
  let n = 0
  for (;;) {
    const snap = await adminDb.collection('news').where('slug', '==', slug).limit(5).get()
    const conflict = snap.docs.find((d) => d.id !== excludeDocId)
    if (!conflict) return slug
    n += 1
    slug = `${baseSlug}-${n}`
  }
}

export async function getNewsArticles(): Promise<NewsArticle[]> {
  await requireAuth()
  try {
    return await getCachedNewsArticles()
  } catch {
    throw new Error('Failed to fetch news articles')
  }
}

export async function getNewsArticleForDashboard(id: string): Promise<NewsArticle | null> {
  await requireAuth()
  if (!adminDb) throw new Error('Firebase Admin SDK is not configured.')

  const doc = await adminDb.collection('news').doc(id).get()
  if (!doc.exists) return null
  return mapNewsDoc(doc.id, doc.data() as Record<string, unknown>)
}

export async function createNewsArticle(input: {
  title: string
  slug?: string
  body: string
  coverImageUrl?: string
  images?: string[]
  published: boolean
  displayDate?: string
}) {
  const session = await requireAuth()
  if (!adminDb) throw new Error('Firebase Admin SDK is not configured.')

  const title = sanitizeNewsTitle(input.title)
  const body = sanitizeNewsBody(input.body)
  if (!title) throw new Error('Title is required.')
  if (!body) throw new Error('Body is required.')

  const baseSlug = slugifyForUrl((input.slug?.trim() || title).trim())
  const slug = await ensureUniqueSlug(baseSlug)

  const now = Timestamp.now()
  const published = Boolean(input.published)
  const images = Array.isArray(input.images)
    ? input.images.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim())
    : []
  const displayDate = resolveNewsDisplayDate(input.displayDate, published)

  const doc = {
    title,
    slug,
    body,
    coverImageUrl: input.coverImageUrl?.trim() || '',
    images,
    published,
    displayDate,
    publishedAt: published ? now : null,
    createdAt: now,
    updatedAt: now,
    createdBy: session.uid,
  }

  await adminDb.collection('news').add(doc)
  revalidatePath('/news')
  revalidatePath('/')
  revalidateTag(DASHBOARD_NEWS_LIST_TAG, 'max')
}

export async function updateNewsArticle(
  id: string,
  input: {
    title: string
    slug?: string
    body: string
    coverImageUrl?: string
    images?: string[]
    published: boolean
    displayDate?: string
  }
) {
  const session = await requireAuth()
  if (!adminDb) throw new Error('Firebase Admin SDK is not configured.')

  const ref = adminDb.collection('news').doc(id)
  const existing = await ref.get()
  if (!existing.exists) throw new Error('Article not found.')

  const data = existing.data() as Record<string, unknown>
  const isOwner = data.createdBy === session.uid
  const role = session.role
  if (!isOwner && role !== 'superAdmin') {
    throw new Error('You do not have permission to edit this article.')
  }

  const title = sanitizeNewsTitle(input.title)
  const body = sanitizeNewsBody(input.body)
  if (!title) throw new Error('Title is required.')
  if (!body) throw new Error('Body is required.')

  const slugInput = (input.slug?.trim() || title).trim()
  const baseSlug = slugifyForUrl(slugInput)
  const slug = await ensureUniqueSlug(baseSlug, id)

  const published = Boolean(input.published)
  const wasPublished = Boolean(data.published)
  const images = Array.isArray(input.images)
    ? input.images.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim())
    : []

  const displayDate = resolveNewsDisplayDate(input.displayDate, published)

  const update: Record<string, unknown> = {
    title,
    slug,
    body,
    coverImageUrl: input.coverImageUrl?.trim() || '',
    images,
    published,
    displayDate,
    updatedAt: FieldValue.serverTimestamp(),
  }

  if (published && !wasPublished) {
    update.publishedAt = Timestamp.now()
  } else if (!published) {
    update.publishedAt = null
  }

  await ref.update(update)
  revalidatePath('/news')
  revalidatePath(`/news/${data.slug as string}`)
  revalidatePath(`/news/${slug}`)
  revalidatePath('/')
  revalidateTag(DASHBOARD_NEWS_LIST_TAG, 'max')
}

export async function deleteNewsArticle(id: string) {
  const session = await requireAuth()
  if (!adminDb) throw new Error('Firebase Admin SDK is not configured.')

  const ref = adminDb.collection('news').doc(id)
  const existing = await ref.get()
  if (!existing.exists) throw new Error('Article not found.')

  const data = existing.data() as Record<string, unknown>
  const isOwner = data.createdBy === session.uid
  if (!isOwner && session.role !== 'superAdmin') {
    throw new Error('You do not have permission to delete this article.')
  }

  await ref.delete()
  revalidatePath('/news')
  revalidatePath(`/news/${String(data.slug)}`)
  revalidatePath('/')
  revalidateTag(DASHBOARD_NEWS_LIST_TAG, 'max')
}
