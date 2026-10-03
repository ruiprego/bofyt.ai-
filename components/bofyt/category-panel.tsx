'use client'

import Image from 'next/image'
import { Blocks, Plus, RadioTower, ScanSearch, SlidersHorizontal, Sprout, Workflow, type LucideIcon } from 'lucide-react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { Category } from '@/lib/bofyt/categories'
import type { Capability, CapabilityId } from '@/lib/bofyt/capabilities'
import { cn } from '@/lib/utils'

interface CategoryPanelProps {
  category: Category
  capability?: Capability
  active: boolean
  mapped: boolean
  dimmed: boolean
  displayIndex?: string
  displayTitle?: string
  displayDescription?: string
  /** Visual shade for panels further from the core: 0 is nearest. */
  shade?: number
  compact?: boolean
  expanded?: boolean
  disableHover?: boolean
  disabled?: boolean
  onSelect: (event: ReactMouseEvent<HTMLButtonElement>) => void
  className?: string
}

const SHADE = ['opacity-0', 'opacity-20', 'opacity-35', 'opacity-50']

const CAPABILITY_VISUALS: Partial<Record<CapabilityId, { icon: LucideIcon; motif: string }>> = {
  grow: { icon: Sprout, motif: 'growth' },
  reach: { icon: RadioTower, motif: 'reach' },
  build: { icon: Blocks, motif: 'build' },
  optimize: { icon: SlidersHorizontal, motif: 'optimize' },
  automate: { icon: Workflow, motif: 'automate' },
  discover: { icon: ScanSearch, motif: 'discover' },
}

export function CategoryPanel({
  category,
  capability,
  active,
  mapped,
  dimmed,
  displayIndex,
  displayTitle,
  displayDescription,
  shade = 0,
  compact = false,
  expanded = false,
  disableHover = false,
  disabled = false,
  onSelect,
  className,
}: CategoryPanelProps) {
  const modules = capability?.modules ?? category.modules
  const capabilities = modules.slice(0, capability ? (expanded ? 6 : 4) : category.id === 'search' ? 5 : 4).map((module) => module.name)
  const imageSrc = capability?.imageSrc ?? (category.id === 'search' ? '/panels/search.png' : `/panels/${category.id}.webp`)
  const panelIndex = capability?.index ?? displayIndex ?? category.index
  const panelTitle = capability?.title ?? displayTitle ?? category.title
  const panelDescription = capability?.description ?? displayDescription ?? category.description
  const descriptionId = `panel-${category.id}-description`
  const capabilityVisual = capability ? CAPABILITY_VISUALS[capability.id] : undefined
  const capabilityCard = Boolean(capabilityVisual)
  const CapabilityIcon = capabilityVisual?.icon

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-expanded={expanded}
      aria-describedby={descriptionId}
      disabled={disabled}
      data-capability={capabilityCard ? capability?.id : undefined}
      data-active={capabilityCard ? String(active) : undefined}
      data-mapped={capabilityCard ? String(mapped) : undefined}
      onClick={onSelect}
      className={cn(
        capabilityCard
          ? 'bofyt-capability-card group relative isolate flex h-full w-full flex-col overflow-hidden rounded-[1.35rem] border bg-tech-ink text-left outline-none transition-[border-color,box-shadow,opacity,transform] duration-500 disabled:pointer-events-none disabled:cursor-default'
          : 'group relative isolate flex h-full w-full flex-col overflow-hidden rounded-md border bg-[#0a0907] text-left outline-none transition-[border-color,box-shadow,opacity,transform] duration-500 disabled:pointer-events-none disabled:cursor-default',
        !disableHover && 'min-[960px]:group-hover:-translate-y-0.5 min-[960px]:group-hover:scale-[1.015]',
        capabilityCard
          ? 'focus-visible:ring-2 focus-visible:ring-tech-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-tech-ink'
          : 'focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-void',
        capabilityCard
          ? active
            ? 'bofyt-capability-card-active'
            : mapped
              ? 'bofyt-capability-card-mapped'
              : 'bofyt-capability-card-idle'
          : active
            ? 'border-gold-light/80 shadow-[0_0_46px_-6px_rgba(226,184,101,0.75),inset_0_0_30px_-12px_rgba(246,221,161,0.5)]'
            : mapped
              ? 'border-gold/55 shadow-[0_0_30px_-12px_rgba(226,184,101,0.5)]'
              : cn('border-white/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)]', !disableHover && 'hover:border-gold/45'),
        dimmed && (disableHover ? 'opacity-55' : 'opacity-55 hover:opacity-100'),
      )}
    >
      <span id={descriptionId} className="sr-only">
        {panelDescription}
      </span>

      <Image
        src={imageSrc}
        alt=""
        fill
        sizes="(min-width: 960px) 12vw, 45vw"
        className={cn(
          capabilityCard
            ? 'bofyt-capability-image absolute inset-0 -z-10 object-cover object-center transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]'
            : 'absolute inset-0 -z-10 object-cover object-center transition-[transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
          capabilityCard
            ? !disableHover && 'group-hover:scale-[1.03]'
            : active
              ? 'scale-105 brightness-110'
              : cn('brightness-75', !disableHover && 'group-hover:scale-[1.03] group-hover:brightness-90'),
        )}
      />
      <span
        aria-hidden
        className={capabilityCard ? 'bofyt-capability-wash absolute inset-0 -z-10' : 'absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#0a0907_0%,rgba(10,9,7,0.55)_26%,rgba(10,9,7,0)_46%,rgba(10,9,7,0.2)_62%,#0a0907_84%)]'}
      />
      <span aria-hidden className={capabilityCard ? 'bofyt-capability-light absolute inset-0 -z-10' : 'absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(255,255,255,0.07),transparent_38%)]'} />
      <span
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 z-10 bg-void transition-opacity duration-500', active ? 'opacity-0' : SHADE[shade])}
      />

      <span className={cn('flex flex-col gap-[clamp(0.65rem,0.95vw,0.9rem)] p-[clamp(0.9rem,1.4vw,1.45rem)]', compact && 'lg:gap-1 lg:p-2.5')}>
        <span className="flex items-start justify-between gap-3">
          <span className={cn('pt-1 text-[10px] tabular-nums tracking-[0.2em] transition-colors', capabilityCard ? 'text-tech-cyan/80' : active ? 'text-gold-light' : 'text-white/60')}>
            {panelIndex}
          </span>
          {CapabilityIcon && (
            <span aria-hidden data-motif={capabilityVisual?.motif} className="bofyt-capability-motif">
              <CapabilityIcon className="size-4" strokeWidth={1.5} />
            </span>
          )}
        </span>
        <span
          className={cn(
            capabilityCard
              ? cn(
                  'font-display text-[clamp(0.95rem,1.35vw,1.3rem)] font-medium uppercase leading-[1.12] tracking-[0.08em] break-words transition-colors duration-500',
                  compact && 'lg:text-[clamp(0.7rem,0.9vw,1rem)] lg:tracking-[0.05em]',
                )
              : 'font-display text-[clamp(0.65rem,0.9vw,0.9rem)] font-medium uppercase leading-[1.2] tracking-wide break-words transition-colors duration-500',
            capabilityCard ? 'text-white' : active ? 'text-gold-light' : 'text-white',
          )}
        >
          {panelTitle}
        </span>
        <span
          aria-hidden
          className={cn(
            'h-px transition-colors',
            capabilityCard ? 'w-10' : 'w-3',
            capabilityCard ? (active ? 'bg-tech-cyan' : 'bg-tech-cyan/70') : active ? 'bg-gold-light' : 'bg-white/40',
          )}
        />
        <span className={cn('max-w-[18rem] leading-relaxed', capabilityCard ? 'text-[12px] text-white/70' : 'text-[11px] text-white/65', compact && 'lg:max-h-12 lg:overflow-hidden lg:text-[10px] lg:leading-tight')}>
          {panelDescription}
        </span>
        {expanded && capability && (
          <span className="hidden max-w-[18rem] flex-col gap-2 text-[10px] leading-relaxed text-white/55 min-[960px]:flex">
            <span className="line-clamp-4">{capability.response}</span>
            <span className="uppercase tracking-[0.12em] text-gold-light/70">{capability.paths.slice(0, 3).join(' · ')}</span>
          </span>
        )}
      </span>

      <span className={cn('mt-auto flex flex-col items-start gap-[clamp(0.75rem,1.2vw,1.15rem)] p-[clamp(0.9rem,1.4vw,1.45rem)]', compact && 'lg:gap-1.5 lg:p-2.5')}>
        <span className={cn('flex flex-col gap-1.5', compact && 'lg:gap-0')}>
          {capabilities.map((name) => (
            <span
              key={name}
              className={cn(
                capabilityCard
                  ? 'text-[clamp(0.58rem,0.68vw,0.7rem)] uppercase leading-snug tracking-[0.16em] transition-colors duration-500'
                  : 'text-[clamp(0.5rem,0.62vw,0.65rem)] uppercase leading-snug tracking-[0.14em] transition-colors duration-500',
                compact && 'lg:text-[8px] lg:tracking-[0.12em]',
                capabilityCard ? 'text-tech-cyan/75' : active ? 'text-gold-light' : 'text-white/70',
              )}
            >
              {name}
            </span>
          ))}
        </span>
        <span
          aria-hidden
          data-card-close={expanded ? 'true' : undefined}
          className={cn(
            capabilityCard
              ? 'grid size-9 place-items-center self-center rounded-xl border transition-[transform,background-color,border-color,color] duration-500'
              : 'grid size-7 place-items-center self-center rounded-full border transition-[transform,background-color,border-color,color] duration-500',
            compact && 'lg:size-6',
            capabilityCard
              ? active
                ? 'rotate-45 border-tech-cyan bg-tech-cyan text-tech-ink'
                : cn('border-tech-cyan/40 text-tech-cyan/80', !disableHover && 'group-hover:border-tech-cyan')
              : active
                ? 'rotate-45 border-gold-light bg-gold text-void'
                : cn('border-white/45 text-white', !disableHover && 'group-hover:border-gold/70'),
          )}
        >
          <Plus className="size-3.5" />
        </span>
      </span>

      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-4 bottom-0 z-20 h-px bg-gradient-to-r from-transparent to-transparent transition-opacity duration-500',
          capabilityCard ? 'via-tech-cyan' : 'via-gold-light',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
    </button>
  )
}
