/**
 * Premium Robofest certificate PDFs — A4 landscape, left robot panel + right content.
 * When content.certificateTemplateId is set, uses the background template engine instead.
 */

export type { CertificateParticipant } from './robofest-certificate-pdf/types'
export {
  buildRobofestCertificateId,
  resolveCertificateParticipants,
} from './robofest-certificate-pdf/participants'
export {
  generateRobofestParticipationCertificatesPDF,
  generateRobofestBulkParticipationCertificatesPDF,
} from './robofest-certificate-pdf/generate'
