import type {
  RobofestRegistration,
  RobofestRegistrationStatus,
} from '@/lib/robofest-content'

export type RobofestRegistrationListFilters = {
  status: RobofestRegistrationStatus
  category?: string
  roundCity?: string
  ageCategory?: string
}

export type RobofestRegistrationCursor = {
  createdAt: string
  id: string
}

export type RobofestRegistrationPage = {
  items: RobofestRegistration[]
  nextCursor: RobofestRegistrationCursor | null
  hasMore: boolean
}

export type RobofestRegistrationStatusCounts = {
  pending: number
  confirmed: number
  cancelled: number
}
