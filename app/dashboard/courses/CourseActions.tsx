'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCourse, archiveCourse } from '../actions'
import { Edit, Trash2, Archive, ArchiveRestore } from 'lucide-react'
import EditCourseForm from './EditCourseForm'
import DeleteConfirmation from './DeleteConfirmation'
import type { Course } from '@/types/course'
import { Button } from '@/components/ui/button'

interface CourseActionsProps {
  course: Course
  currentUserId?: string
  userRole?: 'superAdmin' | 'admin'
}

export default function CourseActions({ course, currentUserId, userRole }: CourseActionsProps) {
  const router = useRouter()
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [archiving, setArchiving] = useState(false)
  
  // Show edit/delete buttons if:
  // - User is Super Admin (can edit/delete any course), OR
  // - User is Admin AND is the creator of the course
  const isSuperAdmin = userRole === 'superAdmin'
  const isOwner = currentUserId && course.createdBy === currentUserId
  const canEdit = isSuperAdmin || isOwner
  const canDelete = isSuperAdmin || isOwner

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await deleteCourse(course.id)
      if (result.success) {
        setShowDeleteConfirm(false)
        router.refresh()
      } else {
        alert(result.error || 'Failed to delete course')
      }
    } catch (error) {
      alert('An unexpected error occurred')
    } finally {
      setDeleting(false)
    }
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      const result = await archiveCourse(course.id)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to archive course')
      }
    } catch (error) {
      alert('An unexpected error occurred')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowEditForm(true)}
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            title="Edit course"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleArchive}
          disabled={archiving}
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          title={course.isArchived ? 'Unarchive course' : 'Archive course'}
        >
          {course.isArchived ? (
            <>
              <ArchiveRestore className="w-4 h-4" />
              Unarchive
            </>
          ) : (
            <>
              <Archive className="w-4 h-4" />
              Archive
            </>
          )}
        </Button>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete course"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        )}
      </div>

      {showEditForm && (
        <EditCourseForm
          course={course}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmation
          title="Delete Course"
          message="Are you sure you want to delete this course? This action cannot be undone."
          itemName={course.title}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}

