'use server'

import { cache } from 'react'
import { adminDb } from '@/lib/firebase-admin'
import type { GalleryGroup, GalleryImage } from '@/types/gallery'

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

export const getGalleryGroups = cache(async (): Promise<GalleryGroup[]> => {
  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch gallery.')
    return []
  }

  try {
    const snap = await adminDb.collection('galleryGroups').get()
    const items: GalleryGroup[] = []
    snap.forEach((doc) => {
      items.push(mapGalleryDoc(doc.id, doc.data() as Record<string, unknown>))
    })
    items.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return items
  } catch (e) {
    console.error('Error fetching gallery groups:', e)
    return []
  }
})
