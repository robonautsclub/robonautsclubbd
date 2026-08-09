'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAuth } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import {
  ROBOFEST_CONTENT_CACHE_TAG,
  ROBOFEST_CONTENT_COLLECTION,
  ROBOFEST_CONTENT_DOC_ID,
  ROBOFEST_REGISTRATIONS_COLLECTION,
  getDefaultRobofestContent,
  getRobofestCategoryByName,
  getRobofestContentFresh,
  mapRobofestContentDoc,
  mapRobofestRegistrationDoc,
  type RobofestContent,
  type RobofestRegistration,
  type RobofestRegistrationStatus,
} from '@/lib/robofest-content'
import {
  getRobofestRegistrationById,
  resendRobofestConfirmationEmail,
  createRobofestRegistrationAndSendEmail,
} from '@/lib/robofest-registration'
import {
  validateRobofestRegistrationInput,
  type RobofestRegistrationInput,
} from '@/lib/robofest-registration-input'
import { computeRobofestRegistrationTotal, resolveRobofestFee } from '@/lib/robofest-fee'

function revalidateRobofestPublic() {
  revalidateTag(ROBOFEST_CONTENT_CACHE_TAG, 'max')
  revalidatePath('/robofest')
  revalidatePath('/robofest', 'layout')
  revalidatePath('/dashboard/robofest')
}

export async function getRobofestDashboardContent(): Promise<RobofestContent> {
  await requireAuth()
  return getRobofestContentFresh()
}

export async function updateRobofestContent(
  input: RobofestContent,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  if (!adminDb) {
    return { success: false, error: 'Database unavailable.' }
  }

  try {
    const defaults = getDefaultRobofestContent()
    const sanitized: RobofestContent = {
      ...defaults,
      ...input,
      presentsLabel: (input.presentsLabel || defaults.presentsLabel).trim(),
      generalRulesPdf: (input.generalRulesPdf || defaults.generalRulesPdf).trim(),
      instagramUrl: (input.instagramUrl || defaults.instagramUrl).trim(),
      contactEmail: (input.contactEmail || defaults.contactEmail).trim(),
      dateLines: (() => {
        const lines = Array.isArray(input.dateLines)
          ? input.dateLines.map((line) => line.trim()).filter(Boolean)
          : defaults.dateLines
        return lines.length > 0 ? lines : defaults.dateLines
      })(),
      venueLines: (() => {
        const lines = Array.isArray(input.venueLines)
          ? input.venueLines.map((line) => line.trim()).filter(Boolean)
          : defaults.venueLines
        return lines.length > 0 ? lines : defaults.venueLines
      })(),
      contactLines: (() => {
        const lines = Array.isArray(input.contactLines)
          ? input.contactLines
              .map((line) => ({
                label: (line.label || '').trim(),
                phone: (line.phone || '').trim(),
                note: (line.note || '').trim(),
              }))
              .filter((line) => line.label || line.phone)
          : defaults.contactLines
        return lines.length > 0 ? lines : defaults.contactLines
      })(),
      categories: (input.categories || []).map((category) => ({
        ...category,
        slug: category.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        name: category.name.trim(),
        highlights: Array.isArray(category.highlights)
          ? category.highlights.map((h) => h.trim()).filter(Boolean)
          : [],
        active: Boolean(category.active),
        amount:
          category.amount == null || Number.isNaN(Number(category.amount))
            ? null
            : Number(category.amount),
      })),
      rounds: (input.rounds || []).map((round) => ({
        city: round.city.trim(),
        title: round.title.trim(),
        dates: round.dates.trim(),
        venueLabel: round.venueLabel.trim(),
        image: round.image.trim() || '/robofest/dhaka.jpg',
      })),
      howItWorks: (input.howItWorks || []).map((step) => ({
        icon: step.icon.trim() || 'group',
        title: step.title.trim(),
        description: step.description.trim(),
      })),
      isPaid: Boolean(input.isPaid),
      amount: Number(input.amount) || 0,
      registrationClosingDate: (() => {
        const raw = (input.registrationClosingDate || '').trim()
        if (!raw) return null
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(raw)) {
          return raw.slice(0, 16)
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T23:59`
        return null
      })(),
    }

    if (!sanitized.categories.length) {
      return { success: false, error: 'At least one category is required.' }
    }
    if (!sanitized.rounds.length) {
      return { success: false, error: 'At least one round is required.' }
    }

    await adminDb
      .collection(ROBOFEST_CONTENT_COLLECTION)
      .doc(ROBOFEST_CONTENT_DOC_ID)
      .set(
        {
          ...sanitized,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: session.uid,
        },
        { merge: true },
      )

    revalidateRobofestPublic()
    for (const category of sanitized.categories) {
      revalidatePath(`/robofest/${category.slug}`)
    }

    return { success: true }
  } catch (error) {
    console.error('[robofest-dashboard] update content failed:', error)
    return { success: false, error: 'Failed to save Robofest content.' }
  }
}

export async function getRobofestRegistrations(): Promise<RobofestRegistration[]> {
  await requireAuth()
  if (!adminDb) return []

  const snap = await adminDb.collection(ROBOFEST_REGISTRATIONS_COLLECTION).get()
  const items = snap.docs.map((doc) =>
    mapRobofestRegistrationDoc(doc.id, doc.data() as Record<string, unknown>),
  )

  items.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })

  return items
}

export async function updateRobofestRegistrationStatus(
  id: string,
  status: RobofestRegistrationStatus,
  adminNotes?: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAuth()
  if (!adminDb) return { success: false, error: 'Database unavailable.' }

  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return { success: false, error: 'Invalid status.' }
  }

  const ref = adminDb.collection(ROBOFEST_REGISTRATIONS_COLLECTION).doc(id)
  const snap = await ref.get()
  if (!snap.exists) return { success: false, error: 'Registration not found.' }

  const update: Record<string, unknown> = {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  }
  if (adminNotes !== undefined) {
    update.adminNotes = adminNotes.trim()
  }

  await ref.update(update)
  revalidatePath('/dashboard/robofest')
  return { success: true }
}

export async function resendRobofestRegistrationEmail(
  id: string,
): Promise<{
  success: boolean
  error?: string
  recipientCount?: number
  emailSendCount?: number
}> {
  await requireAuth()
  const registration = await getRobofestRegistrationById(id)
  if (!registration) {
    return { success: false, error: 'Registration not found.' }
  }
  if (registration.status === 'cancelled') {
    return { success: false, error: 'Cannot email a cancelled registration.' }
  }

  const content = await getRobofestContentFresh()
  const result = await resendRobofestConfirmationEmail(registration, content)
  if (result.success) {
    revalidatePath('/dashboard/robofest')
  }
  return result
}

export type CreateRobofestRegistrationManualInput =
  RobofestRegistrationInput & {
    notes?: string
    paymentMode: 'paid_offline' | 'waived'
    amountPaid?: number
    trxId?: string
    sendEmail?: boolean
  }

export async function createRobofestRegistrationManual(
  input: CreateRobofestRegistrationManualInput,
): Promise<{
  success: boolean
  error?: string
  warning?: string
  registrationId?: string
  registrationDocId?: string
  teamNumber?: string
}> {
  await requireAuth()
  if (!adminDb) {
    return { success: false, error: 'Database unavailable.' }
  }

  try {
    const validated = await validateRobofestRegistrationInput({
      category: input.category,
      name: input.name,
      division: input.division,
      ageCategory: input.ageCategory,
      teamSize: input.teamSize,
      teamMembers: input.teamMembers,
      campusAmbassadorId: input.campusAmbassadorId,
      notes: input.notes,
    })
    if (!validated.ok) {
      return { success: false, error: validated.error }
    }

    const content = await getRobofestContentFresh()
    const category = getRobofestCategoryByName(
      content,
      validated.data.category,
    )
    if (!category) {
      return { success: false, error: 'Selected category is not valid.' }
    }

    const roundOk = content.rounds.some(
      (round) => round.city === validated.data.roundCity,
    )
    if (!roundOk) {
      return { success: false, error: 'Please select a valid division.' }
    }

    const fee = resolveRobofestFee(content, category.name)
    const defaultTotal = computeRobofestRegistrationTotal(
      fee.amount || 300,
      validated.data.teamSize,
    )

    let paymentMeta:
      | {
          paymentId: string
          trxId?: string
          amountPaid: number
          paymentGateway: string
        }
      | undefined

    if (input.paymentMode === 'paid_offline') {
      const amountPaid =
        typeof input.amountPaid === 'number' && input.amountPaid >= 0
          ? input.amountPaid
          : defaultTotal
      paymentMeta = {
        paymentId: `admin-manual-${Date.now()}`,
        trxId: input.trxId?.trim() || undefined,
        amountPaid,
        paymentGateway: 'manual',
      }
    }

    const result = await createRobofestRegistrationAndSendEmail(
      content,
      {
        ...validated.data,
        category: category.name,
        notes: input.notes?.trim() || validated.data.notes || '',
      },
      {
        sendEmail: input.sendEmail !== false,
        paymentMeta,
      },
    )

    if (result.success) {
      revalidatePath('/dashboard/robofest')
    }

    return result
  } catch (error) {
    console.error('Admin manual Robofest registration failed:', error)
    return {
      success: false,
      error: 'Failed to create registration. Please try again.',
    }
  }
}

export async function resetRobofestContentToDefaults(): Promise<{
  success: boolean
  error?: string
  content?: RobofestContent
}> {
  const session = await requireAuth()
  if (!adminDb) return { success: false, error: 'Database unavailable.' }

  const defaults = getDefaultRobofestContent()
  await adminDb
    .collection(ROBOFEST_CONTENT_COLLECTION)
    .doc(ROBOFEST_CONTENT_DOC_ID)
    .set({
      ...defaults,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: session.uid,
    })

  revalidateRobofestPublic()
  return { success: true, content: mapRobofestContentDoc(defaults as unknown as Record<string, unknown>) }
}
