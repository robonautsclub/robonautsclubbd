import type { RobofestRegistration } from '@/lib/robofest-content'

/** Substring match across team / member / contact fields (case-insensitive). */
export function registrationMatchesNameFilter(
  r: RobofestRegistration,
  name: string,
): boolean {
  const needle = name.trim().toLowerCase()
  if (!needle) return true
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
  return haystack.includes(needle)
}
