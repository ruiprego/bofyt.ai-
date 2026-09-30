'use client'

import { categoryById } from '@/lib/bofyt/categories'
import { CAPABILITY_COLUMNS, type CapabilityId } from '@/lib/bofyt/capabilities'
import { cn } from '@/lib/utils'
import { CategoryPanel } from './category-panel'

const PRODUCTION_ORDER: CapabilityId[] = ['grow', 'reach', 'build', 'optimize', 'automate', 'discover']

interface CategoryCarouselProps {
  selected: CapabilityId | null
  highlighted: CapabilityId[]
  onSelect: (id: CapabilityId) => void
  layout?: 'flow' | 'core'
}

export function CategoryCarousel({ selected, highlighted, onSelect, layout = 'flow' }: CategoryCarouselProps) {
  const coreLayout = layout === 'core'
  const capabilities = coreLayout
    ? [...CAPABILITY_COLUMNS].sort((a, b) => PRODUCTION_ORDER.indexOf(a.id) - PRODUCTION_ORDER.indexOf(b.id))
    : CAPABILITY_COLUMNS

  return (
    <section
      id="explore"
      aria-labelledby="explore-heading"
      className={cn('relative flex w-full scroll-mt-24 flex-col gap-4', coreLayout && 'xl:h-full xl:gap-0')}
    >
      <div className={cn('flex flex-col items-center gap-3', coreLayout && 'xl:hidden')}>
        <span aria-hidden className="h-8 w-px bg-gradient-to-b from-transparent to-gold/50" />
        <h2 id="explore-heading" className="text-[11px] uppercase tracking-[0.35em] text-white/70">
          Explore any capability
        </h2>
        <p className="max-w-md text-xs leading-relaxed text-white/45">
          Six independent entry points. Start wherever the next useful move is.
        </p>
      </div>

      <ul
        className={cn(
          '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden',
          !coreLayout && 'lg:-mx-8 lg:px-8',
          coreLayout &&
            'xl:absolute xl:inset-x-0 xl:top-1/2 xl:z-10 xl:mx-auto xl:grid xl:h-[min(60vh,35rem)] xl:w-full xl:max-w-[90rem] xl:-translate-y-1/2 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(32rem,3.5fr)_repeat(3,minmax(0,1fr))] xl:gap-3 xl:overflow-visible xl:px-8 xl:pb-0',
        )}
      >
        {capabilities.map((capability, index) => {
          const category = categoryById[capability.categoryId]
          const mapped = highlighted.includes(capability.id)
          return (
            <li
              key={capability.id}
              className={cn(
                'h-[25rem] w-[min(76vw,18rem)] shrink-0 snap-center sm:h-[28rem] sm:w-52',
                coreLayout ? 'xl:h-full xl:w-auto' : 'lg:h-[min(60vh,35rem)] lg:w-[clamp(10.5rem,14vw,14rem)]',
                coreLayout && index === 3 && 'xl:col-start-5',
              )}
            >
              <CategoryPanel
                category={category}
                capability={capability}
                active={selected === capability.id}
                mapped={mapped}
                dimmed={Boolean(selected) && selected !== capability.id}
                onSelect={() => onSelect(capability.id)}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
