'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { CheckCircle, Banknote } from 'lucide-react'
import { Event } from '@/types/event'
import { getEventRegistrationFields } from '@/lib/registrationFields'
import { PRIVATE_CANDIDATE_OPTION, SCHOOL_NOT_FOUND_OPTION } from '@/lib/schoolDirectory'
import {
  buildEventBookingResolverSchema,
  type EventBookingFormValues,
} from '@/lib/validation/eventBooking'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

export default function BookingForm({ event, schools }: { event: Event; schools: string[] }) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submissionWarning, setSubmissionWarning] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState('')

  const defaultRegistrationFields = getEventRegistrationFields(event)
  const customFormFields = Array.isArray(event.customFormFields) ? event.customFormFields : []

  const bookingSchema = useMemo(() => {
    const registration = getEventRegistrationFields(event)
    const fields = Array.isArray(event.customFormFields) ? event.customFormFields : []
    return buildEventBookingResolverSchema(registration, fields)
  }, [event])

  const form = useForm<EventBookingFormValues>({
    resolver: standardSchemaResolver(bookingSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      schoolSelection: '',
      customSchool: '',
      category: '',
      information: '',
      customAnswers: {},
    },
  })

  const categoryValue = form.watch('category')
  const schoolSelection = form.watch('schoolSelection')

  const hasCategories = Boolean(event.categories && event.categories.length > 0)
  const showCategory = hasCategories && defaultRegistrationFields.category.enabled
  const hasSelectedCategory = !showCategory || Boolean(categoryValue.trim())
  const selectedCategory = event.categories?.find(
    (category) => category.name.toLowerCase() === categoryValue.trim().toLowerCase(),
  )
  const payableAmount =
    event.isPaid && selectedCategory?.amount != null && selectedCategory.amount > 0
      ? selectedCategory.amount
      : hasCategories
        ? null
        : event.amount

  const normalizedSchool = (values: EventBookingFormValues) =>
    values.schoolSelection === SCHOOL_NOT_FOUND_OPTION ? values.customSchool.trim() : values.schoolSelection.trim()

  const onSubmit = async (values: EventBookingFormValues) => {
    setSubmitError('')
    try {
      const { createBooking, initiatePaidEventCheckout } = await import('../actions')
      const eventId = event.id

      const payload = {
        eventId,
        name: values.name.trim(),
        school: normalizedSchool(values),
        email: values.email.trim(),
        phone: values.phone.trim(),
        category: values.category.trim(),
        information: values.information.trim(),
        customAnswers: values.customAnswers ?? {},
      }

      if (event.isPaid) {
        const result = await initiatePaidEventCheckout(payload)
        if (result.success && result.checkoutUrl) {
          window.location.assign(result.checkoutUrl)
          return
        }
        setSubmitError(result.error || 'Failed to submit registration. Please try again.')
        return
      }

      const result = await createBooking(payload)
      if (result.success) {
        setIsSubmitted(true)
        setSubmissionWarning(result.warning ?? null)
        form.reset({
          name: '',
          email: '',
          phone: '',
          schoolSelection: '',
          customSchool: '',
          category: '',
          information: '',
          customAnswers: {},
        })
        setTimeout(() => {
          setIsSubmitted(false)
          setSubmissionWarning(null)
        }, result.warning ? 15000 : 5000)
      } else {
        setSubmitError(result.error || 'Failed to submit registration. Please try again.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setSubmitError('An unexpected error occurred. Please try again.')
    }
  }

  const isLoading = form.formState.isSubmitting

  if (isSubmitted) {
    return (
      <Card className="border-2 border-green-200 shadow-lg">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Registration Successful!</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-2">
            Your registration for <strong className="text-indigo-600">{event.title}</strong> has been confirmed!
          </p>
          {submissionWarning ? (
            <Alert className="mt-4 border-amber-200 bg-amber-50 text-left">
              <AlertTitle className="text-amber-900">Heads up — confirmation email not delivered</AlertTitle>
              <AlertDescription className="text-amber-800">{submissionWarning}</AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-gray-500">
                A confirmation email with event details has been sent to your email address. Please check your inbox
                (and spam folder).
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

  const inputClass = (invalid: boolean) =>
    cn(
      'border-2 rounded-lg py-3 h-auto md:text-base',
      invalid ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300',
    )

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      disabled={isLoading}
                      className={inputClass(!!fieldState.error)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCategory && (
              <FormField
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor="category">
                      Category{' '}
                      {defaultRegistrationFields.category.required && <span className="text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <select
                        id="category"
                        disabled={isLoading}
                        className={cn(
                          'flex h-auto w-full rounded-lg border-2 bg-transparent px-4 py-3 text-base shadow-xs outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                          fieldState.error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300',
                        )}
                        {...field}
                      >
                        <option value="">Select category</option>
                        {event.categories?.map((category) => (
                          <option key={category.name} value={category.name}>
                            {event.isPaid && category.amount != null
                              ? `${category.name} - BDT ${category.amount}`
                              : category.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {defaultRegistrationFields.school.enabled && (
              <>
                <FormField
                  control={form.control}
                  name="schoolSelection"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel htmlFor="school">
                        School (If you are private candidate, write private candidate)
                        {defaultRegistrationFields.school.required && <span className="text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <select
                          id="school"
                          disabled={isLoading}
                          className={cn(
                            'flex h-auto w-full rounded-lg border-2 bg-transparent px-4 py-3 text-base shadow-xs outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                            fieldState.error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300',
                          )}
                          {...field}
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {schoolSelection === SCHOOL_NOT_FOUND_OPTION && (
                  <FormField
                    control={form.control}
                    name="customSchool"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Type your school name"
                            disabled={isLoading}
                            className={inputClass(false)}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel htmlFor="email">
                    Email Address (We will use this to send you the confirmation email){' '}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      disabled={isLoading}
                      className={inputClass(!!fieldState.error)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="01XXXXXXXXX (11 digits starting with 01)"
                      disabled={isLoading}
                      className={inputClass(!!fieldState.error)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {defaultRegistrationFields.information.enabled && (
              <FormField
                control={form.control}
                name="information"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel htmlFor="information">
                      Other Information
                      {defaultRegistrationFields.information.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        id="information"
                        rows={4}
                        disabled={isLoading}
                        placeholder="Any additional information you'd like to share (optional)..."
                        className={cn(
                          'min-h-[100px] resize-none border-2 rounded-lg py-3 md:text-base',
                          fieldState.error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {customFormFields.length > 0 && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-800">Additional Information</p>
                {customFormFields.map((field) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`customAnswers.${field.id}`}
                    render={({ field: f, fieldState }) => {
                      const strVal = typeof f.value === 'string' ? f.value : ''
                      const arrVal = Array.isArray(f.value) ? f.value : []

                      return (
                        <FormItem>
                          <FormLabel htmlFor={`custom-${field.id}`}>
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </FormLabel>
                          <FormControl>
                            {field.type === 'longText' ? (
                              <Textarea
                                id={`custom-${field.id}`}
                                rows={3}
                                disabled={isLoading}
                                placeholder={field.placeholder || 'Enter your answer'}
                                className={cn(
                                  'min-h-[80px] resize-none border-2 rounded-lg py-3 md:text-base',
                                  fieldState.error
                                    ? 'border-red-400 bg-red-50'
                                    : 'border-gray-200 hover:border-gray-300',
                                )}
                                value={strVal}
                                onChange={(e) => f.onChange(e.target.value)}
                                onBlur={f.onBlur}
                                name={f.name}
                                ref={f.ref}
                              />
                            ) : field.type === 'select' ? (
                              <select
                                id={`custom-${field.id}`}
                                disabled={isLoading}
                                className={cn(
                                  'flex h-auto w-full rounded-lg border-2 bg-transparent px-4 py-3 text-base shadow-xs outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                                  fieldState.error
                                    ? 'border-red-400 bg-red-50'
                                    : 'border-gray-200 hover:border-gray-300',
                                )}
                                value={strVal}
                                onChange={(e) => f.onChange(e.target.value)}
                                onBlur={f.onBlur}
                                name={f.name}
                                ref={f.ref}
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
                                  <label
                                    key={`${field.id}-${option}`}
                                    className="flex items-center gap-2 text-sm text-gray-700"
                                  >
                                    <input
                                      type="radio"
                                      name={f.name}
                                      value={option}
                                      checked={f.value === option}
                                      onChange={() => f.onChange(option)}
                                      onBlur={f.onBlur}
                                      disabled={isLoading}
                                    />
                                    {option}
                                  </label>
                                ))}
                              </div>
                            ) : field.type === 'checkbox' ? (
                              <div className="space-y-2">
                                {(field.options ?? []).map((option) => {
                                  const normalized = option.trim()
                                  const checked = arrVal.includes(normalized)
                                  return (
                                    <label
                                      key={`${field.id}-${option}`}
                                      className="flex items-center gap-2 text-sm text-gray-700"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                          const next = [...arrVal]
                                          if (e.target.checked && !next.includes(normalized)) {
                                            next.push(normalized)
                                          }
                                          if (!e.target.checked) {
                                            const i = next.indexOf(normalized)
                                            if (i !== -1) next.splice(i, 1)
                                          }
                                          f.onChange(next)
                                        }}
                                        disabled={isLoading}
                                      />
                                      {option}
                                    </label>
                                  )
                                })}
                              </div>
                            ) : (
                              <Input
                                id={`custom-${field.id}`}
                                type={
                                  field.type === 'email'
                                    ? 'email'
                                    : field.type === 'number'
                                      ? 'number'
                                      : field.type === 'phone'
                                        ? 'tel'
                                        : 'text'
                                }
                                disabled={isLoading}
                                placeholder={field.placeholder || 'Enter your answer'}
                                className={inputClass(!!fieldState.error)}
                                value={strVal}
                                onChange={(e) => f.onChange(e.target.value)}
                                onBlur={f.onBlur}
                                name={f.name}
                                ref={f.ref}
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || (event.isPaid && !hasSelectedCategory)}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg py-6 text-sm sm:text-base"
            >
              {isLoading ? 'Submitting...' : event.isPaid ? 'Proceed to bKash' : 'Submit'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
