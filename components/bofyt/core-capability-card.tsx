'use client'

import { cn } from '@/lib/utils'
import { AiCore } from './ai-core'

interface CoreCapabilityCardProps {
  interactive: boolean
  onActivateCore?: () => void
  positionLabel?: string
  className?: string
}

export function CoreCapabilityCard({ interactive, onActivateCore, positionLabel, className }: CoreCapabilityCardProps) {
  const canActivate = interactive && Boolean(onActivateCore)

  return (
    <article
      data-capability="core"
      data-core-interactive={String(canActivate)}
      className={cn(
        'bofyt-core-card group relative isolate flex h-full w-full flex-col overflow-hidden rounded-[1.5rem] border text-left outline-none transition-[border-color,box-shadow,opacity,transform] duration-700',
        canActivate && 'min-[960px]:hover:-translate-y-1',
        !canActivate && 'opacity-70',
        className,
      )}
    >
      <span aria-hidden className="bofyt-core-card-grid absolute inset-0 -z-10" />
      <span aria-hidden className="bofyt-core-card-shine absolute inset-0 -z-10" />

      <span className="flex items-start justify-between gap-3 p-[clamp(1rem,1.5vw,1.4rem)]">
        <span className="flex flex-col gap-1">
          {positionLabel && <span className="pt-1 text-[10px] tabular-nums tracking-[0.2em] text-tech-cyan">{positionLabel}</span>}
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-tech-cyan/80">CORE</span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/45">Central intelligence</span>
        </span>
        <span className="bofyt-core-status" aria-hidden>
          <span className="size-1.5 rounded-full bg-tech-cyan" />
          <span>awake</span>
        </span>
      </span>

      <span className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-2">
        <span aria-hidden className="bofyt-core-orbit bofyt-core-orbit-one" />
        <span aria-hidden className="bofyt-core-orbit bofyt-core-orbit-two" />
        <AiCore
          mode="idle"
          energy={0.25}
          typingTick={0}
          pulseKey={0}
          particles
          disabled={!canActivate}
          ariaLabel="BOFYT AI Core. Activate to describe your goal"
          onActivate={onActivateCore}
          className="size-[clamp(8.75rem,15vw,12.5rem)]"
        />
      </span>

      <span className="flex flex-col gap-2 p-[clamp(1rem,1.5vw,1.4rem)] pt-3">
        <span className="h-px w-12 bg-gradient-to-r from-tech-cyan/80 to-tech-blue/60" />
        <span className="font-display text-[clamp(1rem,1.4vw,1.3rem)] font-medium uppercase leading-[1.05] tracking-[0.1em] text-white">
          The BOFYT brain
        </span>
        <span className="max-w-[15rem] text-[11px] leading-relaxed text-white/60">
          Awareness that turns your next move into a clear path.
        </span>
        <span className="mt-1 text-[9px] uppercase tracking-[0.2em] text-tech-cyan/65">
          See what needs to happen next
        </span>
      </span>
    </article>
  )
}

