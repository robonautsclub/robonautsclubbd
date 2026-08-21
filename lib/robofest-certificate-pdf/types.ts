import type {
  RobofestContent,
  RobofestRegistration,
} from '@/lib/robofest-content'
import type { RobofestCertificateSignature } from '@/lib/robofest-certificate-signatures'
import type {
  RobofestAwardAccent,
  RobofestAwardCategory,
} from '@/lib/robofest-award-categories'

export type CertificateParticipant = {
  name: string
  school?: string
  grade?: string
  memberIndex: number
  awardCategoryId?: string
}

export type CertificatePageInput = {
  participant: CertificateParticipant
  registration: RobofestRegistration
  content: RobofestContent
  logoBuffer: Buffer | null
  robotBuffer: Buffer | null
  award: RobofestAwardCategory
  verificationUrl: string
  qrBuffer: Buffer | null
  certificateId: string
  signatures: RobofestCertificateSignature[]
  /** signature id → image buffer */
  signatureImages: Record<string, Buffer>
}

export const ACCENT_HEX: Record<RobofestAwardAccent, string> = {
  cyan: '#06b6d4',
  gold: '#ca8a04',
  silver: '#64748b',
  bronze: '#b45309',
  slate: '#334155',
}

export const COLORS = {
  navy: '#0a1628',
  navyMid: '#0f2744',
  navyDeep: '#06101c',
  cyan: '#06b6d4',
  cyanSoft: '#22d3ee',
  ink: '#0f172a',
  mute: '#475569',
  faint: '#94a3b8',
  line: '#cbd5e1',
  rightBg: '#f8fafc',
  white: '#ffffff',
  hex: '#e2e8f0',
}

export const FOOTER_TAGLINE = 'Imagine • Build • Innovate • Inspire'
