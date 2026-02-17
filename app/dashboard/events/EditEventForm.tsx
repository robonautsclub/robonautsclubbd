'use client'

import { useState, FormEvent, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { updateEvent } from '../actions'
import { X, Calendar, Clock, MapPin, FileText, Users, Image as ImageIcon, Sparkles, Edit, Tag, Banknote, Upload, Trash2 } from 'lucide-react'
import MultiDatePicker from './MultiDatePicker'
import TimePicker from './TimePicker'
import type { Event } from '@/types/event'

interface EditEventFormProps {
  event: Event
  onClose: () => void
}

export default function EditEventForm({ event, onClose }: EditEventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Helper function to parse dates (handle both string and array, comma-separated)
  const parseDates = (date: string | string[] | undefined): string[] => {
    if (!date) return []
    if (Array.isArray(date)) return date
    // Handle comma-separated string
    if (typeof date === 'string' && date.includes(',')) {
      return date.split(',').map(d => d.trim()).filter(d => d.length > 0)
    }
    // Single date string
    return [date]
  }

  const [formData, setFormData] = useState({
    title: event.title || '',
    dates: parseDates(event.date),
    description: event.description || '',
    time: event.time || '9:00 AM - 5:00 PM',
    location: event.location || '',
    venue: event.venue || '',
    fullDescription: event.fullDescription || '',
    eligibility: event.eligibility || '',
    agenda: event.agenda || '',
    image: event.image || '',
    tags: event.tags || [],
    isPaid: event.isPaid ?? false,
    amount: event.amount ?? '' as '' | number,
    paymentBkashNumber: event.paymentBkashNumber ?? '',
  })
  const [tagInput, setTagInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please select an image file (JPEG, PNG, WebP, or GIF).')
      return
    }
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size exceeds 5MB. Please select a smaller image.')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
    await uploadImageFile(file)
  }

  const uploadImageFile = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('image', file)
      const response = await fetch('/api/upload-image', { method: 'POST', body: uploadFormData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to upload image')
      setFormData((prev) => ({ ...prev, image: data.secure_url }))
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error('Error uploading image:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setFormData((prev) => ({ ...prev, image: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
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
      const bkash = String(formData.paymentBkashNumber ?? '').trim()
      if (bkash.length !== 11 || !bkash.startsWith('01')) {
        setError('Please enter a valid 11-digit bKash number (starting with 01) for receiving payment')
        setLoading(false)
        return
      }
    }

    // Set default time if not provided
    const eventTime = formData.time || '9:00 AM - 5:00 PM'

    // Convert dates array to string (comma-separated) or single date
    const dateValue = formData.dates.length === 1 ? formData.dates[0] : formData.dates.join(',')

    try {
      const result = await updateEvent(event.id, {
        ...formData,
        date: dateValue,
        time: eventTime,
        isPaid: formData.isPaid,
        amount: formData.isPaid && formData.amount !== '' ? Number(formData.amount) : undefined,
        paymentBkashNumber: formData.isPaid ? (formData.paymentBkashNumber ?? '').trim() : '',
      })

      if (result.success) {
        onClose()
        router.refresh()
      } else {
        setError(result.error || 'Failed to update event')
      }
    } catch (err) {
      console.error('Error updating event:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-500 to-blue-600 px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Edit Event</h3>
              <p className="text-xs sm:text-sm text-indigo-100">Update the event details below</p>
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="edit-title" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-date" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Date(s) <span className="text-red-500">*</span>
              </label>
              <MultiDatePicker
                value={formData.dates}
                onChange={(dates) => setFormData({ ...formData, dates })}
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Select one or multiple dates</p>
            </div>

            <div>
              <label htmlFor="edit-time" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Time
              </label>
              <TimePicker
                value={formData.time}
                onChange={(time) => setFormData({ ...formData, time })}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-description" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="edit-description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none transition-all"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="edit-fullDescription" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Full Description
            </label>
            <textarea
              id="edit-fullDescription"
              rows={4}
              value={formData.fullDescription}
              onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none transition-all"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-location" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                Location
              </label>
              <input
                id="edit-location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="edit-venue" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                Venue
              </label>
              <input
                id="edit-venue"
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-eligibility" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Eligibility
            </label>
            <input
              id="edit-eligibility"
              type="text"
              value={formData.eligibility}
              onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
              placeholder="e.g., Ages 10-18"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
              disabled={loading}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Banknote className="w-4 h-4 text-indigo-500" />
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
              <div className="mt-2 space-y-2">
                <div>
                  <label htmlFor="edit-amount" className="block text-sm font-medium text-gray-600 mb-1">
                    Amount (BDT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-amount"
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
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="edit-payment-bkash" className="block text-sm font-medium text-gray-600 mb-1">
                    bKash number to receive payment <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-payment-bkash"
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={formData.paymentBkashNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 11)
                      setFormData({ ...formData, paymentBkashNumber: v })
                    }}
                    placeholder="e.g. 01712345678"
                    disabled={loading}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Participants will pay the fee to this number via bKash.</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="edit-agenda" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Agenda
            </label>
            <textarea
              id="edit-agenda"
              rows={4}
              value={formData.agenda}
              onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
              placeholder="Event schedule and timeline"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none transition-all"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Enter each agenda item on a new line</p>
          </div>

          <div>
            <label htmlFor="edit-tags" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Tag className="w-4 h-4 text-indigo-500" />
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
                      onClick={() => {
                        const newTags = formData.tags.filter((_, i) => i !== index)
                        setFormData({ ...formData, tags: newTags })
                      }}
                      disabled={loading}
                      className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  id="edit-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault()
                      const trimmedTag = tagInput.trim().replace(/,$/, '')
                      if (trimmedTag && !formData.tags.includes(trimmedTag)) {
                        setFormData({ ...formData, tags: [...formData.tags, trimmedTag] })
                        setTagInput('')
                      }
                    }
                  }}
                  placeholder={formData.tags.length === 0 ? "Type a tag and press Enter..." : "Add another tag..."}
                  className="flex-1 min-w-[150px] outline-none text-sm bg-transparent"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500">Press Enter or comma to add a tag. Tags help categorize your event.</p>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
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
                    aria-label="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    id="edit-image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={loading || uploading}
                  />
                  <label
                    htmlFor="edit-image-upload"
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 rounded-xl font-medium transition-all ${
                      loading || uploading
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed text-gray-400'
                        : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload different photo
                  </label>
                </div>
                <p className="text-xs text-green-600">Current image will be replaced on save</p>
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
                  id="edit-image"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={loading || uploading}
                />
                <label
                  htmlFor="edit-image"
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
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200 sticky bottom-0 bg-white">
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
              disabled={loading || uploading}
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Update Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

