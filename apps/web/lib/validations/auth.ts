import { z } from 'zod'

// Sign up form validation schema
export const signUpSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    // Keep this in sync with Better Auth on the API.
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    termsAccepted: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.termsAccepted === true, {
    message: 'You must agree to the terms and conditions',
    path: ['termsAccepted'],
  })

// Sign in form validation schema
export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Forgot password form validation schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

// Reset password form validation schema
export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Inferred TypeScript types from the schemas
export type SignUpFormData = z.infer<typeof signUpSchema>
export type SignInFormData = z.infer<typeof signInSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
