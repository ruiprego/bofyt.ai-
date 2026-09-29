'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Bookmark, BookmarkCheck, Check, Eye, ExternalLink, GitCompareArrows, Navigation, PencilLine, Plus, RotateCcw } from 'lucide-react'
import type { CategoryId } from '@/lib/bofyt/categories'
import type { Product, ProductPriceConstraint } from '@/lib/products/types'
import { toGoalTitle } from '@/lib/bofyt/plan'
import { buildResult, reasonFor, refineItems, type ResultItem } from '@/lib/bofyt/results'
import { cn } from '@/lib/utils'
import { EyeMark } from './logo'
import { MetaRow, openDirections, openProduct, ResultSheet, type ResultSheetState } from './result-sheet'

export interface GoalResultHandlers {
  saved: boolean
  onEdit: () => void
  onReset: () => void
  onBuildPlan: () => void
  onSave: () => void
  onOpenProgress: () => void
  onNotify: (text: string) => void
}

export interface GoalResultData {
  id: string
  goal: string
  areas: CategoryId[]
  products?: Product[]
  closestProducts?: Product[]
  priceConstraint?: ProductPriceConstraint
}

interface GoalResultProps extends GoalResultHandlers {
  goal: string
  areas: CategoryId[]
  products?: Product[]
  closestProducts?: Product[]
  priceConstraint?: ProductPriceConstraint
}

const ease = [0.22, 1, 0.36, 1] as const
const MAX_COMPARE = 3

export function GoalResult({
  goal,
  areas,
  products,
  closestProducts,
  priceConstraint,
  saved,
  onEdit,
  onReset,
  onBuildPlan,
  onSave,
  onOpenProgress,
  onNotify,
}: GoalResultProps) {
  const model = useMemo(
    () => buildResult(goal, areas, products, closestProducts, priceConstraint),
    [goal, areas, products, closestProducts, priceConstraint],
  )
  const [refinement, setRefinement] = useState(model.defaultRefinement)
  const [compared, setCompared] = useState<string[]>([])
  const [savedItems, setSavedItems] = useState<string[]>([])
  const [sheet, setSheet] = useState<ResultSheetState>(null)

  const items = useMemo(() => refineItems(model.items, refinement), [model.items, refinement])
  const closestItems = model.closestItems ?? []
  const [top, ...rest] = items
  const isPlaces = model.kind === 'places'
  const isProduct = model.kind === 'products'

  const toggleCompare = (item: ResultItem) => {
    if (compared.includes(item.id)) {
      setCompared((ids) => ids.filter((id) => id !== item.id))
      onNotify(`Removed ${item.name} from compare`)
    } else if (compared.length >= MAX_COMPARE) {
      onNotify(`You can compare up to ${MAX_COMPARE} options`)
    } else {
      setCompared((ids) => [...ids, item.id])
      onNotify(`${item.name} added to compare`)
    }
  }

  const toggleSavedItem = (item: ResultItem) => {
    if (savedItems.includes(item.id)) {
      setSavedItems((ids) => ids.filter((id) => id !== item.id))
      onNotify(`Removed ${item.name} from saved products`)
    } else {
      setSavedItems((ids) => [...ids, item.id])
      onNotify(`${item.name} saved`)
    }
  }

  const choose = (item: ResultItem) => {
    setSheet(null)
    if (isPlaces) {
      openDirections(item)
      onNotify(`Opening directions to ${item.name}`)
    } else if (isProduct && item.productUrl) {
      openProduct(item)
      onNotify(`Opening ${item.name}`)
    } else {
      onNotify(`${item.name} added to your plan`)
      onBuildPlan()
    }
  }

  const openCompare = () => {
    const selected = model.items.filter((item) => compared.includes(item.id))
    setSheet({ type: 'compare', items: selected.length >= 2 ? selected : items.slice(0, MAX_COMPARE) })
  }

  const runNextAction = () => {
    if (isProduct) {
      if (top) choose(top)
      else onEdit()
      return
    }
    if (isPlaces) openCompare()
    else onBuildPlan()
  }
  const closeSheet = useCallback(() => setSheet(null), [])

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5, ease }}
      aria-labelledby="result-heading"
      className="flex w-full max-w-xl flex-col text-left"
    >
      {/* 2. User's goal */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/50 py-2 pl-4 pr-2">
        <p className="min-w-0 flex-1">
          <span className="block text-[10px] uppercase tracking-[0.3em] text-white/45">Your goal</span>
          <span className="block truncate text-base text-white">{`“${toGoalTitle(goal)}”`}</span>
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-gold-light active:scale-95"
        >
          <PencilLine aria-hidden className="size-4" />
          Edit
        </button>
      </div>

      {/* 3. Processing / result status */}
      <div className="flex flex-col items-center py-2" aria-hidden>
        <span className="h-5 w-px bg-gradient-to-b from-white/20 to-gold/70" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex min-w-0 items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gold/90">
          <EyeMark className="h-2.5 w-4 shrink-0" />
          <span className="truncate">BOFYT processed · {model.statusLabel}</span>
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 px-1 text-[11px] uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-white active:scale-95"
        >
          <RotateCcw aria-hidden className="size-3.5" />
          New
        </button>
      </div>

      <h2 id="result-heading" className="mt-3 font-display text-2xl leading-tight text-white md:text-3xl">
        Your results
        <span className="mt-1 block font-sans text-sm text-white/55">{model.heading}</span>
      </h2>

      {top ? (
        <>
          {/* 4. Main result / recommended action */}
          <motion.article
            key={`${refinement}-${top.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            aria-label={`Recommended: ${top.name}`}
            className="mt-4 rounded-2xl border border-gold/45 bg-black/60 p-4 shadow-[0_0_60px_-30px_rgba(226,184,101,0.9)]"
          >
            {isProduct && top.imageUrl && (
              <img
                src={top.imageUrl}
                alt={`${top.brand ? `${top.brand} ` : ''}${top.name} product image`}
                className="mb-4 h-40 w-full rounded-xl object-contain bg-white/5"
                loading="eager"
                decoding="async"
              />
            )}
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-light">
              {isProduct ? 'Live result' : `Recommended · ${reasonFor(refinement)}`}
            </p>
            <h3 className="mt-2 text-xl text-white">{top.name}</h3>
            {top.subtitle && <p className="text-sm text-white/55">{top.subtitle}</p>}
            <MetaRow item={top} className="mt-3 text-sm" />
            <ItemActions
              item={top}
              isPlaces={isPlaces}
              isProduct={isProduct}
              isCompared={compared.includes(top.id)}
              isSaved={savedItems.includes(top.id)}
              onView={() => setSheet({ type: 'view', item: top })}
              onCompare={() => toggleCompare(top)}
              onSaveItem={() => toggleSavedItem(top)}
              onThird={() => choose(top)}
              prominent
            />
          </motion.article>

          {/* 5. Relevant options */}
          {rest.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2" aria-label="More options">
              {rest.map((item) => (
                <li key={item.id} className="rounded-2xl border border-white/10 bg-black/45 p-3.5">
                  {isProduct ? (
                    <div className="flex items-start gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={`${item.brand ? `${item.brand} ` : ''}${item.name} product image`}
                          className="size-16 shrink-0 rounded-lg object-contain bg-white/5"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="min-w-0 truncate text-base text-white">{item.name}</h3>
                          {item.subtitle && <span className="shrink-0 text-xs text-white/45">{item.subtitle.split(' · ')[0]}</span>}
                        </div>
                        <MetaRow item={item} className="mt-1.5" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="min-w-0 truncate text-base text-white">{item.name}</h3>
                        <span className="shrink-0 text-xs text-white/45">{item.subtitle.split(' · ')[0]}</span>
                      </div>
                      <MetaRow item={item} className="mt-1.5" />
                    </>
                  )}
                  <ItemActions
                    item={item}
                    isPlaces={isPlaces}
                    isProduct={isProduct}
                    isCompared={compared.includes(item.id)}
                    isSaved={savedItems.includes(item.id)}
                    onView={() => setSheet({ type: 'view', item })}
                    onCompare={() => toggleCompare(item)}
                    onSaveItem={() => toggleSavedItem(item)}
                    onThird={() => choose(item)}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/45 p-4 text-sm text-white/70">
            {model.emptyMessage ?? 'Nothing matches that filter right now.'}{' '}
            <button
              type="button"
              onClick={isProduct ? onEdit : () => setRefinement(model.defaultRefinement)}
              className="min-h-11 text-gold-light underline underline-offset-4"
            >
              {isProduct ? 'Edit search' : 'Show all options'}
            </button>
          </div>

          {isProduct && closestItems.length > 0 && (
            <section className="mt-6 border-t border-white/10 pt-5" aria-labelledby="closest-matches-heading">
              <p id="closest-matches-heading" className="text-[10px] uppercase tracking-[0.3em] text-gold-light">
                {model.priceConstraint?.maxPrice !== undefined && model.priceConstraint.minPrice === undefined
                  ? 'Closest matches above your budget'
                  : 'Closest matches outside your price range'}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/45">
                These products are outside the requested price range and are not exact matches.
              </p>
              <ul
                className="mt-3 flex flex-col gap-2"
                aria-label={
                  model.priceConstraint?.maxPrice !== undefined && model.priceConstraint.minPrice === undefined
                    ? 'Closest matches above your budget'
                    : 'Closest matches outside your price range'
                }
              >
                {closestItems.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
                    <div className="flex items-start gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={`${item.brand ? `${item.brand} ` : ''}${item.name} product image`}
                          className="size-16 shrink-0 rounded-lg object-contain bg-white/5"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="min-w-0 truncate text-base text-white">{item.name}</h3>
                          {item.subtitle && <span className="shrink-0 text-xs text-white/45">{item.subtitle.split(' · ')[0]}</span>}
                        </div>
                        <MetaRow item={item} className="mt-1.5" />
                      </div>
                    </div>
                    <ItemActions
                      item={item}
                      isPlaces={false}
                      isProduct
                      isCompared={compared.includes(item.id)}
                      isSaved={savedItems.includes(item.id)}
                      onView={() => setSheet({ type: 'view', item })}
                      onCompare={() => toggleCompare(item)}
                      onSaveItem={() => toggleSavedItem(item)}
                      onThird={() => choose(item)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* 6. Quick refinement */}
      <p id="refine-label" className="mt-6 text-[10px] uppercase tracking-[0.3em] text-white/45">
        Refine
      </p>
      <div role="group" aria-labelledby="refine-label" className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {model.refinements.map((option) => {
          const active = option.id === refinement
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => setRefinement(option.id)}
              className={cn(
                'min-h-11 shrink-0 rounded-full border px-4 text-xs uppercase tracking-[0.14em] transition-colors active:scale-95',
                active ? 'border-gold bg-gold text-black' : 'border-white/20 text-white/80 hover:border-gold/60',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {/* 7. Primary next action */}
      <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-white/45">Next action</p>
      <motion.button
        type="button"
        onClick={runNextAction}
        whileTap={{ scale: 0.97 }}
        className="group mt-2 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-gold-light to-gold py-4 text-sm font-medium uppercase tracking-[0.16em] text-black shadow-[0_0_30px_-8px_rgba(226,184,101,0.9)]"
      >
        {isPlaces && compared.length >= 2 ? `Compare ${compared.length} selected` : model.nextActionLabel}
        <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </motion.button>

      {/* 8. Progress / save to goal */}
      <button
        type="button"
        onClick={saved ? onOpenProgress : onSave}
        className={cn(
          'mt-2.5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border text-xs uppercase tracking-[0.16em] transition-colors active:scale-[0.98]',
          saved ? 'border-gold/50 text-gold-light' : 'border-white/20 text-white/85 hover:border-gold/60',
        )}
      >
        {saved ? <BookmarkCheck aria-hidden className="size-4" /> : <Bookmark aria-hidden className="size-4" />}
        {saved ? 'Saved · View progress' : 'Save goal to progress'}
      </button>

      <ResultSheet
        state={sheet}
        kind={model.kind}
        compared={compared}
        onToggleCompare={toggleCompare}
        onChoose={choose}
        onClose={closeSheet}
      />
    </motion.section>
  )
}

function ItemActions({
  item,
  isPlaces,
  isProduct,
  isCompared,
  isSaved,
  onView,
  onCompare,
  onSaveItem,
  onThird,
  prominent = false,
}: {
  item: ResultItem
  isPlaces: boolean
  isProduct: boolean
  isCompared: boolean
  isSaved: boolean
  onView: () => void
  onCompare: () => void
  onSaveItem: () => void
  onThird: () => void
  prominent?: boolean
}) {
  const base = 'inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border text-[11px] uppercase tracking-[0.12em] transition-colors active:scale-95'
  return (
    <div className={cn('mt-3 gap-2', isProduct ? 'grid grid-cols-2' : 'flex')}>
      <button type="button" onClick={onView} aria-label={`View ${item.name}`} className={cn(base, 'border-white/20 text-white/85 hover:border-gold/60')}>
        <Eye aria-hidden className="size-3.5" />
        View
      </button>
      <button
        type="button"
        onClick={onCompare}
        aria-pressed={isCompared}
        aria-label={`${isCompared ? 'Remove' : 'Add'} ${item.name} ${isCompared ? 'from' : 'to'} compare`}
        className={cn(base, isCompared ? 'border-gold bg-gold/15 text-gold-light' : 'border-white/20 text-white/85 hover:border-gold/60')}
      >
        {isCompared ? <Check aria-hidden className="size-3.5" /> : <GitCompareArrows aria-hidden className="size-3.5" />}
        Compare
      </button>
      {isProduct && (
        <button
          type="button"
          onClick={onSaveItem}
          aria-pressed={isSaved}
          aria-label={`${isSaved ? 'Remove' : 'Save'} ${item.name}`}
          className={cn(base, isSaved ? 'border-gold bg-gold/15 text-gold-light' : 'border-white/20 text-white/85 hover:border-gold/60')}
        >
          {isSaved ? <BookmarkCheck aria-hidden className="size-3.5" /> : <Bookmark aria-hidden className="size-3.5" />}
          {isSaved ? 'Saved' : 'Save'}
        </button>
      )}
      {isProduct && item.productUrl ? (
        <a
          href={item.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${item.name}`}
          className={cn(
            base,
            prominent ? 'border-gold bg-gold text-black' : 'border-gold/50 text-gold-light hover:bg-gold/10',
          )}
        >
          <ExternalLink aria-hidden className="size-3.5" />
          Open product
        </a>
      ) : (
        <button
          type="button"
          onClick={onThird}
          aria-label={isPlaces ? `Directions to ${item.name}` : `Add ${item.name} to plan`}
          className={cn(
            base,
            prominent ? 'border-gold bg-gold text-black' : 'border-gold/50 text-gold-light hover:bg-gold/10',
          )}
        >
          {isPlaces ? <Navigation aria-hidden className="size-3.5" /> : <Plus aria-hidden className="size-3.5" />}
          {isPlaces ? 'Directions' : 'Plan'}
        </button>
      )}
    </div>
  )
}
