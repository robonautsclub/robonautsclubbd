import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import type { GalleryGroup, GalleryImage } from '@/types/gallery'
import { PUBLIC_GALLERY_TAG } from '@/lib/public-cache-tags'

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
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
    title: typeof data.title === 'string' ? data.title : '',
    location: typeof data.location === 'string' ? data.location : '',
    images: mapImages(data.images),
    sortOrder,
    displayDate: displayIso || null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
  }
}

async function fetchGalleryGroupsFromDb(): Promise<GalleryGroup[]> {
  const db = adminDb!
  const snap = await db.collection('galleryGroups').get()
  const items: GalleryGroup[] = []
  snap.forEach((doc) => {
    items.push(mapGalleryDoc(doc.id, doc.data() as Record<string, unknown>))
  })
  items.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  return items
}

const getCachedGalleryGroups = unstable_cache(
  fetchGalleryGroupsFromDb,
  [PUBLIC_GALLERY_TAG],
  { tags: [PUBLIC_GALLERY_TAG], revalidate: 3600 },
)

export const getPublicGalleryGroupById = cache(async (id: string): Promise<GalleryGroup | null> => {
  const trimmed = id?.trim()
  if (!adminDb || !trimmed) return null
  try {
    return await unstable_cache(
      async () => {
        const doc = await adminDb!.collection('galleryGroups').doc(trimmed).get()
        if (!doc.exists) return null
        return mapGalleryDoc(doc.id, doc.data() as Record<string, unknown>)
      },
      [PUBLIC_GALLERY_TAG, 'by-id', trimmed],
      { tags: [PUBLIC_GALLERY_TAG], revalidate: 3600 },
    )()
  } catch (e) {
    console.error('Error fetching gallery group:', e)
    return null
  }
})

export const getGalleryGroups = cache(async (): Promise<GalleryGroup[]> => {
  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch gallery.')
    return []
  }

  try {
    return await getCachedGalleryGroups()
  } catch (e) {
    console.error('Error fetching gallery groups:', e)
    return []
  }
})
