import { requireAuth } from '@/lib/auth'
import { getPublicEnglishMediumSchools } from '@/app/(marketing)/events/actions'
import {
  getRobofestCampusAmbassadors,
  getRobofestDashboardContent,
  getRobofestRegistrations,
} from './actions'
import RobofestDashboardClient from './RobofestDashboardClient'

export const dynamic = 'force-dynamic'

export default async function RobofestDashboardPage() {
  await requireAuth()
  const [content, registrations, schools, campusAmbassadors] =
    await Promise.all([
      getRobofestDashboardContent(),
      getRobofestRegistrations(),
      getPublicEnglishMediumSchools(),
      getRobofestCampusAmbassadors(),
    ])

  return (
    <div className="w-full min-w-0 max-w-none">
      <RobofestDashboardClient
        initialContent={content}
        registrations={registrations}
        schools={schools}
        campusAmbassadors={campusAmbassadors}
      />
    </div>
  )
}
