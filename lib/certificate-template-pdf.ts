/**
 * Render certificate PDFs from background templates + % positioned fields.
 */

import { format } from 'date-fns'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { setupPDFKitFonts } from '@/lib/pdfGenerator'
import { SITE_CONFIG } from '@/lib/site-config'
import { sanitizeTextForPDF } from '@/lib/textSanitizer'
import type {
  CertificateField,
  CertificateFieldKey,
  CertificateTemplate,
} from '@/lib/certificate-templates'
import {
  CERTIFICATE_DEFAULT_LOGO_PATH,
  getSampleCertificateValues,
  resolveCertificatePdfFont,
} from '@/lib/certificate-templates'

export type CertificateSignatureSlot = {
  imageUrl?: string
  name?: string
  title?: string
}

export type CertificateRenderValues = Partial<
  Record<CertificateFieldKey, string>
> & {
  verificationUrl?: string
  /** Fills signatureImage fields in order when field.imageUrl is empty. */
  signatureSlots?: CertificateSignatureSlot[]
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return Buffer.from(await response.arrayBuffer())
  } catch {
    return null
  }
}

function readPublicAsset(relativePath: string): Buffer | null {
  try {
    const cleaned = relativePath.replace(/^\//, '')
    const filePath = join(process.cwd(), 'public', cleaned)
    if (!existsSync(filePath)) return null
    return readFileSync(filePath)
  } catch {
    return null
  }
}

/** Resolve logo/signature URLs; support /public paths and disk fallback. */
async function resolveImageBuffer(url: string | undefined): Promise<Buffer | null> {
  const raw = (url || '').trim()
  if (!raw) return null

  if (raw.startsWith('/')) {
    const fromDisk = readPublicAsset(raw)
    if (fromDisk) return fromDisk
    const base = (SITE_CONFIG.url || '').replace(/\/$/, '')
    if (base) {
      const fetched = await fetchImageBuffer(`${base}${raw}`)
      if (fetched) return fetched
    }
    return null
  }

  return fetchImageBuffer(raw)
}

function pageDimensions(layout: 'landscape' | 'portrait'): {
  width: number
  height: number
} {
  // PDFKit A4 points
  return layout === 'portrait'
    ? { width: 595.28, height: 841.89 }
    : { width: 841.89, height: 595.28 }
}

function resolveFieldText(
  field: CertificateField,
  values: CertificateRenderValues,
): string {
  if (field.key === 'staticText') {
    return sanitizeTextForPDF(field.staticValue || field.label || '') || ''
  }
  if (
    field.key === 'qrVerify' ||
    field.key === 'signatureImage' ||
    field.key === 'logoImage'
  ) {
    return ''
  }
  const raw = values[field.key]
  return sanitizeTextForPDF(raw || '') || ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PDFKit
async function drawFields(
  doc: any,
  template: CertificateTemplate,
  values: CertificateRenderValues,
  pageWidth: number,
  pageHeight: number,
) {
  const { generateQRCodeBuffer } = await import('./qrCode')
  let signatureSlotCursor = 0

  for (const field of template.fields) {
    const x = (field.xPct / 100) * pageWidth
    const y = (field.yPct / 100) * pageHeight
    const w = (field.wPct / 100) * pageWidth

    if (field.key === 'qrVerify') {
      const url =
        values.verificationUrl ||
        values.qrVerify ||
        `${SITE_CONFIG.url}/verify-booking`
      const size = Math.min(Math.max(w, 24), pageWidth * 0.35, pageHeight * 0.45)
      const qrPixels = Math.min(720, Math.max(160, Math.round(size * 4)))
      let qr: Buffer | null = null
      try {
        qr = await generateQRCodeBuffer(url, qrPixels)
      } catch {
        qr = null
      }
      if (qr) {
        try {
          doc.image(qr, x, y, { width: size, height: size })
        } catch {
          // skip
        }
      }
      continue
    }

    if (field.key === 'logoImage') {
      const buf =
        (await resolveImageBuffer(
          field.imageUrl || CERTIFICATE_DEFAULT_LOGO_PATH,
        )) || readPublicAsset(CERTIFICATE_DEFAULT_LOGO_PATH)
      if (!buf) continue
      const size = Math.min(w, pageHeight * 0.08, 36)
      try {
        doc.image(buf, x, y, {
          fit: [size, size],
          align: 'left',
          valign: 'top',
        })
      } catch {
        // skip
      }
      continue
    }

    if (field.key === 'signatureImage') {
      const slotIndex = signatureSlotCursor
      signatureSlotCursor += 1
      const slot = values.signatureSlots?.[slotIndex]
      const url =
        field.imageUrl?.trim() || slot?.imageUrl?.trim() || ''
      const name =
        sanitizeTextForPDF(slot?.name || field.staticValue || '') || ''
      const role =
        sanitizeTextForPDF(
          slot?.title ||
            (field.label &&
            !/^signature(\s*\d+)?$/i.test(field.label.trim())
              ? field.label
              : ''),
        ) || ''

      const imageH = Math.min(pageHeight * 0.1, Math.max(28, w * 0.22))
      let drewImage = false
      if (url) {
        const buf = await resolveImageBuffer(url)
        if (buf) {
          try {
            doc.image(buf, x, y, {
              fit: [w, imageH],
              align: 'center',
              valign: 'bottom',
            })
            drewImage = true
          } catch {
            // fall through to line + labels
          }
        }
      }

      const lineY = y + (drewImage || url ? imageH + 4 : 8)
      doc
        .moveTo(x, lineY)
        .lineTo(x + w, lineY)
        .strokeColor('#cbd5e1')
        .lineWidth(0.8)
        .stroke()

      if (name) {
        doc
          .font(resolveCertificatePdfFont(field.fontFamily, 'bold'))
          .fontSize(Math.min(11, Math.max(8, field.fontSizePt || 9)))
          .fillColor(field.color || '#0f172a')
          .text(name, x, lineY + 5, {
            width: w,
            align: 'center',
            lineBreak: false,
          })
      }
      if (role) {
        doc
          .font(resolveCertificatePdfFont(field.fontFamily, 'normal'))
          .fontSize(7.5)
          .fillColor('#475569')
          .text(role, x, lineY + (name ? 17 : 5), {
            width: w,
            align: 'center',
            lineBreak: false,
          })
      }
      continue
    }

    const text = resolveFieldText(field, values)
    if (!text) continue

    doc
      .font(resolveCertificatePdfFont(field.fontFamily, field.fontWeight))
      .fontSize(field.fontSizePt)
      .fillColor(field.color || '#0f172a')
      .text(text, x, y, {
        width: w,
        align: field.align || 'center',
        lineBreak: true,
      })
  }
}

export async function generateCertificateFromTemplate(input: {
  template: CertificateTemplate
  values: CertificateRenderValues
  filename?: string
}): Promise<{ buffer: Buffer; filename: string } | { error: string }> {
  const multi = await generateCertificatesFromTemplate({
    template: input.template,
    pages: [input.values],
    filename: input.filename,
  })
  return multi
}

export async function generateCertificatesFromTemplate(input: {
  template: CertificateTemplate
  pages: CertificateRenderValues[]
  filename?: string
}): Promise<{ buffer: Buffer; filename: string } | { error: string }> {
  const { template, pages } = input
  if (!template.backgroundUrl) {
    return { error: 'Template background is missing.' }
  }
  if (!pages.length) {
    return { error: 'No certificate pages to generate.' }
  }

  const background = await fetchImageBuffer(template.backgroundUrl)
  if (!background) {
    return { error: 'Failed to load template background image.' }
  }

  const PDFDocument = (await import('pdfkit')).default
  const layout = template.page.layout === 'portrait' ? 'portrait' : 'landscape'
  const { width: pageWidth, height: pageHeight } = pageDimensions(layout)

  try {
    const buffer = await new Promise<Buffer>(async (resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs')
      let fontPatch: {
        originalReadFileSync: (
          path: string | Buffer | number,
          options?: string,
        ) => Buffer | string
      } | null = null

      try {
        fontPatch = setupPDFKitFonts()
        const doc = new PDFDocument({
          size: 'A4',
          layout,
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          // Must create a page before any font/text calls (PDFKit page buffer is null otherwise).
          autoFirstPage: true,
        })

        const chunks: Buffer[] = []
        doc.on('data', chunks.push.bind(chunks))
        doc.on('end', () => {
          if (fontPatch) fs.readFileSync = fontPatch.originalReadFileSync
          resolve(Buffer.concat(chunks))
        })
        doc.on('error', (err: Error) => {
          if (fontPatch) fs.readFileSync = fontPatch.originalReadFileSync
          reject(err)
        })

        // Prime AFM fonts on the first page (same pattern as registration PDFs).
        const primeFonts = [
          'Helvetica',
          'Helvetica-Bold',
          'Times-Roman',
          'Times-Bold',
          'Courier',
          'Courier-Bold',
        ]
        for (const fontName of primeFonts) {
          try {
            doc
              .font(fontName)
              .fontSize(1)
              .fillColor('white')
              .text(' ', -1000, -1000, { width: 1 })
          } catch {
            // skip missing face
          }
        }

        for (let i = 0; i < pages.length; i += 1) {
          if (i > 0) {
            doc.addPage({
              size: 'A4',
              layout,
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
            })
          }
          try {
            doc.image(background, 0, 0, {
              width: pageWidth,
              height: pageHeight,
            })
          } catch {
            // continue
          }
          await drawFields(doc, template, pages[i], pageWidth, pageHeight)
        }

        doc.end()
      } catch (error) {
        if (fontPatch) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const fs = require('fs')
          fs.readFileSync = fontPatch.originalReadFileSync
        }
        reject(error)
      }
    })

    const first = pages[0]
    const filename =
      input.filename ||
      `Certificate-${sanitizeTextForPDF(first.certificateId || first.registrationId || 'sample')?.replace(/[^a-zA-Z0-9-_]+/g, '-') || 'sample'}.pdf`

    return { buffer, filename }
  } catch (error) {
    console.error('[certificate-template-pdf] generate failed:', error)
    return { error: 'Failed to generate certificate PDF.' }
  }
}

export async function generateSampleCertificatePdf(
  template: CertificateTemplate,
  baseUrl?: string,
): Promise<{ buffer: Buffer; filename: string } | { error: string }> {
  const sample = getSampleCertificateValues()
  const root = (baseUrl || SITE_CONFIG.url || '').replace(/\/$/, '')
  const signatureSlots = template.fields
    .filter((f) => f.key === 'signatureImage')
    .map((f, index) => ({
      imageUrl: f.imageUrl,
      name: f.staticValue || (index === 0 ? 'Dr. A. Rahman' : 'Eng. S. Khan'),
      title: f.label && !/^signature/i.test(f.label) ? f.label : index === 0 ? 'Director' : 'Head Judge',
    }))
  return generateCertificateFromTemplate({
    template,
    values: {
      ...sample,
      verificationUrl: `${root}/verify-booking?registrationId=${encodeURIComponent(sample.registrationId)}`,
      signatureSlots,
    },
    filename: `certificate-sample-${template.id}.pdf`,
  })
}

export function buildEventCertificateId(registrationId: string): string {
  return `EVT-${registrationId}`
}

export function formatEventDateLabel(date: string | string[] | undefined): string {
  if (!date) return ''
  const dates = Array.isArray(date) ? date : [date]
  return dates
    .map((d) => {
      try {
        return format(new Date(d), 'dd MMMM yyyy')
      } catch {
        return d
      }
    })
    .filter(Boolean)
    .join(' · ')
}
