'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import type { Event } from '@/types/event'
import { getEventRegistrationFields } from '@/lib/registrationFields'
import { PRIVATE_CANDIDATE_OPTION, SCHOOL_NOT_FOUND_OPTION } from '@/lib/schoolDirectory'
import {
  buildEventBookingResolverSchema,
  type EventBookingFormValues,
} from '@/lib/validation/eventBooking'
import { resolveEventSuggestedFee } from '@/lib/event-fee'
import { createBookingManual } from '../bookings-actions'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

type Props = {
  event: Event
  schools: string[]
  canViewPayments?: boolean
  canSendMail?: boolean
  onCreated?: () => void
}

export default function CreateEventRegistrationForm({
  event,
  schools,
  canViewPayments = false,
  canSendMail = false,
  onCreated,
}: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [paymentMode, setPaymentMode] = useState<'paid_offline' | 'waived'>(
    canViewPayments ? 'paid_offline' : 'waived'
  )
  const [amountPaid, setAmountPaid] = useState('0')
  const [trxId, setTrxId] = useState('')
  const [sendEmail, setSendEmail] = useState(canSendMail)

  const defaultRegistrationFields = useMemo(
    () => getEventRegistrationFields(event),
    [event]
  )
  const customFormFields = Array.isArray(event.customFormFields) ? event.customFormFields : []
  const hasCategories = Boolean(event.categories && event.categories.length > 0)
  const showCategory = hasCategories && defaultRegistrationFields.category.enabled

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
  const suggestedFee = useMemo(
    () => resolveEventSuggestedFee(event, categoryValue),
    [event, categoryValue]
  )

  useEffect(() => {
    if (paymentMode === 'paid_offline') {
      setAmountPaid(String(suggestedFee))
    }
  }, [suggestedFee, paymentMode])

  const resetForm = () => {
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
    setPaymentMode(canViewPayments ? 'paid_offline' : 'waived')
    setAmountPaid(String(resolveEventSuggestedFee(event, '')))
    setTrxId('')
    setSendEmail(canSendMail)
    setError('')
    setMessage('')
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetForm()
    } else {
      setPaymentMode(canViewPayments ? 'paid_offline' : 'waived')
      setAmountPaid(String(resolveEventSuggestedFee(event, '')))
      setSendEmail(canSendMail)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      const school =
        values.schoolSelection === SCHOOL_NOT_FOUND_OPTION
          ? values.customSchool.trim()
          : values.schoolSelection.trim()

      const amount = Number(amountPaid)
      if (
        event.isPaid &&
        canViewPayments &&
        paymentMode === 'paid_offline' &&
        !(Number.isFinite(amount) && amount > 0)
      ) {
        setError('Paid offline amount must be greater than 0. Use Waived if no fee applies.')
        setIsSubmitting(false)
        return
      }

      const result = await createBookingManual({
        eventId: event.id,
        name: values.name,
        email: values.email,
        phone: values.phone,
        school,
        category: values.category,
        information: values.information,
        customAnswers: values.customAnswers,
        paymentMode: event.isPaid
          ? canViewPayments
            ? paymentMode
            : 'waived'
          : undefined,
        amountPaid:
          event.isPaid &&
          paymentMode === 'paid_offline' &&
          canViewPayments &&
          Number.isFinite(amount) &&
          amount > 0
            ? amount
            : undefined,
        trxId: event.isPaid && paymentMode === 'paid_offline' ? trxId || undefined : undefined,
        sendEmail: canSendMail && sendEmail,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create registration.')
        return
      }

      setMessage(
        result.warning ||
          `Registration created${
            result.registrationId ? ` (${result.registrationId})` : ''
          }.`
      )
      onCreated?.()
      router.refresh()
      setTimeout(() => handleOpenChange(false), 800)
    } catch {
      setError('Failed to create registration. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button type="button" size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add registration
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col gap-0 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 bg-cyan-700 px-4 py-4 text-white">
          <div>
            <SheetTitle className="text-lg font-bold text-white">
              Add event registration
            </SheetTitle>
            <SheetDescription className="text-xs text-cyan-100 mt-1">
              Create a registration as admin (no bKash checkout).
            </SheetDescription>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => handleOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {(error || message) && (
              <Alert variant={error ? 'destructive' : 'default'}>
                <AlertTitle>{error ? 'Could not create' : 'Created'}</AlertTitle>
                <AlertDescription>{error || message}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCategory && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category{' '}
                      {defaultRegistrationFields.category.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <select
                        className={selectClassName}
                        disabled={isSubmitting}
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        School{' '}
                        {defaultRegistrationFields.school.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <select
                          className={selectClassName}
                          disabled={isSubmitting}
                          {...field}
                        >
                          <option value="">Select school</option>
                          <option value={PRIVATE_CANDIDATE_OPTION}>
                            {PRIVATE_CANDIDATE_OPTION}
                          </option>
                          {schools.map((school) => (
                            <option key={school} value={school}>
                              {school}
                            </option>
                          ))}
                          <option value={SCHOOL_NOT_FOUND_OPTION}>
                            School not found (type manually)
                          </option>
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
                            placeholder="Type school name"
                            disabled={isSubmitting}
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="email" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Phone <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      disabled={isSubmitting}
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Other information{' '}
                      {defaultRegistrationFields.information.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {customFormFields.length > 0 && (
              <div className="space-y-3 border-t border-gray-100 pt-3">
                <p className="text-sm font-medium text-gray-800">Additional fields</p>
                {customFormFields.map((fieldDef) => (
                  <FormField
                    key={fieldDef.id}
                    control={form.control}
                    name={`customAnswers.${fieldDef.id}`}
                    render={({ field: f }) => {
                      const strVal = typeof f.value === 'string' ? f.value : ''
                      const arrVal = Array.isArray(f.value) ? f.value : []

                      return (
                        <FormItem>
                          <FormLabel>
                            {fieldDef.label}{' '}
                            {fieldDef.required && <span className="text-red-500">*</span>}
                          </FormLabel>
                          <FormControl>
                            {fieldDef.type === 'longText' ? (
                              <Textarea
                                rows={3}
                                disabled={isSubmitting}
                                placeholder={fieldDef.placeholder}
                                value={strVal}
                                onChange={(e) => f.onChange(e.target.value)}
                                onBlur={f.onBlur}
                                name={f.name}
                                ref={f.ref}
                              />
                            ) : fieldDef.type === 'select' ? (
                              <select
                                className={selectClassName}
                                disabled={isSubmitting}
                                value={strVal}
                                onChange={(e) => f.onChange(e.target.value)}
                                onBlur={f.onBlur}
                                name={f.name}
                                ref={f.ref}
                              >
                                <option value="">Select an option</option>
                                {(fieldDef.options ?? []).map((option) => (
                                  <option key={`${fieldDef.id}-${option}`} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : fieldDef.type === 'radio' ? (
                              <div className="space-y-2">
                                {(fieldDef.options ?? []).map((option) => (
                                  <label
                                    key={`${fieldDef.id}-${option}`}
                                    className="flex items-center gap-2 text-sm text-gray-700"
                                  >
                                    <input
                                      type="radio"
                                      name={f.name}
                                      value={option}
                                      checked={f.value === option}
                                      onChange={() => f.onChange(option)}
                                      onBlur={f.onBlur}
                                      disabled={isSubmitting}
                                    />
                                    {option}
                                  </label>
                                ))}
                              </div>
                            ) : fieldDef.type === 'checkbox' ? (
                              <div className="space-y-2">
                                {(fieldDef.options ?? []).map((option) => {
                                  const normalized = option.trim()
                                  const checked = arrVal.includes(normalized)
                                  return (
                                    <label
                                      key={`${fieldDef.id}-${option}`}
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
                                        disabled={isSubmitting}
                                      />
                                      {option}
                                    </label>
                                  )
                                })}
                              </div>
                            ) : (
                              <Input
                                type={
                                  fieldDef.type === 'email'
                                    ? 'email'
                                    : fieldDef.type === 'number'
                                      ? 'number'
                                      : fieldDef.type === 'phone'
                                        ? 'tel'
                                        : 'text'
                                }
                                disabled={isSubmitting}
                                placeholder={fieldDef.placeholder}
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

            {event.isPaid ? (
              canViewPayments ? (
                <div className="rounded-lg border border-gray-100 p-3 space-y-3">
                  <p className="text-sm font-medium text-gray-800">Payment</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMode"
                        checked={paymentMode === 'paid_offline'}
                        onChange={() => {
                          setPaymentMode('paid_offline')
                          setAmountPaid(String(suggestedFee))
                        }}
                        disabled={isSubmitting}
                      />
                      Paid offline
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMode"
                        checked={paymentMode === 'waived'}
                        onChange={() => setPaymentMode('waived')}
                        disabled={isSubmitting}
                      />
                      Waived (n/a)
                    </label>
                  </div>
                  {paymentMode === 'paid_offline' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">
                          Amount (BDT) · suggested {suggestedFee}
                        </label>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">
                          Trx / reference (optional)
                        </label>
                        <Input
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground rounded-lg border border-gray-100 p-3">
                  New registrations are created as fee waived. You do not have
                  permission to set or view paid amounts.
                </p>
              )
            ) : null}

            {canSendMail ? (
              <label
                className={cn(
                  'flex items-start gap-3 rounded-lg border border-gray-100 px-3 py-3 cursor-pointer'
                )}
              >
                <Checkbox
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked === true)}
                  className="mt-0.5"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-700">
                  Send confirmation email to the registrant
                </span>
              </label>
            ) : (
              <p className="text-sm text-muted-foreground rounded-lg border border-gray-100 p-3">
                Confirmation email will not be sent. You do not have permission to
                send emails from the dashboard.
              </p>
            )}

            <div className="flex gap-2 pt-2 pb-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Creating…' : 'Create registration'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
