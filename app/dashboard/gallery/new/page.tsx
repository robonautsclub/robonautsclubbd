import { requireAuth } from '@/lib/auth'
import GalleryGroupForm from '../GalleryGroupForm'

export const dynamic = 'force-dynamic'

export default async function NewGalleryPage() {
  await requireAuth()
  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">New album</h2>
      <GalleryGroupForm />
    </div>
  )
}
