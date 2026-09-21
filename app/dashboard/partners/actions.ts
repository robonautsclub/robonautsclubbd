'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import {
  requireAuth,
  canCreateArea,
  canEditArea,
  canDeleteArea,
} from '@/lib/auth'
import {
  collectionAdd,
  collectionDelete,
  collectionGet,
  collectionGetAll,
  collectionSet,
} from '@/lib/db/collections'
import { PUBLIC_HOMEPAGE_ORGS_TAG } from '@/lib/public-cache-tags'
import {
  HOMEPAGE_ORGS_COLLECTION,
  mapHomepageOrgDoc,
  sortHomepageOrgs,
  type HomepageOrg,
} from '@/lib/homepage-orgs'
import type { HomepageOrgWriteInput } from '@/types/homepage-org'

const DASHBOARD_HOMEPAGE_ORGS_TAG = 'dashboard-homepage-orgs'

function revalidateHomepageOrgs() {
  revalidatePath('/')
  revalidatePath('/dashboard/partners')
  revalidateTag(PUBLIC_HOMEPAGE_ORGS_TAG, 'max')
  revalidateTag(DASHBOARD_HOMEPAGE_ORGS_TAG, 'max')
}

async function fetchHomepageOrgsFromDb(includeInactive: boolean): Promise<HomepageOrg[]> {
  const docs = await collectionGetAll(HOMEPAGE_ORGS_COLLECTION)
  const orgs: HomepageOrg[] = []
  for (const doc of docs) {
    const mapped = mapHomepageOrgDoc(String(doc.id), doc as Record<string, unknown>)
    if (!mapped) continue
    if (!includeInactive && !mapped.isActive) continue
    orgs.push(mapped)
  }
  return sortHomepageOrgs(orgs)
}

const getCachedHomepageOrgs = unstable_cache(
  () => fetchHomepageOrgsFromDb(true),
  [DASHBOARD_HOMEPAGE_ORGS_TAG],
  { tags: [DASHBOARD_HOMEPAGE_ORGS_TAG], revalidate: 600 },
)

export async function getHomepageOrgs(): Promise<{
  orgs: HomepageOrg[]
  error?: string
}> {
  await requireAuth()
  try {
    const orgs = await getCachedHomepageOrgs()
    return { orgs }
  } catch (error) {
    console.error('Error fetching homepage orgs:', error)
    return { orgs: [], error: 'Failed to load partners and schools.' }
  }
}

export async function createHomepageOrg(
  input: HomepageOrgWriteInput,
): Promise<{ success: boolean; error?: string; id?: string }> {
  const session = await requireAuth()
  if (!canCreateArea(session, 'partners')) {
    return { success: false, error: 'You do not have permission to create partners or schools.' }
  }

  const name = input.name.trim()
  if (!name) return { success: false, error: 'Name is required.' }
  if (input.kind !== 'partner' && input.kind !== 'workshop_school') {
    return { success: false, error: 'Invalid type.' }
  }

  try {
    const existing = await fetchHomepageOrgsFromDb(true)
    const sameKind = existing.filter((org) => org.kind === input.kind)
    const nextOrder =
      typeof input.sortOrder === 'number'
        ? input.sortOrder
        : sameKind.reduce((max, org) => Math.max(max, org.sortOrder), -1) + 1

    const now = new Date().toISOString()
    const id = await collectionAdd(HOMEPAGE_ORGS_COLLECTION, {
      kind: input.kind,
      name,
      logoUrl: input.logoUrl?.trim() || null,
      sortOrder: nextOrder,
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      createdBy: session.uid,
    })

    revalidateHomepageOrgs()
    return { success: true, id }
  } catch (error) {
    console.error('Error creating homepage org:', error)
    return { success: false, error: 'Failed to create entry. Please try again.' }
  }
}

export async function updateHomepageOrg(
  id: string,
  input: Partial<HomepageOrgWriteInput>,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  if (!canEditArea(session, 'partners')) {
    return { success: false, error: 'You do not have permission to edit partners or schools.' }
  }
  if (!id.trim()) return { success: false, error: 'Missing id.' }

  try {
    const existing = await collectionGet(HOMEPAGE_ORGS_COLLECTION, id)
    if (!existing) return { success: false, error: 'Entry not found.' }

    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (typeof input.name === 'string') {
      const name = input.name.trim()
      if (!name) return { success: false, error: 'Name is required.' }
      patch.name = name
    }
    if (input.kind === 'partner' || input.kind === 'workshop_school') {
      patch.kind = input.kind
    }
    if (input.logoUrl !== undefined) {
      patch.logoUrl = input.logoUrl.trim() || null
    }
    if (typeof input.isActive === 'boolean') {
      patch.isActive = input.isActive
    }
    if (typeof input.sortOrder === 'number' && Number.isFinite(input.sortOrder)) {
      patch.sortOrder = input.sortOrder
    }

    await collectionSet(HOMEPAGE_ORGS_COLLECTION, id, patch, { merge: true })
    revalidateHomepageOrgs()
    return { success: true }
  } catch (error) {
    console.error('Error updating homepage org:', error)
    return { success: false, error: 'Failed to update entry. Please try again.' }
  }
}

export async function deleteHomepageOrg(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  if (!canDeleteArea(session, 'partners')) {
    return { success: false, error: 'You do not have permission to delete partners or schools.' }
  }
  if (!id.trim()) return { success: false, error: 'Missing id.' }

  try {
    await collectionDelete(HOMEPAGE_ORGS_COLLECTION, id)
    revalidateHomepageOrgs()
    return { success: true }
  } catch (error) {
    console.error('Error deleting homepage org:', error)
    return { success: false, error: 'Failed to delete entry. Please try again.' }
  }
}

export async function reorderHomepageOrg(
  id: string,
  direction: 'up' | 'down',
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  if (!canEditArea(session, 'partners')) {
    return { success: false, error: 'You do not have permission to reorder partners or schools.' }
  }

  try {
    const all = await fetchHomepageOrgsFromDb(true)
    const current = all.find((org) => org.id === id)
    if (!current) return { success: false, error: 'Entry not found.' }

    const siblings = all.filter((org) => org.kind === current.kind)
    const index = siblings.findIndex((org) => org.id === id)
    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || swapWith < 0 || swapWith >= siblings.length) {
      return { success: true }
    }

    const other = siblings[swapWith]
    const now = new Date().toISOString()
    await Promise.all([
      collectionSet(
        HOMEPAGE_ORGS_COLLECTION,
        current.id,
        { sortOrder: other.sortOrder, updatedAt: now },
        { merge: true },
      ),
      collectionSet(
        HOMEPAGE_ORGS_COLLECTION,
        other.id,
        { sortOrder: current.sortOrder, updatedAt: now },
        { merge: true },
      ),
    ])
    revalidateHomepageOrgs()
    return { success: true }
  } catch (error) {
    console.error('Error reordering homepage org:', error)
    return { success: false, error: 'Failed to reorder. Please try again.' }
  }
}
