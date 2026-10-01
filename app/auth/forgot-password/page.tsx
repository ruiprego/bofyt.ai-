import { AuthShell } from '@/components/bofyt/auth-shell'
import { ForgotPasswordForm } from '@/components/bofyt/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <AuthShell eyebrow="Account recovery" title="Reset your password" description="Enter your email and we’ll send a secure link to choose a new password.">
      <ForgotPasswordForm />
    </AuthShell>
  )
}
