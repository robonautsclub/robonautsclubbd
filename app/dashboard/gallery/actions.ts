'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { requireAuth, canCreateArea, canEditResource, canDeleteResource } from '@/lib/auth'
import {
  collectionAdd,
  collectionDelete,
  collectionGet,
  collectionGetAll,
  collectionSet,
} from '@/lib/db/collections'
import type { GalleryGroup, GalleryImage } from '@/types/gallery'
import { sanitizeGalleryLocation, sanitizeGalleryTitle } from '@/lib/multilingualText'
import { parseDateInputToTimestamp, timestampUtcNoonToday } from '@/lib/dateInput'
import { PUBLIC_GALLERY_TAG } from '@/lib/public-cache-tags'

function toIso(v: unknown): string {
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
  return ''
}

function mapImages(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === 'string' && item.trim()) return { url: item.trim() }
      if (item && typeof item === 'object' && 'url' in item && typeof (item as { url: unknown }).url === 'string') {
        const u = (item as { url: string }).url.trim()
        return u ? { url: u } : null
      }
      return null
    })
    .filter((x): x is GalleryImage => x !== null)
}

function mapGalleryDoc(id: string, data: Record<string, unknown>): GalleryGroup {
  const sortOrder = typeof data.sortOrder === 'number' && !Number.isNaN(data.sortOrder) ? data.sortOrder : 0
  const displayIso = toIso(data.displayDate)
  return {
    id,
    title: String(data.title ?? ''),
    location: String(data.location ?? ''),
    images: mapImages(data.images),
    sortOrder,
    displayDate: displayIso || null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    createdBy: String(data.createdBy ?? ''),
  }
}

async function fetchDashboardGalleryGroupsFromDb(): Promise<GalleryGroup[]> {
  const docs = await collectionGetAll('galleryGroups')
  const items = docs.map((doc) => mapGalleryDoc(String(doc.id), doc as Record<string, unknown>))
  items.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  return items
}

function resolveGalleryDisplayDate(ymd: string | undefined) {
  return parseDateInputToTimestamp(ymd) ?? timestampUtcNoonToday()
}

export async function getGalleryGroupsForDashboard(): Promise<GalleryGroup[]> {
  await requireAuth()
  return fetchDashboardGalleryGroupsFromDb()
}

export async function getGalleryGroupForDashboard(id: string): Promise<GalleryGroup | null> {
  await requireAuth()
  const doc = await collectionGet('galleryGroups', id)
  if (!doc) return null
  return mapGalleryDoc(String(doc.id), doc as Record<string, unknown>)
}

export async function createGalleryGroup(input: {
  title: string
  location: string
  sortOrder: number
  images: GalleryImage[]
  displayDate?: string
}) {
  const session = await requireAuth()
  if (!canCreateArea(session, 'gallery')) {
    throw new Error('You do not have permission to create gallery groups.')
  }

  const title = sanitizeGalleryTitle(input.title)
  const location = sanitizeGalleryLocation(input.location)
  if (!title) throw new Error('Title is required.')

  const sortOrder = Number.isFinite(input.sortOrder) ? Math.floor(input.sortOrder) : 0
  const images = input.images.filter((i) => i.url?.trim())
  const now = new Date().toISOString()
  const displayDate = resolveGalleryDisplayDate(input.displayDate)

  await collectionAdd('galleryGroups', {
    title,
    location,
    sortOrder,
    images,
    displayDate,
    createdAt: now,
    updatedAt: now,
    createdBy: session.uid,
  })

  revalidatePath('/gallery')
  revalidatePath('/')
  revalidateTag(PUBLIC_GALLERY_TAG, 'max')
}

export async function updateGalleryGroup(
  id: string,
  input: {
    title: string
    location: string
    sortOrder: number
    images: GalleryImage[]
    displayDate?: string
  },
) {
  const session = await requireAuth()

  const existing = await collectionGet('galleryGroups', id)
  if (!existing) throw new Error('Group not found.')

  const data = existing as Record<string, unknown>
  if (!canEditResource(session, 'gallery', data.createdBy as string | undefined)) {
    throw new Error('You do not have permission to edit this group.')
  }

  const title = sanitizeGalleryTitle(input.title)
  const location = sanitizeGalleryLocation(input.location)
  if (!title) throw new Error('Title is required.')

  const sortOrder = Number.isFinite(input.sortOrder) ? Math.floor(input.sortOrder) : 0
  const images = input.images.filter((i) => i.url?.trim())
  const displayDate = resolveGalleryDisplayDate(input.displayDate)

  await collectionSet(
    'galleryGroups',
    id,
    {
      title,
      location,
      sortOrder,
      images,
      displayDate,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  )

  revalidatePath('/gallery')
  revalidatePath('/')
  revalidateTag(PUBLIC_GALLERY_TAG, 'max')
}

export async function deleteGalleryGroup(id: string) {
  const session = await requireAuth()

  const existing = await collectionGet('galleryGroups', id)
  if (!existing) throw new Error('Group not found.')

  const data = existing as Record<string, unknown>
  if (!canDeleteResource(session, 'gallery', data.createdBy as string | undefined)) {
    throw new Error('You do not have permission to delete this group.')
  }

  await collectionDelete('galleryGroups', id)
  revalidatePath('/gallery')
  revalidatePath('/')
  revalidateTag(PUBLIC_GALLERY_TAG, 'max')
}
