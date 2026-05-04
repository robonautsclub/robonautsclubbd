'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import {
  BANGLADESH_ENGLISH_MEDIUM_SCHOOLS,
  SCHOOL_DIRECTORY_COLLECTION,
  type SchoolDirectoryEntry,
  type SchoolDirectoryWriteInput,
} from '@/lib/schoolDirectory'

const PUBLIC_SCHOOLS_TAG = 'public-schools'

function normalizeSchoolName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export async function getSchoolDirectory(includeInactive = true): Promise<SchoolDirectoryEntry[]> {
  await requireAuth()
  if (!adminDb) return []

  const snapshot = await adminDb.collection(SCHOOL_DIRECTORY_COLLECTION).get()
  const schools: SchoolDirectoryEntry[] = []
  snapshot.docs.forEach((doc) => {
    const data = doc.data()
    const name = typeof data.name === 'string' ? normalizeSchoolName(data.name) : ''
    if (!name) return
    const city = typeof data.city === 'string' ? data.city.trim() : ''
    const isActive = typeof data.isActive === 'boolean' ? data.isActive : true
    if (!includeInactive && !isActive) return
    schools.push({
      id: doc.id,
      name,
      city: city || undefined,
      isActive,
      medium: 'english',
      country: 'bangladesh',
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    })
  })
  return schools.sort((a, b) => a.name.localeCompare(b.name))
}

export async function createSchoolDirectoryEntry(input: SchoolDirectoryWriteInput): Promise<{ success: boolean; error?: string }> {
  await requireAuth()
  if (!adminDb) return { success: false, error: 'Service unavailable.' }

  const name = normalizeSchoolName(input.name || '')
  if (!name) return { success: false, error: 'School name is required.' }

  const existing = await adminDb
    .collection(SCHOOL_DIRECTORY_COLLECTION)
    .where('nameLower', '==', name.toLowerCase())
    .limit(1)
    .get()

  if (!existing.empty) {
    return { success: false, error: 'School already exists in the directory.' }
  }

  const now = new Date()
  await adminDb.collection(SCHOOL_DIRECTORY_COLLECTION).add({
    name,
    nameLower: name.toLowerCase(),
    city: (input.city || '').trim(),
    country: 'bangladesh',
    medium: 'english',
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath('/dashboard/schools')
  revalidatePath('/events')
  revalidateTag(PUBLIC_SCHOOLS_TAG, 'max')
  return { success: true }
}

export async function updateSchoolDirectoryEntry(
  id: string,
  input: SchoolDirectoryWriteInput
): Promise<{ success: boolean; error?: string }> {
  await requireAuth()
  if (!adminDb) return { success: false, error: 'Service unavailable.' }
  if (!id) return { success: false, error: 'School id is required.' }

  const name = normalizeSchoolName(input.name || '')
  if (!name) return { success: false, error: 'School name is required.' }

  const snapshot = await adminDb
    .collection(SCHOOL_DIRECTORY_COLLECTION)
    .where('nameLower', '==', name.toLowerCase())
    .get()
  const conflict = snapshot.docs.some((doc) => doc.id !== id)
  if (conflict) {
    return { success: false, error: 'Another school with this name already exists.' }
  }

  await adminDb.collection(SCHOOL_DIRECTORY_COLLECTION).doc(id).update({
    name,
    nameLower: name.toLowerCase(),
    city: (input.city || '').trim(),
    isActive: input.isActive ?? true,
    updatedAt: new Date(),
  })
  revalidatePath('/dashboard/schools')
  revalidatePath('/events')
  revalidateTag(PUBLIC_SCHOOLS_TAG, 'max')
  return { success: true }
}

export async function seedEnglishMediumSchools(): Promise<{ success: boolean; message: string }> {
  await requireAuth()
  if (!adminDb) return { success: false, message: 'Service unavailable.' }

  const existingSnapshot = await adminDb.collection(SCHOOL_DIRECTORY_COLLECTION).get()
  const existingNames = new Set(
    existingSnapshot.docs
      .map((doc) => {
        const data = doc.data()
        if (typeof data.nameLower === 'string') return data.nameLower
        if (typeof data.name === 'string') return normalizeSchoolName(data.name).toLowerCase()
        return null
      })
      .filter((name): name is string => typeof name === 'string')
  )

  let created = 0
  const batch = adminDb.batch()
  const now = new Date()
  for (const school of BANGLADESH_ENGLISH_MEDIUM_SCHOOLS) {
    const normalized = normalizeSchoolName(school.name)
    const lower = normalized.toLowerCase()
    if (!normalized || existingNames.has(lower)) continue
    const ref = adminDb.collection(SCHOOL_DIRECTORY_COLLECTION).doc()
    batch.set(ref, {
      name: normalized,
      nameLower: lower,
      city: school.city,
      country: 'bangladesh',
      medium: 'english',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    existingNames.add(lower)
    created += 1
  }

  if (created > 0) {
    await batch.commit()
  }
  revalidatePath('/dashboard/schools')
  revalidatePath('/events')
  revalidateTag(PUBLIC_SCHOOLS_TAG, 'max')
  return { success: true, message: created > 0 ? `Added ${created} schools.` : 'Directory already up to date.' }
}
