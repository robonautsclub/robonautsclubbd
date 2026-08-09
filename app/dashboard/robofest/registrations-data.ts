import { cache } from 'react'
import { adminDb } from '@/lib/firebase-admin'
import {
  ROBOFEST_REGISTRATIONS_COLLECTION,
  mapRobofestRegistrationDoc,
  type RobofestRegistration,
} from '@/lib/robofest-content'

/**
 * Request-deduped registration list for the Robofest dashboard.
 * Kept outside `'use server'` so React `cache()` works for RSC.
 */
export const loadRobofestRegistrationsCached = cache(
  async (): Promise<RobofestRegistration[]> => {
    if (!adminDb) return []

    const snap = await adminDb
      .collection(ROBOFEST_REGISTRATIONS_COLLECTION)
      .get()
    const items = snap.docs.map((doc) =>
      mapRobofestRegistrationDoc(doc.id, doc.data() as Record<string, unknown>),
    )

    items.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return tb - ta
    })

    return items
  },
)
