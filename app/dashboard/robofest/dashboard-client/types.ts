import type { RobofestContent, RobofestRegistration } from '@/lib/robofest-content'
import type { RobofestCampusAmbassador } from '@/lib/robofest-campus-ambassadors'
import type {
  RobofestRegistrationCursor,
  RobofestRegistrationStatusCounts,
} from '../registrations-types'

export type Props = {
  initialContent: RobofestContent
  initialRegistrations: RobofestRegistration[]
  initialNextCursor: RobofestRegistrationCursor | null
  initialHasMore: boolean
  initialStatusCounts: RobofestRegistrationStatusCounts
  schools: string[]
  campusAmbassadors: RobofestCampusAmbassador[]
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
