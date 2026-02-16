'use client'

import { useState, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createEvent } from '../actions'
import { Plus, X, Calendar, Clock, MapPin, FileText, Users, Image as ImageIcon, Sparkles, Upload, Trash2, Tag, Banknote } from 'lucide-react'
import MultiDatePicker from './MultiDatePicker'
import TimePicker from './TimePicker'

export default function CreateEventForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    dates: [] as string[],
    description: '',
    time: '9:00 AM - 5:00 PM', // Default time
    location: '',
    venue: '',
    fullDescription: '',
    eligibility: '',
    agenda: '',
    image: '',
    tags: [] as string[],
    isPaid: false,
    amount: '' as '' | number,
  })
  const [tagInput, setTagInput] = useState('')

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

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (index: number) => {
    const newTags = formData.tags.filter((_, i) => i !== index)
    setFormData({ ...formData, tags: newTags })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!formData.title.trim() || formData.dates.length === 0 || !formData.description.trim()) {
      setError('Please fill in all required fields (Name, Date(s), Description)')
      setLoading(false)
      return
    }
    if (formData.isPaid) {
      const amt = typeof formData.amount === 'number' ? formData.amount : Number(formData.amount)
      if (amt === undefined || amt === null || isNaN(amt) || amt <= 0) {
        setError('Please enter a valid amount for paid events')
        setLoading(false)
        return
      }
    }

    // Set default time if not provided
    const eventTime = formData.time || '9:00 AM - 5:00 PM'

    // Convert dates array to string (comma-separated) or single date
    const dateValue = formData.dates.length === 1 ? formData.dates[0] : formData.dates.join(',')

    try {
      const result = await createEvent({
        ...formData,
        date: dateValue,
        time: eventTime,
        isPaid: formData.isPaid,
        amount: formData.isPaid && formData.amount !== '' ? Number(formData.amount) : undefined,
      })

      if (result.success) {
        // Reset form and close modal
        setFormData({
          title: '',
          dates: [],
          description: '',
          time: '9:00 AM - 5:00 PM', // Reset to default time
          location: '',
          venue: '',
          fullDescription: '',
          eligibility: '',
          agenda: '',
          image: '',
          tags: [],
          isPaid: false,
          amount: '',
        })
        setTagInput('')
        setImagePreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setIsOpen(false)
        router.refresh()
      } else {
        setError(result.error || 'Failed to create event')
      }
    } catch (err) {
      console.error('Error creating event:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
      >
        <Plus className="w-5 h-5" />
        Create Event
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-500 to-blue-600 px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Create New Event</h3>
              <p className="text-xs sm:text-sm text-indigo-100">Fill in the details below to create an event</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsOpen(false)
              setImagePreview(null)
              setError('')
              setTagInput('')
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            disabled={loading || uploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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

            {/* Event Name */}
            <div className="space-y-2">
              <label htmlFor="title" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Enter event name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Date(s) <span className="text-red-500">*</span>
                </label>
                <MultiDatePicker
                  value={formData.dates}
                  onChange={(dates) => setFormData({ ...formData, dates })}
                  disabled={loading || uploading}
                  required
                />
                <p className="text-xs text-gray-500">Select one or multiple dates for the event</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Time
                </label>
                <TimePicker
                  value={formData.time}
                  onChange={(value) => setFormData({ ...formData, time: value })}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 text-indigo-600" />
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Brief description of the event"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-none"
                disabled={loading}
              />
            </div>

            {/* Full Description */}
            <div className="space-y-2">
              <label htmlFor="fullDescription" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 text-indigo-600" />
                Full Description
              </label>
              <textarea
                id="fullDescription"
                rows={4}
                value={formData.fullDescription}
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                placeholder="Detailed description of the event"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-none"
                disabled={loading}
              />
            </div>

            {/* Location and Venue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="location" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Event location"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="venue" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Venue
                </label>
                <input
                  id="venue"
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Specific venue name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Eligibility */}
            <div className="space-y-2">
              <label htmlFor="eligibility" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Users className="w-4 h-4 text-indigo-600" />
                Eligibility
              </label>
              <input
                id="eligibility"
                type="text"
                value={formData.eligibility}
                onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                placeholder="e.g., Ages 10-18, Students in grades 3-12"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
            </div>

            {/* Paid event */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Banknote className="w-4 h-4 text-indigo-600" />
                Paid event
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isPaid: e.target.checked,
                      amount: e.target.checked ? formData.amount : '',
                    })
                  }
                  disabled={loading}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">This is a paid event</span>
              </label>
              {formData.isPaid && (
                <div className="mt-2">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-600 mb-1">
                    Amount (BDT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="amount"
                    type="number"
                    min={1}
                    value={formData.amount === '' ? '' : formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    placeholder="e.g. 500"
                    disabled={loading}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Agenda */}
            <div className="space-y-2">
              <label htmlFor="agenda" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock className="w-4 h-4 text-indigo-600" />
                Agenda
              </label>
              <textarea
                id="agenda"
                rows={4}
                value={formData.agenda}
                onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                placeholder="Event schedule and timeline (one per line)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-none font-mono text-sm"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Tip: Use line breaks to separate agenda items</p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label htmlFor="tags" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Tag className="w-4 h-4 text-indigo-600" />
                Tags
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 p-3 min-h-12 border-2 border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all bg-white">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        disabled={loading || uploading}
                        className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                        e.preventDefault()
                        handleAddTag(tagInput)
                      }
                    }}
                    placeholder={formData.tags.length === 0 ? "Type a tag and press Enter..." : "Add another tag..."}
                    className="flex-1 min-w-[150px] outline-none text-sm bg-transparent"
                    disabled={loading || uploading}
                  />
                </div>
                <p className="text-xs text-gray-500">Press Enter or comma to add a tag. Tags help categorize your event.</p>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Event Image
              </label>
              
              {formData.image ? (
                <div className="space-y-2">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                    <Image
                      src={formData.image}
                      alt="Event preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={loading || uploading}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-green-600">✓ Image uploaded successfully</p>
                </div>
              ) : imagePreview ? (
                <div className="space-y-2">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-white">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm font-medium">Uploading...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={loading}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={loading || uploading}
                  />
                  <label
                    htmlFor="image"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      loading || uploading
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP, or GIF (MAX. 5MB)</p>
                    </div>
                  </label>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  Upload an image from your device. It will be automatically optimized and converted to AVIF format.
                </p>
                <p className="text-xs text-indigo-600 font-medium">
                  Recommended size: 1200 × 800 pixels (3:2 aspect ratio) for best display quality
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setError('')
                  setImagePreview(null)
                  setTagInput('')
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                disabled={loading || uploading}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Create Event
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
