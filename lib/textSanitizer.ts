/**
 * Text Sanitization Utility for PDF Generation and Database Storage
 * Ensures clean English-only text output without emojis or unsupported characters
 * Times New Roman compatible format
 */

/**
 * Removes emojis from text
 * Emojis are Unicode characters in the ranges:
 * - U+1F300 to U+1F9FF (Misc Symbols and Pictographs)
 * - U+1F600 to U+1F64F (Emoticons)
 * - U+1F680 to U+1F6FF (Transport and Map)
 * - U+2600 to U+26FF (Misc symbols)
 * - U+2700 to U+27BF (Dingbats)
 * - U+FE00 to U+FE0F (Variation Selectors)
 * - U+200D (Zero Width Joiner)
 */
function removeEmojis(text: string): string {
  // Comprehensive emoji regex pattern
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu
  return text.replace(emojiRegex, '')
}

/**
 * Removes non-ASCII characters except common punctuation and symbols used in English
 * Keeps: A-Z, a-z, 0-9, and common punctuation: . , ! ? : ; ' " - ( ) [ ] { } / \ & @ # $ % * + = < > | _ ~ `
 */
function removeNonASCII(text: string): string {
  // Allow ASCII printable characters (32-126) which includes:
  // - Letters (A-Z, a-z)
  // - Numbers (0-9)
  // - Common punctuation and symbols
  // Also allow newlines, tabs, and carriage returns for formatting
  return text
    .split('')
    .filter(char => {
      const code = char.charCodeAt(0)
      // Allow ASCII printable (32-126) plus newline (10), tab (9), carriage return (13)
      return (code >= 32 && code <= 126) || code === 10 || code === 9 || code === 13
    })
    .join('')
}

/**
 * Normalizes whitespace - replaces multiple spaces with single space, preserves newlines, trims edges
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space (preserves newlines)
    .replace(/\n[ \t]+/g, '\n') // Remove leading spaces/tabs after newlines
    .replace(/[ \t]+\n/g, '\n') // Remove trailing spaces/tabs before newlines
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines to maximum of 2
    .trim() // Trim leading and trailing whitespace
}

/**
 * Sanitizes text for PDF generation
 * Removes emojis, non-ASCII characters (except English), and normalizes whitespace
 * 
 * @param text - The text to sanitize
 * @returns Clean English-only text ready for PDF rendering
 */
export function sanitizeTextForPDF(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // Step 1: Remove emojis
  let sanitized = removeEmojis(text)

  // Step 2: Remove non-ASCII characters (keep only English ASCII)
  sanitized = removeNonASCII(sanitized)

  // Step 3: Normalize whitespace
  sanitized = normalizeWhitespace(sanitized)

  return sanitized
}

/**
 * Sanitizes an event object for PDF generation
 * Applies sanitization to all text fields
 */
export function sanitizeEventForPDF(event: {
  title?: string
  description?: string
  fullDescription?: string
  venue?: string
  location?: string
  eligibility?: string
  time?: string
  agenda?: string
}): {
  title: string
  description: string
  fullDescription: string
  venue: string
  location: string
  eligibility: string
  time: string
  agenda: string
} {
  return {
    title: sanitizeTextForPDF(event.title) || 'Event',
    description: sanitizeTextForPDF(event.description) || '',
    fullDescription: sanitizeTextForPDF(event.fullDescription) || sanitizeTextForPDF(event.description) || '',
    venue: sanitizeTextForPDF(event.venue) || '',
    location: sanitizeTextForPDF(event.location) || '',
    eligibility: sanitizeTextForPDF(event.eligibility) || '',
    time: sanitizeTextForPDF(event.time) || '',
    agenda: sanitizeTextForPDF(event.agenda) || '',
  }
}

/**
 * Sanitizes booking details for PDF generation
 */
export function sanitizeBookingDetailsForPDF(bookingDetails: {
  name?: string
  school?: string
  email?: string
  phone?: string
  bkashNumber?: string
  information?: string
}): {
  name: string
  school: string
  email: string
  phone: string
  bkashNumber: string
  information: string
} {
  return {
    name: sanitizeTextForPDF(bookingDetails.name) || '',
    school: sanitizeTextForPDF(bookingDetails.school) || '',
    email: sanitizeTextForPDF(bookingDetails.email) || '',
    phone: sanitizeTextForPDF(bookingDetails.phone) || '',
    bkashNumber: sanitizeTextForPDF(bookingDetails.bkashNumber) || '',
    information: sanitizeTextForPDF(bookingDetails.information) || '',
  }
}

/**
 * Sanitizes an event object for database storage
 * Applies sanitization to all text fields before saving to Firestore
 * Preserves empty strings as empty (doesn't add defaults)
 * 
 * @param eventData - The event data to sanitize
 * @returns Sanitized event data ready for database storage
 */
export function sanitizeEventForDatabase(eventData: {
  title?: string
  description?: string
  fullDescription?: string
  venue?: string
  location?: string
  eligibility?: string
  time?: string
  agenda?: string
  tags?: string[]
}): {
  title: string
  description: string
  fullDescription: string
  venue: string
  location: string
  eligibility: string
  time: string
  agenda: string
  tags: string[]
} {
  // Sanitize all text fields
  const sanitizedTitle = sanitizeTextForPDF(eventData.title)
  const sanitizedDescription = sanitizeTextForPDF(eventData.description)
  const sanitizedFullDescription = sanitizeTextForPDF(eventData.fullDescription)
  const sanitizedVenue = sanitizeTextForPDF(eventData.venue)
  const sanitizedLocation = sanitizeTextForPDF(eventData.location)
  const sanitizedEligibility = sanitizeTextForPDF(eventData.eligibility)
  const sanitizedTime = sanitizeTextForPDF(eventData.time)
  const sanitizedAgenda = sanitizeTextForPDF(eventData.agenda)

  // Sanitize tags array - sanitize each tag and filter out empty ones
  const sanitizedTags = eventData.tags && Array.isArray(eventData.tags)
    ? eventData.tags
        .map(tag => sanitizeTextForPDF(tag))
        .filter(tag => tag.trim().length > 0)
    : []

  return {
    title: sanitizedTitle,
    description: sanitizedDescription,
    fullDescription: sanitizedFullDescription,
    venue: sanitizedVenue,
    location: sanitizedLocation,
    eligibility: sanitizedEligibility,
    time: sanitizedTime,
    agenda: sanitizedAgenda,
    tags: sanitizedTags,
  }
}

