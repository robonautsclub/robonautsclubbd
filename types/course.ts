// Course type for Firestore storage
export type Course = {
  id: string // Firestore document ID
  title: string
  level: string // e.g., "Beginner-Intermediate", "For All", "All Levels"
  blurb: string // Short description
  href: string // Course detail page URL
  image: string // Cloudinary URL
  isArchived: boolean // Default: false
  // Firestore metadata
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // UID of the admin who created it
  createdByName?: string // Name of the admin who created it
  createdByEmail?: string // Email of the admin who created it
}

