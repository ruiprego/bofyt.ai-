import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from './logo'

export const authInputClassName =
  'bofyt-auth-input w-full rounded-xl px-4 py-3 text-sm outline-none transition-[border-color,background-color,box-shadow] placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-60'

export const authPrimaryButtonClassName =
  'bofyt-primary-action h-12 w-full rounded-xl font-semibold uppercase tracking-[0.16em]'

interface AuthShellProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="bofyt-auth-shell relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-8 text-white sm:px-6">
      <div aria-hidden className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Return to BOFYT AI" className="transition-opacity hover:opacity-80">
            <Logo className="text-2xl" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/50 transition-colors hover:text-gold-light"
          >
            <ArrowLeft aria-hidden className="size-3.5" />
            Back to BOFYT
          </Link>
        </div>

        <section className="bofyt-auth-panel rounded-[1.75rem] border p-6 sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold-light">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl tracking-tight text-white text-balance sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/55">{description}</p>
          <div className="mt-7">{children}</div>
        </section>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.2em] text-white/30">Your account stays yours</p>
      </div>
    </main>
  )
}
