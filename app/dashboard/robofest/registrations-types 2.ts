import type {
  RobofestRegistration,
  RobofestRegistrationStatus,
} from '@/lib/robofest-content'

export type RobofestRegistrationListFilters = {
  status: RobofestRegistrationStatus
  category?: string
  roundCity?: string
  ageCategory?: string
  /** Global substring search across team / member / contact fields. */
  search?: string
}

export type RobofestRegistrationCursor = {
  createdAt: string
  id: string
}

export type RobofestRegistrationPage = {
  items: RobofestRegistration[]
  nextCursor: RobofestRegistrationCursor | null
  hasMore: boolean
  /** Total rows matching filters (incl. search) when known; used for pager. */
  matchedTotal?: number | null
}

export type RobofestRegistrationStatusCounts = {
  pending: number
  confirmed: number
  cancelled: number
}

/** Overview totals for every registration matching the current filters. */
export type RobofestRegistrationStats = {
  total: number
  registrations: number
  byCategory: [string, number][]
  byAge: [string, number][]
  paidTotal: number
  paidCount: number
}

export const EMPTY_ROBOFEST_REGISTRATION_STATS: RobofestRegistrationStats = {
  total: 0,
  registrations: 0,
  byCategory: [],
  byAge: [],
  paidTotal: 0,
  paidCount: 0,
}

export type RobofestCampusAmbassadorReferralStats = {
  teams: number
  members: number
}

export const EMPTY_ROBOFEST_CAMPUS_AMBASSADOR_REFERRAL_STATS: RobofestCampusAmbassadorReferralStats =
  {
    teams: 0,
    members: 0,
  }
