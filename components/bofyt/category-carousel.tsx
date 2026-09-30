'use client'

import { categoryById, type CategoryId } from '@/lib/bofyt/categories'
import { CategoryPanel } from './category-panel'

export const CAPABILITY_COLUMNS = [
  {
    categoryId: 'social',
    index: '01',
    title: 'Grow',
    description: 'Build an audience and keep your presence moving.',
  },
  {
    categoryId: 'business',
    index: '02',
    title: 'Build',
    description: 'Turn an idea into a business with a clear path.',
  },
  {
    categoryId: 'marketing',
    index: '03',
    title: 'Reach',
    description: 'Put the right message in front of the right people.',
  },
  {
    categoryId: 'personal',
    index: '04',
    title: 'Optimize',
    description: 'Make your habits, health and money work better.',
  },
  {
    categoryId: 'productivity',
    index: '05',
    title: 'Automate',
    description: 'Create systems that protect your time and follow-through.',
  },
  {
    categoryId: 'search',
    index: '06',
    title: 'Discover',
    description: 'Find products, information and options with BOFYT.',
  },
] as const satisfies ReadonlyArray<{
  categoryId: CategoryId
  index: string
  title: string
  description: string
}>

interface CategoryCarouselProps {
  selected: CategoryId | null
  highlighted: CategoryId[]
  onSelect: (id: CategoryId) => void
}

export function CategoryCarousel({ selected, highlighted, onSelect }: CategoryCarouselProps) {
  return (
    <section id="explore" aria-labelledby="explore-heading" className="flex w-full scroll-mt-24 flex-col gap-4">
      <div className="flex flex-col items-center gap-3">
        <span aria-hidden className="h-8 w-px bg-gradient-to-b from-transparent to-gold/50" />
        <h2 id="explore-heading" className="text-[11px] uppercase tracking-[0.35em] text-white/70">
          Or choose a capability
        </h2>
      </div>

      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:gap-4 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden">
        {CAPABILITY_COLUMNS.map((capability) => {
          const category = categoryById[capability.categoryId]
          return (
            <li
              key={capability.categoryId}
              className="h-[25rem] w-[min(76vw,18rem)] shrink-0 snap-center sm:h-[28rem] sm:w-52 lg:h-[min(60vh,35rem)] lg:w-[clamp(10.5rem,14vw,14rem)]"
            >
              <CategoryPanel
                category={category}
                displayIndex={capability.index}
                displayTitle={capability.title}
                displayDescription={capability.description}
                active={selected === category.id}
                mapped={highlighted.includes(category.id)}
                dimmed={Boolean(selected) && selected !== category.id}
                onSelect={() => onSelect(category.id)}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
