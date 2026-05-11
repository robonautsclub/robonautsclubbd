import { z } from 'zod'

export const createUserFormSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  displayName: z.string().trim(),
})

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>

export const editUserFormSchema = z
  .object({
    displayName: z.string(),
    password: z.string(),
    disabled: z.boolean(),
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

export type EditUserFormValues = z.infer<typeof editUserFormSchema>
