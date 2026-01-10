'use client'

import { useState, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { updateCourse } from '../actions'
import { X, FileText, Image as ImageIcon, Upload, Trash2, BookOpen, Link as LinkIcon, GraduationCap, Edit } from 'lucide-react'
import type { Course } from '@/types/course'

interface EditCourseFormProps {
  course: Course
  onClose: () => void
}

export default function EditCourseForm({ course, onClose }: EditCourseFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: course.title || '',
    level: course.level || '',
    blurb: course.blurb || '',
    href: course.href || '',
    image: course.image || '',
  })

  const levelOptions = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Beginner-Intermediate',
    'Intermediate-Advanced',
    'All Levels',
    'For All',
    'Junior–Senior',
  ]

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please select an image file (JPEG, PNG, WebP, or GIF).')
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size exceeds 5MB. Please select a smaller image.')
      return
    }

    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Automatically upload the image
    await uploadImageFile(file)
  }

  const uploadImageFile = async (file: File) => {
    setUploading(true)
    setError('')

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('image', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      // Store the Cloudinary URL in form data
      setFormData({ ...formData, image: data.secure_url })
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image. Please try again.')
      // Keep the preview so user can retry
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setFormData({ ...formData, image: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!formData.title.trim() || !formData.level.trim() || !formData.blurb.trim() || !formData.image.trim()) {
      setError('Please fill in all required fields (Title, Level, Blurb, and Image)')
      setLoading(false)
      return
    }

    try {
      // Generate default href from title if not provided
      const href = formData.href.trim() || `/courses/${formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`

      const result = await updateCourse(course.id, {
        ...formData,
        href,
      })

      if (result.success) {
        onClose()
        router.refresh()
      } else {
        setError(result.error || 'Failed to update course')
      }
    } catch (err) {
      console.error('Error updating course:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-500 to-blue-600 px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Edit Course</h3>
              <p className="text-sm text-indigo-100">Update the course details below</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            disabled={loading || uploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Course Title */}
            <div className="space-y-2">
              <label htmlFor="edit-title" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Enter course title"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
            </div>

            {/* Level */}
            <div className="space-y-2">
              <label htmlFor="edit-level" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Level <span className="text-red-500">*</span>
              </label>
              <select
                id="edit-level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              >
                <option value="">Select a level</option>
                {levelOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Blurb/Description */}
            <div className="space-y-2">
              <label htmlFor="edit-blurb" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 text-indigo-600" />
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="edit-blurb"
                rows={4}
                value={formData.blurb}
                onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
                required
                placeholder="Brief description of the course"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-none"
                disabled={loading}
              />
            </div>

            {/* Link/Href */}
            <div className="space-y-2">
              <label htmlFor="edit-href" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                Course Link (Optional)
              </label>
              <input
                id="edit-href"
                type="text"
                value={formData.href}
                onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                placeholder="/courses/course-name (auto-generated if empty)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Leave empty to auto-generate from title</p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Course Image <span className="text-red-500">*</span>
              </label>
              
              {formData.image ? (
                <div className="relative">
                  <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                    <Image
                      src={formData.image}
                      alt="Course preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={loading || uploading}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {!imagePreview && (
                    <label
                      htmlFor="edit-course-image-upload"
                      className="absolute bottom-2 right-2 p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <Upload className="w-4 h-4 inline mr-1" />
                      Change
                    </label>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={loading || uploading}
                    className="hidden"
                    id="edit-course-image-upload"
                  />
                </div>
              ) : (
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={loading || uploading}
                    className="hidden"
                    id="edit-course-image-upload"
                  />
                  <label
                    htmlFor="edit-course-image-upload"
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      uploading
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                    } ${loading || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-medium text-indigo-600">Uploading image...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      </>
                    )}
                  </label>
                  {imagePreview && (
                    <div className="mt-4 relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || uploading}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploading || !formData.image}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    Update Course
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

