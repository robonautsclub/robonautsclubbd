import { z } from 'zod'
import { CUSTOM_FORM_FIELD_TYPES } from '@/types/event'

const customFieldTypeSchema = z.enum(CUSTOM_FORM_FIELD_TYPES)

const eventCustomFormFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: customFieldTypeSchema,
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
})

const registrationToggleSchema = z.object({
  enabled: z.boolean(),
  required: z.boolean(),
})

const defaultRegistrationFieldsSchema = z.object({
  name: registrationToggleSchema,
  email: registrationToggleSchema,
  phone: registrationToggleSchema,
  school: registrationToggleSchema,
  category: registrationToggleSchema,
  information: registrationToggleSchema,
})

const categoryDraftSchema = z.object({
  name: z.string(),
  amount: z.union([z.string(), z.number()]),
})

/** Dashboard create / edit event sheet — matches client submit validation. */
export const dashboardEventFormSchema = z
  .object({
    title: z.string(),
    dates: z.array(z.string()),
    description: z.string(),
    time: z.string(),
    location: z.string(),
    venue: z.string(),
    fullDescription: z.string(),
    eligibility: z.string(),
    agenda: z.string(),
    image: z.string(),
    tags: z.array(z.string()),
    isPaid: z.boolean(),
    amount: z.union([z.string(), z.number()]),
    paymentBkashNumber: z.string(),
    categories: z.array(categoryDraftSchema),
    registrationClosingDate: z.string(),
    registrationDisabled: z.boolean().optional(),
    contactPersonName: z.string(),
    contactPersonDesignation: z.string(),
    contactPersonMobileOrEmail: z.string(),
    customFormFields: z.array(eventCustomFormFieldSchema),
    defaultRegistrationFields: defaultRegistrationFieldsSchema,
  })
  .superRefine((formData, ctx) => {
    if (!formData.title.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please fill in all required fields (Name, Date(s), Description)',
        path: ['title'],
      })
    }
    if (formData.dates.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please fill in all required fields (Name, Date(s), Description)',
        path: ['dates'],
      })
    }
    if (!formData.description.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please fill in all required fields (Name, Date(s), Description)',
        path: ['description'],
      })
    }

    const validCategories = formData.categories
      .map((category) => ({
        name: category.name.trim(),
        amount:
          category.amount === '' || category.amount == null || Number.isNaN(Number(category.amount))
            ? undefined
            : Number(category.amount),
      }))
      .filter((category) => category.name.length > 0)
    const hasNamedCategories = validCategories.length > 0

    if (hasNamedCategories && formData.isPaid) {
      const invalidCategoryAmount = validCategories.some(
        (category) => !category.amount || category.amount <= 0,
      )
      if (invalidCategoryAmount) {
        ctx.addIssue({
          code: 'custom',
          message: 'Please provide a valid amount for every category (greater than 0).',
          path: ['categories'],
        })
      }
    } else if (formData.isPaid) {
      const amt = typeof formData.amount === 'number' ? formData.amount : Number(formData.amount)
      if (amt === undefined || amt === null || Number.isNaN(amt) || amt <= 0) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Please enter a valid base amount (or add categories and set amount for each).',
          path: ['amount'],
        })
      }
    }
  })

export type DashboardEventFormValues = z.infer<typeof dashboardEventFormSchema>
