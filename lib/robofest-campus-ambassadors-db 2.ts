import { unstable_cache } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import {
  PUBLIC_ROBOFEST_AMBASSADORS_TAG,
  ROBOFEST_CAMPUS_AMBASSADOR_SEED,
  ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION,
  mapRobofestCampusAmbassadorDoc,
  sortRobofestCampusAmbassadors,
  type RobofestCampusAmbassador,
} from '@/lib/robofest-campus-ambassadors'

export const DASHBOARD_ROBOFEST_AMBASSADORS_TAG = 'dashboard-robofest-ambassadors'

export async function listRobofestCampusAmbassadorsFromDb(
  includeInactive = true,
): Promise<RobofestCampusAmbassador[]> {
  if (!adminDb) {
    return sortRobofestCampusAmbassadors(
      includeInactive
        ? ROBOFEST_CAMPUS_AMBASSADOR_SEED
        : ROBOFEST_CAMPUS_AMBASSADOR_SEED.filter((a) => a.isActive),
    )
  }

  const snapshot = await adminDb
    .collection(ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION)
    .get()

  if (snapshot.empty) {
    return sortRobofestCampusAmbassadors(
      includeInactive
        ? ROBOFEST_CAMPUS_AMBASSADOR_SEED
        : ROBOFEST_CAMPUS_AMBASSADOR_SEED.filter((a) => a.isActive),
    )
  }

  const list: RobofestCampusAmbassador[] = []
  for (const doc of snapshot.docs) {
    const mapped = mapRobofestCampusAmbassadorDoc(
      doc.id,
      doc.data() as Record<string, unknown>,
    )
    if (!mapped) continue
    if (!includeInactive && !mapped.isActive) continue
    list.push(mapped)
  }

  return sortRobofestCampusAmbassadors(list)
}

/** Cached dashboard list (invalidate via DASHBOARD_ROBOFEST_AMBASSADORS_TAG). */
export async function listRobofestCampusAmbassadorsCached(
  includeInactive = true,
): Promise<RobofestCampusAmbassador[]> {
  return unstable_cache(
    () => listRobofestCampusAmbassadorsFromDb(includeInactive),
    [DASHBOARD_ROBOFEST_AMBASSADORS_TAG, includeInactive ? 'all' : 'active'],
    {
      tags: [DASHBOARD_ROBOFEST_AMBASSADORS_TAG, PUBLIC_ROBOFEST_AMBASSADORS_TAG],
      revalidate: 600,
    },
  )()
}

/** Active ambassador by id for registration validation. */
export async function getActiveRobofestCampusAmbassadorById(
  id: string,
): Promise<RobofestCampusAmbassador | undefined> {
  const trimmed = id.trim()
  if (!trimmed) return undefined

  if (!adminDb) {
    const seed = ROBOFEST_CAMPUS_AMBASSADOR_SEED.find((a) => a.id === trimmed)
    return seed?.isActive ? seed : undefined
  }

  const snap = await adminDb
    .collection(ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION)
    .doc(trimmed)
    .get()

  if (!snap.exists) {
    // Empty collection fallback: allow seed ids until seeded.
    const countSnap = await adminDb
      .collection(ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION)
      .limit(1)
      .get()
    if (countSnap.empty) {
      const seed = ROBOFEST_CAMPUS_AMBASSADOR_SEED.find((a) => a.id === trimmed)
      return seed?.isActive ? seed : undefined
    }
    return undefined
  }

  const mapped = mapRobofestCampusAmbassadorDoc(
    snap.id,
    snap.data() as Record<string, unknown>,
  )
  if (!mapped || !mapped.isActive) return undefined
  return mapped
}

export async function getPublicRobofestCampusAmbassadors(): Promise<
  RobofestCampusAmbassador[]
> {
  const db = adminDb
  if (!db) {
    return sortRobofestCampusAmbassadors(
      ROBOFEST_CAMPUS_AMBASSADOR_SEED.filter((a) => a.isActive),
    )
  }

  try {
    return await unstable_cache(
      async (): Promise<RobofestCampusAmbassador[]> => {
        const snapshot = await db
          .collection(ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION)
          .get()

        if (snapshot.empty) {
          return sortRobofestCampusAmbassadors(
            ROBOFEST_CAMPUS_AMBASSADOR_SEED.filter((a) => a.isActive),
          )
        }

        const list: RobofestCampusAmbassador[] = []
        for (const doc of snapshot.docs) {
          const mapped = mapRobofestCampusAmbassadorDoc(
            doc.id,
            doc.data() as Record<string, unknown>,
          )
          if (!mapped || !mapped.isActive) continue
          list.push(mapped)
        }
        return sortRobofestCampusAmbassadors(list)
      },
      [PUBLIC_ROBOFEST_AMBASSADORS_TAG],
      { tags: [PUBLIC_ROBOFEST_AMBASSADORS_TAG], revalidate: 3600 },
    )()
  } catch (error) {
    console.error('Error fetching campus ambassadors:', error)
    return sortRobofestCampusAmbassadors(
      ROBOFEST_CAMPUS_AMBASSADOR_SEED.filter((a) => a.isActive),
    )
  }
}
