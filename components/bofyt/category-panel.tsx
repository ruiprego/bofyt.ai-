'use client'

import Image from 'next/image'
import { Plus } from 'lucide-react'
import type { Category } from '@/lib/bofyt/categories'
import type { Capability } from '@/lib/bofyt/capabilities'
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
  onSelect: () => void
  className?: string
}

const SHADE = ['opacity-0', 'opacity-20', 'opacity-35', 'opacity-50']

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
  onSelect,
  className,
}: CategoryPanelProps) {
  const modules = capability?.modules ?? category.modules
  const capabilities = modules.slice(0, capability ? 4 : category.id === 'search' ? 5 : 4).map((module) => module.name)
  const imageSrc = capability?.imageSrc ?? (category.id === 'search' ? '/panels/search.png' : `/panels/${category.id}.webp`)
  const panelIndex = capability?.index ?? displayIndex ?? category.index
  const panelTitle = capability?.title ?? displayTitle ?? category.title
  const panelDescription = capability?.description ?? displayDescription ?? category.description
  const descriptionId = `panel-${category.id}-description`

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-describedby={descriptionId}
      onClick={onSelect}
      className={cn(
        'group relative isolate flex h-full w-full flex-col overflow-hidden rounded-md border bg-[#0a0907] text-left outline-none transition-[border-color,box-shadow,opacity,transform] duration-500',
        'min-[960px]:group-hover:-translate-y-0.5 min-[960px]:group-hover:scale-[1.015]',
        'focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-void',
        active
          ? 'border-gold-light/80 shadow-[0_0_46px_-6px_rgba(226,184,101,0.75),inset_0_0_30px_-12px_rgba(246,221,161,0.5)]'
          : mapped
            ? 'border-gold/55 shadow-[0_0_30px_-12px_rgba(226,184,101,0.5)]'
            : 'border-white/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)] hover:border-gold/45',
        dimmed && 'opacity-55 hover:opacity-100',
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
          'absolute inset-0 -z-10 object-cover object-center transition-[transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
          active ? 'scale-105 brightness-110' : 'brightness-75 group-hover:scale-[1.03] group-hover:brightness-90',
        )}
      />
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#0a0907_0%,rgba(10,9,7,0.55)_26%,rgba(10,9,7,0)_46%,rgba(10,9,7,0.2)_62%,#0a0907_84%)]"
      />
      <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(255,255,255,0.07),transparent_38%)]" />
      <span
        aria-hidden
        className={cn('absolute inset-0 z-10 bg-void transition-opacity duration-500', active ? 'opacity-0' : SHADE[shade])}
      />

      <span className={cn('flex flex-col gap-[clamp(0.4rem,0.7vw,0.65rem)] p-[clamp(0.55rem,0.9vw,0.875rem)]', compact && 'lg:gap-1 lg:p-2.5')}>
        <span className={cn('text-[10px] tabular-nums tracking-[0.2em] transition-colors', active ? 'text-gold-light' : 'text-white/60')}>
          {panelIndex}
        </span>
        <span
          className={cn(
            'font-display text-[clamp(0.65rem,0.9vw,0.9rem)] font-medium uppercase leading-[1.2] tracking-wide break-words transition-colors duration-500',
            active ? 'text-gold-light' : 'text-white',
          )}
        >
          {panelTitle}
        </span>
        <span aria-hidden className={cn('h-px w-3 transition-colors', active ? 'bg-gold-light' : 'bg-white/40')} />
        <span className={cn('max-w-[18rem] text-[11px] leading-relaxed text-white/65', compact && 'lg:max-h-8 lg:overflow-hidden lg:text-[10px] lg:leading-tight')}>
          {panelDescription}
        </span>
      </span>

      <span className={cn('mt-auto flex flex-col items-start gap-[clamp(0.55rem,0.9vw,0.85rem)] p-[clamp(0.55rem,0.9vw,0.875rem)]', compact && 'lg:gap-1.5 lg:p-2.5')}>
        <span className={cn('flex flex-col gap-1', compact && 'lg:gap-0')}>
          {capabilities.map((name) => (
            <span
              key={name}
              className={cn(
                'text-[clamp(0.5rem,0.62vw,0.65rem)] uppercase leading-snug tracking-[0.14em] transition-colors duration-500',
                compact && 'lg:text-[8px] lg:tracking-[0.12em]',
                active ? 'text-gold-light' : 'text-white/70',
              )}
            >
              {name}
            </span>
          ))}
        </span>
        <span
          aria-hidden
          className={cn(
            'grid size-7 place-items-center self-center rounded-full border transition-[transform,background-color,border-color,color] duration-500',
            compact && 'lg:size-6',
            active ? 'rotate-45 border-gold-light bg-gold text-void' : 'border-white/45 text-white group-hover:border-gold/70',
          )}
        >
          <Plus className="size-3.5" />
        </span>
      </span>

      <span
        aria-hidden
        className={cn(
          'absolute inset-x-3 bottom-0 z-20 h-px bg-gradient-to-r from-transparent via-gold-light to-transparent transition-opacity duration-500',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
    </button>
  )
}
