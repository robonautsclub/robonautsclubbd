// Booking type for Firestore bookings collection
export type Booking = {
  id: string // Firestore document ID
  eventId: string // Reference to event document
  registrationId: string // Unique registration ID (format: REG-YYYYMMDD-XXXXX)
  pdfUrl?: string // Cloudinary URL to stored PDF confirmation document
  name: string
  school: string
  email: string
  phone: string
  bkashNumber?: string
  information: string
  createdAt: Date | string
}

