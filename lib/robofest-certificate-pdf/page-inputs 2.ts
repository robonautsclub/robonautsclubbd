import type {
  RobofestContent,
  RobofestRegistration,
} from '@/lib/robofest-content'
import { resolveRobofestAwardCategory } from '@/lib/robofest-award-categories'
import type { RobofestCertificateSignature } from '@/lib/robofest-certificate-signatures'
import {
  buildCertificateVerificationUrl,
} from './assets'
import { buildRobofestCertificateId } from './participants'
import type { CertificatePageInput, CertificateParticipant } from './types'

export async function buildPageInputs(
  registration: RobofestRegistration,
  content: RobofestContent,
  logoBuffer: Buffer | null,
  robotBuffer: Buffer | null,
  participants: CertificateParticipant[],
  baseUrl: string,
  signatures: RobofestCertificateSignature[],
  signatureImages: Record<string, Buffer>,
): Promise<CertificatePageInput[]> {
  const { generateQRCodeBuffer } = await import('../qrCode')
  const registrationId = registration.registrationId || ''

  const pages: CertificatePageInput[] = []
  for (const participant of participants) {
    const award = resolveRobofestAwardCategory(
      content.awardCategories,
      participant.awardCategoryId,
    )
    const verificationUrl = buildCertificateVerificationUrl(
      baseUrl,
      registrationId,
      participant.memberIndex,
    )
    let qrBuffer: Buffer | null = null
    try {
      qrBuffer = await generateQRCodeBuffer(verificationUrl, 320)
    } catch (error) {
      console.error('[robofest-certificate] QR generate failed:', error)
    }
    pages.push({
      participant,
      registration,
      content,
      logoBuffer,
      robotBuffer,
      award,
      verificationUrl,
      qrBuffer,
      certificateId: buildRobofestCertificateId(
        registrationId,
        participant.memberIndex,
      ),
      signatures,
      signatureImages,
    })
  }
  return pages
}
