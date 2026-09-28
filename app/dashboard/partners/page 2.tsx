import { requireTabAccess, canCreateArea, canEditArea, canDeleteArea } from '@/lib/auth'
import { getHomepageOrgs } from './actions'
import PartnersSchoolsManager from './PartnersSchoolsManager'

export const dynamic = 'force-dynamic'

export default async function PartnersPage() {
  const session = await requireTabAccess('partners')
  const canCreate = canCreateArea(session, 'partners')
  const canEdit = canEditArea(session, 'partners')
  const canDelete = canDeleteArea(session, 'partners')
  const { orgs, error } = await getHomepageOrgs()

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Partners & Schools</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Manage strategic partners and workshop schools shown on the homepage.
        </p>
      </div>
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}
      <PartnersSchoolsManager
        orgs={orgs}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  )
}
