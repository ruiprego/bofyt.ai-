'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { authInputClassName, authPrimaryButtonClassName } from './auth-shell'

export function ResetPasswordForm() {
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
      const { error: updateError } = await createClient().auth.updateUser({ password })
      if (updateError) throw updateError
      setIsComplete(true)
    } catch {
      setError('This reset link may have expired. Request a new one and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isComplete) {
    return (
      <div className="flex flex-col gap-5" aria-live="polite">
        <div className="rounded-2xl border border-gold/30 bg-gold/[0.06] p-4">
          <p className="text-sm leading-relaxed text-white/80">Your password has been updated. You can now sign in with the new password.</p>
        </div>
        <Link href="/auth/login" className={`${authPrimaryButtonClassName} inline-flex items-center justify-center`}>
          Return to log in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="reset-password" className="text-[10px] uppercase tracking-[0.2em] text-white/55">
          New password
        </label>
        <input
          id="reset-password"
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
        <label htmlFor="reset-password-confirm" className="text-[10px] uppercase tracking-[0.2em] text-white/55">
          Confirm new password
        </label>
        <input
          id="reset-password-confirm"
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
        {isLoading ? 'Updating password…' : 'Update password'}
      </Button>
    </form>
  )
}
