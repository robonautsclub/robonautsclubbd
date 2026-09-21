'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { requireAuth, canCreateArea, canEditResource, canDeleteResource } from '@/lib/auth'
import {
  collectionAdd,
  collectionDelete,
  collectionGet,
  collectionGetAll,
  collectionSet,
  collectionWhere,
} from '@/lib/db/collections'
import type { NewsArticle } from '@/types/news'
import { sanitizeNewsBody, sanitizeNewsTitle, slugifyForUrl } from '@/lib/multilingualText'
import { parseDateInputToTimestamp, timestampUtcNoonToday } from '@/lib/dateInput'
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

async function fetchNewsArticlesFromDb(): Promise<NewsArticle[]> {
  const docs = await collectionGetAll('news')
  const items = docs.map((doc) => mapNewsDoc(String(doc.id), doc as Record<string, unknown>))
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return items
}

function resolveNewsDisplayDate(ymd: string | undefined, published: boolean) {
  const parsed = parseDateInputToTimestamp(ymd)
  if (parsed) return parsed
  if (published) return timestampUtcNoonToday()
  return null
}

async function ensureUniqueSlug(baseSlug: string, excludeDocId?: string): Promise<string> {
  let slug = baseSlug
  let n = 0
  for (;;) {
    const matches = await collectionWhere('news', 'slug', '==', slug, { limit: 5 })
    const conflict = matches.find((d) => d.id !== excludeDocId)
    if (!conflict) return slug
    n += 1
    slug = `${baseSlug}-${n}`
  }
}

export async function getNewsArticles(): Promise<NewsArticle[]> {
  await requireAuth()
  try {
    return await fetchNewsArticlesFromDb()
  } catch {
    throw new Error('Failed to fetch news articles')
  }
}

export async function getNewsArticleForDashboard(id: string): Promise<NewsArticle | null> {
  await requireAuth()
  const doc = await collectionGet('news', id)
  if (!doc) return null
  return mapNewsDoc(String(doc.id), doc as Record<string, unknown>)
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
  if (!canCreateArea(session, 'news')) {
    throw new Error('You do not have permission to create news articles.')
  }

  const title = sanitizeNewsTitle(input.title)
  const body = sanitizeNewsBody(input.body)
  if (!title) throw new Error('Title is required.')
  if (!body) throw new Error('Body is required.')

  const baseSlug = slugifyForUrl((input.slug?.trim() || title).trim())
  const slug = await ensureUniqueSlug(baseSlug)

  const now = new Date().toISOString()
  const published = Boolean(input.published)
  const images = Array.isArray(input.images)
    ? input.images.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim())
    : []
  const displayDate = resolveNewsDisplayDate(input.displayDate, published)

  await collectionAdd('news', {
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
  })
  revalidatePath('/news')
  revalidatePath('/')
  revalidateTag(PUBLIC_NEWS_TAG, 'max')
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
  },
) {
  const session = await requireAuth()

  const existing = await collectionGet('news', id)
  if (!existing) throw new Error('Article not found.')

  const data = existing as Record<string, unknown>
  if (!canEditResource(session, 'news', data.createdBy as string | undefined)) {
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
  const now = new Date().toISOString()

  const update: Record<string, unknown> = {
    title,
    slug,
    body,
    coverImageUrl: input.coverImageUrl?.trim() || '',
    images,
    published,
    displayDate,
    updatedAt: now,
  }

  if (published && !wasPublished) {
    update.publishedAt = now
  } else if (!published) {
    update.publishedAt = null
  }

  await collectionSet('news', id, update, { merge: true })
  revalidatePath('/news')
  revalidatePath(`/news/${data.slug as string}`)
  revalidatePath(`/news/${slug}`)
  revalidatePath('/')
  revalidateTag(PUBLIC_NEWS_TAG, 'max')
}

export async function deleteNewsArticle(id: string) {
  const session = await requireAuth()

  const existing = await collectionGet('news', id)
  if (!existing) throw new Error('Article not found.')

  const data = existing as Record<string, unknown>
  if (!canDeleteResource(session, 'news', data.createdBy as string | undefined)) {
    throw new Error('You do not have permission to delete this article.')
  }

  await collectionDelete('news', id)
  revalidatePath('/news')
  revalidatePath(`/news/${String(data.slug)}`)
  revalidatePath('/')
  revalidateTag(PUBLIC_NEWS_TAG, 'max')
}
