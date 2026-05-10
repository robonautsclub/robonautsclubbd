/**
 * PDF Generation Service for Registration Confirmations
 */

import type { Event } from '@/types/event'
import { SITE_CONFIG } from './site-config'
import { formatEventDates, getFirstEventDate, parseEventDates } from './dateUtils'
import { sanitizeEventForPDF, sanitizeBookingDetailsForPDF, sanitizeTextForPDF } from './textSanitizer'
import { join, dirname, basename } from 'path'
import { existsSync, readdirSync, readFileSync } from 'fs'

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
      
      // Create PDFDocument - font reads should now be intercepted.
      // We set all PDFKit margins to 0 because the layout in generatePDFContent
      // positions every element with explicit (x, y) coordinates and manages
      // its own padding via the `theme.metric` design tokens. Leaving PDFKit's
      // own margins non-zero would cause it to auto-paginate when our content
      // (legitimately positioned via absolute coords) crosses its internal
      // bottom-margin threshold.
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
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

      // Force font loading by writing invisible text off-page first.
      // PDFKit lazy-loads font files only on first text() call, so we prime each
      // typeface used in the document up-front. This ensures the readFileSync
      // patch (setupPDFKitFonts) catches every .afm load before any visible
      // content is rendered. We rely exclusively on PDFKit's built-in fonts so
      // the document renders identically in dev and serverless environments.
      doc.font('Helvetica').fontSize(1).fillColor('white').text(' ', -1000, -1000, { width: 1 })
      doc.font('Helvetica-Bold').fontSize(1).fillColor('white').text(' ', -1000, -1000, { width: 1 })

      doc.font('Helvetica').fontSize(11).fillColor('#0f172a')

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
      
      // Load logo from public folder (optional)
      let logoBuffer: Buffer | null = null
      try {
        const logoPath = join(process.cwd(), 'public', basename(SITE_CONFIG.assets.logo))
        if (existsSync(logoPath)) {
          logoBuffer = readFileSync(logoPath)
        }
      } catch {
        // Logo optional; continue without it
      }

      // Dynamically import QR code generator only when needed
      const { generateQRCodeBuffer } = await import('./qrCode')
      await generatePDFContent(doc, registrationId, bookingId, event, bookingDetails, verificationUrl, generateQRCodeBuffer, logoBuffer)
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
 * Render the registration confirmation PDF.
 *
 * Design system (single page, Letter portrait):
 *   - Typography: Helvetica family (built-in PDFKit font, ships in any
 *     environment). Hierarchy is established with weight + size + color, not
 *     decorative fills.
 *   - Color palette: deep navy accent (#0f4c81) + slate neutrals. One accent
 *     color, no rainbow of blues/greys.
 *   - Layout: strict left-aligned baseline grid with thin horizontal rules
 *     between sections instead of filled boxes around every row. The QR block
 *     and footer are pinned to the bottom; optional content (additional info,
 *     event description) flexes into the remaining space.
 */
async function generatePDFContent(
  doc: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- PDFDocument instance from dynamically imported pdfkit
  registrationId: string,
  bookingId: string,
  event: Event,
  bookingDetails: BookingDetails,
  verificationUrl: string,
  generateQRCodeBuffer: (text: string, size?: number) => Promise<Buffer>,
  logoBuffer: Buffer | null = null
): Promise<void> {
  // bookingId is reserved for future use (e.g. internal references); the user-facing
  // identifier is registrationId.
  void bookingId

  const sanitizedEvent = sanitizeEventForPDF(event)
  const sanitizedBooking = sanitizeBookingDetailsForPDF(bookingDetails)
  const sanitizedRegistrationId = sanitizeTextForPDF(registrationId)

  // ---------- Design tokens ----------
  const theme = {
    color: {
      ink: '#0f172a',          // slate-900 — primary body text
      mute: '#475569',         // slate-600 — labels, captions
      faint: '#94a3b8',        // slate-400 — hints, deemphasized URLs
      rule: '#e2e8f0',         // slate-200 — hairline dividers
      accent: '#0f4c81',       // brand navy — header band, big numerals
      accentSoft: '#f1f5f9',   // slate-100 — gentle block backgrounds
      onAccent: '#ffffff',
      onAccentMuted: '#cbd5e1',
    },
    font: {
      regular: 'Helvetica',
      bold: 'Helvetica-Bold',
    },
    size: {
      brand: 18,
      docSubtitle: 10,
      sectionLabel: 9,
      regIdLabel: 8.5,
      regIdValue: 22,
      label: 9.5,
      value: 10.5,
      body: 10,
      caption: 8.5,
      micro: 7.5,
      footer: 8,
    },
    metric: {
      pageMarginX: 50,
      pageMarginBottom: 38,
      headerHeight: 76,
      logoSize: 40,
      labelColW: 120,
      sectionGap: 22,
      rowGap: 8,
      qrSize: 110,
      qrBlockH: 178, // QR + caption + URL
    },
  }

  const pageWidth: number = doc.page.width
  const pageHeight: number = doc.page.height
  const left = theme.metric.pageMarginX
  const right = pageWidth - theme.metric.pageMarginX
  const contentWidth = right - left

  // ---------- Helpers ----------
  const formatIssuedDate = (): string => {
    try {
      return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return new Date().toISOString().split('T')[0]
    }
  }

  const drawHRule = (atY: number): void => {
    doc.moveTo(left, atY).lineTo(right, atY)
      .strokeColor(theme.color.rule).lineWidth(0.75).stroke()
  }

  const drawSectionHeader = (label: string, atY: number): number => {
    doc.font(theme.font.bold).fontSize(theme.size.sectionLabel).fillColor(theme.color.mute)
    doc.text(label.toUpperCase(), left, atY, {
      width: contentWidth,
      characterSpacing: 1.6,
    })
    const headerHeight = doc.heightOfString(label.toUpperCase(), {
      width: contentWidth,
      characterSpacing: 1.6,
    })
    drawHRule(atY + headerHeight + 4)
    return atY + headerHeight + 14
  }

  const drawRow = (label: string, value: string | undefined, atY: number): number => {
    if (!value) return atY
    const labelW = theme.metric.labelColW
    const valueX = left + labelW
    const valueW = contentWidth - labelW

    doc.font(theme.font.regular).fontSize(theme.size.value)
    const valueHeight = doc.heightOfString(value, { width: valueW, lineGap: 1 })
    const rowHeight = Math.max(valueHeight, 14)

    doc.font(theme.font.regular).fontSize(theme.size.label).fillColor(theme.color.mute)
    doc.text(label, left, atY, { width: labelW - 8 })

    doc.font(theme.font.regular).fontSize(theme.size.value).fillColor(theme.color.ink)
    doc.text(value, valueX, atY, { width: valueW, lineGap: 1 })

    return atY + rowHeight + theme.metric.rowGap
  }

  // ---------- Header band ----------
  doc.rect(0, 0, pageWidth, theme.metric.headerHeight).fill(theme.color.accent)

  let titleX = left
  if (logoBuffer && logoBuffer.length > 0) {
    try {
      const logoY = (theme.metric.headerHeight - theme.metric.logoSize) / 2
      doc.image(logoBuffer, left, logoY, {
        fit: [theme.metric.logoSize, theme.metric.logoSize],
        align: 'center',
        valign: 'center',
      })
      titleX = left + theme.metric.logoSize + 14
    } catch {
      titleX = left
    }
  }

  doc.font(theme.font.bold).fontSize(theme.size.brand).fillColor(theme.color.onAccent)
  doc.text(SITE_CONFIG.name, titleX, 22, {
    width: right - titleX,
    lineBreak: false,
  })
  doc.font(theme.font.regular).fontSize(theme.size.docSubtitle).fillColor(theme.color.onAccentMuted)
  doc.text('Registration Confirmation', titleX, 46, {
    width: right - titleX,
    lineBreak: false,
  })

  let y = theme.metric.headerHeight + 26

  // ---------- Registration ID + Issued Date (split row) ----------
  const splitColW = contentWidth / 2

  doc.font(theme.font.bold).fontSize(theme.size.regIdLabel).fillColor(theme.color.mute)
  doc.text('REGISTRATION ID', left, y, {
    width: splitColW,
    characterSpacing: 1.6,
  })
  doc.text('ISSUED', left + splitColW, y, {
    width: splitColW,
    characterSpacing: 1.6,
    align: 'right',
  })
  y += 14

  doc.font(theme.font.bold).fontSize(theme.size.regIdValue).fillColor(theme.color.accent)
  doc.text(sanitizedRegistrationId || 'N/A', left, y, {
    width: splitColW,
    lineBreak: false,
  })
  doc.font(theme.font.regular).fontSize(theme.size.value).fillColor(theme.color.ink)
  doc.text(formatIssuedDate(), left + splitColW, y + 8, {
    width: splitColW,
    align: 'right',
    lineBreak: false,
  })

  y += 36
  drawHRule(y)
  y += theme.metric.sectionGap

  // ---------- Event Details ----------
  y = drawSectionHeader('Event Details', y)

  const firstDate = getFirstEventDate(event.date)
  const formattedDate = firstDate ? formatEventDates(parseEventDates(event.date), 'long') : 'TBA'

  y = drawRow('Event Name', sanitizeTextForPDF(sanitizedEvent.title || 'Event'), y)
  y = drawRow('Date', sanitizeTextForPDF(formattedDate || 'TBA'), y)
  if (sanitizedEvent.time) y = drawRow('Time', sanitizedEvent.time, y)
  const venue = sanitizedEvent.venue || sanitizedEvent.location
  if (venue) y = drawRow('Venue', venue, y)
  if (sanitizedEvent.eligibility) y = drawRow('Eligibility', sanitizedEvent.eligibility, y)

  y += theme.metric.sectionGap - theme.metric.rowGap

  // ---------- Registration Information ----------
  y = drawSectionHeader('Registration Information', y)

  y = drawRow('Name', sanitizedBooking.name, y)
  y = drawRow('School', sanitizedBooking.school, y)
  y = drawRow('Email', sanitizedBooking.email, y)
  y = drawRow('Phone', sanitizedBooking.phone, y)
  if (sanitizedBooking.bkashNumber) {
    y = drawRow('bKash Number', sanitizedBooking.bkashNumber, y)
  }

  // ---------- Reserve bottom region for QR block + footer ----------
  // Everything after this point flows into whatever vertical room is left
  // before the QR section. This guarantees the QR + footer always sit at
  // their fixed bottom location, no matter the optional content above.
  const footerH = 28
  const qrBlockY = pageHeight - theme.metric.pageMarginBottom - footerH - theme.metric.qrBlockH
  const flowSpaceBottom = qrBlockY - 14

  // ---------- Optional: Additional Information ----------
  if (sanitizedBooking.information && y + 32 < flowSpaceBottom) {
    y += 6
    doc.font(theme.font.bold).fontSize(theme.size.label).fillColor(theme.color.mute)
    doc.text('Additional Information', left, y, { width: contentWidth })
    y += 14

    const noteAvail = flowSpaceBottom - y - 24
    const noteText = truncateTextToFit(
      sanitizedBooking.information,
      contentWidth - 24,
      noteAvail,
      theme.size.body
    )
    doc.font(theme.font.regular).fontSize(theme.size.body)
    const noteH = doc.heightOfString(noteText, { width: contentWidth - 24, lineGap: 2 })
    const noteBoxH = Math.min(noteH, noteAvail) + 16
    doc.rect(left, y, contentWidth, noteBoxH).fill(theme.color.accentSoft)
    doc.font(theme.font.regular).fontSize(theme.size.body).fillColor(theme.color.ink)
    doc.text(noteText, left + 12, y + 8, {
      width: contentWidth - 24,
      height: noteAvail,
      lineGap: 2,
    })
    y += noteBoxH + 14
  }

  // ---------- Optional: About the Event ----------
  const description = sanitizedEvent.fullDescription || sanitizedEvent.description
  const descRoom = flowSpaceBottom - y
  if (description && descRoom > 56) {
    y = drawSectionHeader('About the Event', y)
    const descAvail = Math.max(0, flowSpaceBottom - y)
    const descText = truncateTextToFit(description, contentWidth, descAvail, theme.size.body)
    doc.font(theme.font.regular).fontSize(theme.size.body).fillColor(theme.color.ink)
    doc.text(descText, left, y, {
      width: contentWidth,
      height: descAvail,
      align: 'left',
      lineGap: 2,
    })
  }

  // ---------- QR Code block (bottom-pinned) ----------
  drawHRule(qrBlockY - 12)

  const qrSize = theme.metric.qrSize
  const qrX = (pageWidth - qrSize) / 2
  const qrY = qrBlockY + 6

  try {
    const qrCodeBuffer = await generateQRCodeBuffer(verificationUrl, qrSize * 4)
    doc.rect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12)
      .strokeColor(theme.color.rule).lineWidth(0.75).stroke()
    doc.image(qrCodeBuffer, qrX, qrY, { width: qrSize, height: qrSize })
  } catch {
    doc.font(theme.font.regular).fontSize(theme.size.body).fillColor(theme.color.faint)
    doc.text('QR code unavailable — please contact support', left, qrY + 40, {
      width: contentWidth,
      align: 'center',
    })
  }

  doc.font(theme.font.regular).fontSize(theme.size.caption).fillColor(theme.color.mute)
  doc.text('Scan to verify your registration', left, qrY + qrSize + 14, {
    width: contentWidth,
    align: 'center',
  })

  // URL — split at query string if long, otherwise let it wrap naturally
  const urlY = qrY + qrSize + 30
  const questionMarkIndex = verificationUrl.indexOf('?')
  doc.font(theme.font.regular).fontSize(theme.size.micro).fillColor(theme.color.faint)
  if (questionMarkIndex > 0 && verificationUrl.length > 90) {
    const base = verificationUrl.substring(0, questionMarkIndex)
    const params = verificationUrl.substring(questionMarkIndex)
    doc.text(base, left, urlY, { width: contentWidth, align: 'center' })
    doc.text(params, left, urlY + 10, { width: contentWidth, align: 'center' })
  } else {
    doc.text(verificationUrl, left, urlY, { width: contentWidth, align: 'center', lineGap: 1.5 })
  }

  // ---------- Footer (bottom-pinned) ----------
  const footerY = pageHeight - theme.metric.pageMarginBottom + 6
  drawHRule(footerY - 8)
  doc.font(theme.font.regular).fontSize(theme.size.footer).fillColor(theme.color.faint)
  doc.text(
    `© ${new Date().getFullYear()} ${SITE_CONFIG.name}. All rights reserved.`,
    left,
    footerY,
    { width: contentWidth, align: 'center' }
  )
}

