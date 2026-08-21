import { format } from 'date-fns'
import type {
  RobofestContent,
  RobofestRegistration,
} from '@/lib/robofest-content'
import { resolveRobofestCertificateSignatures } from '@/lib/robofest-certificate-signatures'
import { generateCertificatesFromTemplate } from '@/lib/certificate-template-pdf'
import { loadActiveCertificateTemplateById } from '@/lib/certificate-templates-db'
import {
  buildTemplateSignatureSlots,
  loadCertLogo,
  loadRobotBuffer,
  loadSignatureImages,
  resolveBaseUrl,
} from './assets'
import { buildCertificatesPdf } from './build-pdf'
import { safeFilenamePart } from './labels'
import { buildPageInputs } from './page-inputs'
import { resolveCertificateParticipants } from './participants'
import { buildTemplateCertificatePage } from './template-pages'
import type { CertificatePageInput } from './types'

export async function generateRobofestParticipationCertificatesPDF(input: {
  registration: RobofestRegistration
  content: RobofestContent
  memberIndex?: number
  baseUrl?: string
}): Promise<{ buffer: Buffer; filename: string } | { error: string }> {
  const { registration, content, memberIndex } = input
  const baseUrl = resolveBaseUrl(input.baseUrl)

  if (!registration.registrationId) {
    return { error: 'Registration ID is missing.' }
  }
  if (registration.status === 'cancelled') {
    return { error: 'Cannot generate certificates for a cancelled registration.' }
  }

  const participants = resolveCertificateParticipants(registration)
  const selected =
    typeof memberIndex === 'number'
      ? participants.filter((p) => p.memberIndex === memberIndex)
      : participants

  if (selected.length === 0) {
    return { error: 'Participant not found on this registration.' }
  }

  const templateId = content.certificateTemplateId?.trim()
  if (templateId) {
    const template = await loadActiveCertificateTemplateById(templateId)
    if (!template) {
      return {
        error:
          'Assigned certificate template is missing or inactive. Clear it in Robofest Content or fix the template.',
      }
    }
    const signatureSlots = buildTemplateSignatureSlots(content)
    const pages = selected.map((participant) =>
      buildTemplateCertificatePage(
        participant,
        registration,
        content,
        baseUrl,
        signatureSlots,
      ),
    )

    const result = await generateCertificatesFromTemplate({
      template,
      pages,
      filename:
        typeof memberIndex === 'number' && selected[0]
          ? `Robofest-Certificate-${registration.registrationId}-${memberIndex + 1}.pdf`
          : `Robofest-Certificate-${registration.registrationId}.pdf`,
    })
    return result
  }

  try {
    const logoBuffer = await loadCertLogo(baseUrl)
    const robotBuffer = loadRobotBuffer()
    const signatures = resolveRobofestCertificateSignatures(content)
    const signatureImages = await loadSignatureImages(signatures)
    const pages = await buildPageInputs(
      registration,
      content,
      logoBuffer,
      robotBuffer,
      selected,
      baseUrl,
      signatures,
      signatureImages,
    )
    const buffer = await buildCertificatesPdf(pages)

    if (typeof memberIndex === 'number' && selected[0] && pages[0]) {
      const part = safeFilenamePart(selected[0].name)
      const awardSlug = safeFilenamePart(pages[0].award.label)
      return {
        buffer,
        filename: `Robofest-Certificate-${registration.registrationId}-${memberIndex + 1}-${awardSlug}-${part}.pdf`,
      }
    }

    return {
      buffer,
      filename: `Robofest-Certificate-${registration.registrationId}.pdf`,
    }
  } catch (error) {
    console.error('[robofest-certificate] generate failed:', error)
    return { error: 'Failed to generate participation certificate.' }
  }
}

export async function generateRobofestBulkParticipationCertificatesPDF(input: {
  registrations: RobofestRegistration[]
  content: RobofestContent
  statusLabel?: string
  baseUrl?: string
}): Promise<{ buffer: Buffer; filename: string } | { error: string }> {
  const { registrations, content, statusLabel } = input
  const baseUrl = resolveBaseUrl(input.baseUrl)
  const eligible = registrations.filter((r) => r.status !== 'cancelled')

  const templateId = content.certificateTemplateId?.trim()
  if (templateId) {
    const template = await loadActiveCertificateTemplateById(templateId)
    if (!template) {
      return {
        error:
          'Assigned certificate template is missing or inactive. Clear it in Robofest Content or fix the template.',
      }
    }
    const signatureSlots = buildTemplateSignatureSlots(content)
    const pages = []
    for (const registration of eligible) {
      if (!registration.registrationId) continue
      for (const participant of resolveCertificateParticipants(registration)) {
        pages.push(
          buildTemplateCertificatePage(
            participant,
            registration,
            content,
            baseUrl,
            signatureSlots,
          ),
        )
      }
    }
    if (pages.length === 0) {
      return { error: 'No participants found to generate certificates for.' }
    }
    const stamp = format(new Date(), 'yyyy-MM-dd')
    const statusPart = safeFilenamePart(statusLabel || 'export')
    return generateCertificatesFromTemplate({
      template,
      pages,
      filename: `Robofest-Certificates-${statusPart}-${stamp}.pdf`,
    })
  }

  const logoBuffer = await loadCertLogo(baseUrl)
  const robotBuffer = loadRobotBuffer()
  const signatures = resolveRobofestCertificateSignatures(content)
  const signatureImages = await loadSignatureImages(signatures)
  const pages: CertificatePageInput[] = []

  for (const registration of eligible) {
    if (!registration.registrationId) continue
    pages.push(
      ...(await buildPageInputs(
        registration,
        content,
        logoBuffer,
        robotBuffer,
        resolveCertificateParticipants(registration),
        baseUrl,
        signatures,
        signatureImages,
      )),
    )
  }

  if (pages.length === 0) {
    return { error: 'No participants found to generate certificates for.' }
  }

  try {
    const buffer = await buildCertificatesPdf(pages)
    const stamp = format(new Date(), 'yyyy-MM-dd')
    const statusPart = safeFilenamePart(statusLabel || 'export')
    return {
      buffer,
      filename: `Robofest-Certificates-${statusPart}-${stamp}.pdf`,
    }
  } catch (error) {
    console.error('[robofest-certificate] bulk generate failed:', error)
    return { error: 'Failed to generate participation certificates.' }
  }
}
