/**
 * Verifies PDFKit works with in-memory font patching (same approach as lib/pdfGenerator.ts).
 * Run: node scripts/verify-pdf-generation.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { createRequire } from 'module'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const require = createRequire(import.meta.url)

// Validate generated font bundle exists
const fontDataPath = join(projectRoot, 'lib', 'pdfkitFontData.ts')
if (!existsSync(fontDataPath)) {
  console.error('Missing lib/pdfkitFontData.ts — run: pnpm generate:pdf-fonts')
  process.exit(1)
}
const fontDataSource = readFileSync(fontDataPath, 'utf8')
if (!fontDataSource.includes('Helvetica.afm') || !fontDataSource.includes('Helvetica-Bold.afm')) {
  console.error('lib/pdfkitFontData.ts is missing required fonts — run: pnpm generate:pdf-fonts')
  process.exit(1)
}

// Build in-memory font map from node_modules (mirrors what generate script embeds)
const pdfkitPath = require.resolve('pdfkit')
const dataDir = join(dirname(pdfkitPath), '..', 'js', 'data')
const REQUIRED_FONTS = ['Helvetica.afm', 'Helvetica-Bold.afm']
const PDFKIT_FONT_DATA = {}
for (const fileName of REQUIRED_FONTS) {
  PDFKIT_FONT_DATA[fileName] = readFileSync(join(dataDir, fileName))
}

const fs = require('fs')
const originalReadFileSync = fs.readFileSync.bind(fs)
fs.readFileSync = function (path, ...args) {
  const pathStr = String(path)
  const fileName = pathStr.split(/[\/\\]/).pop() || ''
  if (fileName.endsWith('.afm') && PDFKIT_FONT_DATA[fileName]) {
    const buf = PDFKIT_FONT_DATA[fileName]
    const encoding = args[0]
    if (encoding === 'utf8' || encoding === 'utf-8') {
      return buf.toString('utf8')
    }
    return buf
  }
  try {
    return originalReadFileSync(path, ...args)
  } catch (error) {
    if (error?.code === 'ENOENT' && fileName.endsWith('.afm') && PDFKIT_FONT_DATA[fileName]) {
      const buf = PDFKIT_FONT_DATA[fileName]
      const encoding = args[0]
      if (encoding === 'utf8' || encoding === 'utf-8') {
        return buf.toString('utf8')
      }
      return buf
    }
    throw error
  }
}

const PDFDocument = require('pdfkit')
const doc = new PDFDocument({ size: 'LETTER', margins: { top: 50, bottom: 50, left: 50, right: 50 } })
const chunks = []
doc.on('data', (chunk) => chunks.push(chunk))

await new Promise((resolve, reject) => {
  doc.on('end', resolve)
  doc.on('error', reject)
  doc.font('Helvetica').fontSize(12).text('PDF generation verification test')
  doc.font('Helvetica-Bold').text('Embedded fonts OK')
  doc.end()
})

const pdfBuffer = Buffer.concat(chunks)
if (pdfBuffer.length < 500 || pdfBuffer.subarray(0, 4).toString() !== '%PDF') {
  console.error('Generated PDF is invalid or too small:', pdfBuffer.length, 'bytes')
  process.exit(1)
}

const outPath = join(projectRoot, 'scripts', 'verify-pdf-output.pdf')
writeFileSync(outPath, pdfBuffer)
console.log(`PDF verification passed: ${pdfBuffer.length} bytes → ${outPath}`)
