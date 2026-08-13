import { requireAuth } from '@/lib/auth'
import LogoutButton from './LogoutButton'
import TokenExpirationChecker from './TokenExpirationChecker'
import SessionTimer from './SessionTimer'
import Notifications from './Notifications'
import DashboardShell from './DashboardShell'

// Force dynamic rendering since this layout uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  return (
    <>
      <TokenExpirationChecker />
      <SessionTimer />
      <DashboardShell
        role={session.role}
        permissions={session.permissions}
        userName={session.name}
        userEmail={session.email}
        headerActions={
          <>
            <Notifications />
            <LogoutButton />
          </>
        }
      >
        {children}
      </DashboardShell>
    </>
  )
}
