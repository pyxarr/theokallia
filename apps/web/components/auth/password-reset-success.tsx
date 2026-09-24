'use client'

import { useState } from 'react'
import { useForgotPassword } from '@/lib/hooks/use-auth'

interface PasswordResetSuccessProps {
  email: string
  onContinue: () => void
}

export default function PasswordResetSuccess({
  email,
  onContinue,
}: PasswordResetSuccessProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [sentMessage, setSentMessage] = useState<string | null>(null)
  const { mutate: resendResetLink, isPending } = useForgotPassword()

  const handleResend = () => {
    setServerError(null)
    setSentMessage(null)

    resendResetLink(
      { email },
      {
        onSuccess: () => setSentMessage('Reset link sent again.'),
        onError: (error) => setServerError(error.message),
      }
    )
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
        We sent you a password reset link.
        <br />
        Open it to choose a new password.
      </p>

      {/* Keep the screen open so the user can ask for another link if needed. */}
      <button
        type="button"
        onClick={handleResend}
        disabled={isPending}
        className="mb-3 text-sm tracking-wide text-purple-700 underline disabled:opacity-50"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        {isPending ? 'Sending...' : 'Resend link'}
      </button>

      {serverError && (
        <p className="mb-3 text-sm text-red-500">{serverError}</p>
      )}
      {sentMessage && (
        <p className="mb-3 text-sm text-green-600">{sentMessage}</p>
      )}

      <button
        onClick={onContinue}
        className="w-full bg-purple-700 py-3.5 text-sm tracking-wide text-white transition-colors hover:bg-purple-800"
        style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
      >
        Got it
      </button>
    </div>
  )
}
