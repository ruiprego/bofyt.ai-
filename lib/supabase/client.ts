import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (browserClient) return browserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase public environment variables are not configured.')
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseKey, {
    cookieOptions: { secure: process.env.NODE_ENV === 'production' },
  })

  return browserClient
}

export function getAuthRedirectUrl(nextPath: string) {
  const configuredRedirect = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
  const fallback = `${window.location.origin}/auth/callback`
  const redirectUrl = new URL(configuredRedirect ?? fallback, window.location.origin)

  if (nextPath !== '/') {
    redirectUrl.searchParams.set('next', nextPath)
  }

  return redirectUrl.toString()
}

