/**
 * Pending school helpers for public registration flows (Admin SDK).
 */

import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import {
  PRIVATE_CANDIDATE_OPTION,
  SCHOOL_DIRECTORY_COLLECTION,
  SCHOOL_NOT_FOUND_OPTION,
  type SchoolDirectorySource,
} from '@/lib/schoolDirectoryShared'

export function normalizeSchoolName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function resolveSchoolFromSelection(
  schoolSelection: string,
  customSchool: string,
): { school: string; isCustom: boolean } {
  const selection = schoolSelection.trim()
  if (selection === SCHOOL_NOT_FOUND_OPTION) {
    return {
      school: normalizeSchoolName(customSchool),
      isCustom: true,
    }
  }
  return {
    school: normalizeSchoolName(selection),
    isCustom: false,
  }
}

export async function createPendingSchoolIfNeeded(
  schoolName: string,
  meta: {
    requestedByName?: string
    requestedByEmail?: string
    source?: SchoolDirectorySource
  } = {},
): Promise<{ school: string; schoolIsCustom: boolean; pendingSchoolId?: string }> {
  const name = normalizeSchoolName(schoolName)
  if (!name) {
    return { school: '', schoolIsCustom: false }
  }

  // Private Candidate is a synthetic option, not a directory school.
  if (name === PRIVATE_CANDIDATE_OPTION) {
    return { school: name, schoolIsCustom: false }
  }

  if (!adminDb) {
    return { school: name, schoolIsCustom: true }
  }

  const existing = await adminDb
    .collection(SCHOOL_DIRECTORY_COLLECTION)
    .where('nameLower', '==', name.toLowerCase())
    .limit(5)
    .get()

  for (const doc of existing.docs) {
    const data = doc.data()
    const status = data.status === 'pending' ? 'pending' : 'approved'
    const isActive = typeof data.isActive === 'boolean' ? data.isActive : true

    if (status === 'approved' && isActive) {
      return {
        school: typeof data.name === 'string' ? normalizeSchoolName(data.name) : name,
        schoolIsCustom: false,
      }
    }

    if (status === 'pending') {
      return {
        school: typeof data.name === 'string' ? normalizeSchoolName(data.name) : name,
        schoolIsCustom: true,
        pendingSchoolId: doc.id,
      }
    }
  }

  const now = new Date()
  const ref = await adminDb.collection(SCHOOL_DIRECTORY_COLLECTION).add({
    name,
    nameLower: name.toLowerCase(),
    city: '',
    country: 'bangladesh',
    medium: 'english',
    isActive: false,
    status: 'pending',
    source: meta.source ?? 'robofest',
    requestedByName: meta.requestedByName?.trim() || '',
    requestedByEmail: meta.requestedByEmail?.trim().toLowerCase() || '',
    requestedAt: FieldValue.serverTimestamp(),
    createdAt: now,
    updatedAt: now,
  })

  return {
    school: name,
    schoolIsCustom: true,
    pendingSchoolId: ref.id,
  }
}
