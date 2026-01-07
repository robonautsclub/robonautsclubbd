'use client'

import { useState, FormEvent } from 'react'
import { CheckCircle } from 'lucide-react'
import { Event } from '@/types/event'

export default function BookingForm({ event }: { event: Event }) {
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    email: '',
    information: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.school.trim()) newErrors.school = 'School is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.information.trim()) {
      newErrors.information = 'Basic information is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setErrors({})

    try {
      // Import the server action dynamically
      const { createBooking } = await import('../actions')
      
      // Event ID is now always a string from Firestore
      const eventId = event.id
      
      const result = await createBooking({
        eventId,
        name: formData.name.trim(),
        school: formData.school.trim(),
        email: formData.email.trim(),
        information: formData.information.trim(),
      })

      if (result.success) {
        setIsSubmitted(true)
        setFormData({ name: '', school: '', email: '', information: '' })
        setTimeout(() => {
          setIsSubmitted(false)
        }, 5000)
      } else {
        setErrors({ submit: result.error || 'Failed to submit booking. Please try again.' })
      }
    } catch (error) {
      console.error('Booking error:', error)
      setErrors({ submit: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl p-8 border-2 border-green-200 shadow-lg">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Booking Successful!
          </h3>
          <p className="text-gray-600 mb-2">
            Your booking request for <strong className="text-indigo-600">{event.title}</strong> has been
            submitted.
          </p>
          <p className="text-sm text-gray-500">
            We&apos;ll contact you soon with confirmation details.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-7 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Book Your Spot</h3>
        <p className="text-sm text-gray-500">{event.title}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.submit && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errors.submit}
          </div>
        )}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            disabled={isLoading || isSubmitted}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="school"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            School <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="school"
            value={formData.school}
            onChange={(e) =>
              setFormData({ ...formData, school: e.target.value })
            }
            disabled={isLoading || isSubmitted}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.school ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          />
          {errors.school && (
            <p className="text-sm text-red-500 mt-1">{errors.school}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Enter your email"
            disabled={isLoading || isSubmitted}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="information"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Basic Information <span className="text-red-500">*</span>
          </label>
          <textarea
            id="information"
            rows={4}
            value={formData.information}
            onChange={(e) =>
              setFormData({ ...formData, information: e.target.value })
            }
            disabled={isLoading || isSubmitted}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.information ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            placeholder="Tell us about your interest in this event..."
          />
          {errors.information && (
            <p className="text-sm text-red-500 mt-1">{errors.information}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || isSubmitted}
          className="w-full py-3.5 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? 'Submitting...' : isSubmitted ? 'Submitted' : 'Submit'}
        </button>
      </form>
    </div>
  )
}

