import { setupPDFKitFonts } from '@/lib/pdfGenerator'
import { drawCertificatePage } from './draw-page'
import { COLORS, type CertificatePageInput } from './types'

export async function buildCertificatesPdf(
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
