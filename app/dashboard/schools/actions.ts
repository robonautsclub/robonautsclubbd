'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import {
  BANGLADESH_ENGLISH_MEDIUM_SCHOOLS,
  SCHOOL_DIRECTORY_COLLECTION,
  type SchoolDirectoryEntry,
  type SchoolDirectoryStatus,
  type SchoolDirectoryWriteInput,
} from '@/lib/schoolDirectory'
import { getRobofestCampusAmbassadorSchools } from '@/lib/robofest-campus-ambassadors'
import { normalizeSchoolName } from '@/lib/pendingSchool'

const PUBLIC_SCHOOLS_TAG = 'public-schools'

function mapSchoolDoc(
  id: string,
  data: Record<string, unknown>,
): SchoolDirectoryEntry | null {
  const name = typeof data.name === 'string' ? normalizeSchoolName(data.name) : ''
  if (!name) return null
  const city = typeof data.city === 'string' ? data.city.trim() : ''
  const isActive = typeof data.isActive === 'boolean' ? data.isActive : true
  const status: SchoolDirectoryStatus =
    data.status === 'pending' ? 'pending' : 'approved'

  const requestedAt = data.requestedAt as { toDate?: () => Date } | Date | string | undefined
  const createdAt = data.createdAt as { toDate?: () => Date } | Date | string | undefined
  const updatedAt = data.updatedAt as { toDate?: () => Date } | Date | string | undefined

  return {
    id,
    name,
    city: city || undefined,
    isActive,
    status,
    medium: 'english',
    country: 'bangladesh',
    source:
      data.source === 'robofest' || data.source === 'admin' || data.source === 'seed'
        ? data.source
        : undefined,
    requestedByName:
      typeof data.requestedByName === 'string' && data.requestedByName.trim()
        ? data.requestedByName.trim()
        : undefined,
    requestedByEmail:
      typeof data.requestedByEmail === 'string' && data.requestedByEmail.trim()
        ? data.requestedByEmail.trim()
        : undefined,
    requestedAt:
      requestedAt && typeof requestedAt === 'object' && 'toDate' in requestedAt && typeof requestedAt.toDate === 'function'
        ? requestedAt.toDate()
        : (requestedAt as Date | string | undefined),
    createdAt:
      createdAt && typeof createdAt === 'object' && 'toDate' in createdAt && typeof createdAt.toDate === 'function'
        ? createdAt.toDate()
        : (createdAt as Date | string | undefined),
    updatedAt:
      updatedAt && typeof updatedAt === 'object' && 'toDate' in updatedAt && typeof updatedAt.toDate === 'function'
        ? updatedAt.toDate()
        : (updatedAt as Date | string | undefined),
  }
}

export async function getSchoolDirectory(includeInactive = true): Promise<SchoolDirectoryEntry[]> {
  await requireAuth()
  if (!adminDb) return []

  const snapshot = await adminDb.collection(SCHOOL_DIRECTORY_COLLECTION).get()
  const schools: SchoolDirectoryEntry[] = []
  snapshot.docs.forEach((doc) => {
    const mapped = mapSchoolDoc(doc.id, doc.data() as Record<string, unknown>)
    if (!mapped) return
    if (!includeInactive && !mapped.isActive) return
    schools.push(mapped)
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
    status: 'approved',
    source: 'admin',
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath('/dashboard/schools')
  revalidatePath('/events')
  revalidatePath('/robofest')
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
    status: 'approved',
    updatedAt: new Date(),
  })
  revalidatePath('/dashboard/schools')
  revalidatePath('/events')
  revalidatePath('/robofest')
  revalidateTag(PUBLIC_SCHOOLS_TAG, 'max')
  return { success: true }
}

export async function confirmPendingSchool(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAuth()
  if (!adminDb) return { success: false, error: 'Service unavailable.' }
  if (!id) return { success: false, error: 'School id is required.' }

  const ref = adminDb.collection(SCHOOL_DIRECTORY_COLLECTION).doc(id)
  const snap = await ref.get()
  if (!snap.exists) {
    return { success: false, error: 'Pending school not found.' }
  }

  const data = snap.data() || {}
  if (data.status !== 'pending') {
    return { success: false, error: 'This school is not pending confirmation.' }
  }

  const name = typeof data.name === 'string' ? normalizeSchoolName(data.name) : ''
  if (!name) {
    return { success: false, error: 'School name is missing.' }
  }

  // Ensure no other approved school already has this name.
  const existing = await adminDb
    .collection(SCHOOL_DIRECTORY_COLLECTION)
    .where('nameLower', '==', name.toLowerCase())
    .get()
  const conflict = existing.docs.some((doc) => {
    if (doc.id === id) return false
    const status = doc.data().status === 'pending' ? 'pending' : 'approved'
    return status === 'approved'
  })
  if (conflict) {
    return { success: false, error: 'An approved school with this name already exists.' }
  }

  await ref.update({
    status: 'approved',
    isActive: true,
    updatedAt: new Date(),
  })

  revalidatePath('/dashboard/schools')
  revalidatePath('/events')
  revalidatePath('/robofest')
  revalidateTag(PUBLIC_SCHOOLS_TAG, 'max')
  return { success: true }
}

export async function rejectPendingSchool(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAuth()
  if (!adminDb) return { success: false, error: 'Service unavailable.' }
  if (!id) return { success: false, error: 'School id is required.' }

  const ref = adminDb.collection(SCHOOL_DIRECTORY_COLLECTION).doc(id)
  const snap = await ref.get()
  if (!snap.exists) {
    return { success: false, error: 'Pending school not found.' }
  }

  const data = snap.data() || {}
  if (data.status !== 'pending') {
    return { success: false, error: 'This school is not pending confirmation.' }
  }

  await ref.delete()

  revalidatePath('/dashboard/schools')
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

  const seedSchools: Array<{ name: string; city?: string }> = [
    ...BANGLADESH_ENGLISH_MEDIUM_SCHOOLS,
    ...getRobofestCampusAmbassadorSchools().map((name) => ({ name })),
  ]

  let created = 0
  const batch = adminDb.batch()
  const now = new Date()
  for (const school of seedSchools) {
    const normalized = normalizeSchoolName(school.name)
    const lower = normalized.toLowerCase()
    if (!normalized || existingNames.has(lower)) continue
    const ref = adminDb.collection(SCHOOL_DIRECTORY_COLLECTION).doc()
    batch.set(ref, {
      name: normalized,
      nameLower: lower,
      ...(school.city ? { city: school.city } : {}),
      country: 'bangladesh',
      medium: 'english',
      isActive: true,
      status: 'approved',
      source: 'seed',
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
  revalidatePath('/robofest')
  revalidateTag(PUBLIC_SCHOOLS_TAG, 'max')
  return { success: true, message: created > 0 ? `Added ${created} schools.` : 'Directory already up to date.' }
}
