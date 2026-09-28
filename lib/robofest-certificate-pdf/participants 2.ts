import type { RobofestRegistration } from '@/lib/robofest-content'
import type { CertificateParticipant } from './types'

export function buildRobofestCertificateId(
  registrationId: string,
  memberIndex: number,
): string {
  return `RF26-${registrationId}-M${memberIndex + 1}`
}

export function resolveCertificateParticipants(
  registration: RobofestRegistration,
): CertificateParticipant[] {
  const members = registration.teamMembers?.filter((m) => m?.name?.trim()) || []
  if (members.length > 0) {
    return members.map((m, index) => ({
      name: m.name.trim(),
      school: m.school?.trim() || registration.school || undefined,
      grade: m.grade?.trim() || undefined,
      memberIndex: index,
      awardCategoryId: m.awardCategoryId,
    }))
  }

  const fallbackName =
    registration.name?.trim() ||
    registration.email?.trim() ||
    'Participant'
  return [
    {
      name: fallbackName,
      school: registration.school?.trim() || undefined,
      grade: undefined,
      memberIndex: 0,
      awardCategoryId: 'participant',
    },
  ]
}
