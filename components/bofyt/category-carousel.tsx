'use client'

import { categories, type CategoryId } from '@/lib/bofyt/categories'
import { CategoryPanel } from './category-panel'

interface CategoryCarouselProps {
  selected: CategoryId | null
  highlighted: CategoryId[]
  onSelect: (id: CategoryId) => void
}

export function CategoryCarousel({ selected, highlighted, onSelect }: CategoryCarouselProps) {
  return (
    <section id="explore" aria-labelledby="explore-heading" className="flex w-full scroll-mt-24 flex-col gap-4 xl:hidden">
      <div className="flex flex-col items-center gap-3">
        <span aria-hidden className="h-8 w-px bg-gradient-to-b from-transparent to-gold/50" />
        <h2 id="explore-heading" className="text-[11px] uppercase tracking-[0.35em] text-white/70">
          Or choose a capability
        </h2>
      </div>

      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <li key={category.id} className="h-80 w-[42vw] max-w-44 shrink-0 snap-center md:h-96 md:w-44">
            <CategoryPanel
              category={category}
              active={selected === category.id}
              mapped={highlighted.includes(category.id)}
              dimmed={Boolean(selected) && selected !== category.id}
              onSelect={() => onSelect(category.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
