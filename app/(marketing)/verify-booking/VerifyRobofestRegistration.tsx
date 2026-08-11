import {
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  Mail,
  Phone,
  ShieldCheck,
  QrCode,
  Trophy,
  Award,
} from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import type { RobofestContent, RobofestRegistration } from '@/lib/robofest-content'
import {
  resolveRobofestRoundDateLabel,
  resolveRobofestRoundVenueLabel,
} from '@/lib/robofest-content'
import {
  resolveRobofestAwardCategory,
  ROBOFEST_DEFAULT_AWARD_CATEGORY_ID,
} from '@/lib/robofest-award-categories'
import { formatAgeCategoryLabel } from '@/lib/robofest-registration-options'
import { SITE_CONFIG } from '@/lib/site-config'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import CopyButton from './CopyButton'

type Props = {
  registration: RobofestRegistration
  content: RobofestContent
  qrCodeDataURL: string | null
  /** When set (from certificate QR), show minimal certificate verify UI only. */
  certificateMemberIndex?: number
}

function resolveCertificateAwardee(
  registration: RobofestRegistration,
  memberIndex: number,
): { name: string; awardCategoryId?: string } | null {
  const members = registration.teamMembers || []
  if (members.length > 0) {
    const member = members[memberIndex]
    if (!member?.name?.trim()) return null
    return {
      name: member.name.trim(),
      awardCategoryId: member.awardCategoryId,
    }
  }
  if (memberIndex === 0) {
    return {
      name:
        registration.name?.trim() ||
        registration.email?.trim() ||
        'Participant',
      awardCategoryId: ROBOFEST_DEFAULT_AWARD_CATEGORY_ID,
    }
  }
  return null
}

export default function VerifyRobofestRegistration({
  registration,
  content,
  qrCodeDataURL,
  certificateMemberIndex,
}: Props) {
  const teamMembers = registration.teamMembers || []
  const registeredAt = registration.createdAt
    ? new Date(registration.createdAt)
    : null
  const ageLabel = registration.ageCategory
    ? formatAgeCategoryLabel(registration.ageCategory)
    : null
  const eventDate = resolveRobofestRoundDateLabel(
    content,
    registration.roundCity || '',
  )
  const roundVenue = resolveRobofestRoundVenueLabel(
    content,
    registration.roundCity || '',
  )
  const teamNumber = registration.teamNumber || registration.name

  const certificateMode =
    typeof certificateMemberIndex === 'number' &&
    Number.isInteger(certificateMemberIndex) &&
    certificateMemberIndex >= 0

  const awardee = certificateMode
    ? resolveCertificateAwardee(registration, certificateMemberIndex!)
    : null

  if (certificateMode && awardee) {
    const award = resolveRobofestAwardCategory(
      content.awardCategories,
      awardee.awardCategoryId,
    )

    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-cyan-50 to-slate-100 flex items-center justify-center py-8 sm:py-12 px-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-200 rounded-full blur-3xl opacity-25 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-200 rounded-full blur-3xl opacity-30 -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-linear-to-r from-cyan-600 via-teal-600 to-slate-800 px-6 sm:px-8 py-8 text-center">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 shadow-xl border-4 border-white/40">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100 mb-2">
                RoboFest Bangladesh 2026
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                Certificate Verified
              </h1>
              <p className="text-sm text-cyan-50 font-medium">
                This award certificate is authentic
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              <div className="rounded-xl border-2 border-cyan-200 bg-cyan-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700 mb-1">
                  Registration ID
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xl font-bold font-mono text-slate-900">
                    {registration.registrationId}
                  </p>
                  {registration.registrationId ? (
                    <CopyButton
                      text={registration.registrationId}
                      label="Registration ID"
                    />
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Name
                </p>
                <p className="text-xl font-bold text-slate-900">{awardee.name}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Position
                </p>
                <Badge className="inline-flex items-center gap-1.5 bg-cyan-700 hover:bg-cyan-700 text-white border-0 text-sm px-3 py-1.5">
                  <Award className="w-4 h-4" />
                  {award.label}
                </Badge>
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full border-slate-200"
              >
                <Link href="/robofest" prefetch={false}>
                  Back to Robofest
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (certificateMode && !awardee) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-cyan-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-amber-700" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Certificate member not found
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            This registration is valid, but the certificate member index does
            not match a team member.
          </p>
          <p className="text-xs font-mono text-slate-500 mb-6">
            {registration.registrationId}
          </p>
          <Button asChild className="bg-cyan-700 hover:bg-cyan-800 text-white">
            <Link
              href={`/verify-booking?registrationId=${encodeURIComponent(registration.registrationId || '')}`}
              prefetch={false}
            >
              View full registration
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-cyan-50 to-slate-100 py-8 sm:py-12 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-200 rounded-full blur-3xl opacity-25 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-200 rounded-full blur-3xl opacity-30 -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-6 sm:mb-8">
          <div className="bg-linear-to-r from-cyan-600 via-teal-600 to-slate-800 px-6 sm:px-8 py-8 sm:py-10 text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl border-4 border-white/40">
                <CheckCircle className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
              </div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 mb-2">
                RoboFest Bangladesh 2026
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
                Team Registration Verified
              </h1>
              <p className="text-base sm:text-lg text-cyan-50 font-medium">
                This Robofest team registration is valid and confirmed
              </p>
              <Badge className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm rounded-full text-sm font-semibold">
                <ShieldCheck className="w-5 h-5" />
                Valid Robofest Registration
              </Badge>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="bg-linear-to-br from-cyan-50 via-white to-slate-50 border-2 border-cyan-200 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-cyan-700" />
                    </div>
                    <p className="text-sm font-semibold text-cyan-700 uppercase tracking-wider">
                      Registration ID
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
                      {registration.registrationId}
                    </p>
                    {registration.registrationId ? (
                      <CopyButton
                        text={registration.registrationId}
                        label="Registration ID"
                      />
                    ) : null}
                  </div>
                  <p className="text-xs text-cyan-800 mt-2 font-medium">
                    Save this number for check-in and records
                  </p>
                </div>

                {qrCodeDataURL ? (
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-cyan-200 mb-3">
                      <Image
                        src={qrCodeDataURL}
                        alt="QR Code for Robofest registration verification"
                        width={144}
                        height={144}
                        className="w-32 h-32 sm:w-36 sm:h-36"
                        unoptimized
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <QrCode className="w-4 h-4" />
                      <span className="font-medium">Scan to verify</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
              <div className="rounded-2xl p-6 sm:p-7 border border-slate-200 bg-slate-50/80 shadow-md">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-cyan-700" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Competition
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Event
                    </p>
                    <p className="text-base sm:text-lg font-bold text-slate-900">
                      {content.headline || 'RoboFest Bangladesh 2026'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Competition
                    </p>
                    <p className="text-base font-bold text-slate-900">
                      {registration.category}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Division
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {registration.roundCity}
                    </p>
                  </div>
                  {ageLabel ? (
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Category
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {ageLabel}
                      </p>
                    </div>
                  ) : null}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Event date
                      </p>
                    </div>
                    <p className="text-base font-semibold text-slate-900">
                      {eventDate}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Venue
                      </p>
                    </div>
                    <p className="text-base font-semibold text-slate-900">
                      {roundVenue}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 sm:p-7 border border-slate-200 bg-slate-50/80 shadow-md">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-cyan-700" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Team
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Team Number
                    </p>
                    <p className="text-base sm:text-lg font-bold font-mono text-cyan-800">
                      {teamNumber}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Team Lead Email
                      </p>
                    </div>
                    <p className="text-base font-semibold text-slate-900 break-all">
                      {registration.email}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Team lead Contact
                      </p>
                    </div>
                    <p className="text-base font-semibold text-slate-900">
                      {registration.phone || '—'}
                    </p>
                  </div>
                  {registration.paymentStatus === 'paid' ? (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">
                        Payment
                      </p>
                      <p className="text-sm font-bold text-emerald-900">
                        Paid
                        {registration.amountPaid != null
                          ? ` · BDT ${registration.amountPaid}`
                          : ''}
                        {registration.trxId ? ` · ${registration.trxId}` : ''}
                      </p>
                    </div>
                  ) : null}
                  {registeredAt && !Number.isNaN(registeredAt.getTime()) ? (
                    <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                      <p className="text-xs font-semibold text-cyan-800 uppercase tracking-wider mb-1.5">
                        Registered on
                      </p>
                      <p className="text-sm font-bold text-cyan-950">
                        {format(registeredAt, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 border-2 border-cyan-200 bg-linear-to-br from-cyan-50 to-white shadow-md mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cyan-700" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Team Members
                  </h3>
                  <p className="text-sm text-slate-500">
                    {registration.teamSize || teamMembers.length || 0} member
                    {(registration.teamSize || teamMembers.length) === 1
                      ? ''
                      : 's'}
                  </p>
                </div>
              </div>

              {teamMembers.length > 0 ? (
                <ul className="space-y-3">
                  {teamMembers.map((member, index) => (
                    <li
                      key={`${member.email}-${index}`}
                      className="bg-white rounded-xl p-4 border border-slate-200"
                    >
                      <p className="font-bold text-slate-900">
                        {index === 0
                          ? '01'
                          : String(index + 1).padStart(2, '0')}
                        . {member.name}
                        {index === 0 && (
                          <span className="ml-1 text-xs font-normal text-slate-600">
                            (Team Leader)
                          </span>
                        )}
                      </p>

                      <p className="text-sm text-cyan-800 mt-1 break-all">
                        {member.email || '—'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {[member.grade, member.school, member.branch, member.phone]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-slate-200 text-sm text-slate-500">
                  No detailed member roster on file for this registration.
                </div>
              )}

              {registration.campusAmbassadorName ? (
                <div className="mt-4 bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Campus ambassador
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {registration.campusAmbassadorName}
                    {registration.campusAmbassadorSchool
                      ? ` · ${registration.campusAmbassadorSchool}`
                      : ''}
                  </p>
                </div>
              ) : null}

              {registration.notes ? (
                <div className="mt-4 bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {registration.notes}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <QrCode className="w-5 h-5 text-cyan-700" />
                  <p className="text-sm font-medium">
                    Scan the QR on your Robofest confirmation PDF to reopen this page
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap justify-center">
                  <Button
                    asChild
                    variant="ghost"
                    className="text-cyan-700 hover:text-cyan-800 hover:bg-cyan-50"
                  >
                    <Link href="/robofest" prefetch={false}>
                      View Robofest
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <Link href="/" prefetch={false}>
                      Back to Home
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm shadow-md text-xs font-semibold text-slate-700"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-700" />
            Securely verified by {SITE_CONFIG.name}
          </Badge>
        </div>
      </div>
    </div>
  )
}
