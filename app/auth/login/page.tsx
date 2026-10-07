import { AuthShell } from '@/components/bofyt/auth-shell'
import { LoginForm } from '@/components/bofyt/login-form'
import { safeNextPath } from '@/lib/supabase/redirect'

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const nextPath = safeNextPath(params.next)

  return (
    <AuthShell eyebrow="Welcome back" title="Pick up where you left off" description="Sign in to keep your BOFYT identity connected across sessions.">
      <LoginForm nextPath={nextPath} />
    </AuthShell>
  )
}
