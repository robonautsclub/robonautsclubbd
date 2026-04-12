import { requireAuth } from '@/lib/auth'
import GalleryGroupForm from '../GalleryGroupForm'

export const dynamic = 'force-dynamic'

export default async function NewGalleryPage() {
  await requireAuth()
  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">New album</h2>
      <GalleryGroupForm />
    </div>
  )
}
