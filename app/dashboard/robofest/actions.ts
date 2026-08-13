'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import {
  requireAuth,
  canCreateArea,
  canEditOthersArea,
  canDeleteArea,
  hasPermission,
} from '@/lib/auth'
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
  sanitizeRobofestAwardCategories,
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
import {
  PUBLIC_ROBOFEST_AMBASSADORS_TAG,
  ROBOFEST_CAMPUS_AMBASSADOR_SEED,
  ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION,
  nextRobofestCampusAmbassadorId,
  type RobofestCampusAmbassador,
  type RobofestCampusAmbassadorWriteInput,
} from '@/lib/robofest-campus-ambassadors'
import {
  listRobofestCampusAmbassadorsCached,
  DASHBOARD_ROBOFEST_AMBASSADORS_TAG,
} from '@/lib/robofest-campus-ambassadors-db'
import { sanitizeRobofestCertificateSignatures } from '@/lib/robofest-certificate-signatures'
import {
  loadRobofestRegistrationsForExport,
  loadRobofestRegistrationsPage,
  loadRobofestRegistrationStatusCounts,
  ROBOFEST_REGISTRATIONS_PAGE_SIZE,
} from './registrations-data'
import type {
  RobofestRegistrationCursor,
  RobofestRegistrationListFilters,
  RobofestRegistrationPage,
  RobofestRegistrationStatusCounts,
} from './registrations-types'

function revalidateRobofestPublic() {
  revalidateTag(ROBOFEST_CONTENT_CACHE_TAG, 'max')
  revalidatePath('/robofest')
  revalidatePath('/robofest', 'layout')
  revalidatePath('/dashboard/robofest')
}

function revalidateRobofestAmbassadors() {
  revalidateTag(PUBLIC_ROBOFEST_AMBASSADORS_TAG, 'max')
  revalidateTag(DASHBOARD_ROBOFEST_AMBASSADORS_TAG, 'max')
  revalidatePath('/dashboard/robofest')
  revalidatePath('/robofest')
  revalidatePath('/robofest', 'layout')
}

export async function getRobofestDashboardContent(): Promise<RobofestContent> {
  await requireAuth()
  return getRobofestContentFresh()
}

export async function updateRobofestContent(
  input: RobofestContent,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  if (!canEditOthersArea(session, 'robofest')) {
    return { success: false, error: 'You do not have permission to edit Robofest.' }
  }
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
      awardCategories: sanitizeRobofestAwardCategories(input.awardCategories),
      certificateSignatures: sanitizeRobofestCertificateSignatures(
        input.certificateSignatures,
        (input.hostName || defaults.hostName).trim(),
      ),
      certificateTemplateId: input.certificateTemplateId?.trim() || null,
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

export async function getRobofestRegistrationsPage(input: {
  filters: RobofestRegistrationListFilters
  cursor?: RobofestRegistrationCursor | null
  pageSize?: number
}): Promise<RobofestRegistrationPage> {
  await requireAuth()
  try {
    return await loadRobofestRegistrationsPage(input)
  } catch (error) {
    console.error('[robofest-dashboard] list registrations page failed:', error)
    return { items: [], nextCursor: null, hasMore: false }
  }
}

export async function getRobofestRegistrationStatusCounts(): Promise<RobofestRegistrationStatusCounts> {
  await requireAuth()
  try {
    return await loadRobofestRegistrationStatusCounts()
  } catch (error) {
    console.error('[robofest-dashboard] status counts failed:', error)
    return { pending: 0, confirmed: 0, cancelled: 0 }
  }
}

/** Full filtered list for CSV/Excel/PDF/certificate export (not for table paint). */
export async function getRobofestRegistrationsForExport(
  filters: RobofestRegistrationListFilters,
): Promise<{ success: boolean; items?: RobofestRegistration[]; error?: string }> {
  await requireAuth()
  try {
    const items = await loadRobofestRegistrationsForExport(filters)
    return { success: true, items }
  } catch (error) {
    console.error('[robofest-dashboard] export list failed:', error)
    return {
      success: false,
      error: 'Failed to load registrations for export. Please try again.',
    }
  }
}

/** @deprecated Prefer getRobofestRegistrationsPage — kept for any leftover callers. */
export async function getRobofestRegistrations(): Promise<RobofestRegistration[]> {
  await requireAuth()
  const page = await loadRobofestRegistrationsPage({
    filters: { status: 'pending' },
    pageSize: ROBOFEST_REGISTRATIONS_PAGE_SIZE,
  })
  return page.items
}

export async function updateRobofestRegistrationStatus(
  id: string,
  status: RobofestRegistrationStatus,
  adminNotes?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  if (!canEditOthersArea(session, 'robofest')) {
    return { success: false, error: 'You do not have permission to edit Robofest.' }
  }
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

export async function updateRobofestMemberAwardCategory(
  registrationDocId: string,
  memberIndex: number,
  awardCategoryId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  if (!canEditOthersArea(session, 'robofest')) {
    return { success: false, error: 'You do not have permission to edit Robofest.' }
  }
  if (!adminDb) return { success: false, error: 'Database unavailable.' }

  const trimmedId = (registrationDocId || '').trim()
  if (!trimmedId) {
    return { success: false, error: 'Registration id is required.' }
  }
  if (!Number.isInteger(memberIndex) || memberIndex < 0) {
    return { success: false, error: 'Invalid member index.' }
  }

  const content = await getRobofestContentFresh()
  const categories = sanitizeRobofestAwardCategories(content.awardCategories)
  const categoryId = (awardCategoryId || '').trim()
  const category = categories.find((c) => c.id === categoryId)
  if (!category || category.isActive === false) {
    return { success: false, error: 'Selected award category is not valid.' }
  }

  const ref = adminDb
    .collection(ROBOFEST_REGISTRATIONS_COLLECTION)
    .doc(trimmedId)
  const snap = await ref.get()
  if (!snap.exists) return { success: false, error: 'Registration not found.' }

  const data = snap.data() as Record<string, unknown>
  const members = Array.isArray(data.teamMembers)
    ? [...(data.teamMembers as Record<string, unknown>[])]
    : []

  if (members.length === 0) {
    return {
      success: false,
      error: 'This registration has no team members to assign an award to.',
    }
  }
  if (memberIndex >= members.length) {
    return { success: false, error: 'Member not found on this registration.' }
  }

  const current = members[memberIndex]
  if (!current || typeof current !== 'object') {
    return { success: false, error: 'Member not found on this registration.' }
  }

  members[memberIndex] = {
    ...current,
    awardCategoryId: category.id,
  }

  await ref.update({
    teamMembers: members,
    updatedAt: FieldValue.serverTimestamp(),
  })
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
  const session = await requireAuth()
  if (!hasPermission(session, 'mail.send')) {
    return {
      success: false,
      error: 'You do not have permission to send emails from the dashboard.',
    }
  }
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
  const session = await requireAuth()
  if (!canCreateArea(session, 'robofest')) {
    return { success: false, error: 'You do not have permission to create Robofest items.' }
  }
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
      if (!hasPermission(session, 'payments.view')) {
        return {
          success: false,
          error: 'You do not have permission to set paid amounts.',
        }
      }
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
        sendEmail:
          input.sendEmail !== false && hasPermission(session, 'mail.send'),
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
  if (!canEditOthersArea(session, 'robofest')) {
    return { success: false, error: 'You do not have permission to edit Robofest.' }
  }
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

export async function getRobofestCampusAmbassadors(): Promise<
  RobofestCampusAmbassador[]
> {
  await requireAuth()
  if (adminDb) {
    const collection = adminDb.collection(ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION)
    const snapshot = await collection.limit(1).get()
    if (snapshot.empty) {
      const now = new Date()
      const batch = adminDb.batch()
      for (const seed of ROBOFEST_CAMPUS_AMBASSADOR_SEED) {
        batch.set(collection.doc(seed.id), {
          name: seed.name,
          school: seed.school,
          phone: seed.phone || '',
          email: seed.email || '',
          isActive: seed.isActive,
          createdAt: now,
          updatedAt: now,
        })
      }
      await batch.commit()
    }
  }
  return listRobofestCampusAmbassadorsCached(true)
}

export async function createRobofestCampusAmbassador(
  input: RobofestCampusAmbassadorWriteInput,
): Promise<{ success: boolean; error?: string; id?: string }> {
  const session = await requireAuth()
  if (!canCreateArea(session, 'robofest')) {
    return { success: false, error: 'You do not have permission to create Robofest items.' }
  }
  if (!adminDb) return { success: false, error: 'Database unavailable.' }

  const name = (input.name || '').trim()
  const school = (input.school || '').trim()
  if (!name) return { success: false, error: 'Name is required.' }
  if (!school) return { success: false, error: 'School is required.' }

  const phone = (input.phone || '').trim()
  const email = (input.email || '').trim().toLowerCase()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Enter a valid email.' }
  }

  const existing = await adminDb
    .collection(ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION)
    .get()
  const id = nextRobofestCampusAmbassadorId(existing.docs.map((d) => d.id))
  const now = new Date()

  await adminDb.collection(ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION).doc(id).set({
    name,
    school,
    phone,
    email,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  })

  revalidateRobofestAmbassadors()
  return { success: true, id }
}

export async function updateRobofestCampusAmbassador(
  id: string,
  input: RobofestCampusAmbassadorWriteInput,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  if (!canEditOthersArea(session, 'robofest')) {
    return { success: false, error: 'You do not have permission to edit Robofest.' }
  }
  if (!adminDb) return { success: false, error: 'Database unavailable.' }

  const trimmedId = (id || '').trim()
  if (!trimmedId) return { success: false, error: 'Ambassador id is required.' }

  const name = (input.name || '').trim()
  const school = (input.school || '').trim()
  if (!name) return { success: false, error: 'Name is required.' }
  if (!school) return { success: false, error: 'School is required.' }

  const phone = (input.phone || '').trim()
  const email = (input.email || '').trim().toLowerCase()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Enter a valid email.' }
  }

  const ref = adminDb
    .collection(ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION)
    .doc(trimmedId)
  const snap = await ref.get()
  if (!snap.exists) {
    return { success: false, error: 'Ambassador not found.' }
  }

  await ref.update({
    name,
    school,
    phone,
    email,
    isActive: input.isActive ?? true,
    updatedAt: FieldValue.serverTimestamp(),
  })

  revalidateRobofestAmbassadors()
  return { success: true }
}

export async function deleteRobofestCampusAmbassador(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  if (!canDeleteArea(session, 'robofest')) {
    return { success: false, error: 'You do not have permission to delete Robofest items.' }
  }
  if (!adminDb) return { success: false, error: 'Database unavailable.' }

  const trimmedId = (id || '').trim()
  if (!trimmedId) return { success: false, error: 'Ambassador id is required.' }

  const ref = adminDb
    .collection(ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION)
    .doc(trimmedId)
  const snap = await ref.get()
  if (!snap.exists) {
    return { success: false, error: 'Ambassador not found.' }
  }

  await ref.delete()
  revalidateRobofestAmbassadors()
  return { success: true }
}

export async function seedRobofestCampusAmbassadors(): Promise<{
  success: boolean
  message: string
}> {
  const session = await requireAuth()
  if (!canCreateArea(session, 'robofest') && !canEditOthersArea(session, 'robofest')) {
    return { success: false, message: 'You do not have permission to edit Robofest.' }
  }
  if (!adminDb) return { success: false, message: 'Database unavailable.' }

  const collection = adminDb.collection(ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION)
  const existing = await collection.get()
  const existingById = new Map(
    existing.docs.map((doc) => [doc.id, doc.data() as Record<string, unknown>]),
  )

  let created = 0
  let updated = 0
  const now = new Date()
  const batch = adminDb.batch()

  for (const seed of ROBOFEST_CAMPUS_AMBASSADOR_SEED) {
    const ref = collection.doc(seed.id)
    const prev = existingById.get(seed.id)
    if (!prev) {
      batch.set(ref, {
        name: seed.name,
        school: seed.school,
        phone: seed.phone || '',
        email: seed.email || '',
        isActive: seed.isActive,
        createdAt: now,
        updatedAt: now,
      })
      created += 1
      continue
    }

    const prevActive =
      typeof prev.isActive === 'boolean' ? prev.isActive : true
    batch.set(
      ref,
      {
        name: seed.name,
        school: seed.school,
        phone: seed.phone || '',
        email: seed.email || '',
        isActive: prevActive,
        updatedAt: now,
        createdAt: prev.createdAt ?? now,
      },
      { merge: true },
    )
    updated += 1
  }

  if (created + updated > 0) {
    await batch.commit()
  }

  revalidateRobofestAmbassadors()
  return {
    success: true,
    message: `Seed complete: ${created} created, ${updated} updated.`,
  }
}
