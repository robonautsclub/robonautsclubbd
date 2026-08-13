/**
 * Client-safe Robofest certificate signature helpers.
 * Keep this free of firebase-admin / Node-only imports.
 */

import { ROBOFEST_LOCAL } from '@/lib/robofest-local'

export type RobofestCertificateSignature = {
  id: string
  name: string
  /** Role under the signature line, e.g. "Head Judge". */
  title: string
  /** Optional Cloudinary URL for a scanned/drawn signature image. */
  imageUrl?: string
}

export const ROBOFEST_MAX_CERTIFICATE_SIGNATURES = 4

export function getDefaultCertificateSignatures(
  hostName: string = ROBOFEST_LOCAL.hostName,
): RobofestCertificateSignature[] {
  const host = hostName.trim() || 'Robonauts Ltd'
  return [
    {
      id: 'sig-director',
      name: host,
      title: 'Competition Director',
    },
    {
      id: 'sig-judge',
      name: 'Head Judge',
      title: 'Head Judge',
    },
    {
      id: 'sig-organizer',
      name: host,
      title: 'Event Organizer',
    },
  ]
}

function newCertificateSignatureId(): string {
  return `sig-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function mapRobofestCertificateSignature(
  raw: Record<string, unknown>,
  fallbackId?: string,
): RobofestCertificateSignature | null {
  const id =
    (typeof raw.id === 'string' ? raw.id.trim() : '') ||
    fallbackId ||
    newCertificateSignatureId()
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const imageUrl =
    typeof raw.imageUrl === 'string' ? raw.imageUrl.trim() : ''
  if (!name && !title && !imageUrl) return null
  return {
    id,
    name,
    title,
    ...(imageUrl ? { imageUrl } : {}),
  }
}

/** Build signatures from new array, or migrate legacy director/judge/organizer fields. */
export function resolveRobofestCertificateSignatures(
  data: {
    certificateSignatures?: unknown
    competitionDirector?: unknown
    headJudge?: unknown
    eventOrganizer?: unknown
    hostName?: unknown
  },
  fallbackHostName: string = ROBOFEST_LOCAL.hostName,
): RobofestCertificateSignature[] {
  if (Array.isArray(data.certificateSignatures)) {
    const mapped = data.certificateSignatures
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null
        return mapRobofestCertificateSignature(
          item as Record<string, unknown>,
          `sig-${index + 1}`,
        )
      })
      .filter((s): s is RobofestCertificateSignature => s != null)
      .slice(0, ROBOFEST_MAX_CERTIFICATE_SIGNATURES)
    if (mapped.length > 0) return mapped
  }

  const host =
    (typeof data.hostName === 'string' && data.hostName.trim()) ||
    fallbackHostName ||
    'Robonauts Ltd'
  const director =
    (typeof data.competitionDirector === 'string' &&
      data.competitionDirector.trim()) ||
    host
  const judge =
    (typeof data.headJudge === 'string' && data.headJudge.trim()) ||
    'Head Judge'
  const organizer =
    (typeof data.eventOrganizer === 'string' &&
      data.eventOrganizer.trim()) ||
    host

  return [
    { id: 'sig-director', name: director, title: 'Competition Director' },
    { id: 'sig-judge', name: judge, title: 'Head Judge' },
    { id: 'sig-organizer', name: organizer, title: 'Event Organizer' },
  ]
}

export function sanitizeRobofestCertificateSignatures(
  input: RobofestCertificateSignature[] | undefined,
  hostName: string = ROBOFEST_LOCAL.hostName,
): RobofestCertificateSignature[] {
  const resolved = resolveRobofestCertificateSignatures(
    { certificateSignatures: input },
    hostName,
  )
  const cleaned = resolved
    .map((sig, index) => {
      const name = (sig.name || '').trim()
      const title = (sig.title || '').trim()
      const imageUrl = (sig.imageUrl || '').trim()
      if (!name && !title) return null
      return {
        id: (sig.id || '').trim() || `sig-${index + 1}`,
        name: name || title,
        title: title || 'Signatory',
        ...(imageUrl ? { imageUrl } : {}),
      } satisfies RobofestCertificateSignature
    })
    .filter((s): s is RobofestCertificateSignature => s != null)
    .slice(0, ROBOFEST_MAX_CERTIFICATE_SIGNATURES)

  return cleaned.length > 0
    ? cleaned
    : getDefaultCertificateSignatures(hostName)
}
