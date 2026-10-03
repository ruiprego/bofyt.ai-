'use client'

import { Button } from '@/components/ui/button'
import { createClient, getAuthRedirectUrl } from '@/lib/supabase/client'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { authInputClassName, authPrimaryButtonClassName } from './auth-shell'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl('/auth/reset-password'),
      })
      if (resetError) throw resetError
      setIsComplete(true)
    } catch {
      setError('Unable to send a reset link right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isComplete) {
    return (
      <div className="flex flex-col gap-5" aria-live="polite">
        <div className="bofyt-glass-panel-gold rounded-2xl p-4">
          <p className="text-sm leading-relaxed text-white/80">
            If an account exists for that address, a reset link is on its way. Check your inbox and follow the link to choose a new password.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setIsComplete(false)} className="bofyt-secondary-action h-12 rounded-xl">
          Send another link
        </Button>
        <p className="text-center text-sm text-white/50">
          Remembered your password?{' '}
          <Link href="/auth/login" className="text-gold-light underline decoration-gold/40 underline-offset-4 hover:text-gold">
            Log in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="forgot-email" className="text-[10px] uppercase tracking-[0.2em] text-white/55">
          Email address
        </label>
        <input
          id="forgot-email"
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
      {error && (
        <p role="alert" className="text-sm leading-relaxed text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isLoading} className={authPrimaryButtonClassName}>
        {isLoading ? 'Sending link…' : 'Send reset link'}
      </Button>
      <p className="text-center text-sm text-white/50">
        Remembered your password?{' '}
        <Link href="/auth/login" className="text-gold-light underline decoration-gold/40 underline-offset-4 hover:text-gold">
          Log in
        </Link>
      </p>
    </form>
  )
}
