'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { requireAuth } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import type { GalleryGroup, GalleryImage } from '@/types/gallery'
import { sanitizeGalleryLocation, sanitizeGalleryTitle } from '@/lib/multilingualText'
import { parseDateInputToTimestamp, timestampUtcNoonToday } from '@/lib/dateInput'

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

function resolveGalleryDisplayDate(ymd: string | undefined) {
  return parseDateInputToTimestamp(ymd) ?? timestampUtcNoonToday()
}

export async function getGalleryGroupsForDashboard(): Promise<GalleryGroup[]> {
  await requireAuth()
  if (!adminDb) throw new Error('Firebase Admin SDK is not configured.')

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
}

export async function getGalleryGroupForDashboard(id: string): Promise<GalleryGroup | null> {
  await requireAuth()
  if (!adminDb) throw new Error('Firebase Admin SDK is not configured.')

  const doc = await adminDb.collection('galleryGroups').doc(id).get()
  if (!doc.exists) return null
  return mapGalleryDoc(doc.id, doc.data() as Record<string, unknown>)
}

export async function createGalleryGroup(input: {
  title: string
  location: string
  sortOrder: number
  images: GalleryImage[]
  displayDate?: string
}) {
  const session = await requireAuth()
  if (!adminDb) throw new Error('Firebase Admin SDK is not configured.')

  const title = sanitizeGalleryTitle(input.title)
  const location = sanitizeGalleryLocation(input.location)
  if (!title) throw new Error('Title is required.')

  const sortOrder = Number.isFinite(input.sortOrder) ? Math.floor(input.sortOrder) : 0
  const images = input.images.filter((i) => i.url?.trim())

  const now = Timestamp.now()
  const displayDate = resolveGalleryDisplayDate(input.displayDate)
  await adminDb.collection('galleryGroups').add({
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
}

export async function updateGalleryGroup(
  id: string,
  input: {
    title: string
    location: string
    sortOrder: number
    images: GalleryImage[]
    displayDate?: string
  }
) {
  const session = await requireAuth()
  if (!adminDb) throw new Error('Firebase Admin SDK is not configured.')

  const ref = adminDb.collection('galleryGroups').doc(id)
  const existing = await ref.get()
  if (!existing.exists) throw new Error('Group not found.')

  const data = existing.data() as Record<string, unknown>
  const isOwner = data.createdBy === session.uid
  if (!isOwner && session.role !== 'superAdmin') {
    throw new Error('You do not have permission to edit this group.')
  }

  const title = sanitizeGalleryTitle(input.title)
  const location = sanitizeGalleryLocation(input.location)
  if (!title) throw new Error('Title is required.')

  const sortOrder = Number.isFinite(input.sortOrder) ? Math.floor(input.sortOrder) : 0
  const images = input.images.filter((i) => i.url?.trim())

  const displayDate = resolveGalleryDisplayDate(input.displayDate)

  await ref.update({
    title,
    location,
    sortOrder,
    images,
    displayDate,
    updatedAt: FieldValue.serverTimestamp(),
  })

  revalidatePath('/gallery')
  revalidatePath('/')
}

export async function deleteGalleryGroup(id: string) {
  const session = await requireAuth()
  if (!adminDb) throw new Error('Firebase Admin SDK is not configured.')

  const ref = adminDb.collection('galleryGroups').doc(id)
  const existing = await ref.get()
  if (!existing.exists) throw new Error('Group not found.')

  const data = existing.data() as Record<string, unknown>
  const isOwner = data.createdBy === session.uid
  if (!isOwner && session.role !== 'superAdmin') {
    throw new Error('You do not have permission to delete this group.')
  }

  await ref.delete()
  revalidatePath('/gallery')
  revalidatePath('/')
}
