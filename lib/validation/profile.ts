import { z } from 'zod'

export const profileFormSchema = z
  .object({
    displayName: z.string().trim().min(1, 'Display name is required'),
    password: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password.length > 0 && data.password.length < 6) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password must be at least 6 characters long',
        path: ['password'],
      })
    }
  })

export type ProfileFormValues = z.infer<typeof profileFormSchema>
