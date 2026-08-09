import { requireAuth } from '@/lib/auth'
import ProfileForm from './ProfileForm'

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await requireAuth()

  return (
    <div className="w-full min-w-0 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">My Profile</h2>
        <p className="text-sm sm:text-base text-slate-600 mt-1">Update your profile information</p>
      </div>

      {/* Profile Form */}
      <ProfileForm session={session} />
    </div>
  )
}
