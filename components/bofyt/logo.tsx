import { cn } from '@/lib/utils'

export function EyeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" aria-hidden className={cn('overflow-visible', className)}>
      <defs>
        <linearGradient id="eye-mark-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBE7B5" />
          <stop offset="50%" stopColor="#E2B865" />
          <stop offset="100%" stopColor="#9A7130" />
        </linearGradient>
      </defs>
      <path d="M 3 20 Q 32 -2 61 20 Q 32 42 3 20 Z" fill="none" stroke="url(#eye-mark-gold)" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="32" cy="20" r="11" fill="none" stroke="url(#eye-mark-gold)" strokeWidth="2.2" />
      <g transform="rotate(180 32 20)">
        <path d="M 28.5 16 C 28.5 12.5 35.5 12.5 35.5 16.4 C 35.5 19.4 32 19.4 32 22.6" fill="none" stroke="#F6DDA1" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="26" r="1.3" fill="#F6DDA1" />
      </g>
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="BOFYT AI"
      className={cn('inline-flex items-center gap-[0.12em] font-display font-semibold leading-none tracking-tight', className)}
    >
      <span aria-hidden className="text-white">B</span>
      <EyeMark className="h-[0.78em] w-[1.25em]" />
      <span aria-hidden className="text-white">FYT</span>
      <span aria-hidden className="ml-[0.28em] font-normal text-gold-metal">AI</span>
    </span>
  )
}
