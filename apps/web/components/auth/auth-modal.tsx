'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import SignUpForm from '@/components/auth/sign-up-form'
import LoginForm from '@/components/auth/login-form'
import CheckEmail from '@/components/auth/check-email'
import EmailVerified from '@/components/auth/email-verified'
import ForgotPasswordForm from '@/components/auth/forgot-password-form'
import ResetPasswordForm from '@/components/auth/reset-password-form'
import PasswordResetSuccess from '@/components/auth/password-reset-success'
import TermsOfService from '@/components/auth/terms-of-service'
import PrivacyPolicy from '@/components/auth/privacy-policy'
import { useAuthStore } from '@/lib/stores/auth-store'

type AuthView =
  | 'login'
  | 'sign-up'
  | 'check-email'
  | 'verified'
  | 'reset-password'
  | 'forgot-password'
  | 'password-reset-success'
  | 'terms'
  | 'privacy'

interface AuthModalProps {
  isOpen: boolean
  initialView: 'login' | 'sign-up' | 'check-email' | 'verified' | 'reset-password'
  onClose: () => void
}

const VERIFIED_DELAY_MS = 2500

export default function AuthModal({ isOpen, initialView, onClose }: AuthModalProps) {
  const [view, setView] = useState<AuthView>(initialView)
  const [previousView, setPreviousView] = useState<AuthView>(initialView)
  // Keep the signup email around so the check-email step can poll the server.
  const [email, setEmail] = useState('')
  // Reuse the same slot for password-reset resend.
  const [resetEmail, setResetEmail] = useState('')
  const { resetToken, setResetToken } = useAuthStore()

  useEffect(() => {
    setView(initialView)
    setPreviousView(initialView)
  }, [initialView])

  useEffect(() => {
    if (view !== 'verified') return

    // Show the success state briefly, then return to login.
    const timer = setTimeout(() => {
      setView('login')
    }, VERIFIED_DELAY_MS)

    return () => clearTimeout(timer)
  }, [view])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      setEmail('')
      setResetEmail('')
      setResetToken(null)
    } else {
      setView(initialView)
      setPreviousView(initialView)
    }
  }

  const openTerms = () => {
    setPreviousView(view)
    setView('terms')
  }

  const openPrivacy = () => {
    setPreviousView(view)
    setView('privacy')
  }

  const goBack = () => setView(previousView)

  // shared footer props passed to every form
  const legalProps = { onTerms: openTerms, onPrivacy: openPrivacy }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-sm rounded-none border border-gray-200 p-8 shadow-lg">
        <DialogTitle className="sr-only">
          {view === 'sign-up' && 'Sign Up'}
          {view === 'login' && 'Login'}
          {view === 'check-email' && 'Check Email'}
          {view === 'verified' && 'Email Verified'}
          {view === 'reset-password' && 'Reset Password'}
          {view === 'forgot-password' && 'Forgot Password'}
          {view === 'password-reset-success' && 'Check Email'}
          {view === 'terms' && 'Terms of Service'}
          {view === 'privacy' && 'Privacy Policy'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {view === 'sign-up' && 'Create your account to get started'}
          {view === 'login' && 'Sign in to your existing account'}
          {view === 'check-email' && 'Check your email to continue'}
          {view === 'verified' && 'Your email has already been verified'}
          {view === 'reset-password' && 'Create a new password'}
          {view === 'forgot-password' && 'Enter your email to receive a password reset link'}
          {view === 'password-reset-success' && 'Your reset link has been sent'}
          {view === 'terms' && 'Terms of service for Theokallia'}
          {view === 'privacy' && 'Privacy policy for Theokallia'}
        </DialogDescription>

        {view === 'sign-up' && (
          <SignUpForm
            onSwitchToLogin={() => setView('login')}
            onEmailSent={(userEmail) => {
              setEmail(userEmail)
              setView('check-email')
            }}
            {...legalProps}
          />
        )}

        {view === 'login' && (
          <LoginForm
            onSwitchToSignUp={() => setView('sign-up')}
            onSuccess={onClose}
            onForgotPassword={() => setView('forgot-password')}
            {...legalProps}
          />
        )}

        {view === 'check-email' && (
          <CheckEmail
            email={email}
            onVerified={() => setView('verified')}
          />
        )}

        {view === 'verified' && (
          <EmailVerified />
        )}

        {view === 'reset-password' && (
          <ResetPasswordForm
            token={resetToken ?? ''}
            onSuccess={() => {
              setResetToken(null)
              setView('login')
            }}
            onTerms={openTerms}
            onPrivacy={openPrivacy}
          />
        )}

        {view === 'forgot-password' && (
          <ForgotPasswordForm
            // Better Auth sends the reset callback back into the modal flow.
            onEmailSent={(userEmail) => {
              setResetEmail(userEmail)
              setView('password-reset-success')
            }}
            onBack={() => setView('login')}
            {...legalProps}
          />
        )}

        {view === 'password-reset-success' && (
          <PasswordResetSuccess
            email={resetEmail}
            onContinue={() => setView('login')}
          />
        )}

        {view === 'terms' && (
          <TermsOfService onContinue={goBack} />
        )}

        {view === 'privacy' && (
          <PrivacyPolicy onContinue={goBack} />
        )}
      </DialogContent>
    </Dialog>
  )
}
