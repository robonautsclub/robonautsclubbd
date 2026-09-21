'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { requireAuth, canCreateArea, canEditOthersArea, canDeleteArea } from '@/lib/auth'
import {
  collectionAdd,
  collectionDelete,
  collectionGet,
  collectionGetAll,
  collectionSet,
} from '@/lib/db/collections'
import {
  CERTIFICATE_TEMPLATES_COLLECTION,
  mapCertificateTemplateDoc,
  sanitizeCertificateFields,
  type CertificateTemplate,
  type CertificateTemplateWriteInput,
  type CertificatePageLayout,
} from '@/lib/certificate-templates'

const CERTIFICATE_TEMPLATES_CACHE_TAG = 'certificate-templates'

function revalidateCertificatePaths(id?: string) {
  revalidateTag(CERTIFICATE_TEMPLATES_CACHE_TAG, 'max')
  revalidatePath('/dashboard/certificates')
  if (id) revalidatePath(`/dashboard/certificates/${id}/edit`)
}

async function fetchCertificateTemplatesFromDb(): Promise<CertificateTemplate[]> {
  const docs = await collectionGetAll(CERTIFICATE_TEMPLATES_COLLECTION)
  const list = docs.map((doc) =>
    mapCertificateTemplateDoc(String(doc.id), doc as Record<string, unknown>),
  )
  list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  return list
}

export async function listCertificateTemplates(): Promise<CertificateTemplate[]> {
  await requireAuth()
  try {
    return await unstable_cache(
      fetchCertificateTemplatesFromDb,
      [CERTIFICATE_TEMPLATES_CACHE_TAG],
      { tags: [CERTIFICATE_TEMPLATES_CACHE_TAG], revalidate: 600 },
    )()
  } catch (error) {
    console.error('[certificate-templates] list failed:', error)
    return []
  }
}

export async function listActiveCertificateTemplates(): Promise<CertificateTemplate[]> {
  const all = await listCertificateTemplates()
  return all.filter((t) => t.isActive && t.backgroundUrl)
}

export async function getCertificateTemplate(id: string): Promise<CertificateTemplate | null> {
  await requireAuth()
  const { loadCertificateTemplateById } = await import('@/lib/certificate-templates-db')
  return loadCertificateTemplateById(id)
}

export async function getCertificateTemplateForIssue(
  id: string,
): Promise<CertificateTemplate | null> {
  const { loadActiveCertificateTemplateById } = await import('@/lib/certificate-templates-db')
  return loadActiveCertificateTemplateById(id)
}

export async function createCertificateTemplate(
  input: CertificateTemplateWriteInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await requireAuth()
  if (!canCreateArea(session, 'certificates')) {
    return { success: false, error: 'You do not have permission to create certificate templates.' }
  }

  const name = (input.name || '').trim()
  const backgroundUrl = (input.backgroundUrl || '').trim()
  if (!name) return { success: false, error: 'Name is required.' }
  if (!backgroundUrl) {
    return { success: false, error: 'Background image is required.' }
  }

  const layout: CertificatePageLayout =
    input.page?.layout === 'portrait' ? 'portrait' : 'landscape'
  const now = new Date().toISOString()

  try {
    const id = await collectionAdd(CERTIFICATE_TEMPLATES_COLLECTION, {
      name,
      description: (input.description || '').trim() || null,
      backgroundUrl,
      page: { size: 'A4', layout },
      fields: sanitizeCertificateFields(input.fields || []),
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now,
      updatedBy: session.uid,
    })
    revalidateCertificatePaths(id)
    return { success: true, id }
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
  const templateId = id.trim()
  if (!templateId) return { success: false, error: 'Template id required.' }

  const existing = await collectionGet(CERTIFICATE_TEMPLATES_COLLECTION, templateId)
  if (!existing) return { success: false, error: 'Template not found.' }

  const patch: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
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
    await collectionSet(CERTIFICATE_TEMPLATES_COLLECTION, templateId, patch, { merge: true })
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
  const source = await getCertificateTemplate(id)
  if (!source) return { success: false, error: 'Template not found.' }

  const now = new Date().toISOString()
  try {
    const newId = await collectionAdd(CERTIFICATE_TEMPLATES_COLLECTION, {
      name: `${source.name} (copy)`,
      description: source.description || null,
      backgroundUrl: source.backgroundUrl,
      page: source.page,
      fields: sanitizeCertificateFields(source.fields),
      isActive: source.isActive,
      createdAt: now,
      updatedAt: now,
      updatedBy: session.uid,
    })
    revalidateCertificatePaths(newId)
    return { success: true, id: newId }
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
  const templateId = id.trim()
  if (!templateId) return { success: false, error: 'Template id required.' }

  try {
    await collectionDelete(CERTIFICATE_TEMPLATES_COLLECTION, templateId)
    revalidateCertificatePaths()
    return { success: true }
  } catch (error) {
    console.error('[certificate-templates] delete failed:', error)
    return { success: false, error: 'Failed to delete template.' }
  }
}
