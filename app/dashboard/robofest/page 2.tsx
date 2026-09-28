import { requireTabAccess, canCreateArea, canEditOthersArea, canDeleteArea, hasPermission } from '@/lib/auth'
import { getPublicEnglishMediumSchools } from '@/app/(marketing)/events/actions'
import {
  getRobofestCampusAmbassadorReferralCounts,
  getRobofestCampusAmbassadors,
  getRobofestDashboardContent,
  getRobofestRegistrationsPage,
  getRobofestRegistrationStats,
  getRobofestRegistrationStatusCounts,
} from './actions'
import RobofestDashboardClient from './RobofestDashboardClient'

export const dynamic = 'force-dynamic'

export default async function RobofestDashboardPage() {
  const session = await requireTabAccess('robofest')
  const defaultFilters = { status: 'confirmed' as const }
  const [
    content,
    registrationPage,
    statusCounts,
    initialStats,
    schools,
    campusAmbassadors,
  ] = await Promise.all([
    getRobofestDashboardContent(),
    getRobofestRegistrationsPage({
      filters: defaultFilters,
      pageSize: 10,
    }),
    getRobofestRegistrationStatusCounts(),
    getRobofestRegistrationStats(defaultFilters),
    getPublicEnglishMediumSchools(),
    getRobofestCampusAmbassadors(),
  ])

  const referralCounts = await getRobofestCampusAmbassadorReferralCounts(
    campusAmbassadors.map((a) => a.id),
  )

  return (
    <div className="w-full min-w-0 max-w-none">
      <RobofestDashboardClient
        initialContent={content}
        initialRegistrations={registrationPage.items}
        initialNextCursor={registrationPage.nextCursor}
        initialHasMore={registrationPage.hasMore}
        initialStatusCounts={statusCounts}
        initialStats={initialStats}
        schools={schools}
        campusAmbassadors={campusAmbassadors}
        referralCounts={referralCounts}
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
