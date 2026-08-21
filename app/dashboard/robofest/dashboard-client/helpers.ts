import type { RobofestRegistration, RobofestRegistrationStatus } from '@/lib/robofest-content'
import type { StatusTone } from './types'

export function statusBadgeClass(status: string) {
  if (status === 'confirmed') {
    return 'bg-emerald-50 text-emerald-800 hover:bg-emerald-50 border-emerald-100'
  }
  if (status === 'cancelled') {
    return 'bg-rose-50 text-rose-800 hover:bg-rose-50 border-rose-100'
  }
  return 'bg-amber-50 text-amber-800 hover:bg-amber-50 border-amber-100'
}

export const statusEmptyCopy: Record<
  RobofestRegistrationStatus,
  { title: string; body: string }
> = {
  pending: {
    title: 'No pending registrations',
    body: 'New teams awaiting review will appear here.',
  },
  confirmed: {
    title: 'No confirmed registrations',
    body: 'Confirmed teams will appear here.',
  },
  cancelled: {
    title: 'No cancelled registrations',
    body: 'Cancelled team registrations will appear here.',
  },
}

export function getStatusTone(statusTab: RobofestRegistrationStatus): StatusTone {
  return statusTab === 'confirmed'
    ? {
        badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200/80',
        bar: 'from-emerald-500 to-teal-500',
        chip: 'bg-emerald-50 text-emerald-800',
      }
    : statusTab === 'cancelled'
      ? {
          badge: 'bg-rose-100 text-rose-800 ring-rose-200/80',
          bar: 'from-rose-500 to-orange-400',
          chip: 'bg-rose-50 text-rose-800',
        }
      : {
          badge: 'bg-amber-100 text-amber-900 ring-amber-200/80',
          bar: 'from-amber-500 to-cyan-500',
          chip: 'bg-amber-50 text-amber-900',
        }
}

export function registrationMatchesNameFilter(
  r: RobofestRegistration,
  name: string,
): boolean {
  const haystack = [
    r.name,
    r.teamNumber,
    r.registrationId,
    r.email,
    r.phone,
    r.school,
    r.campusAmbassadorName,
    ...(r.teamMembers || []).flatMap((m) => [
      m.name,
      m.email,
      m.phone,
      m.school,
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(name)
}
