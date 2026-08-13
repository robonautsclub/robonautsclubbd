/**
 * Premium Robofest certificate PDFs — A4 landscape, left robot panel + right content.
 * When content.certificateTemplateId is set, uses the background template engine instead.
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { format } from 'date-fns'
import type {
  RobofestContent,
  RobofestRegistration,
} from '@/lib/robofest-content'
import { resolveRobofestRoundVenueLabel } from '@/lib/robofest-content'
import {
  resolveRobofestCertificateSignatures,
  type RobofestCertificateSignature,
} from '@/lib/robofest-certificate-signatures'
import {
  resolveRobofestAwardCategory,
  type RobofestAwardAccent,
  type RobofestAwardCategory,
  type RobofestCertificateType,
} from '@/lib/robofest-award-categories'
import { generateCertificatesFromTemplate } from '@/lib/certificate-template-pdf'
import type { CertificateRenderValues } from '@/lib/certificate-template-pdf'
import { resolveCertificateAwardFields } from '@/lib/certificate-templates'
import { loadActiveCertificateTemplateById } from '@/lib/certificate-templates-db'
import { loadLogoBuffer, setupPDFKitFonts } from '@/lib/pdfGenerator'
import { SITE_CONFIG } from '@/lib/site-config'
import { sanitizeTextForPDF } from '@/lib/textSanitizer'

export type CertificateParticipant = {
  name: string
  school?: string
  grade?: string
  memberIndex: number
  awardCategoryId?: string
}

type CertificatePageInput = {
  participant: CertificateParticipant
  registration: RobofestRegistration
  content: RobofestContent
  logoBuffer: Buffer | null
  robotBuffer: Buffer | null
  award: RobofestAwardCategory
  verificationUrl: string
  qrBuffer: Buffer | null
  certificateId: string
  signatures: RobofestCertificateSignature[]
  /** signature id → image buffer */
  signatureImages: Record<string, Buffer>
}

const ACCENT_HEX: Record<RobofestAwardAccent, string> = {
  cyan: '#06b6d4',
  gold: '#ca8a04',
  silver: '#64748b',
  bronze: '#b45309',
  slate: '#334155',
}

const COLORS = {
  navy: '#0a1628',
  navyMid: '#0f2744',
  navyDeep: '#06101c',
  cyan: '#06b6d4',
  cyanSoft: '#22d3ee',
  ink: '#0f172a',
  mute: '#475569',
  faint: '#94a3b8',
  line: '#cbd5e1',
  rightBg: '#f8fafc',
  white: '#ffffff',
  hex: '#e2e8f0',
}

const FOOTER_TAGLINE = 'Imagine • Build • Innovate • Inspire'

function safeFilenamePart(value: string): string {
  return (
    sanitizeTextForPDF(value)
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'participant'
  )
}

export function buildRobofestCertificateId(
  registrationId: string,
  memberIndex: number,
): string {
  return `RF26-${registrationId}-M${memberIndex + 1}`
}

export function resolveCertificateParticipants(
  registration: RobofestRegistration,
): CertificateParticipant[] {
  const members = registration.teamMembers?.filter((m) => m?.name?.trim()) || []
  if (members.length > 0) {
    return members.map((m, index) => ({
      name: m.name.trim(),
      school: m.school?.trim() || registration.school || undefined,
      grade: m.grade?.trim() || undefined,
      memberIndex: index,
      awardCategoryId: m.awardCategoryId,
    }))
  }

  const fallbackName =
    registration.name?.trim() ||
    registration.email?.trim() ||
    'Participant'
  return [
    {
      name: fallbackName,
      school: registration.school?.trim() || undefined,
      grade: undefined,
      memberIndex: 0,
      awardCategoryId: 'participant',
    },
  ]
}

function teamLabel(registration: RobofestRegistration): string {
  return (
    registration.teamNumber?.trim() ||
    registration.name?.trim() ||
    ''
  )
}

function eventTitle(content: RobofestContent): string {
  return (
    sanitizeTextForPDF(content.headline)?.trim() ||
    'RoboFest Bangladesh 2026'
  )
}

function organizerLine(content: RobofestContent): string {
  const presents = sanitizeTextForPDF(content.presentsLabel)?.trim()
  const host = sanitizeTextForPDF(content.hostName)?.trim()
  if (presents) return presents
  if (host) return `${host} Presents`
  return 'Robonauts Ltd Presents'
}

async function fetchSignatureImageBuffer(
  url: string,
): Promise<Buffer | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return Buffer.from(await response.arrayBuffer())
  } catch {
    return null
  }
}

function buildTemplateSignatureSlots(
  content: RobofestContent,
): NonNullable<CertificateRenderValues['signatureSlots']> {
  return resolveRobofestCertificateSignatures(content).map((sig) => ({
    imageUrl: sig.imageUrl?.trim() || undefined,
    name: sig.name?.trim() || undefined,
    title: sig.title?.trim() || undefined,
  }))
}

async function loadSignatureImages(
  signatures: RobofestCertificateSignature[],
): Promise<Record<string, Buffer>> {
  const images: Record<string, Buffer> = {}
  await Promise.all(
    signatures.map(async (sig) => {
      const url = sig.imageUrl?.trim()
      if (!url) return
      const buf = await fetchSignatureImageBuffer(url)
      if (buf) images[sig.id] = buf
    }),
  )
  return images
}

function isParticipationAward(award: RobofestAwardCategory): boolean {
  const type = (award.certificateType ||
    (award.id === 'participant' ? 'participation' : 'achievement')) as
    | RobofestCertificateType
    | string
  return type === 'participation' || award.id === 'participant'
}

function fitNameFontSize(name: string, maxWidth: number): number {
  const len = name.length
  if (len <= 18) return 32
  if (len <= 28) return 26
  if (len <= 40) return 22
  if (len <= 55) return 18
  void maxWidth
  return 15
}

function loadRobotBuffer(): Buffer | null {
  try {
    const robotPath = join(
      process.cwd(),
      'public',
      'robofest',
      'certificate-robot.png',
    )
    if (existsSync(robotPath)) return readFileSync(robotPath)
  } catch {
    // continue without robot art
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PDFKit instance
function drawHexGrid(
  doc: any,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  opacity = 0.35,
) {
  doc.save()
  doc.opacity(opacity)
  doc.strokeColor(color).lineWidth(0.45)
  const size = 18
  const rowH = size * 1.55
  const colW = size * 1.75
  for (let row = 0; row < Math.ceil(h / rowH) + 1; row += 1) {
    const offset = row % 2 === 0 ? 0 : colW / 2
    for (let col = 0; col < Math.ceil(w / colW) + 1; col += 1) {
      const cx = x + offset + col * colW
      const cy = y + row * rowH
      if (cx < x - size || cy < y - size || cx > x + w + size || cy > y + h + size) {
        continue
      }
      const r = size * 0.42
      doc
        .moveTo(cx + r, cy)
        .lineTo(cx + r / 2, cy + (r * Math.sqrt(3)) / 2)
        .lineTo(cx - r / 2, cy + (r * Math.sqrt(3)) / 2)
        .lineTo(cx - r, cy)
        .lineTo(cx - r / 2, cy - (r * Math.sqrt(3)) / 2)
        .lineTo(cx + r / 2, cy - (r * Math.sqrt(3)) / 2)
        .closePath()
        .stroke()
    }
  }
  doc.restore()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PDFKit instance
function drawCircuitOverlay(
  doc: any,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: string,
) {
  doc.save()
  doc.opacity(0.45)
  doc.strokeColor(accent).lineWidth(0.7)

  const pad = 16
  doc
    .moveTo(x + pad, y + h * 0.22)
    .lineTo(x + w * 0.35, y + h * 0.22)
    .lineTo(x + w * 0.42, y + h * 0.28)
    .lineTo(x + w - pad, y + h * 0.28)
    .stroke()
  doc.circle(x + pad, y + h * 0.22, 2).fill(accent)

  doc
    .moveTo(x + pad, y + h * 0.72)
    .lineTo(x + w * 0.28, y + h * 0.72)
    .lineTo(x + w * 0.34, y + h * 0.66)
    .lineTo(x + w * 0.55, y + h * 0.66)
    .stroke()
  doc.circle(x + w * 0.55, y + h * 0.66, 2).fill(COLORS.cyanSoft)

  doc
    .dash(2.5, { space: 2.5 })
    .moveTo(x + w * 0.18, y + pad)
    .lineTo(x + w * 0.18, y + h * 0.18)
    .stroke()
  doc.undash()

  doc
    .moveTo(x + w * 0.72, y + h - pad)
    .lineTo(x + w * 0.72, y + h * 0.78)
    .lineTo(x + w - pad, y + h * 0.78)
    .stroke()

  doc.restore()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PDFKit instance
function drawSignatureBlock(
  doc: any,
  x: number,
  y: number,
  width: number,
  name: string,
  role: string,
  imageBuffer?: Buffer | null,
) {
  const imageH = 32
  const imageY = y
  const lineY = y + imageH + 4

  if (imageBuffer) {
    try {
      doc.image(imageBuffer, x + 4, imageY, {
        fit: [width - 8, imageH],
        align: 'center',
        valign: 'bottom',
      })
    } catch {
      // blank line still drawn below
    }
  }

  doc
    .moveTo(x, lineY)
    .lineTo(x + width, lineY)
    .strokeColor(COLORS.line)
    .lineWidth(0.8)
    .stroke()
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.ink)
    .text(name, x, lineY + 6, { width, align: 'center' })
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(COLORS.mute)
    .text(role, x, lineY + 18, { width, align: 'center' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PDFKit instance
function drawCertificatePage(doc: any, input: CertificatePageInput): void {
  const {
    participant,
    registration,
    content,
    logoBuffer,
    robotBuffer,
    award,
    qrBuffer,
    certificateId,
    signatures,
    signatureImages,
  } = input

  const pageWidth = doc.page.width as number
  const pageHeight = doc.page.height as number
  const margin = 34 // ~12mm
  const accentKey = (award.accent || 'cyan') as RobofestAwardAccent
  const accent = ACCENT_HEX[accentKey] || ACCENT_HEX.cyan
  const participation = isParticipationAward(award)

  const innerX = margin
  const innerY = margin
  const innerW = pageWidth - margin * 2
  const innerH = pageHeight - margin * 2
  const leftW = Math.round(innerW * 0.28)
  const rightX = innerX + leftW
  const rightW = innerW - leftW

  // Outer navy frame
  doc.rect(0, 0, pageWidth, pageHeight).fill(COLORS.navyDeep)
  doc
    .rect(innerX - 2, innerY - 2, innerW + 4, innerH + 4)
    .lineWidth(1.25)
    .strokeColor(accent)
    .stroke()

  // —— Left robot panel ——
  doc.rect(innerX, innerY, leftW, innerH).fill(COLORS.navy)
  // subtle gradient bands
  doc.opacity(0.35)
  doc.rect(innerX, innerY, leftW, innerH * 0.45).fill(COLORS.navyMid)
  doc.opacity(1)

  drawHexGrid(doc, innerX, innerY, leftW, innerH, COLORS.cyan, 0.18)
  drawCircuitOverlay(doc, innerX, innerY, leftW, innerH, COLORS.cyan)

  if (robotBuffer) {
    try {
      doc.save()
      doc.rect(innerX, innerY, leftW, innerH).clip()
      // Full-bleed width in the left panel
      doc.image(robotBuffer, innerX, innerY, {
        cover: [leftW, innerH],
        align: 'center',
        valign: 'center',
      })
      doc.restore()
    } catch {
      // continue without art
    }
  }

  // Cyan edge seam
  doc.rect(rightX - 3, innerY, 3, innerH).fill(accent)

  // —— Right content panel ——
  doc.rect(rightX, innerY, rightW, innerH).fill(COLORS.white)
  drawHexGrid(doc, rightX, innerY, rightW, innerH, COLORS.hex, 0.45)

  const contentPad = 28
  const contentLeft = rightX + contentPad
  const contentWidth = rightW - contentPad * 2 - 8
  const qrSize = 64
  let y = innerY + 22

  // Brand row
  const logoSize = 28
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, contentLeft, y, {
        fit: [logoSize, logoSize],
      })
    } catch {
      // continue
    }
  }
  const brandX = logoBuffer ? contentLeft + logoSize + 10 : contentLeft
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(COLORS.navy)
    .text('ROBOFEST 2026', brandX, y + 2, {
      characterSpacing: 2.2,
      width: contentWidth - (logoBuffer ? logoSize + 10 : 0),
    })
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(COLORS.mute)
    .text(organizerLine(content), brandX, y + 22, {
      width: contentWidth - (logoBuffer ? logoSize + 10 : 0),
    })

  y += 48
  doc
    .moveTo(contentLeft, y)
    .lineTo(contentLeft + contentWidth, y)
    .strokeColor(COLORS.line)
    .lineWidth(0.6)
    .stroke()
  doc
    .moveTo(contentLeft, y + 1.5)
    .lineTo(contentLeft + 72, y + 1.5)
    .strokeColor(accent)
    .lineWidth(2)
    .stroke()

  y += 16
  const competition = eventTitle(content)
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORS.navy)
    .text(competition.toUpperCase(), contentLeft, y, {
      width: contentWidth,
      align: 'center',
      characterSpacing: 1.4,
    })

  y += 20
  const title =
    sanitizeTextForPDF(award.certificateTitle) ||
    (participation
      ? 'CERTIFICATE OF PARTICIPATION'
      : 'CERTIFICATE OF ACHIEVEMENT')
  doc
    .font('Helvetica-Bold')
    .fontSize(participation ? 13 : 14)
    .fillColor(accent)
    .text(title, contentLeft, y, {
      width: contentWidth,
      align: 'center',
      characterSpacing: 1.1,
    })

  y += 26
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.mute)
    .text('This is to certify that', contentLeft, y, {
      width: contentWidth,
      align: 'center',
    })

  y += 18
  const name = sanitizeTextForPDF(participant.name) || 'Participant'
  const nameSize = fitNameFontSize(name, contentWidth)
  doc
    .font('Helvetica-Bold')
    .fontSize(nameSize)
    .fillColor(COLORS.ink)
    .text(name, contentLeft, y, {
      width: contentWidth,
      align: 'center',
    })
  const nameHeight = Math.ceil(name.length / 42) * (nameSize + 2)
  y += Math.max(nameSize + 8, nameHeight + 4)

  // Name underline accent
  const underlineW = Math.min(contentWidth * 0.55, 220)
  doc
    .moveTo(contentLeft + (contentWidth - underlineW) / 2, y)
    .lineTo(contentLeft + (contentWidth + underlineW) / 2, y)
    .strokeColor(accent)
    .lineWidth(1.25)
    .stroke()
  y += 12

  const schoolBits = [
    sanitizeTextForPDF(participant.school),
    sanitizeTextForPDF(participant.grade),
  ].filter(Boolean)
  if (schoolBits.length > 0) {
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(COLORS.mute)
      .text(schoolBits.join('  ·  '), contentLeft, y, {
        width: contentWidth,
        align: 'center',
      })
    y += 16
  }

  // Award / category / team emphasis
  const category =
    sanitizeTextForPDF(registration.category) || 'Robofest'
  const venue = sanitizeTextForPDF(
    resolveRobofestRoundVenueLabel(content, registration.roundCity),
  )
  const team = sanitizeTextForPDF(teamLabel(registration))
  const awardLabel = sanitizeTextForPDF(award.label) || 'Participant'
  const bodyRaw =
    sanitizeTextForPDF(award.certificateBody) ||
    (participation
      ? 'has participated in Robofest Bangladesh as a registered competitor'
      : `for achieving ${awardLabel} in`)

  let bodyLine: string
  if (participation) {
    bodyLine = bodyRaw.replace(/\.*$/, '') + '.'
  } else {
    const endsOpen = /\bin\s*$/i.test(bodyRaw.trim())
    bodyLine = endsOpen
      ? `${bodyRaw.trim()} ${category}.`
      : `${bodyRaw.trim()}.`
  }

  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(COLORS.ink)
    .text(bodyLine, contentLeft, y, {
      width: contentWidth,
      align: 'center',
    })
  y += 22

  if (!participation) {
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(accent)
      .text(awardLabel.toUpperCase(), contentLeft, y, {
        width: contentWidth,
        align: 'center',
        characterSpacing: 1.2,
      })
    y += 16
  }

  // Meta strip: Category / Team / Venue
  const metaParts: string[] = [`Category: ${category}`]
  if (team) metaParts.push(`Team: ${team}`)
  if (venue) metaParts.push(`Venue: ${venue}`)
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.mute)
    .text(metaParts.join('   ·   '), contentLeft, y, {
      width: contentWidth,
      align: 'center',
    })
  y += 28

  // Issue date + certificate ID
  const issuedOn = format(
    registration.createdAt ? new Date(registration.createdAt) : new Date(),
    'dd MMMM yyyy',
  )
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(COLORS.mute)
    .text(`Issued on ${issuedOn}`, contentLeft, y, {
      width: contentWidth * 0.5,
      align: 'left',
    })
  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.navy)
    .text(`Certificate ID: ${certificateId}`, contentLeft + contentWidth * 0.4, y, {
      width: contentWidth * 0.6,
      align: 'right',
    })

  // Signatures — auto-arrange 1–4 across content left of QR
  const sigCount = Math.max(signatures.length, 1)
  const sigY = innerY + innerH - 132
  const sigGap = 12
  const sigAreaW = contentWidth - qrSize - 28
  const sigW = (sigAreaW - sigGap * (sigCount - 1)) / sigCount
  signatures.forEach((sig, index) => {
    const name =
      sanitizeTextForPDF(sig.name)?.trim() ||
      sanitizeTextForPDF(sig.title)?.trim() ||
      'Signatory'
    const role =
      sanitizeTextForPDF(sig.title)?.trim() || 'Signatory'
    drawSignatureBlock(
      doc,
      contentLeft + index * (sigW + sigGap),
      sigY,
      sigW,
      name,
      role,
      signatureImages[sig.id] || null,
    )
  })

  // QR bottom-right of content
  const qrX = rightX + rightW - contentPad - qrSize
  const qrY = innerY + innerH - contentPad - qrSize - 14
  doc
    .roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 22, 4)
    .lineWidth(1)
    .strokeColor(accent)
    .stroke()

  if (qrBuffer) {
    try {
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize })
    } catch {
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(COLORS.faint)
        .text('QR unavailable', qrX, qrY + qrSize / 2 - 4, {
          width: qrSize,
          align: 'center',
        })
    }
  } else {
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(COLORS.faint)
      .text('QR unavailable', qrX, qrY + qrSize / 2 - 4, {
        width: qrSize,
        align: 'center',
      })
  }
  doc
    .font('Helvetica-Bold')
    .fontSize(6.5)
    .fillColor(accent)
    .text('SCAN TO VERIFY', qrX - 6, qrY + qrSize + 4, {
      width: qrSize + 12,
      align: 'center',
      characterSpacing: 0.6,
    })

  // Footer tagline
  const footerY = innerY + innerH - 16
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.faint)
    .text(FOOTER_TAGLINE, contentLeft, footerY, {
      width: contentWidth - qrSize - 24,
      align: 'left',
      characterSpacing: 0.4,
    })
}

async function buildCertificatesPdf(
  pages: CertificatePageInput[],
): Promise<Buffer> {
  if (pages.length === 0) {
    throw new Error('No participants to generate certificates for.')
  }

  const PDFDocument = (await import('pdfkit')).default

  return new Promise(async (resolve, reject) => {
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
        layout: 'landscape',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        autoFirstPage: true,
      })

      doc
        .font('Helvetica')
        .fontSize(1)
        .fillColor('white')
        .text(' ', -1000, -1000, { width: 1 })
      doc
        .font('Helvetica-Bold')
        .fontSize(1)
        .fillColor('white')
        .text(' ', -1000, -1000, { width: 1 })
      doc.font('Helvetica').fontSize(11).fillColor(COLORS.ink)

      const buffers: Buffer[] = []
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        if (fontPatch) {
          fs.readFileSync = fontPatch.originalReadFileSync
        }
        resolve(Buffer.concat(buffers))
      })
      doc.on('error', (error: Error) => {
        if (fontPatch) {
          fs.readFileSync = fontPatch.originalReadFileSync
        }
        reject(error)
      })

      pages.forEach((page, index) => {
        if (index > 0) {
          doc.addPage({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
          })
        }
        drawCertificatePage(doc, page)
      })

      doc.end()
    } catch (error) {
      if (fontPatch) {
        fs.readFileSync = fontPatch.originalReadFileSync
      }
      reject(error)
    }
  })
}

function resolveBaseUrl(baseUrl?: string): string {
  const raw =
    baseUrl ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    SITE_CONFIG.url ||
    ''
  return raw.replace(/\/$/, '')
}

function buildCertificateVerificationUrl(
  baseUrl: string,
  registrationId: string,
  memberIndex: number,
): string {
  return `${baseUrl}/verify-booking?registrationId=${encodeURIComponent(registrationId)}&member=${memberIndex}`
}

async function loadCertLogo(baseUrl: string): Promise<Buffer | null> {
  return loadLogoBuffer(`${baseUrl}/verify-booking`)
}

async function buildPageInputs(
  registration: RobofestRegistration,
  content: RobofestContent,
  logoBuffer: Buffer | null,
  robotBuffer: Buffer | null,
  participants: CertificateParticipant[],
  baseUrl: string,
  signatures: RobofestCertificateSignature[],
  signatureImages: Record<string, Buffer>,
): Promise<CertificatePageInput[]> {
  const { generateQRCodeBuffer } = await import('./qrCode')
  const registrationId = registration.registrationId || ''

  const pages: CertificatePageInput[] = []
  for (const participant of participants) {
    const award = resolveRobofestAwardCategory(
      content.awardCategories,
      participant.awardCategoryId,
    )
    const verificationUrl = buildCertificateVerificationUrl(
      baseUrl,
      registrationId,
      participant.memberIndex,
    )
    let qrBuffer: Buffer | null = null
    try {
      qrBuffer = await generateQRCodeBuffer(verificationUrl, 320)
    } catch (error) {
      console.error('[robofest-certificate] QR generate failed:', error)
    }
    pages.push({
      participant,
      registration,
      content,
      logoBuffer,
      robotBuffer,
      award,
      verificationUrl,
      qrBuffer,
      certificateId: buildRobofestCertificateId(
        registrationId,
        participant.memberIndex,
      ),
      signatures,
      signatureImages,
    })
  }
  return pages
}

export async function generateRobofestParticipationCertificatesPDF(input: {
  registration: RobofestRegistration
  content: RobofestContent
  memberIndex?: number
  baseUrl?: string
}): Promise<{ buffer: Buffer; filename: string } | { error: string }> {
  const { registration, content, memberIndex } = input
  const baseUrl = resolveBaseUrl(input.baseUrl)

  if (!registration.registrationId) {
    return { error: 'Registration ID is missing.' }
  }
  if (registration.status === 'cancelled') {
    return { error: 'Cannot generate certificates for a cancelled registration.' }
  }

  const participants = resolveCertificateParticipants(registration)
  const selected =
    typeof memberIndex === 'number'
      ? participants.filter((p) => p.memberIndex === memberIndex)
      : participants

  if (selected.length === 0) {
    return { error: 'Participant not found on this registration.' }
  }

  const templateId = content.certificateTemplateId?.trim()
  if (templateId) {
    const template = await loadActiveCertificateTemplateById(templateId)
    if (!template) {
      return {
        error:
          'Assigned certificate template is missing or inactive. Clear it in Robofest Content or fix the template.',
      }
    }
    const signatureSlots = buildTemplateSignatureSlots(content)
    const pages = selected.map((participant) => {
      const award = resolveRobofestAwardCategory(
        content.awardCategories,
        participant.awardCategoryId,
      )
      const category = registration.category || ''
      const awardFields = resolveCertificateAwardFields(award, { category })
      const certificateId = buildRobofestCertificateId(
        registration.registrationId!,
        participant.memberIndex,
      )
      return {
        recipientName: participant.name,
        school: participant.school || registration.school || '',
        grade: participant.grade || '',
        category,
        eventTitle: content.headline || 'RoboFest Bangladesh 2026',
        eventDate: content.dateLabel || '',
        venue: resolveRobofestRoundVenueLabel(content, registration.roundCity),
        teamNumber: registration.teamNumber || registration.name || '',
        certificateTitle: awardFields.certificateTitle,
        certificateBody: awardFields.certificateBody,
        awardLabel: awardFields.awardLabel,
        registrationId: registration.registrationId!,
        certificateId,
        issueDate: format(
          registration.createdAt
            ? new Date(registration.createdAt)
            : new Date(),
          'dd MMMM yyyy',
        ),
        verificationUrl: buildCertificateVerificationUrl(
          baseUrl,
          registration.registrationId!,
          participant.memberIndex,
        ),
        signatureSlots,
      }
    })

    const result = await generateCertificatesFromTemplate({
      template,
      pages,
      filename:
        typeof memberIndex === 'number' && selected[0]
          ? `Robofest-Certificate-${registration.registrationId}-${memberIndex + 1}.pdf`
          : `Robofest-Certificate-${registration.registrationId}.pdf`,
    })
    return result
  }

  try {
    const logoBuffer = await loadCertLogo(baseUrl)
    const robotBuffer = loadRobotBuffer()
    const signatures = resolveRobofestCertificateSignatures(content)
    const signatureImages = await loadSignatureImages(signatures)
    const pages = await buildPageInputs(
      registration,
      content,
      logoBuffer,
      robotBuffer,
      selected,
      baseUrl,
      signatures,
      signatureImages,
    )
    const buffer = await buildCertificatesPdf(pages)

    if (typeof memberIndex === 'number' && selected[0] && pages[0]) {
      const part = safeFilenamePart(selected[0].name)
      const awardSlug = safeFilenamePart(pages[0].award.label)
      return {
        buffer,
        filename: `Robofest-Certificate-${registration.registrationId}-${memberIndex + 1}-${awardSlug}-${part}.pdf`,
      }
    }

    return {
      buffer,
      filename: `Robofest-Certificate-${registration.registrationId}.pdf`,
    }
  } catch (error) {
    console.error('[robofest-certificate] generate failed:', error)
    return { error: 'Failed to generate participation certificate.' }
  }
}

export async function generateRobofestBulkParticipationCertificatesPDF(input: {
  registrations: RobofestRegistration[]
  content: RobofestContent
  statusLabel?: string
  baseUrl?: string
}): Promise<{ buffer: Buffer; filename: string } | { error: string }> {
  const { registrations, content, statusLabel } = input
  const baseUrl = resolveBaseUrl(input.baseUrl)
  const eligible = registrations.filter((r) => r.status !== 'cancelled')

  const templateId = content.certificateTemplateId?.trim()
  if (templateId) {
    const template = await loadActiveCertificateTemplateById(templateId)
    if (!template) {
      return {
        error:
          'Assigned certificate template is missing or inactive. Clear it in Robofest Content or fix the template.',
      }
    }
    const signatureSlots = buildTemplateSignatureSlots(content)
    const pages = []
    for (const registration of eligible) {
      if (!registration.registrationId) continue
      for (const participant of resolveCertificateParticipants(registration)) {
        const award = resolveRobofestAwardCategory(
          content.awardCategories,
          participant.awardCategoryId,
        )
        const category = registration.category || ''
        const awardFields = resolveCertificateAwardFields(award, { category })
        pages.push({
          recipientName: participant.name,
          school: participant.school || registration.school || '',
          grade: participant.grade || '',
          category,
          eventTitle: content.headline || 'RoboFest Bangladesh 2026',
          eventDate: content.dateLabel || '',
          venue: resolveRobofestRoundVenueLabel(
            content,
            registration.roundCity,
          ),
          teamNumber: registration.teamNumber || registration.name || '',
          certificateTitle: awardFields.certificateTitle,
          certificateBody: awardFields.certificateBody,
          awardLabel: awardFields.awardLabel,
          registrationId: registration.registrationId,
          certificateId: buildRobofestCertificateId(
            registration.registrationId,
            participant.memberIndex,
          ),
          issueDate: format(
            registration.createdAt
              ? new Date(registration.createdAt)
              : new Date(),
            'dd MMMM yyyy',
          ),
          verificationUrl: buildCertificateVerificationUrl(
            baseUrl,
            registration.registrationId,
            participant.memberIndex,
          ),
          signatureSlots,
        })
      }
    }
    if (pages.length === 0) {
      return { error: 'No participants found to generate certificates for.' }
    }
    const stamp = format(new Date(), 'yyyy-MM-dd')
    const statusPart = safeFilenamePart(statusLabel || 'export')
    return generateCertificatesFromTemplate({
      template,
      pages,
      filename: `Robofest-Certificates-${statusPart}-${stamp}.pdf`,
    })
  }

  const logoBuffer = await loadCertLogo(baseUrl)
  const robotBuffer = loadRobotBuffer()
  const signatures = resolveRobofestCertificateSignatures(content)
  const signatureImages = await loadSignatureImages(signatures)
  const pages: CertificatePageInput[] = []

  for (const registration of eligible) {
    if (!registration.registrationId) continue
    pages.push(
      ...(await buildPageInputs(
        registration,
        content,
        logoBuffer,
        robotBuffer,
        resolveCertificateParticipants(registration),
        baseUrl,
        signatures,
        signatureImages,
      )),
    )
  }

  if (pages.length === 0) {
    return { error: 'No participants found to generate certificates for.' }
  }

  try {
    const buffer = await buildCertificatesPdf(pages)
    const stamp = format(new Date(), 'yyyy-MM-dd')
    const statusPart = safeFilenamePart(statusLabel || 'export')
    return {
      buffer,
      filename: `Robofest-Certificates-${statusPart}-${stamp}.pdf`,
    }
  } catch (error) {
    console.error('[robofest-certificate] bulk generate failed:', error)
    return { error: 'Failed to generate participation certificates.' }
  }
}
