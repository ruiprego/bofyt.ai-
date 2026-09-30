'use client'

import { categoryById } from '@/lib/bofyt/categories'
import { CAPABILITY_COLUMNS, type CapabilityId } from '@/lib/bofyt/capabilities'
import { CategoryPanel } from './category-panel'

interface CategoryCarouselProps {
  selected: CapabilityId | null
  highlighted: CapabilityId[]
  onSelect: (id: CapabilityId) => void
}

export function CategoryCarousel({ selected, highlighted, onSelect }: CategoryCarouselProps) {
  return (
    <section id="explore" aria-labelledby="explore-heading" className="flex w-full scroll-mt-24 flex-col gap-4">
      <div className="flex flex-col items-center gap-3">
        <span aria-hidden className="h-8 w-px bg-gradient-to-b from-transparent to-gold/50" />
        <h2 id="explore-heading" className="text-[11px] uppercase tracking-[0.35em] text-white/70">
          Explore any capability
        </h2>
        <p className="max-w-md text-xs leading-relaxed text-white/45">
          Six independent entry points. Start wherever the next useful move is.
        </p>
      </div>

      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:gap-4 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden">
        {CAPABILITY_COLUMNS.map((capability) => {
          const category = categoryById[capability.categoryId]
          const mapped = highlighted.includes(capability.id)
          return (
            <li
              key={capability.id}
              className="h-[25rem] w-[min(76vw,18rem)] shrink-0 snap-center sm:h-[28rem] sm:w-52 lg:h-[min(60vh,35rem)] lg:w-[clamp(10.5rem,14vw,14rem)]"
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
