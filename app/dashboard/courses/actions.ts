'use server'

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import {
  requireAuth,
  canCreateArea,
  canEditResource,
  canDeleteResource,
} from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { Course } from '@/types/course'
import { createNotification } from '@/lib/notifications'

const DASHBOARD_COURSES_LIST_TAG = 'dashboard-courses-list'

const DASHBOARD_COURSE_LIST_FIELDS = [
  'title',
  'level',
  'blurb',
  'href',
  'image',
  'isArchived',
  'createdAt',
  'updatedAt',
  'createdBy',
  'createdByName',
  'createdByEmail',
] as const
const PUBLIC_COURSES_TAG = 'public-courses'

async function fetchDashboardCoursesListFromDb(): Promise<Course[]> {
  const db = adminDb!
  const coursesSnapshot = await db
    .collection('courses')
    .select(...(DASHBOARD_COURSE_LIST_FIELDS as unknown as string[]))
    .get()

  const courses: Course[] = []
  coursesSnapshot.forEach((doc) => {
    const data = doc.data()
    courses.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    } as Course)
  })

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

// ==================== COURSE MANAGEMENT ====================

/**
 * Get all courses from Firestore (admin only)
 */
export async function getCourses(): Promise<Course[]> {
  await requireAuth() // Ensure user is authenticated
  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch courses. Set FIREBASE_ADMIN_* in .env')
    return []
  }
  try {
    return await getCachedCoursesList()
  } catch (error) {
    console.error('Error fetching courses:', error)
    throw new Error('Failed to fetch courses')
  }
}

/**
 * Get a single course by ID
 */
export async function getCourse(id: string): Promise<Course | null> {
  await requireAuth()

  if (!adminDb) {
    console.warn('Firebase Admin SDK not available. Cannot fetch course.')
    return null
  }

  try {
    const courseDoc = await adminDb.collection('courses').doc(id).get()
    
    if (!courseDoc.exists) {
      return null
    }

    const data = courseDoc.data()!
    return {
      id: courseDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    } as Course
  } catch (error) {
    console.error('Error fetching course:', error)
    throw new Error('Failed to fetch course')
  }
}

/**
 * Create a new course
 */
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
  if (!adminDb) {
    return {
      success: false,
      error: 'Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.',
    }
  }

  try {
    // Validate required fields
    if (!formData.title.trim() || !formData.level.trim() || !formData.blurb.trim() || !formData.image.trim()) {
      return {
        success: false,
        error: 'Title, level, blurb, and image are required fields.',
      }
    }

    // Check if course with same title already exists
    const existingCourses = await adminDb
      .collection('courses')
      .where('title', '==', formData.title.trim())
      .get()

    if (!existingCourses.empty) {
      return {
        success: false,
        error: 'A course with this name already exists',
      }
    }

    // Create course in Firestore
    const now = new Date()
    const courseRef = await adminDb.collection('courses').add({
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

    // Revalidate pages to show new course immediately
    revalidatePath('/')
    revalidatePath('/dashboard/courses')
    revalidateTag(DASHBOARD_COURSES_LIST_TAG, 'max')
    revalidateTag(PUBLIC_COURSES_TAG, 'max')

    // Create notification for course creation
    await createNotification(
      'course_created',
      `${session.name} created a new course: "${formData.title.trim()}"`,
      session,
      ['course created']
    )

    return {
      success: true,
      courseId: courseRef.id,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create course. Please try again.',
    }
  }
}

/**
 * Update an existing course
 */
export async function updateCourse(
  courseId: string,
  formData: {
    title: string
    level: string
    blurb: string
    href: string
    image: string
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()

  if (!adminDb) {
    return {
      success: false,
      error: 'Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.',
    }
  }

  try {
    // Check if course exists
    const courseDoc = await adminDb.collection('courses').doc(courseId).get()
    if (!courseDoc.exists) {
      return {
        success: false,
        error: 'Course not found',
      }
    }

    const courseData = courseDoc.data()!

    if (!canEditResource(session, 'courses', courseData.createdBy as string | undefined)) {
      return {
        success: false,
        error: 'You do not have permission to edit this course.',
      }
    }

    // Validate required fields
    if (!formData.title.trim() || !formData.level.trim() || !formData.blurb.trim() || !formData.image.trim()) {
      return {
        success: false,
        error: 'Title, level, blurb, and image are required fields.',
      }
    }

    // Check if another course with the same title exists (excluding current course)
    const existingCourses = await adminDb
      .collection('courses')
      .where('title', '==', formData.title.trim())
      .get()

    const hasDuplicate = existingCourses.docs.some((doc) => doc.id !== courseId)
    if (hasDuplicate) {
      return {
        success: false,
        error: 'A course with this name already exists',
      }
    }

    // Update course in Firestore
    await adminDb.collection('courses').doc(courseId).update({
      title: formData.title.trim(),
      level: formData.level.trim(),
      blurb: formData.blurb.trim(),
      href: formData.href.trim() || `/courses/${formData.title.toLowerCase().replace(/\s+/g, '-')}`,
      image: formData.image.trim(),
      updatedAt: new Date(),
    })

    // Revalidate pages to show updated course immediately
    revalidatePath('/')
    revalidatePath('/dashboard/courses')
    revalidateTag(DASHBOARD_COURSES_LIST_TAG, 'max')
    revalidateTag(PUBLIC_COURSES_TAG, 'max')

    // Create notification for course update
    await createNotification(
      'course_updated',
      `${session.name} updated the course: "${formData.title.trim()}"`,
      session,
      ['course updated']
    )

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update course. Please try again.',
    }
  }
}

/**
 * Archive or unarchive a course
 */
export async function archiveCourse(courseId: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()

  if (!adminDb) {
    return {
      success: false,
      error: 'Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.',
    }
  }

  try {
    // Check if course exists
    const courseDoc = await adminDb.collection('courses').doc(courseId).get()
    if (!courseDoc.exists) {
      return {
        success: false,
        error: 'Course not found',
      }
    }

    const courseData = courseDoc.data()!

    if (!canEditResource(session, 'courses', courseData.createdBy as string | undefined)) {
      return {
        success: false,
        error: 'You do not have permission to archive this course.',
      }
    }

    const currentArchiveStatus = courseData.isArchived || false

    // Toggle archive status
    await adminDb.collection('courses').doc(courseId).update({
      isArchived: !currentArchiveStatus,
      updatedAt: new Date(),
    })

    // Revalidate pages
    revalidatePath('/')
    revalidatePath('/dashboard/courses')
    revalidateTag(DASHBOARD_COURSES_LIST_TAG, 'max')
    revalidateTag(PUBLIC_COURSES_TAG, 'max')

    // Create notification for course archive/unarchive
    const action = !currentArchiveStatus ? 'archived' : 'unarchived'
    await createNotification(
      'course_archived',
      `${session.name} ${action} the course: "${courseData.title}"`,
      session,
      [`course ${action}`]
    )

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to archive course. Please try again.',
    }
  }
}

/**
 * Delete a course permanently
 */
export async function deleteCourse(courseId: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()

  if (!adminDb) {
    return {
      success: false,
      error: 'Firebase Admin SDK is not configured. Please set up FIREBASE_ADMIN_* environment variables.',
    }
  }

  try {
    // Check if course exists
    const courseDoc = await adminDb.collection('courses').doc(courseId).get()
    if (!courseDoc.exists) {
      return {
        success: false,
        error: 'Course not found',
      }
    }

    const courseData = courseDoc.data()!

    if (!canDeleteResource(session, 'courses', courseData.createdBy as string | undefined)) {
      return {
        success: false,
        error: 'You do not have permission to delete this course.',
      }
    }

    // Delete the course
    await adminDb.collection('courses').doc(courseId).delete()

    // Revalidate pages to remove deleted course immediately
    revalidatePath('/')
    revalidatePath('/dashboard/courses')
    revalidateTag(DASHBOARD_COURSES_LIST_TAG, 'max')
    revalidateTag(PUBLIC_COURSES_TAG, 'max')

    // Create notification for course deletion
    await createNotification(
      'course_deleted',
      `${session.name} deleted the course: "${courseData.title}"`,
      session,
      ['course deleted']
    )

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to delete course. Please try again.',
    }
  }
}
