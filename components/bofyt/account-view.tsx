import { ArrowLeft, ShieldCheck } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { SignOutButton } from './sign-out-button'
import { Logo } from './logo'

export function AccountView({ user }: { user: User }) {
  const memberSince = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(user.created_at))

  return (
    <main className="relative min-h-svh overflow-hidden bg-void px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="Return to BOFYT AI" className="transition-opacity hover:opacity-80">
            <Logo className="text-2xl" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/50 transition-colors hover:text-gold-light">
            <ArrowLeft aria-hidden className="size-3.5" />
            Back to BOFYT
          </Link>
        </header>

        <section className="rounded-[1.75rem] border border-gold/30 bg-void p-6 shadow-[0_0_70px_-32px_rgba(226,184,101,0.8)] sm:p-8">
          <div className="flex flex-col gap-7">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-gold-light">Account / Profile</p>
              <h1 className="mt-3 font-display text-4xl tracking-tight text-white text-balance">Your BOFYT account</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
                Your account keeps your BOFYT identity ready across sessions. Your progress stays in this browser until synced to your account data layer.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Email</p>
                <p className="mt-2 break-words text-sm text-white/80">{user.email ?? 'No email available'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Member since</p>
                <p className="mt-2 text-sm text-white/80">{memberSince}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
                <div>
                  <p className="text-sm text-white">Protected account area</p>
                  <p className="mt-1 max-w-md text-sm leading-relaxed text-white/50">
                    Session cookies are refreshed server-side and this page is unavailable when you are signed out.
                  </p>
                </div>
              </div>
              <SignOutButton />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
