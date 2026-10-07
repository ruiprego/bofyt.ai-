import { AuthShell } from '@/components/bofyt/auth-shell'
import { SignUpForm } from '@/components/bofyt/sign-up-form'

export default function SignUpPage() {
  return (
    <AuthShell eyebrow="Start your account" title="Make progress personal" description="Create your BOFYT account to keep your identity ready for the next move.">
      <SignUpForm />
    </AuthShell>
  )
}
