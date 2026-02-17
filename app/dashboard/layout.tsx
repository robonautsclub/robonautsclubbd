import { requireAuth } from '@/lib/auth'
import { SITE_CONFIG } from '@/lib/site-config'
import { Sparkles } from 'lucide-react'
import LogoutButton from './LogoutButton'
import Sidebar from './Sidebar'
import AutoRefresh from './AutoRefresh'
import TokenExpirationChecker from './TokenExpirationChecker'
import SessionTimer from './SessionTimer'
import Notifications from './Notifications'

// Force dynamic rendering since this layout uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require authentication - redirects to login if not authenticated
  const session = await requireAuth()

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <AutoRefresh />
      <TokenExpirationChecker />
      <SessionTimer />
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500 hidden sm:block">{SITE_CONFIG.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">{session.name}</p>
                <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[200px]">{session.email}</p>
              </div>
              <Notifications />
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <Sidebar role={session.role} />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

