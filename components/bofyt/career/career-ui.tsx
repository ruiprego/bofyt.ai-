import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Panel({ title, eyebrow, action, children, className }: { title?: string; eyebrow?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5', className)}>
      {(title || eyebrow || action) && (
        <header className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            {eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">{eyebrow}</p>}
            {title && <h3 className="font-display text-base font-semibold text-white text-balance">{title}</h3>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

type Tone = 'gold' | 'ghost' | 'quiet'

export function CareerButton({ tone = 'ghost', busy, className, children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; busy?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || busy}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'gold' && 'bg-gold text-void hover:bg-gold-light',
        tone === 'ghost' && 'border border-white/15 text-white hover:border-gold/50 hover:text-gold-light',
        tone === 'quiet' && 'text-white/60 hover:text-white',
        className,
      )}
    >
      {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

const fieldClass =
  'w-full rounded-xl border border-white/10 bg-void/60 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40'

export function TextField({ label, hint, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-white/70">{label}</span>
      <input {...props} className={fieldClass} />
      {hint && <span className="text-xs text-white/40">{hint}</span>}
    </label>
  )
}

export function TextArea({ label, hint, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-white/70">{label}</span>
      <textarea {...props} className={cn(fieldClass, 'min-h-24 resize-y leading-relaxed')} />
      {hint && <span className="text-xs text-white/40">{hint}</span>}
    </label>
  )
}

export function Notice({ tone = 'info', children, action }: { tone?: 'info' | 'error'; children: ReactNode; action?: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm leading-relaxed',
        tone === 'error' ? 'border-red-400/30 bg-red-400/[0.06] text-red-100' : 'border-gold/25 bg-gold/[0.06] text-gold-light',
      )}
    >
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="flex flex-1 flex-col gap-2">{children}{action}</div>
    </div>
  )
}

export function Chips({ items, tone = 'neutral' }: { items: string[]; tone?: 'neutral' | 'match' | 'gap' }) {
  if (!items.length) return <p className="text-sm text-white/40">None identified</p>
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs',
            tone === 'neutral' && 'border-white/10 text-white/75',
            tone === 'match' && 'border-gold/40 bg-gold/10 text-gold-light',
            tone === 'gap' && 'border-white/10 border-dashed text-white/50',
          )}
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

export function LoadingLine({ label }: { label: string }) {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-white/60">
      <Loader2 aria-hidden className="size-4 animate-spin text-gold" />
      {label}
    </p>
  )
}
