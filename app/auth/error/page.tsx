import { AuthShell } from '@/components/bofyt/auth-shell'
import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <AuthShell eyebrow="Link unavailable" title="We couldn’t verify that link" description="The link may have expired or already been used. Request a fresh link and try again.">
      <div className="flex flex-col gap-5">
        <Link href="/auth/forgot-password" className="inline-flex h-12 items-center justify-center rounded-xl border border-gold bg-gold px-4 text-sm font-semibold uppercase tracking-[0.16em] text-void transition-colors hover:bg-gold-light">
          Request a new link
        </Link>
        <p className="text-center text-sm text-white/50">
          Need to start over?{' '}
          <Link href="/auth/login" className="text-gold-light underline decoration-gold/40 underline-offset-4 hover:text-gold">
            Return to log in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
