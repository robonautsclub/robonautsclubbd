/**
 * Path Utilities for File System Operations
 * Handles sanitization and path generation for event-based folder structures
 */
import { join } from 'path'

/**
 * Generates a filesystem-safe slug from an event title
 * Removes special characters, converts to lowercase, replaces spaces with hyphens
 * 
 * @param eventTitle - The event title to convert to a slug
 * @returns A sanitized slug suitable for directory names
 * 
 * Example: "Robotics Workshop 2024!" → "robotics-workshop-2024"
 */
export function generateEventSlug(eventTitle: string): string {
  if (!eventTitle || typeof eventTitle !== 'string') {
    return 'event'
  }

  return eventTitle
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens and alphanumeric
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length to 100 characters for filesystem compatibility
    .substring(0, 100) || 'event'
}

/**
 * Generates the full storage path for a PDF file (relative to project root, in public directory)
 * Files stored in public/uploads will be accessible at /uploads via Next.js static file serving
 * 
 * @param eventSlug - The sanitized event slug (from generateEventSlug)
 * @param bookingId - The booking document ID
 * @returns The relative path for PDF storage (accessible at /uploads/events/...)
 * 
 * Example: "robotics-workshop-2024", "abc123" → "/uploads/events/robotics-workshop-2024/booking-abc123.pdf"
 */
export function getPDFStoragePath(eventSlug: string, bookingId: string): string {
  const sanitizedEventSlug = generateEventSlug(eventSlug)
  const sanitizedBookingId = bookingId.replace(/[^a-zA-Z0-9]/g, '') // Remove any invalid chars from bookingId
  
  return `/uploads/events/${sanitizedEventSlug}/booking-${sanitizedBookingId}.pdf`
}

/**
 * Gets the absolute filesystem path for PDF storage
 * Stores PDFs in public/uploads so they're accessible via URL at /uploads/...
 * Uses process.cwd() to get project root
 * 
 * @param eventSlug - The sanitized event slug
 * @param bookingId - The booking document ID
 * @returns The absolute filesystem path (public/uploads/events/...)
 */
export function getAbsolutePDFPath(eventSlug: string, bookingId: string): string {
  const relativePath = getPDFStoragePath(eventSlug, bookingId)
  // Remove leading slash and prepend 'public' for Next.js static file serving
  const pathWithoutLeadingSlash = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath
  return join(process.cwd(), 'public', pathWithoutLeadingSlash)
}

/**
 * Gets the directory path for an event (without filename)
 * This is the URL path, not the filesystem path
 * 
 * @param eventSlug - The sanitized event slug
 * @returns The directory path (URL path)
 */
export function getEventDirectoryPath(eventSlug: string): string {
  const sanitizedEventSlug = generateEventSlug(eventSlug)
  return `/uploads/events/${sanitizedEventSlug}`
}

/**
 * Gets the absolute directory path for an event (filesystem path in public directory)
 * 
 * @param eventSlug - The sanitized event slug
 * @returns The absolute directory path (public/uploads/events/...)
 */
export function getAbsoluteEventDirectoryPath(eventSlug: string): string {
  const relativePath = getEventDirectoryPath(eventSlug)
  const pathWithoutLeadingSlash = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath
  return join(process.cwd(), 'public', pathWithoutLeadingSlash)
}
