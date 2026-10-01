'use client'

import { Button } from '@/components/ui/button'
import { createClient, getAuthRedirectUrl } from '@/lib/supabase/client'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { authInputClassName, authPrimaryButtonClassName } from './auth-shell'

function signUpErrorMessage(error: unknown) {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }

  if (code === 'weak_password') return 'Choose a stronger password.'
  if (code === 'email_address_invalid') return 'Please use a valid email address.'
  if (code === 'email_address_not_authorized') return 'That address cannot receive confirmation email. Try another one.'
  if (code === 'over_email_send_rate_limit' || status === 429) return 'Too many attempts. Please wait a moment and try again.'
  return 'Unable to create your account right now. Please try again.'
}

export function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }
    if (password !== repeatPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      const { error: signUpError } = await createClient().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: getAuthRedirectUrl('/') },
      })
      if (signUpError) throw signUpError
      setIsComplete(true)
    } catch (error: unknown) {
      setError(signUpErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  if (isComplete) {
    return (
      <div className="flex flex-col gap-5" aria-live="polite">
        <div className="rounded-2xl border border-gold/30 bg-gold/[0.06] p-4">
          <p className="text-sm leading-relaxed text-white/80">
            Your account is ready. Check your inbox for a confirmation link, then return here to log in.
          </p>
        </div>
        <Link href="/auth/login" className={`${authPrimaryButtonClassName} inline-flex items-center justify-center`}>
          Continue to log in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="sign-up-email" className="text-[10px] uppercase tracking-[0.2em] text-white/55">
          Email address
        </label>
        <input
          id="sign-up-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={authInputClassName}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="sign-up-password" className="text-[10px] uppercase tracking-[0.2em] text-white/55">
          Password
        </label>
        <input
          id="sign-up-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={authInputClassName}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="sign-up-password-confirm" className="text-[10px] uppercase tracking-[0.2em] text-white/55">
          Confirm password
        </label>
        <input
          id="sign-up-password-confirm"
          name="password-confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={repeatPassword}
          onChange={(event) => setRepeatPassword(event.target.value)}
          className={authInputClassName}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm leading-relaxed text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isLoading} className={authPrimaryButtonClassName}>
        {isLoading ? 'Creating account…' : 'Create account'}
      </Button>
      <p className="text-center text-sm text-white/50">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-gold-light underline decoration-gold/40 underline-offset-4 hover:text-gold">
          Log in
        </Link>
      </p>
    </form>
  )
}
