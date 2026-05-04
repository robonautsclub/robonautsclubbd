import { requireAuth } from '@/lib/auth'
import { getSchoolDirectory } from './actions'
import SchoolDirectoryManager from './SchoolDirectoryManager'

export const dynamic = 'force-dynamic'

export default async function SchoolsPage() {
  await requireAuth()
  const schools = await getSchoolDirectory(true)

  return (
    <div className="max-w-7xl space-y-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">School Directory</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Manage English-medium schools in Bangladesh for event registration dropdowns.
        </p>
      </div>
      <SchoolDirectoryManager schools={schools} />
    </div>
  )
}
