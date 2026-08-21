import type { CertificateField } from '@/lib/certificate-templates'

export function displayValue(
  field: CertificateField,
  sample: Record<string, string>,
  showSample: boolean,
): string {
  if (field.key === 'staticText') {
    return field.staticValue || field.label || 'Static text'
  }
  if (field.key === 'signatureImage' || field.key === 'logoImage') return ''
  if (field.key === 'qrVerify') return ''
  if (!showSample) return `{{${field.key}}}`
  return sample[field.key] || field.label || field.key
}
