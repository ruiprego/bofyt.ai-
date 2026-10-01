import { ArrowLeft, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import type { UserProfile } from '@/lib/bofyt/user-data'
import { AccountSettingsForm } from './account-settings-form'
import { SignOutButton } from './sign-out-button'
import { Logo } from './logo'

export function AccountView({
  user,
  profile,
  returnPath,
}: {
  user: User
  profile: UserProfile | null
  returnPath: string
}) {
  const memberSince = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(user.created_at))
  const metadataName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : ''

  return (
    <main className="relative min-h-svh overflow-hidden bg-void px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <Link href={returnPath} aria-label="Return to BOFYT AI" className="transition-opacity hover:opacity-80">
            <Logo className="text-2xl" />
          </Link>
          <Link
            href={returnPath}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/50 transition-colors hover:text-gold-light"
          >
            <ArrowLeft aria-hidden className="size-3.5" />
            Back to BOFYT
          </Link>
        </header>

        <section className="rounded-[1.75rem] border border-gold/30 bg-void p-6 shadow-[0_0_70px_-32px_rgba(226,184,101,0.8)] sm:p-8">
          <div className="flex flex-col gap-7">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-gold-light">Account / Settings</p>
              <h1 className="mt-3 font-display text-4xl tracking-tight text-white text-balance">Your BOFYT account</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
                Keep your identity and focus areas ready for the next goal you bring to BOFYT.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Current email</p>
                <p className="mt-2 break-words text-sm text-white/80">{user.email ?? 'No email available'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Member since</p>
                <p className="mt-2 text-sm text-white/80">{memberSince}</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <AccountSettingsForm
                userId={user.id}
                initialDisplayName={profile?.displayName ?? metadataName}
                initialFocusAreas={profile?.focusAreas ?? []}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Sparkles aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gold-light">Subscription</p>
                  <h2 className="mt-2 font-display text-2xl text-white">Free plan</h2>
                </div>
                <span className="rounded-full border border-gold/35 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-gold-light">Active</span>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50">
                Premium features will appear here when the Free / Premium layer is ready. Your account is set up for that next step.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <LockKeyhole aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
              <div>
                <h2 className="text-sm text-white">Password</h2>
                <p className="mt-1 text-sm leading-relaxed text-white/50">Request a secure reset link to choose a new password.</p>
              </div>
            </div>
            <Link
              href="/auth/forgot-password"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-white/20 px-4 text-[10px] uppercase tracking-[0.16em] text-white/75 transition-colors hover:border-gold/60 hover:text-gold-light"
            >
              Reset password
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-start sm:justify-between">
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
        </section>

        {profile?.focusAreas.length ? (
          <p className="sr-only">
            Saved focus areas: {profile.focusAreas.map((id) => {
              const categoryMap: Record<string, { shortTitle: string }> = {
                // Focus area categories mapping would go here
              }
              return categoryMap[id]?.shortTitle ?? id
            }).join(', ')}
          </p>
        ) : null}
      </div>
    </main>
  )
}

export default AccountView
