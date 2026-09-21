import { requireAuth } from '@/lib/auth'
import type { Metadata } from 'next'
import { NOINDEX_ROBOTS } from '@/lib/seo-metadata'
import LogoutButton from './LogoutButton'
import TokenExpirationChecker from './TokenExpirationChecker'
import SessionTimer from './SessionTimer'
import Notifications from './Notifications'
import DashboardShell from './DashboardShell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

// Force dynamic rendering since this layout uses cookies for authentication
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: NOINDEX_ROBOTS,
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  return (
    <TooltipProvider delayDuration={200}>
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
      <Toaster richColors closeButton position="top-right" />
    </TooltipProvider>
  )
}
