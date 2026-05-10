'use client'

import { useState, FormEvent } from 'react'
import { CheckCircle, Banknote } from 'lucide-react'
import { Event } from '@/types/event'
import { getEventRegistrationFields } from '@/lib/registrationFields'
import { PRIVATE_CANDIDATE_OPTION, SCHOOL_NOT_FOUND_OPTION } from '@/lib/schoolDirectory'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function BookingForm({ event, schools }: { event: Event; schools: string[] }) {
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    email: '',
    phone: '',
    category: '',
    information: '',
    customAnswers: {} as Record<string, string | string[]>,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submissionWarning, setSubmissionWarning] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [schoolSelection, setSchoolSelection] = useState('')
  const [customSchool, setCustomSchool] = useState('')
  const defaultRegistrationFields = getEventRegistrationFields(event)
  const normalizedSchool = schoolSelection === SCHOOL_NOT_FOUND_OPTION ? customSchool.trim() : schoolSelection.trim()

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (defaultRegistrationFields.school.enabled && defaultRegistrationFields.school.required && !normalizedSchool) {
      newErrors.school = 'School is required'
    }
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
    if (defaultRegistrationFields.category.enabled && defaultRegistrationFields.category.required && !formData.category.trim()) {
      newErrors.category = 'Please select a category'
    }
    if (
      defaultRegistrationFields.information.enabled &&
      defaultRegistrationFields.information.required &&
      !formData.information.trim()
    ) {
      newErrors.information = 'Other information is required'
    }
    const customFormFields = Array.isArray(event.customFormFields) ? event.customFormFields : []
    for (const field of customFormFields) {
      const value = formData.customAnswers[field.id]
      const missing =
        value == null ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)
      if (field.required && missing) {
        newErrors[`custom_${field.id}`] = `${field.label} is required`
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
      const { createBooking, initiatePaidEventCheckout } = await import('../actions')

      // Event ID is now always a string from Firestore
      const eventId = event.id

      const payload = {
        eventId,
        name: formData.name.trim(),
        school: normalizedSchool,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        category: formData.category.trim(),
        information: formData.information.trim(),
        customAnswers: formData.customAnswers,
      }

      if (event.isPaid) {
        const result = await initiatePaidEventCheckout(payload)
        if (result.success && result.checkoutUrl) {
          window.location.assign(result.checkoutUrl)
          return
        }
        const errorMessage = result.error || 'Failed to submit registration. Please try again.'
        setErrors({ submit: errorMessage })
        return
      }

      const result = await createBooking(payload)
      if (result.success) {
        setIsSubmitted(true)
        setSubmissionWarning(result.warning ?? null)
        setFormData({ name: '', school: '', email: '', phone: '', category: '', information: '', customAnswers: {} })
        setSchoolSelection('')
        setCustomSchool('')
        // Keep the success view longer when there's a warning so the user has time to read it.
        setTimeout(() => {
          setIsSubmitted(false)
          setSubmissionWarning(null)
        }, result.warning ? 15000 : 5000)
      } else {
        const errorMessage = result.error || 'Failed to submit registration. Please try again.'
        setErrors({ submit: errorMessage })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ submit: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="border-2 border-green-200 shadow-lg">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
            Registration Successful!
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-2">
            Your registration for <strong className="text-indigo-600">{event.title}</strong> has been
            confirmed!
          </p>
          {submissionWarning ? (
            <Alert className="mt-4 border-amber-200 bg-amber-50 text-left">
              <AlertTitle className="text-amber-900">
                Heads up — confirmation email not delivered
              </AlertTitle>
              <AlertDescription className="text-amber-800">
                {submissionWarning}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-gray-500">
                A confirmation email with event details has been sent to your email address. Please check your inbox (and spam folder).
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                If you don&apos;t see it in a few minutes, check your spam or junk folder.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const selectedCategory = event.categories?.find(
    (category) => category.name.toLowerCase() === formData.category.trim().toLowerCase()
  )
  const hasCategories = Boolean(event.categories && event.categories.length > 0)
  const showCategory = hasCategories && defaultRegistrationFields.category.enabled
  const hasSelectedCategory = !showCategory || Boolean(formData.category.trim())
  const customFormFields = Array.isArray(event.customFormFields) ? event.customFormFields : []
  const payableAmount =
    event.isPaid && selectedCategory?.amount != null && selectedCategory.amount > 0
      ? selectedCategory.amount
      : hasCategories
      ? null
      : event.amount

  return (
    <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-5 sm:p-7 pb-0">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Registration Form</h3>
        <p className="text-xs sm:text-sm text-gray-500">{event.title}</p>
      </CardHeader>
      <CardContent className="p-5 sm:p-7 pt-4 sm:pt-6">
      {event.isPaid && (
        <Alert className="mb-5 border-2 border-amber-300 bg-amber-50 shadow-sm">
          <Banknote className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800 uppercase tracking-wide">Registration Fee</AlertTitle>
          <AlertDescription>
            <p className="text-2xl sm:text-3xl font-bold text-amber-700">
              {payableAmount != null ? `BDT ${payableAmount}` : 'Select a category to see the fee'}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              You will be redirected to bKash secure checkout after submitting this form.
            </p>
          </AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.submit && (
          <Alert variant="destructive">
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
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
        {showCategory && (
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category {defaultRegistrationFields.category.required && <span className="text-red-500">*</span>}
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={isLoading || isSubmitted}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.category ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <option value="">Select category</option>
              {event.categories?.map((category) => (
                <option key={category.name} value={category.name}>
                  {event.isPaid && category.amount != null ? `${category.name} - BDT ${category.amount}` : category.name}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
          </div>
        )}
        {defaultRegistrationFields.school.enabled && (
          <div>
            <label
              htmlFor="school"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              School (If you are private candidate, write private candidate)
              {defaultRegistrationFields.school.required && <span className="text-red-500">*</span>}
            </label>
            <select
              id="school"
              value={schoolSelection}
              onChange={(e) => setSchoolSelection(e.target.value)}
              disabled={isLoading || isSubmitted}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.school ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <option value="">Select school</option>
              <option value={PRIVATE_CANDIDATE_OPTION}>{PRIVATE_CANDIDATE_OPTION}</option>
              {schools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
              <option value={SCHOOL_NOT_FOUND_OPTION}>School not found (type manually)</option>
            </select>
            {schoolSelection === SCHOOL_NOT_FOUND_OPTION && (
              <input
                type="text"
                value={customSchool}
                onChange={(e) => setCustomSchool(e.target.value)}
                placeholder="Type your school name"
                disabled={isLoading || isSubmitted}
                className={`mt-2 w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.school ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              />
            )}
            {errors.school && (
              <p className="text-sm text-red-500 mt-1">{errors.school}</p>
            )}
          </div>
        )}
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
        {defaultRegistrationFields.information.enabled && (
          <div>
            <label
              htmlFor="information"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Other Information
              {defaultRegistrationFields.information.required && <span className="text-red-500">*</span>}
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
        )}
        {customFormFields.length > 0 && (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <p className="text-sm font-semibold text-gray-800">Additional Information</p>
            {customFormFields.map((field) => {
              const errorKey = `custom_${field.id}`
              const error = errors[errorKey]
              const value = formData.customAnswers[field.id]

              return (
                <div key={field.id}>
                  <label htmlFor={`custom-${field.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'longText' ? (
                    <textarea
                      id={`custom-${field.id}`}
                      rows={3}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customAnswers: { ...formData.customAnswers, [field.id]: e.target.value },
                        })
                      }
                      placeholder={field.placeholder || 'Enter your answer'}
                      disabled={isLoading || isSubmitted}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed ${
                        error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={`custom-${field.id}`}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customAnswers: { ...formData.customAnswers, [field.id]: e.target.value },
                        })
                      }
                      disabled={isLoading || isSubmitted}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <option value="">Select an option</option>
                      {(field.options ?? []).map((option) => (
                        <option key={`${field.id}-${option}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'radio' ? (
                    <div className="space-y-2">
                      {(field.options ?? []).map((option) => (
                        <label key={`${field.id}-${option}`} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name={`custom-${field.id}`}
                            value={option}
                            checked={value === option}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                customAnswers: { ...formData.customAnswers, [field.id]: e.target.value },
                              })
                            }
                            disabled={isLoading || isSubmitted}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div className="space-y-2">
                      {(field.options ?? []).map((option) => {
                        const selected = Array.isArray(value) ? value : []
                        const checked = selected.includes(option)
                        return (
                          <label key={`${field.id}-${option}`} className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = Array.isArray(value) ? [...value] : []
                                const normalized = option.trim()
                                const exists = next.includes(normalized)
                                if (e.target.checked && !exists) next.push(normalized)
                                if (!e.target.checked && exists) {
                                  const index = next.indexOf(normalized)
                                  next.splice(index, 1)
                                }
                                setFormData({
                                  ...formData,
                                  customAnswers: { ...formData.customAnswers, [field.id]: next },
                                })
                              }}
                              disabled={isLoading || isSubmitted}
                            />
                            {option}
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <input
                      id={`custom-${field.id}`}
                      type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'phone' ? 'tel' : 'text'}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customAnswers: { ...formData.customAnswers, [field.id]: e.target.value },
                        })
                      }
                      placeholder={field.placeholder || 'Enter your answer'}
                      disabled={isLoading || isSubmitted}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  )}
                  {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
                </div>
              )
            })}
          </div>
        )}
        <Button
          type="submit"
          disabled={isLoading || isSubmitted || (event.isPaid && !hasSelectedCategory)}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg py-6 text-sm sm:text-base"
        >
          {isLoading ? 'Submitting...' : isSubmitted ? 'Submitted' : event.isPaid ? 'Proceed to bKash' : 'Submit'}
        </Button>
      </form>
      </CardContent>
    </Card>
  )
}
