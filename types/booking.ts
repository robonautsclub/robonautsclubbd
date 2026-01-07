// Booking type for Firestore bookings collection
export type Booking = {
  id: string // Firestore document ID
  eventId: string // Reference to event document
  name: string
  school: string
  email: string
  information: string
  createdAt: Date | string
}

