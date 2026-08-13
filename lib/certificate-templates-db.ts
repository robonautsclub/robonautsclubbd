/**
 * Server-only Firestore access for certificate templates.
 */

import { adminDb } from '@/lib/firebase-admin'
import {
  CERTIFICATE_TEMPLATES_COLLECTION,
  mapCertificateTemplateDoc,
  type CertificateTemplate,
} from '@/lib/certificate-templates'

export async function loadCertificateTemplateById(
  id: string,
): Promise<CertificateTemplate | null> {
  if (!adminDb || !id.trim()) return null
  const doc = await adminDb
    .collection(CERTIFICATE_TEMPLATES_COLLECTION)
    .doc(id.trim())
    .get()
  if (!doc.exists) return null
  return mapCertificateTemplateDoc(
    doc.id,
    doc.data() as Record<string, unknown>,
  )
}

export async function loadActiveCertificateTemplateById(
  id: string,
): Promise<CertificateTemplate | null> {
  const template = await loadCertificateTemplateById(id)
  if (!template?.isActive || !template.backgroundUrl) return null
  return template
}
