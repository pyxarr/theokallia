'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validations/auth'
import { useForgotPassword } from '@/lib/hooks/use-auth'

interface ForgotPasswordFormProps {
  onEmailSent: (email: string) => void
  onBack: () => void
  onTerms: () => void
  onPrivacy: () => void
}

export default function ForgotPasswordForm({
  onEmailSent,
  onBack,
  onTerms,
  onPrivacy,
}: ForgotPasswordFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const { mutate: forgotPassword, isPending } = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = (data: ForgotPasswordInput) => {
    setServerError(null)
    forgotPassword(data, {
      onSuccess: () => onEmailSent(data.email),
      onError: (err) => setServerError(err.message),
    })
  }

  return (
    <div className="flex flex-col items-center px-2">
      <h2
        className="mb-2 text-center text-xl leading-snug font-normal"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        Forgot your password?
      </h2>
      <p
        className="mb-8 text-center text-sm text-gray-500"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <label
            className="text-sm text-gray-600"
            style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
          >
            Email address
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="your@email.com"
            disabled={isPending}
            className="border border-gray-300 px-4 py-3.5 text-sm outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-red-500">{serverError}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 text-sm tracking-wide text-white transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-primary)',
            fontFamily: 'var(--font-cormorant-garamond)',
          }}
        >
          {isPending ? 'Sending...' : 'Send reset link'}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="w-full border border-gray-300 py-3.5 text-sm tracking-wide text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
          style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
        >
          Back to Login
        </button>
      </form>

      <div className="mt-8 flex justify-center gap-3 text-xs text-gray-400">
        <span onClick={onTerms} className="cursor-pointer hover:text-gray-600">
          Terms of service
        </span>
        <span>|</span>
        <span
          onClick={onPrivacy}
          className="cursor-pointer hover:text-gray-600"
        >
          Privacy policy
        </span>
      </div>
    </div>
  )
}
