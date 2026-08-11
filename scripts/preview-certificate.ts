/**
 * Sample preview for the premium Robofest certificate PDF.
 * Run with: pnpm tsx scripts/preview-certificate.ts
 * Outputs to: scripts/verify-certificate-output.pdf
 */
import { writeFileSync } from 'fs'
import { join } from 'path'
import { getDefaultRobofestContent } from '../lib/robofest-content'
import type { RobofestRegistration } from '../lib/robofest-content'
import { generateRobofestParticipationCertificatesPDF } from '../lib/robofest-certificate-pdf'

const sampleRegistration: RobofestRegistration = {
  id: 'preview_reg_001',
  category: 'Line Following Bot',
  name: 'Team Neon Circuit',
  email: 'captain@example.com',
  phone: '01712345678',
  school: 'St. Joseph Higher Secondary School',
  ageCategory: 'senior',
  teamSize: 3,
  teamMembers: [
    {
      name: 'Mohammad Salah Akram Fuad',
      email: 'fuad@example.com',
      school: 'St. Joseph Higher Secondary School',
      grade: 'Class 11',
      awardCategoryId: 'first',
    },
    {
      name: 'Ayesha Rahman',
      email: 'ayesha@example.com',
      school: 'Viqarunnisa Noon School',
      grade: 'Class 10',
      awardCategoryId: 'participant',
    },
  ],
  roundCity: 'Dhaka',
  notes: '',
  status: 'confirmed',
  teamNumber: 'LF#042',
  registrationId: 'RF-DHK-2026-0042',
  paymentStatus: 'paid',
  createdAt: new Date('2026-08-01T10:00:00+06:00').toISOString(),
}

async function main() {
  console.log('Generating premium certificate preview…')

  const content = getDefaultRobofestContent()
  content.competitionDirector = 'Eng. Farhan Ahmed'
  content.headJudge = 'Dr. Nusrat Jahan'
  content.eventOrganizer = content.hostName || 'Robonauts Ltd'

  // Participation + 1st place pages from sample team
  const result = await generateRobofestParticipationCertificatesPDF({
    registration: sampleRegistration,
    content,
    baseUrl: 'https://robonautsclub.com',
  })

  if ('error' in result) {
    console.error('Preview failed:', result.error)
    process.exit(1)
  }

  const outPath = join(process.cwd(), 'scripts', 'verify-certificate-output.pdf')
  writeFileSync(outPath, result.buffer)
  console.log(`Wrote ${outPath} (${result.buffer.length} bytes)`)
  console.log(`Filename suggestion: ${result.filename}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
