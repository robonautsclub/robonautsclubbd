import { requireTabAccess, canCreateArea, canEditOthersArea, canDeleteArea, hasPermission } from '@/lib/auth'
import { getPublicEnglishMediumSchools } from '@/app/(marketing)/events/actions'
import {
  getRobofestCampusAmbassadors,
  getRobofestDashboardContent,
  getRobofestRegistrationsPage,
  getRobofestRegistrationStatusCounts,
} from './actions'
import RobofestDashboardClient from './RobofestDashboardClient'

export const dynamic = 'force-dynamic'

export default async function RobofestDashboardPage() {
  const session = await requireTabAccess('robofest')
  const defaultFilters = { status: 'pending' as const }
  const [content, registrationPage, statusCounts, schools, campusAmbassadors] =
    await Promise.all([
      getRobofestDashboardContent(),
      getRobofestRegistrationsPage({ filters: defaultFilters }),
      getRobofestRegistrationStatusCounts(),
      getPublicEnglishMediumSchools(),
      getRobofestCampusAmbassadors(),
    ])

  return (
    <div className="w-full min-w-0 max-w-none">
      <RobofestDashboardClient
        initialContent={content}
        initialRegistrations={registrationPage.items}
        initialNextCursor={registrationPage.nextCursor}
        initialHasMore={registrationPage.hasMore}
        initialStatusCounts={statusCounts}
        schools={schools}
        campusAmbassadors={campusAmbassadors}
        canCreate={canCreateArea(session, 'robofest')}
        canEdit={canEditOthersArea(session, 'robofest')}
        canDelete={canDeleteArea(session, 'robofest')}
        canViewPayments={hasPermission(session, 'payments.view')}
        canSendMail={hasPermission(session, 'mail.send')}
        canExportCsv={hasPermission(session, 'exports.csv')}
        canExportExcel={hasPermission(session, 'exports.excel')}
        canExportPdf={hasPermission(session, 'exports.pdf')}
      />
    </div>
  )
}
