'use client'

import { useEffect, useState } from 'react'
import {
  useVerificationStatus,
  useResendVerification,
} from '@/lib/hooks/use-auth'

interface CheckEmailProps {
  email: string
  onVerified: () => void
}

export default function CheckEmail({ email, onVerified }: CheckEmailProps) {
  const [timer, setTimer] = useState(60)
  const [resendSuccess, setResendSuccess] = useState(false)

  const { data } = useVerificationStatus(email)
  const { mutate: resendEmail, isPending: isPendingResend } =
    useResendVerification()

  useEffect(() => {
    if (data?.verified) {
      onVerified()
    }
  }, [data?.verified, onVerified])

  useEffect(() => {
    if (timer <= 0) return

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timer])

  const handleResend = async () => {
    setResendSuccess(false)
    try {
      await resendEmail(email)
      setResendSuccess(true)
      setTimer(60)
    } catch (error) {
      console.error('Failed to resend verification email:', error)
    }
  }

  return (
    <div className="flex flex-col items-center px-2 py-4">
      <div className="mb-6">
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
        Check your email
      </h2>

      <p
        className="mb-8 text-center text-sm leading-relaxed text-gray-500"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        We sent you a verification link to{' '}
        <span className="font-medium text-gray-900">{email}</span>.
        <br />
        Open it to finish creating your account.
      </p>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          className={`text-xs transition-colors ${
            timer > 0 || isPendingResend
              ? 'cursor-not-allowed text-gray-400'
              : 'text-purple-600 underline underline-offset-4 hover:text-purple-700'
          }`}
          onClick={handleResend}
          disabled={timer > 0 || isPendingResend}
        >
          {timer > 0
            ? `Resend link in ${timer}s`
            : isPendingResend
              ? 'Sending...'
              : 'Resend verification link'}
        </button>

        {resendSuccess && (
          <p className="text-xs font-medium text-green-600">
            Verification link sent successfully!
          </p>
        )}
      </div>
    </div>
  )
}
