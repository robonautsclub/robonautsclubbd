import { format } from 'date-fns'
import type {
  RobofestContent,
  RobofestRegistration,
} from '@/lib/robofest-content'
import { resolveRobofestRoundVenueLabel } from '@/lib/robofest-content'
import { resolveRobofestAwardCategory } from '@/lib/robofest-award-categories'
import type { CertificateRenderValues } from '@/lib/certificate-template-pdf'
import { resolveCertificateAwardFields } from '@/lib/certificate-templates'
import { buildCertificateVerificationUrl } from './assets'
import { buildRobofestCertificateId } from './participants'
import type { CertificateParticipant } from './types'

export function buildTemplateCertificatePage(
  participant: CertificateParticipant,
  registration: RobofestRegistration,
  content: RobofestContent,
  baseUrl: string,
  signatureSlots: NonNullable<CertificateRenderValues['signatureSlots']>,
): CertificateRenderValues {
  const award = resolveRobofestAwardCategory(
    content.awardCategories,
    participant.awardCategoryId,
  )
  const category = registration.category || ''
  const awardFields = resolveCertificateAwardFields(award, { category })
  const certificateId = buildRobofestCertificateId(
    registration.registrationId!,
    participant.memberIndex,
  )
  return {
    recipientName: participant.name,
    school: participant.school || registration.school || '',
    grade: participant.grade || '',
    category,
    eventTitle: content.headline || 'RoboFest Bangladesh 2026',
    eventDate: content.dateLabel || '',
    venue: resolveRobofestRoundVenueLabel(content, registration.roundCity),
    teamNumber: registration.teamNumber || registration.name || '',
    certificateTitle: awardFields.certificateTitle,
    certificateBody: awardFields.certificateBody,
    awardLabel: awardFields.awardLabel,
    registrationId: registration.registrationId!,
    certificateId,
    issueDate: format(
      registration.createdAt
        ? new Date(registration.createdAt)
        : new Date(),
      'dd MMMM yyyy',
    ),
    verificationUrl: buildCertificateVerificationUrl(
      baseUrl,
      registration.registrationId!,
      participant.memberIndex,
    ),
    signatureSlots,
  }
}
