/**
 * One-off preview script for the registration confirmation PDF.
 * Run with: pnpm tsx scripts/preview-pdf.ts
 * Outputs to: scripts/preview-output.pdf
 */
import { writeFileSync } from 'fs'
import { join } from 'path'
import { generateBookingConfirmationPDF } from '../lib/pdfGenerator'
import type { Event } from '../types/event'

// Cast through `unknown` because this is a one-off preview helper and we only
// need the fields the PDF generator reads. Avoids having to mirror every
// strict field of the production Event type.
const mockEvent = {
  id: 'evt_preview_001',
  title: 'Robonauts National Robotics Olympiad 2026',
  description:
    'A nationwide robotics competition bringing together the brightest young minds from across the country.',
  fullDescription:
    'A nationwide robotics competition bringing together the brightest young minds from schools across Bangladesh. ' +
    'Compete in line-following, sumo robots, and innovation tracks judged by industry professionals from leading robotics companies. ' +
    'Workshops, mentor sessions, and a closing ceremony with awards. Open to participants in grades 6 through 12.',
  date: '2026-08-15',
  time: '9:00 AM – 6:00 PM',
  venue: 'BRAC University Auditorium, Dhaka',
  location: 'BRAC University, Dhaka',
  eligibility: 'Students from class 6 to class 12',
  isPaid: true,
  amount: 1500,
  categories: [],
  customFormFields: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as Event

async function main() {
  console.log('Generating preview PDFs...')

  // Variant A: full content (long event title, all optional fields, additional info, description)
  const fullBuffer = await generateBookingConfirmationPDF({
    registrationId: 'RNC-2026-X9K3M7',
    bookingId: 'bk_preview_full',
    event: mockEvent,
    bookingDetails: {
      name: 'Mohammad Salah Akram Fuad',
      school: 'St. Joseph Higher Secondary School',
      email: 'salah.akram.fuad@g.bracu.ac.bd',
      phone: '01712345678',
      bkashNumber: '01787654321',
      information:
        'I am also interested in volunteering for future events and would love to be added to the mentor pool. ' +
        'I have experience with Arduino, Raspberry Pi, and basic ROS programming.',
    },
    verificationUrl: 'https://robonautsclub.com/verify-booking?registrationId=RNC-2026-X9K3M7',
  })
  writeFileSync(join(process.cwd(), 'scripts', 'preview-output.pdf'), fullBuffer)
  console.log(`Full variant: ${fullBuffer.length} bytes`)

  // Variant B: minimal content — required fields only, free event, no optional sections
  const minimalEvent = {
    ...mockEvent,
    title: 'Robotics Workshop',
    time: undefined,
    venue: undefined,
    location: undefined,
    eligibility: undefined,
    description: undefined,
    fullDescription: undefined,
  } as unknown as Event
  const minimalBuffer = await generateBookingConfirmationPDF({
    registrationId: 'RNC-2026-A1B2C3',
    bookingId: 'bk_preview_min',
    event: minimalEvent,
    bookingDetails: {
      name: 'Jane Doe',
      school: 'Demo School',
      email: 'jane@example.com',
      phone: '01799999999',
      information: '',
    },
    verificationUrl: 'https://robonautsclub.com/verify-booking?registrationId=RNC-2026-A1B2C3',
  })
  writeFileSync(join(process.cwd(), 'scripts', 'preview-output-minimal.pdf'), minimalBuffer)
  console.log(`Minimal variant: ${minimalBuffer.length} bytes`)
}

main().catch((err) => {
  console.error('Preview failed:', err)
  process.exit(1)
})
