import { z } from 'zod'
import type { EventCustomFormField, EventDefaultRegistrationFields } from '@/types/event'
import { SCHOOL_NOT_FOUND_OPTION } from '@/lib/schoolDirectory'

/**
 * Booking form values (includes UI fields for school before normalization).
 */
export const eventBookingFormValuesSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
  phone: z.string().trim(),
  schoolSelection: z.string(),
  customSchool: z.string(),
  category: z.string(),
  information: z.string(),
  customAnswers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
})

export type EventBookingFormValues = z.infer<typeof eventBookingFormValuesSchema>

export function refineEventBookingForm(
  data: EventBookingFormValues,
  ctx: z.RefinementCtx,
  registration: EventDefaultRegistrationFields,
  customFormFields: EventCustomFormField[],
) {
  const normalizedSchool =
    data.schoolSelection === SCHOOL_NOT_FOUND_OPTION ? data.customSchool.trim() : data.schoolSelection.trim()
  if (registration.school.enabled && registration.school.required && !normalizedSchool) {
    ctx.addIssue({ code: 'custom', message: 'School is required', path: ['schoolSelection'] })
  }

  const phoneDigits = data.phone.replace(/\s/g, '')
  if (!phoneDigits) {
    ctx.addIssue({ code: 'custom', message: 'Phone number is required', path: ['phone'] })
  } else if (phoneDigits.length !== 11 || !phoneDigits.startsWith('01')) {
    ctx.addIssue({
      code: 'custom',
      message: 'Phone number must be 11 digits and start with 01',
      path: ['phone'],
    })
  }

  if (registration.category.enabled && registration.category.required && !data.category.trim()) {
    ctx.addIssue({ code: 'custom', message: 'Please select a category', path: ['category'] })
  }

  if (
    registration.information.enabled &&
    registration.information.required &&
    !data.information.trim()
  ) {
    ctx.addIssue({ code: 'custom', message: 'Other information is required', path: ['information'] })
  }

  const answers = data.customAnswers ?? {}
  for (const field of customFormFields) {
    if (!field.required) continue
    const v = answers[field.id]
    const missing =
      v == null ||
      (typeof v === 'string' && v.trim() === '') ||
      (Array.isArray(v) && v.length === 0)
    if (missing) {
      ctx.addIssue({
        code: 'custom',
        message: `${field.label} is required`,
        path: ['customAnswers', field.id],
      })
    }
  }
}

export function buildEventBookingResolverSchema(
  registration: EventDefaultRegistrationFields,
  customFormFields: EventCustomFormField[],
) {
  return eventBookingFormValuesSchema.superRefine((data, ctx) =>
    refineEventBookingForm(data, ctx, registration, customFormFields),
  )
}
