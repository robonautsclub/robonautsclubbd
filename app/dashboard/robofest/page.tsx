import { requireTabAccess, canCreateArea, canEditOthersArea, canDeleteArea, hasPermission } from '@/lib/auth'
import { getPublicEnglishMediumSchools } from '@/app/(marketing)/events/actions'
import {
  getRobofestCampusAmbassadors,
  getRobofestDashboardContent,
  getRobofestRegistrations,
} from './actions'
import RobofestDashboardClient from './RobofestDashboardClient'

export const dynamic = 'force-dynamic'

export default async function RobofestDashboardPage() {
  const session = await requireTabAccess('robofest')
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
