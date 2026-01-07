// Event type extending the existing structure from app/events/data.ts
// with Firestore-specific fields
export type Event = {
  id: string // Firestore document ID
  title: string
  date: string
  time?: string
  location: string
  description: string
  fullDescription?: string
  image?: string
  eligibility?: string
  venue?: string
  agenda?: string
  // Firestore metadata
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // UID of the admin who created it
}

