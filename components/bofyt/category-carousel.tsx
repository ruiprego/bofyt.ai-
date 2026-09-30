'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { categoryById } from '@/lib/bofyt/categories'
import { CAPABILITY_COLUMNS, type CapabilityId } from '@/lib/bofyt/capabilities'
import { cn } from '@/lib/utils'
import { CategoryPanel } from './category-panel'

const PRODUCTION_ORDER: CapabilityId[] = ['grow', 'reach', 'build', 'optimize', 'automate', 'discover']
const HOVER_EASE = [0.22, 1, 0.36, 1] as const

interface CategoryCarouselProps {
  selected: CapabilityId | null
  highlighted: CapabilityId[]
  onSelect: (id: CapabilityId) => void
  layout?: 'flow' | 'core'
  mode?: 'normal' | 'discovery'
  showIntro?: boolean
}

export function CategoryCarousel({ selected, highlighted, onSelect, layout = 'flow', mode = 'normal', showIntro = true }: CategoryCarouselProps) {
  const coreLayout = layout === 'core'
  const discoveryLayout = coreLayout && mode === 'discovery'
  const capabilities = coreLayout
    ? [...CAPABILITY_COLUMNS].sort((a, b) => PRODUCTION_ORDER.indexOf(a.id) - PRODUCTION_ORDER.indexOf(b.id))
    : CAPABILITY_COLUMNS
  const [hoveredCapability, setHoveredCapability] = useState<CapabilityId | null>(null)
  const hoveredIndex = hoveredCapability ? capabilities.findIndex(({ id }) => id === hoveredCapability) : -1
  const desktopHovering = coreLayout && hoveredIndex >= 0

  return (
    <section
      id={showIntro ? 'explore' : undefined}
      aria-label={showIntro ? undefined : 'BOFYT capabilities'}
      aria-labelledby={showIntro ? 'explore-heading' : undefined}
      className={cn(
        'relative flex w-full scroll-mt-24 flex-col gap-4',
        coreLayout && 'min-[960px]:h-full min-[960px]:gap-0',
        discoveryLayout && 'min-[960px]:min-h-[min(78vh,48rem)]',
      )}
    >
      {showIntro && (
        <div className={cn('flex flex-col items-center gap-3', coreLayout && 'min-[960px]:hidden')}>
        <span aria-hidden className="h-8 w-px bg-gradient-to-b from-transparent to-gold/50" />
        <h2 id="explore-heading" className="text-[11px] uppercase tracking-[0.35em] text-white/70">
          Explore any capability
        </h2>
          <p className="max-w-md text-xs leading-relaxed text-white/45">
            Six independent entry points. Start wherever the next useful move is.
          </p>
        </div>
      )}

      <ul
        className={cn(
          '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden',
          !coreLayout && 'lg:-mx-8 lg:px-8',
          coreLayout &&
            'min-[960px]:absolute min-[960px]:left-1/2 min-[960px]:right-auto min-[960px]:top-1/2 min-[960px]:z-10 min-[960px]:mx-0 min-[960px]:grid min-[960px]:h-[min(68vh,42rem)] min-[960px]:w-[min(calc(100vw-2rem),112rem)] min-[960px]:-translate-x-1/2 min-[960px]:-translate-y-1/2 min-[960px]:grid-cols-[repeat(3,minmax(0,1fr))_minmax(clamp(20rem,calc(100vw_-_38rem),36rem),3.5fr)_repeat(3,minmax(0,1fr))] min-[960px]:gap-[clamp(0.5rem,0.65vw,0.75rem)] min-[960px]:overflow-visible min-[960px]:px-0 min-[960px]:pb-0',
          desktopHovering && 'min-[960px]:!z-30',
          discoveryLayout && 'min-[960px]:!h-[min(78vh,48rem)] min-[960px]:!w-[min(calc(100vw-2rem),124rem)]',
          )}
        >
        {capabilities.map((capability, index) => {
          const category = categoryById[capability.categoryId]
          const mapped = highlighted.includes(capability.id)
          const isFocused = hoveredCapability === capability.id
          const shouldFade = desktopHovering && !isFocused
          const baseGridColumn = index < 3 ? index + 1 : index + 2
          const slideDirection = index < hoveredIndex ? -1 : 1

          return (
            <motion.li
              key={capability.id}
              layout={coreLayout}
              initial={false}
              animate={
                shouldFade
                  ? { opacity: 0, scale: 0.84, x: slideDirection * 36 }
                  : { opacity: 1, scale: 1, x: 0 }
              }
              transition={{
                layout: { duration: 0.56, ease: HOVER_EASE },
                opacity: { duration: 0.34, ease: HOVER_EASE },
                scale: { duration: 0.48, ease: HOVER_EASE },
                x: { duration: 0.48, ease: HOVER_EASE },
              }}
              onPointerEnter={(event) => {
                if (coreLayout && event.pointerType === 'mouse' && window.matchMedia('(min-width: 960px)').matches) {
                  setHoveredCapability(capability.id)
                }
              }}
              onPointerLeave={(event) => {
                if (coreLayout && event.pointerType === 'mouse' && window.matchMedia('(min-width: 960px)').matches) {
                  setHoveredCapability(null)
                }
              }}
              style={
                coreLayout
                  ? {
                      gridColumn: isFocused && desktopHovering ? '1 / -1' : String(baseGridColumn),
                      gridRow: '1',
                    }
                  : undefined
              }
              className={cn(
                'h-[25rem] w-[min(76vw,18rem)] shrink-0 snap-center sm:h-[28rem] sm:w-52',
                coreLayout ? 'min-[960px]:!h-full min-[960px]:!w-auto' : 'lg:h-[min(60vh,35rem)] lg:w-[clamp(10.5rem,14vw,14rem)]',
                shouldFade && 'min-[960px]:pointer-events-none',
                desktopHovering && isFocused && 'min-[960px]:z-30',
              )}
            >
              <CategoryPanel
                category={category}
                capability={capability}
                active={selected === capability.id}
                mapped={mapped}
                dimmed={Boolean(selected) && selected !== capability.id}
                expanded={discoveryLayout && isFocused}
                onSelect={() => onSelect(capability.id)}
              />
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}
