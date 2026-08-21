import type {
  RobofestContent,
  RobofestRegistration,
} from '@/lib/robofest-content'
import type {
  RobofestAwardCategory,
  RobofestCertificateType,
} from '@/lib/robofest-award-categories'
import { sanitizeTextForPDF } from '@/lib/textSanitizer'

export function safeFilenamePart(value: string): string {
  return (
    sanitizeTextForPDF(value)
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'participant'
  )
}

export function teamLabel(registration: RobofestRegistration): string {
  return (
    registration.teamNumber?.trim() ||
    registration.name?.trim() ||
    ''
  )
}

export function eventTitle(content: RobofestContent): string {
  return (
    sanitizeTextForPDF(content.headline)?.trim() ||
    'RoboFest Bangladesh 2026'
  )
}

export function organizerLine(content: RobofestContent): string {
  const presents = sanitizeTextForPDF(content.presentsLabel)?.trim()
  const host = sanitizeTextForPDF(content.hostName)?.trim()
  if (presents) return presents
  if (host) return `${host} Presents`
  return 'Robonauts Ltd Presents'
}

export function isParticipationAward(award: RobofestAwardCategory): boolean {
  const type = (award.certificateType ||
    (award.id === 'participant' ? 'participation' : 'achievement')) as
    | RobofestCertificateType
    | string
  return type === 'participation' || award.id === 'participant'
}

export function fitNameFontSize(name: string, maxWidth: number): number {
  const len = name.length
  if (len <= 18) return 32
  if (len <= 28) return 26
  if (len <= 40) return 22
  if (len <= 55) return 18
  void maxWidth
  return 15
}
