/**
 * PDF Generation Service for Registration Confirmations
 */

import type { Event } from '@/types/event'
import { SITE_CONFIG } from './site-config'
import { formatEventDates, getFirstEventDate, parseEventDates } from './dateUtils'
import { sanitizeEventForPDF, sanitizeBookingDetailsForPDF, sanitizeTextForPDF } from './textSanitizer'
import { join, dirname } from 'path'
import { existsSync, readdirSync } from 'fs'

interface BookingDetails {
  name: string
  school: string
  email: string
  phone: string
  bkashNumber?: string
  information: string
}

interface GeneratePDFProps {
  registrationId: string // For display in PDF
  bookingId: string // For QR code URL and file naming
  event: Event
  bookingDetails: BookingDetails
  verificationUrl: string // Should include bookingId parameter
}

/**
 * Truncate text to fit within specified dimensions
 */
function truncateTextToFit(text: string, maxWidth: number, maxHeight: number, fontSize: number): string {
  if (!text) return ''
  
  // Approximate character width (conservative estimate for Times-Roman)
  const avgCharWidth = fontSize * 0.6
  const charsPerLine = Math.floor(maxWidth / avgCharWidth)
  const lineHeight = fontSize * 1.2
  const maxLines = Math.floor(maxHeight / lineHeight)
  const maxChars = Math.max(0, maxLines * charsPerLine - 10) // Reserve space for ellipsis
  
  if (text.length <= maxChars) {
    return text
  }
  
  // Truncate at word boundary when possible
  const truncated = text.substring(0, maxChars - 3)
  const lastSpace = truncated.lastIndexOf(' ')
  const lastNewline = truncated.lastIndexOf('\n')
  const lastBreak = Math.max(lastSpace, lastNewline)
  
  if (lastBreak > maxChars - 50) {
    return truncated.substring(0, lastBreak) + '...'
  }
  
  return truncated + '...'
}

/**
 * Resolve PDFKit font data path for serverless environments
 * This handles different path structures in local vs serverless environments
 */
function resolvePDFKitFontPath(): string | null {
  try {
    // Method 1: Try to find PDFKit package using require.resolve
    try {
      // Dynamic require needed for PDFKit resolution in serverless environments
      const pdfkitPath = require.resolve('pdfkit')
      const pdfkitDir = dirname(pdfkitPath)
      // Navigate up from lib/pdfkit.js to node_modules/pdfkit, then to js/data
      const possiblePaths = [
        join(pdfkitDir, '..', 'js', 'data'), // Standard structure
        join(pdfkitDir.replace(/\/lib.*$/, ''), 'js', 'data'), // If in lib subdirectory
        join(process.cwd(), 'node_modules', 'pdfkit', 'js', 'data'), // Direct path
      ]

      for (const fontPath of possiblePaths) {
        // Check for Times-Roman (PDFKit standard font)
        const timesRomanPath = join(fontPath, 'Times-Roman.afm')
        if (existsSync(timesRomanPath)) {
          return fontPath
        }
        // Fallback to Helvetica if Times-Roman not found
        const helveticaPath = join(fontPath, 'Helvetica.afm')
        if (existsSync(helveticaPath)) {
          return fontPath
        }
      }
    } catch {
      // Continue to next method
    }

    // Method 2: Try pnpm specific paths (common in serverless)
    try {
      const pnpmDir = join(process.cwd(), 'node_modules', '.pnpm')
      if (existsSync(pnpmDir)) {
        const dirs = readdirSync(pnpmDir).filter((dir) => dir.startsWith('pdfkit@'))
        const pnpmPaths = dirs.map((dir) => 
          join(pnpmDir, dir, 'node_modules', 'pdfkit', 'js', 'data')
        )
        
        // Also try the exact version from the error
        pnpmPaths.push(join(process.cwd(), 'node_modules', '.pnpm', 'pdfkit@0.17.2', 'node_modules', 'pdfkit', 'js', 'data'))

        for (const fontPath of pnpmPaths) {
          // Check for Times-Roman first
          const timesRomanPath = join(fontPath, 'Times-Roman.afm')
          if (existsSync(timesRomanPath)) {
            return fontPath
          }
          // Fallback to Helvetica
          const helveticaPath = join(fontPath, 'Helvetica.afm')
          if (existsSync(helveticaPath)) {
            return fontPath
          }
        }
      }
    } catch {
      // Continue
    }

    // Method 3: Try to extract from the error path pattern and search nearby
    // The error shows: /ROOT/node_modules/.pnpm/pdfkit@0.17.2/node_modules/pdfkit/js/data/Helvetica.afm
    // Try variations of this path
    const rootPaths = [
      '/ROOT/node_modules/.pnpm/pdfkit@0.17.2/node_modules/pdfkit/js/data',
      '/ROOT/node_modules/pdfkit/js/data',
      '/var/task/node_modules/pdfkit/js/data',
      '/var/task/node_modules/.pnpm/pdfkit@0.17.2/node_modules/pdfkit/js/data',
      '/tmp/node_modules/pdfkit/js/data',
    ]

    for (const fontPath of rootPaths) {
      try {
        // Check for Times-Roman first
        const timesRomanPath = join(fontPath, 'Times-Roman.afm')
        if (existsSync(timesRomanPath)) {
          return fontPath
        }
        // Fallback to Helvetica
        const helveticaPath = join(fontPath, 'Helvetica.afm')
        if (existsSync(helveticaPath)) {
          return fontPath
        }
      } catch {
        // Path might not be accessible, continue
      }
    }
    
    // Method 4: Try to find pdfkit using require.resolve and navigate from there
    try {
      // Dynamic require needed for PDFKit resolution in serverless environments
      const pdfkitMain = require.resolve('pdfkit')
      // Try to find the data directory relative to the main file
      // pdfkit main is usually at: .../pdfkit/lib/pdfkit.js
      // data is at: .../pdfkit/js/data
      const pdfkitRoot = pdfkitMain.replace(/[/\\]lib[/\\].*$/, '').replace(/[/\\]lib$/, '')
      const dataPath = join(pdfkitRoot, 'js', 'data')
      if (existsSync(join(dataPath, 'Times-Roman.afm')) || existsSync(join(dataPath, 'Helvetica.afm'))) {
        return dataPath
      }
      
      // Try alternative: go up from lib/pdfkit.js
      const pdfkitLibDir = dirname(pdfkitMain)
      const altDataPath = join(pdfkitLibDir, '..', 'js', 'data')
      if (existsSync(join(altDataPath, 'Times-Roman.afm')) || existsSync(join(altDataPath, 'Helvetica.afm'))) {
        return altDataPath
      }
    } catch {
      // require.resolve might fail in some environments
    }

    return null
  } catch (error) {
    // Log error but don't throw - return null to allow fallback behavior
    // Error logging is intentional for debugging font loading issues
    if (error instanceof Error) {
      // Intentional console.error for debugging - server-side only
      console.error('Error resolving PDFKit font path:', error.message)
    }
    return null
  }
}

/**
 * Type for the original readFileSync function
 */
type ReadFileSyncFn = (path: string | Buffer | number, options?: string) => Buffer | string

/**
 * Patch fs.readFileSync to intercept PDFKit font file reads
 * Returns the original function and the patched function setup status
 * This is the most reliable way to handle font loading in serverless environments
 */
function setupPDFKitFonts(): { originalReadFileSync: ReadFileSyncFn; fontPath: string | null } | null {
  try {
    const fontPath = resolvePDFKitFontPath()
    if (!fontPath) {
      return null
    }

    // Get the original fs module
    // Dynamic require needed for monkey-patching in serverless environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    const originalReadFileSync = fs.readFileSync.bind(fs) as ReadFileSyncFn
    
    // Patch readFileSync to intercept font file reads
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fs.readFileSync = function(path: string | Buffer | number, ...args: any[]): Buffer | string {
      const pathStr = String(path)
      
      // Check if this is a PDFKit font file request (more comprehensive matching)
      const isPDFKitFontRequest = 
        (pathStr.includes('pdfkit') || pathStr.includes('Helvetica') || pathStr.includes('Times') || pathStr.includes('Courier')) &&
        (pathStr.includes('data') || pathStr.includes('.afm') || pathStr.includes('js'))
      
      if (isPDFKitFontRequest) {
        // Extract just the filename
        const fileName = pathStr.split(/[\/\\]/).pop() || ''
        if (fileName.endsWith('.afm')) {
          // Try to find the font file in our resolved path
          const correctPath = join(fontPath, fileName)
          if (existsSync(correctPath)) {
            return originalReadFileSync(correctPath, ...args)
          }
        }
        // Handle font name references (without .afm extension)
        if (fileName.includes('Times-Roman') || fileName.includes('TimesRoman')) {
          const timesRomanPath = join(fontPath, 'Times-Roman.afm')
          if (existsSync(timesRomanPath)) {
            return originalReadFileSync(timesRomanPath, ...args)
          }
        }
        if (fileName.includes('Helvetica')) {
          const helveticaPath = join(fontPath, 'Helvetica.afm')
          if (existsSync(helveticaPath)) {
            return originalReadFileSync(helveticaPath, ...args)
          }
        }
      }
      
      // For all other files, use original behavior
      try {
        return originalReadFileSync(path, ...args)
      } catch (error: unknown) {
        // If the original path fails and it's a PDFKit font file, try our resolved path
        const nodeError = error as { code?: string }
        if (nodeError.code === 'ENOENT' && isPDFKitFontRequest) {
          const fileName = pathStr.split(/[\/\\]/).pop() || ''
          if (fileName.endsWith('.afm')) {
            const correctPath = join(fontPath, fileName)
            if (existsSync(correctPath)) {
              return originalReadFileSync(correctPath, ...args)
            }
          }
          // Try Times-Roman first, then Helvetica as fallback
          const timesRomanPath = join(fontPath, 'Times-Roman.afm')
          if (existsSync(timesRomanPath)) {
            return originalReadFileSync(timesRomanPath, ...args)
          }
          const helveticaPath = join(fontPath, 'Helvetica.afm')
          if (existsSync(helveticaPath)) {
            return originalReadFileSync(helveticaPath, ...args)
          }
        }
        throw error
      }
    }
    return { originalReadFileSync, fontPath }
  } catch (error) {
    // Log error but don't throw - return null to allow fallback behavior
    // Error logging is intentional for debugging font loading issues
    if (error instanceof Error) {
      // Intentional console.error for debugging - server-side only
      console.error('Error setting up PDFKit fonts:', error.message)
    }
    return null
  }
}

/**
 * Generate PDF registration confirmation
 */
export async function generateBookingConfirmationPDF({
  registrationId,
  bookingId,
  event,
  bookingDetails,
  verificationUrl,
}: GeneratePDFProps): Promise<Buffer> {
  // Dynamically import PDFKit only when needed (code splitting)
  const PDFDocument = (await import('pdfkit')).default
  
  return new Promise(async (resolve, reject) => {
    // Dynamic require needed for monkey-patching in serverless environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    let fontPatch: { originalReadFileSync: ReadFileSyncFn; fontPath: string | null } | null = null
    
    try {
      // Setup fonts before creating PDFDocument
      fontPatch = setupPDFKitFonts()
      
      // Create PDFDocument - font reads should now be intercepted
      // Single page mode - we'll manually manage all content placement
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
        autoFirstPage: true,
      })
      
      // Monitor for page additions - if a second page is created, log a warning
      let pageCount = 1
      doc.on('pageAdded', () => {
        pageCount++
        if (pageCount > 1) {
          // Intentional console.warn for debugging layout issues - server-side only
          console.warn('Warning: Content exceeded single page - consider reducing font sizes or content')
        }
      })

      // Force font loading by writing a small invisible text first
      // This ensures fonts are loaded and initialized before any visible content
      // Position it off-page so it's not visible
      // Use Times-Roman as the standard font
      doc.font('Times-Roman').fontSize(1).fillColor('white').text(' ', -1000, -1000, { width: 1 })
      
      // Reset to proper settings for actual content
      doc.font('Times-Roman').fontSize(12).fillColor('#000000')

      const buffers: Buffer[] = []
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        // Restore original readFileSync if patch was applied
        if (fontPatch) {
          fs.readFileSync = fontPatch.originalReadFileSync
        }
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })
      doc.on('error', (error) => {
        // Restore original readFileSync on error
        if (fontPatch) {
          fs.readFileSync = fontPatch.originalReadFileSync
        }
        reject(error)
      })
      
      // Dynamically import QR code generator only when needed
      const { generateQRCodeBuffer } = await import('./qrCode')
      await generatePDFContent(doc, registrationId, bookingId, event, bookingDetails, verificationUrl, generateQRCodeBuffer)
      doc.end()
    } catch (error) {
      // Restore original readFileSync on error
      if (fontPatch) {
        fs.readFileSync = fontPatch.originalReadFileSync
      }
      // Intentional console.error for debugging PDF generation issues - server-side only
      if (error instanceof Error) {
        console.error('Error in PDF generation:', error.message)
      }
      reject(error)
    }
  })
}

/**
 * Generate PDF content with single-page layout
 * Automatically adjusts spacing to ensure everything fits on one page
 */
async function generatePDFContent(
  doc: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- PDFDocument instance from dynamically imported pdfkit
  registrationId: string,
  bookingId: string,
  event: Event,
  bookingDetails: BookingDetails,
  verificationUrl: string,
  generateQRCodeBuffer: (text: string, size?: number) => Promise<Buffer>
): Promise<void> {
  try {
    // Sanitize all event and booking data before rendering
    const sanitizedEvent = sanitizeEventForPDF(event)
    const sanitizedBooking = sanitizeBookingDetailsForPDF(bookingDetails)
    const sanitizedRegistrationId = sanitizeTextForPDF(registrationId)

    // Calculate available page dimensions for single-page layout
    const pageWidth = doc.page.width
    const pageHeight = doc.page.height
    const margin = 50
    const marginTop = 40
    const marginBottom = 40
    const contentWidth = pageWidth - (margin * 2)
    const footerHeight = 45
    const headerHeight = 80
    const availableHeight = pageHeight - marginTop - marginBottom - footerHeight - headerHeight

    // Define font sizes for single-page layout (increased for better readability)
    const fontSizes = {
      header: 28,
      subheader: 12,
      sectionTitle: 16,
      body: 11,
      small: 9,
      registrationId: 18,
    }

    // Calculate spacing (adjusted for larger fonts and colored sections)
    const spacing = {
      section: 12,
      field: 10,
      subsection: 8,
    }

    // Track Y position for layout management
    let yPos = marginTop

    // Helper to add a field with proper wrapping and elegant styling
    const addField = (label: string, value: string | undefined, required = false, currentY: number): number => {
      if (!value && !required) return currentY
      
      const displayValue = value || 'N/A'
      // Truncate very long values to prevent layout issues
      const maxFieldLength = 150
      const truncatedValue = displayValue.length > maxFieldLength 
        ? displayValue.substring(0, maxFieldLength - 3) + '...' 
        : displayValue
      
      const labelWidth = 100
      const valueWidth = contentWidth - labelWidth
      
      // Add subtle background for each field
      doc.rect(margin - 3, currentY - 2, contentWidth + 6, 18).fill('#ffffff').stroke('#e5e7eb').lineWidth(0.5)
      
      // Use indigo color for labels with bold styling
      doc.font('Times-Roman').fontSize(fontSizes.body).fillColor('#6366f1')
      doc.text(`${label}`, margin + 3, currentY + 2)
      
      // Use dark color for values
      doc.fillColor('#1f2937').text(truncatedValue, margin + labelWidth, currentY + 2, {
        width: valueWidth - 6,
      })
      
      // Calculate if value wrapped (estimate line height - adjusted for larger font)
      const charsPerLine = Math.floor(valueWidth / 6)
      const lines = Math.max(1, Math.ceil(truncatedValue.length / charsPerLine))
      const lineHeight = 16
      
      return currentY + Math.max(spacing.field + 2, lines * lineHeight)
    }

    // ==================== HEADER ====================
    // Elegant header with gradient effect using indigo background
    doc.rect(0, 0, pageWidth, headerHeight).fill('#6366f1')
    
    // Add decorative line at bottom of header
    doc.rect(0, headerHeight - 3, pageWidth, 3).fill('#4f46e5')
    
    doc.font('Times-Roman').fontSize(fontSizes.header).fillColor('#ffffff').text('Registration Confirmed', margin, 20, {
      width: contentWidth,
    })
    
    doc.font('Times-Roman').fontSize(fontSizes.subheader).fillColor('#e0e7ff').text('Event Registration Confirmation', margin, 52, {
      width: contentWidth,
    })

    yPos = headerHeight + 20

    // ==================== REGISTRATION ID SECTION ====================
    // Prominent Registration ID display with elegant styling
    const regIdBoxHeight = 65
    doc.rect(margin - 8, yPos - 8, contentWidth + 16, regIdBoxHeight).fill('#eff6ff').stroke('#3b82f6').lineWidth(2)
    
    doc.font('Times-Roman').fontSize(12).fillColor('#6366f1').text('Registration ID', margin, yPos)
    yPos += 15
    doc.font('Times-Roman').fontSize(fontSizes.registrationId).fillColor('#1e3a8a').text(sanitizedRegistrationId || 'N/A', margin, yPos, {
      width: contentWidth,
    })
    
    yPos += 45

    // ==================== EVENT DETAILS SECTION ====================
    // Elegant section header with icon-like styling
    doc.rect(margin - 8, yPos - 8, contentWidth + 16, 25).fill('#f8fafc').stroke('#cbd5e1').lineWidth(1.5)
    doc.font('Times-Roman').fontSize(fontSizes.sectionTitle).fillColor('#1e40af').text('Event Details', margin, yPos)
    yPos += 28

    const firstDate = getFirstEventDate(event.date)
    const formattedDate = firstDate ? formatEventDates(parseEventDates(event.date), 'long') : 'TBA'
    const sanitizedDate = sanitizeTextForPDF(formattedDate)

    // Event Name (required)
    yPos = addField('Event Name', sanitizedEvent.title || 'Event', true, yPos)

    // Date (required)
    yPos = addField('Date', sanitizedDate || 'TBA', true, yPos)

    // Time (if available)
    if (sanitizedEvent.time) {
      yPos = addField('Time', sanitizedEvent.time, false, yPos)
    }

    // Venue (if available)
    const venue = sanitizedEvent.venue || sanitizedEvent.location
    if (venue) {
      yPos = addField('Venue', venue, false, yPos)
    }

    // Eligibility (if available)
    if (sanitizedEvent.eligibility) {
      yPos = addField('Eligibility', sanitizedEvent.eligibility, false, yPos)
    }

    yPos += spacing.subsection

    yPos += spacing.subsection

    // ==================== REGISTRATION INFORMATION SECTION ====================
    // Elegant section header with icon-like styling
    doc.rect(margin - 8, yPos - 8, contentWidth + 16, 25).fill('#f8fafc').stroke('#cbd5e1').lineWidth(1.5)
    doc.font('Times-Roman').fontSize(fontSizes.sectionTitle).fillColor('#1e40af').text('Registration Information', margin, yPos)
    yPos += 28

    // Name (required)
    yPos = addField('Name', sanitizedBooking.name, true, yPos)

    // School (required)
    yPos = addField('School', sanitizedBooking.school, true, yPos)

    // Email (required)
    yPos = addField('Email', sanitizedBooking.email, true, yPos)

    // Phone (required)
    yPos = addField('Phone', sanitizedBooking.phone, true, yPos)

    // bKash Number (when present, for paid events)
    if (sanitizedBooking.bkashNumber) {
      yPos = addField('bKash Number', sanitizedBooking.bkashNumber, false, yPos)
    }

    // Additional Information (optional, truncate if too long for single page)
    if (sanitizedBooking.information) {
      // Reserve space for description, QR code, and footer
      const remainingForDescQRAndFooter = 180
      const usedHeight = yPos - marginTop - headerHeight
      const maxInfoHeight = availableHeight - usedHeight - remainingForDescQRAndFooter
      
      if (maxInfoHeight > 25) {
        yPos += 8
        doc.font('Times-Roman').fontSize(fontSizes.body).fillColor('#6366f1')
        doc.text('Additional Information: ', margin, yPos)
        yPos += 14
        
        // Truncate information intelligently to fit on page
        const infoText = truncateTextToFit(sanitizedBooking.information, contentWidth, maxInfoHeight, fontSizes.body)
        
        // Add elegant background box for additional info
        const infoLines = infoText.split('\n').length || 1
        const infoBoxHeight = Math.min((infoLines * 14) + 12, maxInfoHeight + 12)
        doc.rect(margin - 5, yPos - 5, contentWidth + 10, infoBoxHeight).fill('#f9fafb').stroke('#d1d5db').lineWidth(1)
        
        doc.font('Times-Roman').fontSize(fontSizes.body).fillColor('#374151').text(infoText, margin, yPos, {
          width: contentWidth,
          align: 'left',
        })
        
        // Update Y position based on actual content height
        const charsPerLine = Math.floor(contentWidth / 6)
        const lines = Math.ceil(infoText.length / charsPerLine) || 1
        yPos += Math.min(lines * 14, maxInfoHeight) + 8
      }
    }

    yPos += spacing.subsection

    // ==================== EVENT DESCRIPTION (if space available) ====================
    const eventDescription = sanitizedEvent.fullDescription || sanitizedEvent.description
    // Reserve space for QR code section (210px: 100px QR + 110px spacing/text) and footer (35px)
    const minQRAndFooterSpace = 245
    const remainingHeight = pageHeight - yPos - marginBottom - minQRAndFooterSpace
    
    if (eventDescription && remainingHeight > 50) {
      yPos += 10
      // Elegant section header
      doc.rect(margin - 8, yPos - 8, contentWidth + 16, 25).fill('#f8fafc').stroke('#cbd5e1').lineWidth(1.5)
      doc.font('Times-Roman').fontSize(fontSizes.sectionTitle).fillColor('#1e40af').text('About the Event', margin, yPos)
      yPos += 28

      // Calculate max height for description
      const maxDescHeight = remainingHeight - 30
      
      // Truncate description intelligently
      const descText = truncateTextToFit(eventDescription, contentWidth, maxDescHeight, fontSizes.body)

      // Add elegant background box
      const estimatedLines = Math.ceil(descText.length / (contentWidth / 6))
      const descBoxHeight = Math.min(estimatedLines * 14 + 14, maxDescHeight + 14)
      doc.rect(margin - 5, yPos - 5, contentWidth + 10, descBoxHeight).fill('#f9fafb').stroke('#d1d5db').lineWidth(1)
      
      doc.font('Times-Roman').fontSize(fontSizes.body).fillColor('#475569').text(descText, margin, yPos, {
        width: contentWidth,
        align: 'left',
      })
      
      yPos += descBoxHeight + 10
    }

    // ==================== QR CODE SECTION (at bottom) ====================
    yPos += 40 // Increased spacing before QR section
    const qrSize = 100
    // Increased section height to accommodate more spacing and full URL display
    const qrSectionHeight = qrSize + 110 // Increased from 60 to 110 for better spacing
    const minFooterSpace = 35 // Increased footer space
    
    // Calculate position - ensure QR section fits before footer
    const maxQRY = pageHeight - marginBottom - qrSectionHeight - minFooterSpace
    const qrSectionY = Math.min(yPos, maxQRY)
    
    // Create elegant QR code section with border and background
    doc.rect(margin - 10, qrSectionY - 10, contentWidth + 20, qrSectionHeight).fill('#f0f9ff').stroke('#3b82f6').lineWidth(2)
    
    // Decorative top border
    doc.rect(margin - 10, qrSectionY - 10, contentWidth + 20, 4).fill('#6366f1')
    
    // Section title with more spacing
    doc.font('Times-Roman').fontSize(15).fillColor('#1e40af').text('Scan QR Code to Verify Registration', margin, qrSectionY + 8, {
      align: 'center',
      width: contentWidth,
    })
    
    // Generate and place QR code centered with more spacing below title
    try {
      const qrY = qrSectionY + 28 // Increased from 18 to 28 for more space below title
      const qrX = (pageWidth - qrSize) / 2
      
      // Add elegant white border around QR code with shadow effect
      doc.rect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20).fill('#ffffff').stroke('#6366f1').lineWidth(2.5)
      
      const qrCodeBuffer = await generateQRCodeBuffer(verificationUrl, qrSize)
      doc.image(qrCodeBuffer, qrX, qrY, {
        width: qrSize,
        height: qrSize,
      })
      
      // Instruction text below QR code with more spacing
      doc.font('Times-Roman').fontSize(10).fillColor('#1e40af').text('Scan with your phone camera to verify your registration', margin, qrY + qrSize + 20, {
        align: 'center',
        width: contentWidth,
      })
      
      // URL text - display full URL with proper spacing (may wrap to multiple lines)
      // Split URL at query parameter for better readability if URL is long
      const urlY = qrY + qrSize + 38 // Increased spacing below instruction text
      const questionMarkIndex = verificationUrl.indexOf('?')
      
      if (questionMarkIndex > 0 && verificationUrl.length > 120) {
        // If URL is long and has query params, display base URL and params on separate lines
        const baseUrl = verificationUrl.substring(0, questionMarkIndex)
        const queryParams = verificationUrl.substring(questionMarkIndex)
        
        doc.font('Times-Roman').fontSize(7).fillColor('#6b7280').text(baseUrl, margin, urlY, {
          align: 'center',
          width: contentWidth - 20,
        })
        doc.font('Times-Roman').fontSize(7).fillColor('#6b7280').text(queryParams, margin, urlY + 10, {
          align: 'center',
          width: contentWidth - 20,
        })
      } else {
        // Display full URL, allow natural wrapping across multiple lines if needed
        doc.font('Times-Roman').fontSize(7).fillColor('#6b7280').text(verificationUrl, margin, urlY, {
          align: 'center',
          width: contentWidth - 20,
          lineGap: 2,
        })
      }
    } catch {
      // Continue without QR code if generation fails
      doc.font('Times-Roman').fontSize(fontSizes.body).fillColor('#6b7280').text('QR code unavailable - Please contact support', margin, qrSectionY + 40, {
        align: 'center',
        width: contentWidth,
      })
    }

    // ==================== FOOTER ====================
    const footerY = pageHeight - marginBottom - 25
    // Add elegant footer background
    doc.rect(0, footerY - 5, pageWidth, 25).fill('#f3f4f6')
    doc.font('Times-Roman').fontSize(9).fillColor('#6b7280').text(
      `© ${new Date().getFullYear()} ${SITE_CONFIG.name}. All rights reserved.`,
      margin,
      footerY,
      {
        align: 'center',
        width: contentWidth,
      }
    )

  } catch (error) {
    throw error
  }
}

