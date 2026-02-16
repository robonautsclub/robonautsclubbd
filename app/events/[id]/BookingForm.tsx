'use client'

import { useState, FormEvent } from 'react'
import { CheckCircle, Banknote } from 'lucide-react'
import { Event } from '@/types/event'

export default function BookingForm({ event }: { event: Event }) {
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    email: '',
    phone: '',
    bkashNumber: '',
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
    // Phone number is required, 11 digits starting with 01
    const phoneDigits = formData.phone.trim().replace(/\s/g, '')
    if (!phoneDigits) {
      newErrors.phone = 'Phone number is required'
    } else if (phoneDigits.length !== 11 || !phoneDigits.startsWith('01')) {
      newErrors.phone = 'Phone number must be 11 digits and start with 01'
    }
    // bKash number required for paid events
    if (event.isPaid) {
      const bkashDigits = formData.bkashNumber.trim().replace(/\s/g, '')
      if (!bkashDigits) {
        newErrors.bkashNumber = 'bKash number is required for paid events'
      } else if (bkashDigits.length !== 11 || !bkashDigits.startsWith('01')) {
        newErrors.bkashNumber = 'bKash number must be 11 digits and start with 01'
      }
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
        phone: formData.phone.trim(),
        bkashNumber: formData.bkashNumber.trim(),
        information: formData.information.trim(),
      })

      if (result.success) {
        // Only show success message if booking was created AND email was sent
        setIsSubmitted(true)
        setFormData({ name: '', school: '', email: '', phone: '', bkashNumber: '', information: '' })
        setTimeout(() => {
          setIsSubmitted(false)
        }, 5000)
      } else {
        // Show specific error message - this includes email sending failures
        const errorMessage = result.error || 'Failed to submit booking. Please try again.'
        setErrors({ submit: errorMessage })

        // If it's a duplicate booking error, highlight it
        if (errorMessage.includes('already registered')) {
          // Optionally clear the form or keep it for user to see
        }
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
      <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-green-200 shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
            Booking Successful!
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-2">
            Your booking for <strong className="text-indigo-600">{event.title}</strong> has been
            confirmed!
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            A confirmation email with event details has been sent to your email address. Please check your inbox (and spam folder).
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-7 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Registration Form</h3>
        <p className="text-xs sm:text-sm text-gray-500">{event.title}</p>
      </div>
      {event.isPaid && event.amount != null && event.amount > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Registration Fee</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-700">
            BDT {event.amount}
          </p>
        </div>
      )}
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
            School (If you are private candidate, write private candidate)<span className="text-red-500">*</span>
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
            Email Address (We will use this to send you the confirmation email) <span className="text-red-500">*</span>
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
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="01XXXXXXXXX (11 digits starting with 01)"
            disabled={isLoading || isSubmitted}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          />
          {errors.phone && (
            <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>
        {event.isPaid && (
          <div>
            <label
              htmlFor="bkashNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              bKash Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="bkashNumber"
              value={formData.bkashNumber}
              onChange={(e) =>
                setFormData({ ...formData, bkashNumber: e.target.value })
              }
              placeholder="01XXXXXXXXX (11 digits for bKash payment)"
              disabled={isLoading || isSubmitted}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.bkashNumber ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            />
            {errors.bkashNumber && (
              <p className="text-sm text-red-500 mt-1">{errors.bkashNumber}</p>
            )}
            <p className="text-xs text-gray-600 mt-2">
              Payment confirmation will be notified by one of the admin.
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="information"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Other Information
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
            placeholder="Any additional information you'd like to share (optional)..."
          />
          {errors.information && (
            <p className="text-sm text-red-500 mt-1">{errors.information}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || isSubmitted}
          className="w-full py-3 sm:py-3.5 px-4 sm:px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
        >
          {isLoading ? 'Submitting...' : isSubmitted ? 'Submitted' : 'Submit'}
        </button>
      </form>
    </div>
  )
}
