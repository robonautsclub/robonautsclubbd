import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { collectionGet, collectionGetAll } from '@/lib/db/collections'
import type { GalleryGroup, GalleryImage } from '@/types/gallery'
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

function mapGalleryDoc(id: string, data: Record<string, unknown>, lean: boolean): GalleryGroup {
  const sortOrder = typeof data.sortOrder === 'number' && !Number.isNaN(data.sortOrder) ? data.sortOrder : 0
  const displayIso = toIso(data.displayDate)
  const allImages = mapImages(data.images)
  const images = lean ? allImages.slice(0, 4) : allImages
  return {
    id,
    title: typeof data.title === 'string' ? data.title : '',
    location: typeof data.location === 'string' ? data.location : '',
    images,
    imageCount: allImages.length,
    sortOrder,
    displayDate: displayIso || null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
  }
}

async function fetchGalleryGroupsFromDb(): Promise<GalleryGroup[]> {
  const docs = await collectionGetAll('galleryGroups')
  const items = docs.map((doc) => mapGalleryDoc(String(doc.id), doc as Record<string, unknown>, true))
  items.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  return items
}

const getCachedGalleryGroups = unstable_cache(fetchGalleryGroupsFromDb, [PUBLIC_GALLERY_TAG, 'list'], {
  tags: [PUBLIC_GALLERY_TAG],
  revalidate: 3600,
})

export const getPublicGalleryGroupById = cache(async (id: string): Promise<GalleryGroup | null> => {
  const trimmed = id?.trim()
  if (!trimmed) return null
  try {
    const doc = await collectionGet('galleryGroups', trimmed)
    if (!doc) return null
    return mapGalleryDoc(String(doc.id), doc as Record<string, unknown>, false)
  } catch (e) {
    console.error('Error fetching gallery group:', e)
    return null
  }
})

export const getGalleryGroups = cache(async (): Promise<GalleryGroup[]> => {
  try {
    // Skip unstable_cache on the public list so D1 albums appear immediately.
    return await fetchGalleryGroupsFromDb()
  } catch (e) {
    console.error('Error fetching gallery groups:', e)
    try {
      return await getCachedGalleryGroups()
    } catch (cacheError) {
      console.error('Error fetching cached gallery groups:', cacheError)
      return []
    }
  }
})
