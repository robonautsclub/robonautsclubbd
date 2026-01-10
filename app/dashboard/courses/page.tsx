import { requireAuth } from '@/lib/auth'
import { getCourses } from '../actions'
import CoursesClient from './CoursesClient'

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const session = await requireAuth()
  const courses = await getCourses()

  const activeCourses = courses.filter((c) => !c.isArchived)
  const archivedCourses = courses.filter((c) => c.isArchived)

  return (
    <CoursesClient
      courses={courses}
      activeCourses={activeCourses}
      archivedCourses={archivedCourses}
      sessionId={session.uid}
    />
  )
}

