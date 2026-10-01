'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { authInputClassName, authPrimaryButtonClassName } from './auth-shell'

function loginErrorMessage(error: unknown) {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }

  if (code === 'email_not_confirmed') return 'Confirm your email address before signing in.'
  if (code === 'over_request_rate_limit' || status === 429) return 'Too many attempts. Please wait a moment and try again.'
  if (code === 'invalid_credentials') return 'Invalid email or password.'
  return 'Unable to sign in right now. Please try again.'
}

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error: signInError } = await createClient().auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      router.replace(nextPath)
    } catch (error: unknown) {
      setError(loginErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="login-email" className="text-[10px] uppercase tracking-[0.2em] text-white/55">
          Email address
        </label>
        <input
          id="login-email"
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
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="login-password" className="text-[10px] uppercase tracking-[0.2em] text-white/55">
            Password
          </label>
          <Link href="/auth/forgot-password" className="text-[10px] uppercase tracking-[0.12em] text-gold-light/80 hover:text-gold-light">
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={authInputClassName}
        />
      </div>
      {error && (
        <p id="login-error" role="alert" className="text-sm leading-relaxed text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isLoading} className={authPrimaryButtonClassName}>
        {isLoading ? 'Signing in…' : 'Log in'}
      </Button>
      <p className="text-center text-sm text-white/50">
        New to BOFYT?{' '}
        <Link href="/auth/sign-up" className="text-gold-light underline decoration-gold/40 underline-offset-4 hover:text-gold">
          Create an account
        </Link>
      </p>
    </form>
  )
}
