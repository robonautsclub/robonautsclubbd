/**
 * Server-only D1 access for certificate templates.
 */

import { collectionGet } from '@/lib/db/collections'
import {
  CERTIFICATE_TEMPLATES_COLLECTION,
  mapCertificateTemplateDoc,
  type CertificateTemplate,
} from '@/lib/certificate-templates'

export async function loadCertificateTemplateById(
  id: string,
): Promise<CertificateTemplate | null> {
  if (!id.trim()) return null
  const doc = await collectionGet(CERTIFICATE_TEMPLATES_COLLECTION, id.trim())
  if (!doc) return null
  return mapCertificateTemplateDoc(String(doc.id), doc as Record<string, unknown>)
}

export async function loadActiveCertificateTemplateById(
  id: string,
): Promise<CertificateTemplate | null> {
  const template = await loadCertificateTemplateById(id)
  if (!template?.isActive || !template.backgroundUrl) return null
  return template
}
