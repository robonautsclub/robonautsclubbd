import { z } from 'zod'

export const newsArticleFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  slugOverride: z.string(),
  body: z.string().trim().min(1, 'Article body is required'),
  coverImageUrl: z.string(),
  displayDateInput: z.string().min(1, 'Display date is required'),
  published: z.boolean(),
})

export type NewsArticleFormValues = z.infer<typeof newsArticleFormSchema>
