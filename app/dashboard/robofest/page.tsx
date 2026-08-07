import { requireAuth } from '@/lib/auth'
import {
  getRobofestDashboardContent,
  getRobofestRegistrations,
} from './actions'
import RobofestDashboardClient from './RobofestDashboardClient'

export const dynamic = 'force-dynamic'

export default async function RobofestDashboardPage() {
  await requireAuth()
  const [content, registrations] = await Promise.all([
    getRobofestDashboardContent(),
    getRobofestRegistrations(),
  ])

  return (
    <div className="w-full min-w-0 max-w-none">
      <RobofestDashboardClient
        initialContent={content}
        registrations={registrations}
      />
    </div>
  )
}
