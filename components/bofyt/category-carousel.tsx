'use client'

import { categoryById } from '@/lib/bofyt/categories'
import { CAPABILITY_COLUMNS, type CapabilityId } from '@/lib/bofyt/capabilities'
import { cn } from '@/lib/utils'
import { CategoryPanel } from './category-panel'

interface CategoryCarouselProps {
  selected: CapabilityId | null
  highlighted: CapabilityId[]
  onSelect: (id: CapabilityId) => void
  layout?: 'flow' | 'core'
}

export function CategoryCarousel({ selected, highlighted, onSelect, layout = 'flow' }: CategoryCarouselProps) {
  const coreLayout = layout === 'core'

  return (
    <section
      id="explore"
      aria-labelledby="explore-heading"
      className={cn('relative flex w-full scroll-mt-24 flex-col gap-4', coreLayout && 'lg:h-full lg:gap-0')}
    >
      <div className={cn('flex flex-col items-center gap-3', coreLayout && 'lg:absolute lg:inset-x-0 lg:top-0 lg:z-10 lg:gap-2')}>
        <span aria-hidden className="h-8 w-px bg-gradient-to-b from-transparent to-gold/50" />
        <h2 id="explore-heading" className="text-[11px] uppercase tracking-[0.35em] text-white/70">
          Explore any capability
        </h2>
        <p className="max-w-md text-xs leading-relaxed text-white/45">
          Six independent entry points. Start wherever the next useful move is.
        </p>
      </div>

      {coreLayout && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-1/4 hidden h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent lg:block"
        />
      )}

      <ul
        className={cn(
          '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden',
          !coreLayout && 'lg:-mx-8 lg:px-8',
          coreLayout &&
            'lg:relative lg:z-10 lg:mx-auto lg:grid lg:w-full lg:max-w-[78rem] lg:grid-cols-[minmax(12rem,16rem)_minmax(12rem,16rem)] lg:grid-rows-3 lg:justify-between lg:gap-x-6 lg:gap-y-4 lg:overflow-visible lg:px-8 lg:pt-14',
        )}
      >
        {CAPABILITY_COLUMNS.map((capability) => {
          const category = categoryById[capability.categoryId]
          const mapped = highlighted.includes(capability.id)
          return (
            <li
              key={capability.id}
              className={cn(
                'h-[25rem] w-[min(76vw,18rem)] shrink-0 snap-center sm:h-[28rem] sm:w-52',
                coreLayout ? 'lg:h-44 lg:w-full' : 'lg:h-[min(60vh,35rem)] lg:w-[clamp(10.5rem,14vw,14rem)]',
              )}
            >
              <CategoryPanel
                category={category}
                capability={capability}
                active={selected === capability.id}
                mapped={mapped}
                dimmed={Boolean(selected) && selected !== capability.id}
                compact={coreLayout}
                onSelect={() => onSelect(capability.id)}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
