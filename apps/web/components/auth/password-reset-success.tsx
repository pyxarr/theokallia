'use client'

import { useState } from 'react'
import { Mail, Check } from 'lucide-react'
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
        <Mail className="size-20 text-[#7E22CE]" />
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
        <p className="flex items-center gap-2 mb-3 text-sm text-green-600">
          <Check className="size-3" />
          {sentMessage}
        </p>
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
