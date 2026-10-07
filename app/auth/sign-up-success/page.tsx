import { AuthShell } from '@/components/bofyt/auth-shell'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <AuthShell eyebrow="Almost there" title="Check your inbox" description="Confirm your email address to finish creating your BOFYT account.">
      <div className="flex flex-col gap-5" aria-live="polite">
        <div className="rounded-2xl border border-gold/30 bg-gold/[0.06] p-4">
          <p className="text-sm leading-relaxed text-white/80">
            Follow the link in your confirmation email. Once confirmed, you can return and log in.
          </p>
        </div>
        <Link href="/auth/login" className="inline-flex h-12 items-center justify-center rounded-xl border border-gold bg-gold px-4 text-sm font-semibold uppercase tracking-[0.16em] text-void transition-colors hover:bg-gold-light">
          Continue to log in
        </Link>
      </div>
    </AuthShell>
  )
}
