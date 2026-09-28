import { z } from 'zod'

export const campusAmbassadorFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  school: z.string().trim().min(1, 'School is required'),
  phone: z.string().trim(),
  email: z
    .string()
    .trim()
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      'Enter a valid email',
    ),
  isActive: z.boolean(),
})

export type CampusAmbassadorFormValues = z.infer<
  typeof campusAmbassadorFormSchema
>
