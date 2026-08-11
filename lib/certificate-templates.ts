/**
 * Client-safe certificate template types and helpers.
 * Keep free of firebase-admin / Node-only imports.
 */

export const CERTIFICATE_TEMPLATES_COLLECTION = 'certificateTemplates'

export const CERTIFICATE_FIELD_KEYS = [
  'recipientName',
  'school',
  'grade',
  'category',
  'eventTitle',
  'eventDate',
  'venue',
  'teamNumber',
  'awardLabel',
  'certificateTitle',
  'certificateBody',
  'registrationId',
  'certificateId',
  'issueDate',
  'staticText',
  'qrVerify',
  'signatureImage',
  'logoImage',
] as const

export type CertificateFieldKey = (typeof CERTIFICATE_FIELD_KEYS)[number]

/** Path used for default club logo on new templates (resolved at PDF time). */
export const CERTIFICATE_DEFAULT_LOGO_PATH = '/robologo.png'

/** Dynamic fields filled per recipient at issue time (excludes static copy). */
export const CERTIFICATE_DYNAMIC_FIELD_KEYS = CERTIFICATE_FIELD_KEYS.filter(
  (key) => key !== 'staticText',
) as CertificateFieldKey[]

export const CERTIFICATE_IMAGE_FIELD_KEYS = [
  'signatureImage',
  'logoImage',
  'qrVerify',
] as const

export type CertificateFieldAlign = 'left' | 'center' | 'right'
export type CertificateFontWeight = 'normal' | 'bold'
export type CertificatePageLayout = 'landscape' | 'portrait'

/** PDFKit built-in standard fonts (no custom font files required). */
export const CERTIFICATE_FONT_FAMILIES = [
  'Helvetica',
  'Times-Roman',
  'Courier',
] as const

export type CertificateFontFamily = (typeof CERTIFICATE_FONT_FAMILIES)[number]

export const CERTIFICATE_FONT_FAMILY_LABELS: Record<
  CertificateFontFamily,
  string
> = {
  Helvetica: 'Helvetica (sans)',
  'Times-Roman': 'Times (serif)',
  Courier: 'Courier (mono)',
}

export function isCertificateFontFamily(
  value: unknown,
): value is CertificateFontFamily {
  return (
    typeof value === 'string' &&
    (CERTIFICATE_FONT_FAMILIES as readonly string[]).includes(value)
  )
}

/** Map field fontFamily + weight → PDFKit font name. */
export function resolveCertificatePdfFont(
  family: CertificateFontFamily | undefined,
  weight: CertificateFontWeight,
): string {
  const bold = weight === 'bold'
  switch (family) {
    case 'Times-Roman':
      return bold ? 'Times-Bold' : 'Times-Roman'
    case 'Courier':
      return bold ? 'Courier-Bold' : 'Courier'
    case 'Helvetica':
    default:
      return bold ? 'Helvetica-Bold' : 'Helvetica'
  }
}

/** CSS font-family for the editor canvas preview. */
export function certificateFontFamilyCss(
  family: CertificateFontFamily | undefined,
): string {
  switch (family) {
    case 'Times-Roman':
      return 'Times New Roman, Times, serif'
    case 'Courier':
      return 'Courier New, Courier, monospace'
    case 'Helvetica':
    default:
      return 'Helvetica, Arial, sans-serif'
  }
}

export type CertificateField = {
  id: string
  key: CertificateFieldKey
  label?: string
  staticValue?: string
  xPct: number
  yPct: number
  wPct: number
  fontSizePt: number
  fontWeight: CertificateFontWeight
  fontFamily?: CertificateFontFamily
  color: string
  align: CertificateFieldAlign
  imageUrl?: string
}

export type CertificateTemplatePage = {
  size: 'A4'
  layout: CertificatePageLayout
}

export type CertificateTemplate = {
  id: string
  name: string
  description?: string
  backgroundUrl: string
  page: CertificateTemplatePage
  fields: CertificateField[]
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
  updatedBy?: string | null
}

export type CertificateTemplateWriteInput = {
  name: string
  description?: string
  backgroundUrl: string
  page?: CertificateTemplatePage
  fields?: CertificateField[]
  isActive?: boolean
}

/** Minimal award shape for title/body/position resolution (Robofest or future events). */
export type CertificateAwardLike = {
  id?: string
  label?: string
  certificateTitle?: string
  certificateBody?: string
  certificateType?: string
} | null

export type ResolvedCertificateAwardFields = {
  certificateTitle: string
  certificateBody: string
  /** Position / award name; empty for participation so PDF skips the line. */
  awardLabel: string
  isParticipation: boolean
}

export const CERTIFICATE_FIELD_LABELS: Record<CertificateFieldKey, string> = {
  recipientName: 'Recipient name',
  school: 'School',
  grade: 'Grade',
  category: 'Category',
  eventTitle: 'Event / competition title',
  eventDate: 'Date',
  venue: 'Venue',
  teamNumber: 'Team number',
  awardLabel: 'Position / award (achievement only)',
  certificateTitle: 'Certificate title (Achievement / Participation)',
  certificateBody: 'Body text (from award)',
  registrationId: 'Registration ID',
  certificateId: 'Certificate ID',
  issueDate: 'Issue date',
  staticText: 'Static text',
  qrVerify: 'QR (verify)',
  signatureImage: 'Signature image',
  logoImage: 'Club logo',
}

export function newCertificateFieldId(): string {
  return `fld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Resolve heading, body, and position from an award.
 * Has position / non-participation → Achievement + awardLabel.
 * Otherwise → Participation and empty awardLabel.
 */
export function resolveCertificateAwardFields(
  award: CertificateAwardLike,
  options?: { category?: string },
): ResolvedCertificateAwardFields {
  const category = (options?.category || '').trim()
  const type = (award?.certificateType || '').toLowerCase()
  const id = (award?.id || '').toLowerCase()
  const isParticipation =
    !award ||
    type === 'participation' ||
    id === 'participant' ||
    id === 'participation'

  if (isParticipation) {
    const bodyRaw =
      (award?.certificateBody || '').trim() ||
      'has participated with dedication and is hereby recognized for their contribution'
    return {
      certificateTitle:
        (award?.certificateTitle || '').trim() ||
        'CERTIFICATE OF PARTICIPATION',
      certificateBody: bodyRaw.replace(/\.*$/, '') + '.',
      awardLabel: '',
      isParticipation: true,
    }
  }

  const position =
    (award?.label || '').trim() ||
    'Achievement'
  const title =
    (award?.certificateTitle || '').trim() ||
    'CERTIFICATE OF ACHIEVEMENT'
  const bodyRaw =
    (award?.certificateBody || '').trim() ||
    `for achieving ${position} in`
  const endsOpen = /\bin\s*$/i.test(bodyRaw)
  const certificateBody = endsOpen
    ? `${bodyRaw} ${category || 'the competition'}.`
    : bodyRaw.replace(/\.*$/, '') + '.'

  return {
    certificateTitle: title,
    certificateBody,
    awardLabel: position,
    isParticipation: false,
  }
}

/** Standard certificate coordinates — mirrored from Robofest drawCertificatePage. */
type FieldSlot = Omit<CertificateField, 'id' | 'key' | 'label'> & {
  label?: string
}

/**
 * Geometry from lib/robofest-certificate-pdf.ts drawCertificatePage (A4 landscape).
 * Left ~28% inner width is robot art; text sits in the right content band.
 */
const RF = (() => {
  const PAGE_W = 841.89
  const PAGE_H = 595.28
  const margin = 34
  const innerX = margin
  const innerY = margin
  const innerW = PAGE_W - margin * 2
  const innerH = PAGE_H - margin * 2
  const leftW = Math.round(innerW * 0.28)
  const rightX = innerX + leftW
  const rightW = innerW - leftW
  const contentPad = 28
  const contentLeft = rightX + contentPad
  const contentWidth = rightW - contentPad * 2 - 8
  const qrSize = 64
  const logoSize = 28
  const brandY = innerY + 22
  const px = (x: number) => Math.round((x / PAGE_W) * 10000) / 100
  const py = (y: number) => Math.round((y / PAGE_H) * 10000) / 100
  const pw = (w: number) => Math.round((w / PAGE_W) * 10000) / 100
  // Sequential Y stack matching a medium-length name (~30pt after name block)
  const eventTitleY = brandY + 48 + 16 // after brand block + rule
  const certTitleY = eventTitleY + 20
  const introY = certTitleY + 26
  const nameY = introY + 18
  const schoolY = nameY + 30 + 12 // name height + underline gap
  const bodyY = schoolY + 16
  const awardY = bodyY + 22
  const metaY = awardY + 16
  const issueY = metaY + 28
  const sigY = innerY + innerH - 132
  const qrX = rightX + rightW - contentPad - qrSize
  const qrY = innerY + innerH - contentPad - qrSize - 14
  const sigAreaW = contentWidth - qrSize - 28
  const sigGap = 12
  const sigW = (sigAreaW - sigGap) / 2
  const footerY = innerY + innerH - 16
  const brandX = contentLeft + logoSize + 10
  const brandW = contentWidth - logoSize - 10

  return {
    contentLeftPct: px(contentLeft),
    contentWidthPct: pw(contentWidth),
    logo: {
      xPct: px(contentLeft),
      yPct: py(brandY),
      wPct: pw(logoSize),
    },
    brand: {
      xPct: px(brandX),
      yPct: py(brandY + 2),
      wPct: pw(brandW),
    },
    organizer: {
      xPct: px(brandX),
      yPct: py(brandY + 22),
      wPct: pw(brandW),
    },
    eventTitleY: py(eventTitleY),
    certTitleY: py(certTitleY),
    introY: py(introY),
    nameY: py(nameY),
    schoolY: py(schoolY),
    bodyY: py(bodyY),
    awardY: py(awardY),
    metaY: py(metaY),
    issueY: py(issueY),
    sigY: py(sigY),
    sigW: pw(sigW),
    sig1X: px(contentLeft),
    sig2X: px(contentLeft + sigW + sigGap),
    qr: { xPct: px(qrX), yPct: py(qrY), wPct: pw(qrSize) },
    issueW: pw(contentWidth * 0.5),
    certIdX: px(contentLeft + contentWidth * 0.4),
    certIdW: pw(contentWidth * 0.6),
    footerY: py(footerY),
    footerW: pw(contentWidth - qrSize - 24),
  }
})()

const COLORS = {
  navy: '#0a1628',
  cyan: '#06b6d4',
  ink: '#0f172a',
  mute: '#475569',
  faint: '#94a3b8',
}

const LANDSCAPE_SLOTS: Partial<Record<CertificateFieldKey, FieldSlot>> = {
  logoImage: {
    xPct: RF.logo.xPct,
    yPct: RF.logo.yPct,
    wPct: RF.logo.wPct,
    fontSizePt: 10,
    fontWeight: 'normal',
    color: COLORS.ink,
    align: 'left',
    imageUrl: CERTIFICATE_DEFAULT_LOGO_PATH,
  },
  eventTitle: {
    xPct: RF.contentLeftPct,
    yPct: RF.eventTitleY,
    wPct: RF.contentWidthPct,
    fontSizePt: 11,
    fontWeight: 'bold',
    color: COLORS.navy,
    align: 'center',
  },
  certificateTitle: {
    xPct: RF.contentLeftPct,
    yPct: RF.certTitleY,
    wPct: RF.contentWidthPct,
    fontSizePt: 14,
    fontWeight: 'bold',
    color: COLORS.cyan,
    align: 'center',
  },
  staticText: {
    xPct: RF.contentLeftPct,
    yPct: RF.introY,
    wPct: RF.contentWidthPct,
    fontSizePt: 10,
    fontWeight: 'normal',
    color: COLORS.mute,
    align: 'center',
    staticValue: 'This is to certify that',
  },
  recipientName: {
    xPct: RF.contentLeftPct,
    yPct: RF.nameY,
    wPct: RF.contentWidthPct,
    fontSizePt: 24,
    fontWeight: 'bold',
    color: COLORS.ink,
    align: 'center',
  },
  school: {
    xPct: RF.contentLeftPct,
    yPct: RF.schoolY,
    wPct: RF.contentWidthPct,
    fontSizePt: 9.5,
    fontWeight: 'normal',
    color: COLORS.mute,
    align: 'center',
  },
  grade: {
    xPct: RF.contentLeftPct,
    yPct: RF.schoolY + 2.2,
    wPct: RF.contentWidthPct,
    fontSizePt: 9,
    fontWeight: 'normal',
    color: COLORS.mute,
    align: 'center',
  },
  certificateBody: {
    xPct: RF.contentLeftPct,
    yPct: RF.bodyY + 2.2,
    wPct: RF.contentWidthPct,
    fontSizePt: 11,
    fontWeight: 'normal',
    color: COLORS.ink,
    align: 'center',
  },
  awardLabel: {
    xPct: RF.contentLeftPct,
    yPct: RF.awardY + 2.2,
    wPct: RF.contentWidthPct,
    fontSizePt: 12,
    fontWeight: 'bold',
    color: COLORS.cyan,
    align: 'center',
  },
  category: {
    xPct: RF.contentLeftPct,
    yPct: RF.metaY + 2.2,
    wPct: RF.contentWidthPct,
    fontSizePt: 9,
    fontWeight: 'normal',
    color: COLORS.mute,
    align: 'center',
  },
  teamNumber: {
    xPct: RF.contentLeftPct,
    yPct: RF.metaY + 4.5,
    wPct: RF.contentWidthPct * 0.5,
    fontSizePt: 9,
    fontWeight: 'normal',
    color: COLORS.mute,
    align: 'center',
  },
  venue: {
    xPct: RF.contentLeftPct + RF.contentWidthPct * 0.5,
    yPct: RF.metaY + 4.5,
    wPct: RF.contentWidthPct * 0.5,
    fontSizePt: 9,
    fontWeight: 'normal',
    color: COLORS.mute,
    align: 'center',
  },
  eventDate: {
    xPct: RF.contentLeftPct,
    yPct: RF.issueY - 2.5,
    wPct: RF.issueW,
    fontSizePt: 8.5,
    fontWeight: 'normal',
    color: COLORS.mute,
    align: 'left',
  },
  issueDate: {
    xPct: RF.contentLeftPct,
    yPct: RF.issueY,
    wPct: RF.issueW,
    fontSizePt: 8.5,
    fontWeight: 'normal',
    color: COLORS.mute,
    align: 'left',
  },
  registrationId: {
    xPct: RF.certIdX,
    yPct: RF.issueY - 2.5,
    wPct: RF.certIdW,
    fontSizePt: 8,
    fontWeight: 'normal',
    color: COLORS.mute,
    align: 'right',
  },
  certificateId: {
    xPct: RF.certIdX,
    yPct: RF.issueY,
    wPct: RF.certIdW,
    fontSizePt: 8.5,
    fontWeight: 'bold',
    color: COLORS.navy,
    align: 'right',
  },
  signatureImage: {
    xPct: RF.sig1X,
    yPct: RF.sigY,
    wPct: RF.sigW,
    fontSizePt: 10,
    fontWeight: 'normal',
    color: COLORS.ink,
    align: 'center',
  },
  qrVerify: {
    xPct: RF.qr.xPct,
    yPct: RF.qr.yPct,
    wPct: RF.qr.wPct,
    fontSizePt: 6.5,
    fontWeight: 'normal',
    color: COLORS.cyan,
    align: 'center',
  },
}

function adjustSlotForLayout(
  slot: FieldSlot,
  layout: CertificatePageLayout,
): FieldSlot {
  if (layout !== 'portrait') return { ...slot }
  // Portrait: keep right-band bias but slightly widen / compress Y
  return {
    ...slot,
    yPct: clampPct(slot.yPct * 0.92 + 2),
    wPct: clampPct(Math.min(slot.wPct + 2, 90), 3, 100),
    xPct: clampPct(slot.xPct * 0.98),
  }
}

export function getStandardSlotForKey(
  key: CertificateFieldKey,
  layout: CertificatePageLayout = 'landscape',
): FieldSlot {
  const base = LANDSCAPE_SLOTS[key]
  if (base) return adjustSlotForLayout(base, layout)
  const isImage =
    key === 'signatureImage' || key === 'qrVerify' || key === 'logoImage'
  return adjustSlotForLayout(
    {
      xPct: RF.contentLeftPct,
      yPct: 40,
      wPct: isImage ? 12 : RF.contentWidthPct,
      fontSizePt: 12,
      fontWeight: 'normal',
      color: COLORS.ink,
      align: 'center',
    },
    layout,
  )
}

type PresetFieldSpec = {
  key: CertificateFieldKey
  label?: string
  staticValue?: string
  imageUrl?: string
  xPct?: number
  yPct?: number
  wPct?: number
  fontSizePt?: number
  fontWeight?: CertificateFontWeight
  color?: string
  align?: CertificateFieldAlign
}

/**
 * Full standard certificate field set — Robofest right-panel positions + logo.
 */
export function getStandardCertificateFields(
  layout: CertificatePageLayout = 'landscape',
): CertificateField[] {
  const specs: PresetFieldSpec[] = [
    {
      key: 'logoImage',
      label: 'Club logo',
      imageUrl: CERTIFICATE_DEFAULT_LOGO_PATH,
    },
    {
      key: 'staticText',
      label: 'Brand',
      staticValue: 'ROBOFEST 2026',
      xPct: RF.brand.xPct,
      yPct: RF.brand.yPct,
      wPct: RF.brand.wPct,
      fontSizePt: 18,
      fontWeight: 'bold',
      color: COLORS.navy,
      align: 'left',
    },
    {
      key: 'staticText',
      label: 'Organizer',
      staticValue: 'Presented by Robonauts Club',
      xPct: RF.organizer.xPct,
      yPct: RF.organizer.yPct,
      wPct: RF.organizer.wPct,
      fontSizePt: 8.5,
      fontWeight: 'normal',
      color: COLORS.mute,
      align: 'left',
    },
    { key: 'eventTitle' },
    { key: 'certificateTitle' },
    {
      key: 'staticText',
      label: 'Intro',
      staticValue: 'This is to certify that',
    },
    { key: 'recipientName' },
    { key: 'school' },
    { key: 'grade' },
    { key: 'certificateBody' },
    { key: 'awardLabel' },
    { key: 'category' },
    { key: 'issueDate' },
    { key: 'certificateId' },
    {
      key: 'signatureImage',
      label: 'Signature 1',
      xPct: RF.sig1X,
      wPct: RF.sigW,
    },
    {
      key: 'signatureImage',
      label: 'Signature 2',
      xPct: RF.sig2X,
      wPct: RF.sigW,
    },
    { key: 'qrVerify' },
    {
      key: 'staticText',
      label: 'Footer tagline',
      staticValue: 'Imagine • Build • Innovate • Inspire',
      xPct: RF.contentLeftPct,
      yPct: RF.footerY,
      wPct: RF.footerW,
      fontSizePt: 8,
      fontWeight: 'normal',
      color: COLORS.faint,
      align: 'left',
    },
  ]

  return specs.map((spec) => {
    const slot = getStandardSlotForKey(spec.key, layout)
    const yPct =
      spec.yPct !== undefined
        ? layout === 'portrait'
          ? clampPct(spec.yPct * 0.92 + 2)
          : spec.yPct
        : slot.yPct
    return {
      id: newCertificateFieldId(),
      key: spec.key,
      label: spec.label || CERTIFICATE_FIELD_LABELS[spec.key],
      ...slot,
      ...(spec.staticValue !== undefined
        ? { staticValue: spec.staticValue }
        : {}),
      ...(spec.imageUrl !== undefined ? { imageUrl: spec.imageUrl } : {}),
      ...(spec.xPct !== undefined ? { xPct: spec.xPct } : {}),
      yPct,
      ...(spec.wPct !== undefined ? { wPct: spec.wPct } : {}),
      ...(spec.fontSizePt !== undefined
        ? { fontSizePt: spec.fontSizePt }
        : {}),
      ...(spec.fontWeight !== undefined
        ? { fontWeight: spec.fontWeight }
        : {}),
      ...(spec.color !== undefined ? { color: spec.color } : {}),
      ...(spec.align !== undefined ? { align: spec.align } : {}),
    }
  })
}

function slotsOverlap(
  a: FieldSlot,
  b: Pick<CertificateField, 'xPct' | 'yPct' | 'wPct'>,
): boolean {
  const ay2 = a.yPct + 4
  const by2 = b.yPct + 4
  const ax2 = a.xPct + a.wPct
  const bx2 = b.xPct + b.wPct
  const xOverlap = a.xPct < bx2 && ax2 > b.xPct
  const yOverlap = a.yPct < by2 && ay2 > b.yPct
  return xOverlap && yOverlap
}

/** Place a new field at its standard slot; nudge if that area is occupied. */
export function createDefaultCertificateField(
  key: CertificateFieldKey,
  overrides?: Partial<CertificateField>,
  options?: {
    layout?: CertificatePageLayout
    existing?: CertificateField[]
  },
): CertificateField {
  const layout = options?.layout || 'landscape'
  const slot = getStandardSlotForKey(key, layout)
  let xPct = slot.xPct
  let yPct = slot.yPct
  const existing = options?.existing || []

  let attempts = 0
  while (
    attempts < 6 &&
    existing.some((f) => slotsOverlap({ ...slot, xPct, yPct }, f))
  ) {
    yPct = clampPct(yPct + 5)
    xPct = clampPct(xPct + (attempts % 2 === 0 ? 2 : -2))
    attempts += 1
  }

  const defaults: Partial<CertificateField> =
    key === 'staticText'
      ? {
          label: 'Static copy',
          staticValue: 'Appreciation message',
          fontSizePt: 10,
          fontWeight: 'normal',
          color: COLORS.mute,
        }
      : key === 'logoImage'
        ? {
            imageUrl: CERTIFICATE_DEFAULT_LOGO_PATH,
          }
        : {}

  return {
    id: newCertificateFieldId(),
    key,
    label: CERTIFICATE_FIELD_LABELS[key],
    ...slot,
    ...defaults,
    xPct,
    yPct,
    ...overrides,
  }
}

export function clampPct(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function sanitizeCertificateField(
  raw: Partial<CertificateField> & { key?: string },
): CertificateField | null {
  const key = raw.key as CertificateFieldKey | undefined
  if (!key || !(CERTIFICATE_FIELD_KEYS as readonly string[]).includes(key)) {
    return null
  }
  const id =
    (typeof raw.id === 'string' && raw.id.trim()) || newCertificateFieldId()
  const imageUrl =
    typeof raw.imageUrl === 'string' ? raw.imageUrl.trim() : undefined
  return {
    id,
    key,
    label:
      typeof raw.label === 'string' && raw.label.trim()
        ? raw.label.trim()
        : CERTIFICATE_FIELD_LABELS[key],
    staticValue:
      typeof raw.staticValue === 'string' ? raw.staticValue : undefined,
    xPct: clampPct(Number(raw.xPct ?? 20)),
    yPct: clampPct(Number(raw.yPct ?? 40)),
    wPct: clampPct(Number(raw.wPct ?? 40), 5, 100),
    fontSizePt: Math.min(72, Math.max(6, Number(raw.fontSizePt) || 12)),
    fontWeight: raw.fontWeight === 'bold' ? 'bold' : 'normal',
    fontFamily: isCertificateFontFamily(raw.fontFamily)
      ? raw.fontFamily
      : 'Helvetica',
    color:
      typeof raw.color === 'string' &&
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw.color)
        ? raw.color
        : '#0f172a',
    align:
      raw.align === 'left' || raw.align === 'right' || raw.align === 'center'
        ? raw.align
        : 'center',
    ...(imageUrl ? { imageUrl } : {}),
  }
}

export function sanitizeCertificateFields(
  input: unknown,
): CertificateField[] {
  if (!Array.isArray(input)) return []
  const out: CertificateField[] = []
  for (const item of input) {
    if (!item || typeof item !== 'object') continue
    const field = sanitizeCertificateField(item as Partial<CertificateField>)
    if (field) out.push(field)
  }
  return out
}

export function mapCertificateTemplateDoc(
  id: string,
  data: Record<string, unknown>,
): CertificateTemplate {
  const pageRaw =
    data.page && typeof data.page === 'object'
      ? (data.page as Record<string, unknown>)
      : {}
  const layout =
    pageRaw.layout === 'portrait' ? 'portrait' : 'landscape'

  const toIso = (value: unknown): string | null => {
    if (!value) return null
    if (typeof value === 'string') return value
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate: () => Date }).toDate === 'function'
    ) {
      return (value as { toDate: () => Date }).toDate().toISOString()
    }
    return null
  }

  return {
    id,
    name:
      (typeof data.name === 'string' && data.name.trim()) || 'Untitled template',
    description:
      typeof data.description === 'string' ? data.description : undefined,
    backgroundUrl:
      typeof data.backgroundUrl === 'string' ? data.backgroundUrl.trim() : '',
    page: { size: 'A4', layout },
    fields: sanitizeCertificateFields(data.fields),
    isActive: data.isActive !== false,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    updatedBy:
      typeof data.updatedBy === 'string' ? data.updatedBy : null,
  }
}

/** Sample values for editor preview / sample PDF (achievement sample so position shows). */
export function getSampleCertificateValues(): Record<
  CertificateFieldKey,
  string
> {
  const award = resolveCertificateAwardFields(
    {
      id: 'first',
      label: '1st Place',
      certificateTitle: 'CERTIFICATE OF ACHIEVEMENT',
      certificateBody: 'for achieving 1st Place in',
      certificateType: 'achievement',
    },
    { category: 'Line Following Bot' },
  )
  return {
    recipientName: 'Mohammad Salah Akram Fuad',
    school: 'St. Joseph Higher Secondary School',
    grade: 'Class 11',
    category: 'Line Following Bot',
    eventTitle: 'RoboFest Bangladesh 2026',
    eventDate: '18 September 2026',
    venue: 'Dhaka - TBA',
    teamNumber: 'LF#042',
    awardLabel: award.awardLabel,
    certificateTitle: award.certificateTitle,
    certificateBody: award.certificateBody,
    registrationId: 'RF-DHK-2026-0042',
    certificateId: 'RF26-RF-DHK-2026-0042-M1',
    issueDate: '11 August 2026',
    staticText: 'This is to certify that',
    qrVerify: '',
    signatureImage: '',
    logoImage: '',
  }
}
