import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { RobofestContent } from '@/lib/robofest-content'
import {
  resolveRobofestCertificateSignatures,
  type RobofestCertificateSignature,
} from '@/lib/robofest-certificate-signatures'
import type { CertificateRenderValues } from '@/lib/certificate-template-pdf'
import { loadLogoBuffer } from '@/lib/pdfGenerator'
import { SITE_CONFIG } from '@/lib/site-config'

export async function fetchSignatureImageBuffer(
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

export function buildTemplateSignatureSlots(
  content: RobofestContent,
): NonNullable<CertificateRenderValues['signatureSlots']> {
  return resolveRobofestCertificateSignatures(content).map((sig) => ({
    imageUrl: sig.imageUrl?.trim() || undefined,
    name: sig.name?.trim() || undefined,
    title: sig.title?.trim() || undefined,
  }))
}

export async function loadSignatureImages(
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

export function loadRobotBuffer(): Buffer | null {
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

export function resolveBaseUrl(baseUrl?: string): string {
  const raw =
    baseUrl ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    SITE_CONFIG.url ||
    ''
  return raw.replace(/\/$/, '')
}

export function buildCertificateVerificationUrl(
  baseUrl: string,
  registrationId: string,
  memberIndex: number,
): string {
  return `${baseUrl}/verify-booking?registrationId=${encodeURIComponent(registrationId)}&member=${memberIndex}`
}

export async function loadCertLogo(baseUrl: string): Promise<Buffer | null> {
  return loadLogoBuffer(`${baseUrl}/verify-booking`)
}
