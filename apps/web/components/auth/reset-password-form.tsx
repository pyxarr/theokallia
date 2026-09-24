'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/lib/validations/auth'
import { useResetPassword } from '@/lib/hooks/use-auth'

interface ResetPasswordFormProps {
  token: string
  onSuccess: () => void
  onTerms?: () => void
  onPrivacy?: () => void
}

export default function ResetPasswordForm({
  token,
  onSuccess,
  onTerms,
  onPrivacy,
}: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { mutate: resetPassword, isPending } = useResetPassword()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  function onSubmit(data: ResetPasswordInput) {
    resetPassword(
      { token, password: data.password },
      {
        onSuccess: () => setIsComplete(true),
        onError: (error) => {
          setError('root', {
            message: error.message ?? 'Something went wrong. Please try again.',
          })
        },
      }
    )
  }

  useEffect(() => {
    if (!isComplete) return

    // Show the success state briefly, then return to login.
    const timer = window.setTimeout(() => {
      onSuccess()
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [isComplete, onSuccess])

  if (isComplete) {
    return (
      <div className="flex flex-col items-center px-2 py-4">
        <div className="mb-6 animate-pulse">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M40 4L46.5 14.5L59 10L58 23.5L70 28L63 39.5L70 51L58 55.5L59 69L46.5 64.5L40 75L33.5 64.5L21 69L22 55.5L10 51L17 39.5L10 28L22 23.5L21 10L33.5 14.5L40 4Z"
              fill="#7E22CE"
            />
            <path
              d="M28 40L36 48L53 31"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2
          className="mb-3 text-center text-2xl font-normal"
          style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
        >
          Password reset successful
        </h2>

        <p
          className="text-center text-sm leading-relaxed text-gray-500"
          style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
        >
          Your new password has been saved.
          <br />
          Opening the login form now.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col px-2">
      <h2 className="mb-8 text-center font-cormorant-garamond text-3xl leading-snug font-normal">
        Create a New Password
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="new-password"
            className="text-sm font-normal text-gray-700"
          >
            New password
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              className="rounded-none border-gray-300 pr-10"
              disabled={isPending}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff size={16} strokeWidth={1.5} />
              ) : (
                <Eye size={16} strokeWidth={1.5} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="confirm-password"
            className="text-sm font-normal text-gray-700"
          >
            Confirm New password
          </Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm new password"
              className="rounded-none border-gray-300 pr-10"
              disabled={isPending}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? (
                <EyeOff size={16} strokeWidth={1.5} />
              ) : (
                <Eye size={16} strokeWidth={1.5} />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {errors.root && (
          <p className="text-xs text-red-500">{errors.root.message}</p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full py-5 text-sm tracking-wide text-white hover:bg-purple-800"
        >
          {isPending ? 'Saving...' : 'Save Password'}
        </Button>
      </form>

      {onTerms && onPrivacy && (
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
      )}
    </div>
  )
}
