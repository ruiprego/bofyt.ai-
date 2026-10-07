import { AuthShell } from '@/components/bofyt/auth-shell'
import { ResetPasswordForm } from '@/components/bofyt/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <AuthShell eyebrow="Account recovery" title="Choose a new password" description="Set a new password for your BOFYT account, then return to your flow.">
      <ResetPasswordForm />
    </AuthShell>
  )
}
