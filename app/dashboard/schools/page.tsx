import { requireTabAccess, canCreateArea, canEditOthersArea, canDeleteArea } from '@/lib/auth'
import { getSchoolDirectory } from './actions'
import SchoolDirectoryManager from './SchoolDirectoryManager'

export const dynamic = 'force-dynamic'

export default async function SchoolsPage() {
  const session = await requireTabAccess('schools')
  const canCreate = canCreateArea(session, 'schools')
  const canEdit = canEditOthersArea(session, 'schools')
  const canDelete = canDeleteArea(session, 'schools')
  const { schools, error } = await getSchoolDirectory(true)

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">School Directory</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Manage English-medium schools for registration dropdowns. Confirm custom names submitted via Robofest.
        </p>
      </div>
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}
      <SchoolDirectoryManager schools={schools} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
    </div>
  )
}
