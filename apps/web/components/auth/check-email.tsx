'use client'

import { useEffect, useState } from 'react'
import { Mail, Check } from 'lucide-react'
import {
  useVerificationStatus,
  useResendVerification,
} from '@/lib/hooks/use-auth'
import { toast } from 'sonner'

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
    } catch {
      toast.error('Failed to resend verification email')
    }
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
          <p className="flex items-center gap-2 text-xs font-medium text-green-600">
            <Check className="size-3" />
            Verification link sent successfully!
          </p>
        )}
      </div>
    </div>
  )
}
