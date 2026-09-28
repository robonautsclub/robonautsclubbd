import type { RobofestContent, RobofestRegistration } from '@/lib/robofest-content'
import type { RobofestCampusAmbassador } from '@/lib/robofest-campus-ambassadors'
import type {
  RobofestCampusAmbassadorReferralStats,
  RobofestRegistrationCursor,
  RobofestRegistrationStats,
  RobofestRegistrationStatusCounts,
} from '../registrations-types'

export type Props = {
  initialContent: RobofestContent
  initialRegistrations: RobofestRegistration[]
  initialNextCursor: RobofestRegistrationCursor | null
  initialHasMore: boolean
  initialStatusCounts: RobofestRegistrationStatusCounts
  initialStats: RobofestRegistrationStats
  schools: string[]
  campusAmbassadors: RobofestCampusAmbassador[]
  referralCounts?: Record<string, RobofestCampusAmbassadorReferralStats>
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canViewPayments?: boolean
  canSendMail?: boolean
  canExportCsv?: boolean
  canExportExcel?: boolean
  canExportPdf?: boolean
}

export type StatusTone = {
  badge: string
  bar: string
  chip: string
}
