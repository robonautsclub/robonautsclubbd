/**
 * Pending school helpers for public registration flows.
 */

import { collectionAdd, collectionWhere } from '@/lib/db/collections'
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

  if (name === PRIVATE_CANDIDATE_OPTION) {
    return { school: name, schoolIsCustom: false }
  }

  const existing = await collectionWhere(
    SCHOOL_DIRECTORY_COLLECTION,
    'nameLower',
    '==',
    name.toLowerCase(),
    { limit: 5 },
  )

  for (const doc of existing) {
    const status = doc.status === 'pending' ? 'pending' : 'approved'
    const isActive = typeof doc.isActive === 'boolean' ? doc.isActive : true

    if (status === 'approved' && isActive) {
      return {
        school: typeof doc.name === 'string' ? normalizeSchoolName(doc.name) : name,
        schoolIsCustom: false,
      }
    }

    if (status === 'pending') {
      return {
        school: typeof doc.name === 'string' ? normalizeSchoolName(doc.name) : name,
        schoolIsCustom: true,
        pendingSchoolId: String(doc.id),
      }
    }
  }

  const now = new Date().toISOString()
  const pendingSchoolId = await collectionAdd(SCHOOL_DIRECTORY_COLLECTION, {
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
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
  })

  return {
    school: name,
    schoolIsCustom: true,
    pendingSchoolId,
  }
}
