import { z } from 'zod'

export const schoolDirectoryFormSchema = z.object({
  name: z.string().trim().min(1, 'School name is required'),
  city: z.string(),
  isActive: z.boolean(),
})

export type SchoolDirectoryFormValues = z.infer<typeof schoolDirectoryFormSchema>
