'use client'

import { categories, categoryById, type CategoryId } from '@/lib/bofyt/categories'
import { cn } from '@/lib/utils'
import { CATEGORY_ICONS } from './category-icons'

interface CategoryGridProps {
  selected: CategoryId | null
  highlighted: CategoryId[]
  onSelect: (id: CategoryId) => void
}

const PRIMARY = categories.filter((category) => !category.secondary)
const CONNECT = categoryById.communication

export function CategoryGrid({ selected, highlighted, onSelect }: CategoryGridProps) {
  return (
    <section id="explore" aria-labelledby="explore-heading" className="flex w-full max-w-xl scroll-mt-24 flex-col gap-4 md:max-w-3xl lg:hidden">
      <div className="flex flex-col items-center gap-3">
        <span aria-hidden className="h-8 w-px bg-gradient-to-b from-transparent to-gold/50" />
        <h2 id="explore-heading" className="text-[11px] uppercase tracking-[0.35em] text-white/70">
          Or explore the system
        </h2>
      </div>

      <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {PRIMARY.map((category) => {
          const Icon = CATEGORY_ICONS[category.id]
          const isSelected = selected === category.id
          const isMapped = highlighted.includes(category.id)
          return (
            <li key={category.id} className={cn(category.featured && 'col-span-2')}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(category.id)}
                className={cn(
                  'flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-black/40 p-3 text-left transition-[border-color,background-color,transform] duration-300 active:scale-[0.98]',
                  isSelected
                    ? 'border-gold/80 bg-gold/[0.08]'
                    : isMapped
                      ? 'border-gold/50'
                      : category.featured
                        ? 'border-gold/35'
                        : 'border-white/12',
                )}
              >
                <span
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full border transition-colors duration-300',
                    isSelected ? 'border-gold-light bg-gold/15 text-gold-light' : 'border-gold/35 text-white/80',
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className={cn('text-[13px] font-medium leading-snug', isSelected ? 'text-gold-light' : 'text-white')}>
                    {category.title}
                  </span>
                  {category.featured && <span className="mt-0.5 text-xs leading-relaxed text-white/60">{category.description}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <ConnectLayer selected={selected === CONNECT.id} onSelect={() => onSelect(CONNECT.id)} />
    </section>
  )
}

const PEOPLE = ['AM', 'JL', 'SK']

function ConnectLayer({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'flex min-h-16 w-full items-center gap-3 rounded-2xl border border-dashed p-3 text-left transition-colors duration-300',
        selected ? 'border-gold/70 bg-gold/[0.06]' : 'border-white/15',
      )}
    >
      <span aria-hidden className="flex shrink-0 -space-x-2">
        {PEOPLE.map((initials) => (
          <span
            key={initials}
            className="grid size-8 place-items-center rounded-full border border-void bg-gold-deep/60 text-[10px] font-medium text-gold-light"
          >
            {initials}
          </span>
        ))}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn('text-[13px] font-medium', selected ? 'text-gold-light' : 'text-white')}>{CONNECT.title}</span>
        <span className="text-xs leading-relaxed text-white/60">{CONNECT.description}</span>
      </span>
    </button>
  )
}
