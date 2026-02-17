// Event type extending the existing structure from app/events/data.ts
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
  isPaid?: boolean
  amount?: number // Fee amount (e.g. BDT)
  paymentBkashNumber?: string // bKash number for participants to pay to (set by event creator)
  // Firestore metadata
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // UID of the admin who created it
  createdByName?: string // Name of the admin who created it
  createdByEmail?: string // Email of the admin who created it
}

