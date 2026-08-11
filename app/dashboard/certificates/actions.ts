'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAuth, canCreateArea, canEditOthersArea, canDeleteArea } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import {
  CERTIFICATE_TEMPLATES_COLLECTION,
  mapCertificateTemplateDoc,
  sanitizeCertificateFields,
  type CertificateTemplate,
  type CertificateTemplateWriteInput,
  type CertificatePageLayout,
} from '@/lib/certificate-templates'

function revalidateCertificatePaths(id?: string) {
  revalidatePath('/dashboard/certificates')
  if (id) revalidatePath(`/dashboard/certificates/${id}/edit`)
}

export async function listCertificateTemplates(): Promise<CertificateTemplate[]> {
  await requireAuth()
  if (!adminDb) return []
  const snap = await adminDb.collection(CERTIFICATE_TEMPLATES_COLLECTION).get()
  const list = snap.docs.map((doc) =>
    mapCertificateTemplateDoc(doc.id, doc.data() as Record<string, unknown>),
  )
  list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  return list
}

export async function listActiveCertificateTemplates(): Promise<
  CertificateTemplate[]
> {
  const all = await listCertificateTemplates()
  return all.filter((t) => t.isActive && t.backgroundUrl)
}

export async function getCertificateTemplate(
  id: string,
): Promise<CertificateTemplate | null> {
  await requireAuth()
  const { loadCertificateTemplateById } = await import(
    '@/lib/certificate-templates-db'
  )
  return loadCertificateTemplateById(id)
}

/** Unauthenticated-safe load for PDF routes after session check in the route. */
export async function getCertificateTemplateForIssue(
  id: string,
): Promise<CertificateTemplate | null> {
  const { loadActiveCertificateTemplateById } = await import(
    '@/lib/certificate-templates-db'
  )
  return loadActiveCertificateTemplateById(id)
}

export async function createCertificateTemplate(
  input: CertificateTemplateWriteInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await requireAuth()
  if (!canCreateArea(session, 'certificates')) {
    return { success: false, error: 'You do not have permission to create certificate templates.' }
  }
  if (!adminDb) return { success: false, error: 'Database unavailable.' }

  const name = (input.name || '').trim()
  const backgroundUrl = (input.backgroundUrl || '').trim()
  if (!name) return { success: false, error: 'Name is required.' }
  if (!backgroundUrl) {
    return { success: false, error: 'Background image is required.' }
  }

  const layout: CertificatePageLayout =
    input.page?.layout === 'portrait' ? 'portrait' : 'landscape'

  try {
    const ref = await adminDb.collection(CERTIFICATE_TEMPLATES_COLLECTION).add({
      name,
      description: (input.description || '').trim() || null,
      backgroundUrl,
      page: { size: 'A4', layout },
      fields: sanitizeCertificateFields(input.fields || []),
      isActive: input.isActive !== false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: session.uid,
    })
    revalidateCertificatePaths(ref.id)
    return { success: true, id: ref.id }
  } catch (error) {
    console.error('[certificate-templates] create failed:', error)
    return { success: false, error: 'Failed to create template.' }
  }
}

export async function updateCertificateTemplate(
  id: string,
  input: Partial<CertificateTemplateWriteInput> & {
    fields?: CertificateTemplate['fields']
  },
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  if (!canEditOthersArea(session, 'certificates') && !canCreateArea(session, 'certificates')) {
    return { success: false, error: 'You do not have permission to edit certificate templates.' }
  }
  if (!adminDb) return { success: false, error: 'Database unavailable.' }
  const templateId = id.trim()
  if (!templateId) return { success: false, error: 'Template id required.' }

  const ref = adminDb
    .collection(CERTIFICATE_TEMPLATES_COLLECTION)
    .doc(templateId)
  const existing = await ref.get()
  if (!existing.exists) return { success: false, error: 'Template not found.' }

  const patch: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: session.uid,
  }

  if (typeof input.name === 'string') {
    const name = input.name.trim()
    if (!name) return { success: false, error: 'Name is required.' }
    patch.name = name
  }
  if (typeof input.description === 'string') {
    patch.description = input.description.trim() || null
  }
  if (typeof input.backgroundUrl === 'string') {
    const url = input.backgroundUrl.trim()
    if (!url) return { success: false, error: 'Background image is required.' }
    patch.backgroundUrl = url
  }
  if (input.page) {
    patch.page = {
      size: 'A4',
      layout: input.page.layout === 'portrait' ? 'portrait' : 'landscape',
    }
  }
  if (input.fields) {
    patch.fields = sanitizeCertificateFields(input.fields)
  }
  if (typeof input.isActive === 'boolean') {
    patch.isActive = input.isActive
  }

  try {
    await ref.update(patch)
    revalidateCertificatePaths(templateId)
    return { success: true }
  } catch (error) {
    console.error('[certificate-templates] update failed:', error)
    return { success: false, error: 'Failed to update template.' }
  }
}

export async function duplicateCertificateTemplate(
  id: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await requireAuth()
  if (!canCreateArea(session, 'certificates')) {
    return { success: false, error: 'You do not have permission to create certificate templates.' }
  }
  if (!adminDb) return { success: false, error: 'Database unavailable.' }
  const source = await getCertificateTemplate(id)
  if (!source) return { success: false, error: 'Template not found.' }

  try {
    const ref = await adminDb.collection(CERTIFICATE_TEMPLATES_COLLECTION).add({
      name: `${source.name} (copy)`,
      description: source.description || null,
      backgroundUrl: source.backgroundUrl,
      page: source.page,
      fields: sanitizeCertificateFields(source.fields),
      isActive: source.isActive,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: session.uid,
    })
    revalidateCertificatePaths(ref.id)
    return { success: true, id: ref.id }
  } catch (error) {
    console.error('[certificate-templates] duplicate failed:', error)
    return { success: false, error: 'Failed to duplicate template.' }
  }
}

export async function deleteCertificateTemplate(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  if (!canDeleteArea(session, 'certificates')) {
    return { success: false, error: 'You do not have permission to delete certificate templates.' }
  }
  if (!adminDb) return { success: false, error: 'Database unavailable.' }
  const templateId = id.trim()
  if (!templateId) return { success: false, error: 'Template id required.' }

  try {
    await adminDb
      .collection(CERTIFICATE_TEMPLATES_COLLECTION)
      .doc(templateId)
      .delete()
    revalidateCertificatePaths()
    return { success: true }
  } catch (error) {
    console.error('[certificate-templates] delete failed:', error)
    return { success: false, error: 'Failed to delete template.' }
  }
}
