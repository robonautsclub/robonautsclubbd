'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { requireAuth, canCreateArea, canEditResource, canDeleteResource } from '@/lib/auth'
import {
  collectionAdd,
  collectionDelete,
  collectionGet,
  collectionGetAll,
  collectionSet,
  collectionWhere,
} from '@/lib/db/collections'
import { Course } from '@/types/course'
import { createNotification } from '@/lib/notifications'

const DASHBOARD_COURSES_LIST_TAG = 'dashboard-courses-list'
const PUBLIC_COURSES_TAG = 'public-courses'

function parseDateField(value: unknown): Date | string | undefined {
  if (value == null) return undefined
  if (value instanceof Date) return value
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate()
    } catch {
      return undefined
    }
  }
  return undefined
}

async function fetchDashboardCoursesListFromDb(): Promise<Course[]> {
  const docs = await collectionGetAll('courses')
  const courses: Course[] = docs.map((doc) => ({
    id: String(doc.id),
    ...doc,
    createdAt: parseDateField(doc.createdAt),
    updatedAt: parseDateField(doc.updatedAt),
  })) as Course[]

  courses.sort((a, b) => {
    if (!a.createdAt && !b.createdAt) return 0
    if (!a.createdAt) return 1
    if (!b.createdAt) return -1
    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
    return dateB - dateA
  })

  return courses
}

export const getCachedCoursesList = unstable_cache(fetchDashboardCoursesListFromDb, [DASHBOARD_COURSES_LIST_TAG], {
  tags: [DASHBOARD_COURSES_LIST_TAG],
  revalidate: 900,
})

export async function getCourses(): Promise<Course[]> {
  await requireAuth()
  try {
    return await getCachedCoursesList()
  } catch (error) {
    console.error('Error fetching courses:', error)
    throw new Error('Failed to fetch courses')
  }
}

export async function getCourse(id: string): Promise<Course | null> {
  await requireAuth()
  try {
    const doc = await collectionGet('courses', id)
    if (!doc) return null
    return {
      id: String(doc.id),
      ...doc,
      createdAt: parseDateField(doc.createdAt),
      updatedAt: parseDateField(doc.updatedAt),
    } as Course
  } catch (error) {
    console.error('Error fetching course:', error)
    throw new Error('Failed to fetch course')
  }
}

export async function createCourse(formData: {
  title: string
  level: string
  blurb: string
  href: string
  image: string
}): Promise<{ success: boolean; error?: string; courseId?: string }> {
  const session = await requireAuth()
  if (!canCreateArea(session, 'courses')) {
    return { success: false, error: 'You do not have permission to create courses.' }
  }

  try {
    if (!formData.title.trim() || !formData.level.trim() || !formData.blurb.trim() || !formData.image.trim()) {
      return { success: false, error: 'Title, level, blurb, and image are required fields.' }
    }

    const existingCourses = await collectionWhere('courses', 'title', '==', formData.title.trim())
    if (existingCourses.length > 0) {
      return { success: false, error: 'A course with this name already exists' }
    }

    const now = new Date().toISOString()
    const courseId = await collectionAdd('courses', {
      title: formData.title.trim(),
      level: formData.level.trim(),
      blurb: formData.blurb.trim(),
      href: formData.href.trim() || `/courses/${formData.title.toLowerCase().replace(/\s+/g, '-')}`,
      image: formData.image.trim(),
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      createdBy: session.uid,
      createdByName: session.name,
      createdByEmail: session.email,
    })

    revalidatePath('/')
    revalidatePath('/dashboard/courses')
    revalidateTag(DASHBOARD_COURSES_LIST_TAG, 'max')
    revalidateTag(PUBLIC_COURSES_TAG, 'max')

    await createNotification(
      'course_created',
      `${session.name} created a new course: "${formData.title.trim()}"`,
      session,
      ['course created'],
    )

    return { success: true, courseId }
  } catch {
    return { success: false, error: 'Failed to create course. Please try again.' }
  }
}

export async function updateCourse(
  courseId: string,
  formData: {
    title: string
    level: string
    blurb: string
    href: string
    image: string
  },
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()

  try {
    const courseDoc = await collectionGet('courses', courseId)
    if (!courseDoc) return { success: false, error: 'Course not found' }

    const courseData = courseDoc as Record<string, unknown>
    if (!canEditResource(session, 'courses', courseData.createdBy as string | undefined)) {
      return { success: false, error: 'You do not have permission to edit this course.' }
    }

    if (!formData.title.trim() || !formData.level.trim() || !formData.blurb.trim() || !formData.image.trim()) {
      return { success: false, error: 'Title, level, blurb, and image are required fields.' }
    }

    const existingCourses = await collectionWhere('courses', 'title', '==', formData.title.trim())
    const hasDuplicate = existingCourses.some((doc) => String(doc.id) !== courseId)
    if (hasDuplicate) {
      return { success: false, error: 'A course with this name already exists' }
    }

    await collectionSet(
      'courses',
      courseId,
      {
        title: formData.title.trim(),
        level: formData.level.trim(),
        blurb: formData.blurb.trim(),
        href: formData.href.trim() || `/courses/${formData.title.toLowerCase().replace(/\s+/g, '-')}`,
        image: formData.image.trim(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    )

    revalidatePath('/')
    revalidatePath('/dashboard/courses')
    revalidateTag(DASHBOARD_COURSES_LIST_TAG, 'max')
    revalidateTag(PUBLIC_COURSES_TAG, 'max')

    await createNotification(
      'course_updated',
      `${session.name} updated the course: "${formData.title.trim()}"`,
      session,
      ['course updated'],
    )

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update course. Please try again.' }
  }
}

export async function archiveCourse(courseId: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()

  try {
    const courseDoc = await collectionGet('courses', courseId)
    if (!courseDoc) return { success: false, error: 'Course not found' }

    const courseData = courseDoc as Record<string, unknown>
    if (!canEditResource(session, 'courses', courseData.createdBy as string | undefined)) {
      return { success: false, error: 'You do not have permission to archive this course.' }
    }

    const currentArchiveStatus = Boolean(courseData.isArchived)
    await collectionSet(
      'courses',
      courseId,
      { isArchived: !currentArchiveStatus, updatedAt: new Date().toISOString() },
      { merge: true },
    )

    revalidatePath('/')
    revalidatePath('/dashboard/courses')
    revalidateTag(DASHBOARD_COURSES_LIST_TAG, 'max')
    revalidateTag(PUBLIC_COURSES_TAG, 'max')

    const action = !currentArchiveStatus ? 'archived' : 'unarchived'
    await createNotification(
      'course_archived',
      `${session.name} ${action} the course: "${courseData.title}"`,
      session,
      [`course ${action}`],
    )

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to archive course. Please try again.' }
  }
}

export async function deleteCourse(courseId: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()

  try {
    const courseDoc = await collectionGet('courses', courseId)
    if (!courseDoc) return { success: false, error: 'Course not found' }

    const courseData = courseDoc as Record<string, unknown>
    if (!canDeleteResource(session, 'courses', courseData.createdBy as string | undefined)) {
      return { success: false, error: 'You do not have permission to delete this course.' }
    }

    await collectionDelete('courses', courseId)

    revalidatePath('/')
    revalidatePath('/dashboard/courses')
    revalidateTag(DASHBOARD_COURSES_LIST_TAG, 'max')
    revalidateTag(PUBLIC_COURSES_TAG, 'max')

    await createNotification(
      'course_deleted',
      `${session.name} deleted the course: "${courseData.title}"`,
      session,
      ['course deleted'],
    )

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete course. Please try again.' }
  }
}
