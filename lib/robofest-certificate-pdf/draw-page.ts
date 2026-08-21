import { format } from 'date-fns'
import { resolveRobofestRoundVenueLabel } from '@/lib/robofest-content'
import type { RobofestAwardAccent } from '@/lib/robofest-award-categories'
import { sanitizeTextForPDF } from '@/lib/textSanitizer'
import {
  drawCircuitOverlay,
  drawHexGrid,
  drawSignatureBlock,
} from './draw-decorations'
import {
  eventTitle,
  fitNameFontSize,
  isParticipationAward,
  organizerLine,
  teamLabel,
} from './labels'
import {
  ACCENT_HEX,
  COLORS,
  FOOTER_TAGLINE,
  type CertificatePageInput,
} from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PDFKit instance
export function drawCertificatePage(doc: any, input: CertificatePageInput): void {
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
