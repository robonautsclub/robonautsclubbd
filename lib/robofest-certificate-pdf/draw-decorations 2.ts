import { COLORS } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PDFKit instance
export function drawHexGrid(
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
export function drawCircuitOverlay(
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
export function drawSignatureBlock(
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
