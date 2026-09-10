// Booking type for Firestore bookings collection
export type Booking = {
  id: string // Firestore document ID
  eventId: string // Reference to event document
  registrationId: string // Unique registration ID (format: REG-YYYYMMDD-XXXXX)
  pdfUrl?: string // Cloudinary URL to stored PDF confirmation document
  pdfGenerated?: boolean
  pdfGeneratedAt?: Date | string
  pdfError?: string
  name: string
  school: string
  email: string
  phone: string
  category?: string
  bkashNumber?: string
  paymentGateway?: 'bkash' | 'manual'
  paymentStatus?: 'paid' | 'n/a'
  paymentId?: string
  trxId?: string
  amountPaid?: number
  paidAt?: Date | string
  information: string
  customAnswers?: Record<string, string | string[] | number>
  emailSent?: boolean
  emailSentAt?: Date | string
  emailError?: string
  emailFailedAt?: Date | string
  emailSendCount?: number
  createdAt: Date | string
}

