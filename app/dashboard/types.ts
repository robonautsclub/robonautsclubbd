import type { Event, EventCategory } from '@/types/event'
import type { Course } from '@/types/course'
import type { NewsArticle } from '@/types/news'
import type { GalleryGroup } from '@/types/gallery'

export type DashboardNotification = {
  id: string
  type: string
  message: string
  userId: string
  userName: string
  userEmail: string
  changes: string[]
  readBy: string[]
  isRead: boolean
  createdAt: string
}

export type DashboardMember = {
  uid: string
  email: string
  displayName: string
  emailVerified: boolean
  role: 'superAdmin' | 'admin'
  createdAt: string
  lastSignIn: string | null
  disabled: boolean
}

export type DashboardEventRealtime = Pick<
  Event,
  | 'id'
  | 'title'
  | 'date'
  | 'time'
  | 'location'
  | 'description'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'createdByName'
  | 'createdByEmail'
> & {
  fullDescription?: string
  eligibility?: string
  venue?: string
  agenda?: string
  image?: string
  tags?: string[]
  categories?: EventCategory[]
  isPaid?: boolean
  amount?: number
  paymentBkashNumber?: string
  registrationClosingDate?: string
  registrationDisabled?: boolean
}

export type DashboardBootstrapData = {
  events: DashboardEventRealtime[]
  courses: Course[]
  news: NewsArticle[]
  galleryGroups: GalleryGroup[]
  notifications: DashboardNotification[]
  members: DashboardMember[]
}
