export type EventCategory = {
  name: string
  amount?: number
}

export const CUSTOM_FORM_FIELD_TYPES = [
  'shortText',
  'longText',
  'number',
  'email',
  'phone',
  'select',
  'radio',
  'checkbox',
] as const

export type CustomFormFieldType = (typeof CUSTOM_FORM_FIELD_TYPES)[number]

export type EventCustomFormField = {
  id: string
  label: string
  type: CustomFormFieldType
  required: boolean
  placeholder?: string
  options?: string[]
}

export type EventDefaultRegistrationFields = {
  name: { enabled: true; required: true }
  email: { enabled: true; required: true }
  phone: { enabled: true; required: true }
  school: { enabled: boolean; required: boolean }
  category: { enabled: boolean; required: boolean }
  information: { enabled: boolean; required: boolean }
}

// Event type extending the existing structure from app/(marketing)/events/data.ts
// with Firestore-specific fields
export type Event = {
  id: string // Firestore document ID
  title: string
  date: string | string[] // Single date string or array of dates
  time?: string
  location: string
  description: string
  fullDescription?: string
  image?: string
  eligibility?: string
  venue?: string
  agenda?: string
  tags?: string[] // Event tags for categorization
  categories?: EventCategory[] // Optional categories (paid events can have per-category fee)
  isPaid?: boolean
  amount?: number // Fee amount (e.g. BDT)
  paymentBkashNumber?: string // bKash number for participants to pay to (set by event creator)
  contactPersonName?: string
  contactPersonDesignation?: string
  contactPersonMobileOrEmail?: string
  registrationClosingDate?: string // Optional ISO date (YYYY-MM-DD); registration closes at end of this day
  registrationDisabled?: boolean // When true, registration is closed regardless of date (Super Admin or event creator can toggle)
  customFormFields?: EventCustomFormField[]
  defaultRegistrationFields?: EventDefaultRegistrationFields
  // Firestore metadata
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // UID of the admin who created it
  createdByName?: string // Name of the admin who created it
  createdByEmail?: string // Email of the admin who created it
}

