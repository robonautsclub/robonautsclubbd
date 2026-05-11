import { z } from 'zod'

/** Shared shape for create / edit course dialogs */
export const courseFormSchema = z.object({
  title: z.string().trim().min(1, 'Course title is required'),
  level: z.string().trim().min(1, 'Level is required'),
  blurb: z.string().trim().min(1, 'Blurb is required'),
  href: z.string(),
  image: z.string().trim().min(1, 'Course image is required'),
})

export type CourseFormValues = z.infer<typeof courseFormSchema>
