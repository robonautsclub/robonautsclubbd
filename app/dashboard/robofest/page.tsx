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
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Robofest</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage local-round content, fees, and category registrations.
        </p>
      </div>
      <RobofestDashboardClient
        initialContent={content}
        registrations={registrations}
      />
    </div>
  )
}
